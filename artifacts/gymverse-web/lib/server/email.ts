import type { ConnectFn, EmailMessageInput, WaitlistEnv } from "./env.ts";
import { SmtpError, sendViaSmtp } from "./smtp.ts";

export const DEFAULT_NOTIFY_TO = "team@gymx.life";
export const DEFAULT_NOTIFY_FROM = "GYMX Waitlist <waitlist@gymx.life>";
export const DEFAULT_CONFIRMATION_FROM = "The GYMX Team <hello@gymx.life>";
const SEND_TIMEOUT_MS = 8000;

export interface Mailer {
  readonly provider: "cloudflare" | "resend" | "gmail";
  send(message: EmailMessageInput, idempotencyKey: string): Promise<void>;
}

export class MailError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const SIMPLE_EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/**
 * Picks the configured provider: Cloudflare Email Service binding, then Resend, then Gmail SMTP.
 * Null when none is set up (or Gmail is configured but sockets aren't available).
 */
export function getMailer(env: WaitlistEnv, fetchImpl: typeof fetch = fetch, connect?: ConnectFn): Mailer | null {
  const binding = env.EMAIL;
  if (binding) {
    return {
      provider: "cloudflare",
      async send(message) {
        try {
          await binding.send(message);
        } catch (e) {
          const err = e as { code?: string; message?: string };
          throw new MailError(err.code ?? "E_UNKNOWN", err.message ?? "Email Service send failed");
        }
      },
    };
  }
  const apiKey = env.RESEND_API_KEY?.trim();
  if (apiKey) {
    return {
      provider: "resend",
      async send(message, idempotencyKey) {
        let res: Response;
        try {
          res = await fetchImpl("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
            body: JSON.stringify({ from: message.from, to: [message.to], subject: message.subject, text: message.text, html: message.html, ...(message.replyTo ? { reply_to: message.replyTo } : {}) }),
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
          });
        } catch (e) {
          throw new MailError("E_NETWORK", (e as Error).name === "TimeoutError" ? "Resend request timed out" : "Resend request failed");
        }
        if (!res.ok) throw new MailError(`HTTP_${res.status}`, `Resend rejected the message (HTTP ${res.status})`);
      },
    };
  }
  const gmailUser = env.GMAIL_USER?.trim();
  // Google shows app passwords in groups of four ("abcd efgh ijkl mnop"); the spaces aren't part of it.
  const gmailPassword = env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (gmailUser && gmailPassword && connect) {
    return {
      provider: "gmail",
      async send(message, idempotencyKey) {
        if (!SIMPLE_EMAIL.test(gmailUser)) throw new MailError("E_CONFIG", "GMAIL_USER is not a valid email address");
        try {
          await sendViaSmtp({ connect, user: gmailUser, password: gmailPassword, message, messageId: idempotencyKey });
        } catch (e) {
          if (e instanceof SmtpError) throw new MailError(e.code, `Gmail: ${e.message}`);
          throw new MailError("E_UNKNOWN", "Gmail send failed");
        }
      },
    };
  }
  return null;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function formatUtc(iso: string): string {
  const d = new Date(iso);
  return `${d.toUTCString().replace("GMT", "UTC")}`;
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#090909;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#FFF7ED">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#1A1A1A;border-radius:16px">
<tr><td style="padding:28px 28px 8px"><span style="font-size:26px;font-weight:900;letter-spacing:1px;color:#FFF7ED">GYM</span><span style="font-size:26px;font-weight:900;letter-spacing:1px;color:#FF5A1F">X</span></td></tr>
<tr><td style="padding:8px 28px 28px"><h1 style="margin:0 0 16px;font-size:22px;line-height:1.2;color:#FFF7ED">${escapeHtml(title)}</h1>${body}</td></tr>
</table></body></html>`;
}

export interface TeamNotificationInput {
  kind: "member" | "coach";
  email: string;
  createdAt: string;
  totals: { members: number; coaches: number } | null;
}

/** Team-only notification: new signup, email, time, and totals. */
export function buildTeamNotification(n: TeamNotificationInput, to: string, from: string): EmailMessageInput {
  const label = n.kind === "coach" ? "founding coach application" : "waitlist signup";
  const when = formatUtc(n.createdAt);
  const total = n.totals ? n.totals.members + n.totals.coaches : null;
  const lines = [
    `New GYMX ${label}`,
    "",
    `Email: ${n.email}`,
    `Registered: ${when}`,
    ...(n.totals ? [`Total registrations: ${total} (${n.totals.members} waitlist, ${n.totals.coaches} coach applications)`] : []),
  ];
  const rows = [
    ["Email", escapeHtml(n.email)],
    ["Registered", escapeHtml(when)],
    ...(n.totals ? [["Total registrations", `${total} <span style="color:#A3A3A3">(${n.totals.members} waitlist · ${n.totals.coaches} coaches)</span>`]] : []),
  ]
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#A3A3A3;font-size:14px;width:140px">${k}</td><td style="padding:6px 0;font-size:15px">${v}</td></tr>`)
    .join("");
  return {
    to,
    from,
    subject: `New GYMX ${label}`,
    text: lines.join("\n"),
    html: shell(`New ${label}`, `<table role="presentation" cellspacing="0" cellpadding="0">${rows}</table>`),
  };
}

export const CONFIRMATION_SUBJECT = "You're on the GYMX Waitlist!";

/** Member confirmation email (only sent when CONFIRMATION_EMAILS_ENABLED is "true"). */
export function buildConfirmationEmail(to: string, from: string): EmailMessageInput {
  const paragraphs = [
    "Welcome to GYMX!",
    "You're officially on the waitlist for a new fitness-focused social platform built to connect athletes, gym enthusiasts, and anyone committed to improving themselves.",
    "We're excited to have you here.",
    "Stay tuned.",
  ];
  return {
    to,
    from,
    subject: CONFIRMATION_SUBJECT,
    text: [...paragraphs, "", "The GYMX Team"].join("\n\n"),
    html: shell(
      "You're on the waitlist",
      paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#FFF7ED">${escapeHtml(p)}</p>`).join("") +
        `<p style="margin:20px 0 0;font-size:15px;font-weight:700;color:#FF5A1F">The GYMX Team</p>`,
    ),
  };
}

export const confirmationsEnabled = (env: WaitlistEnv) => env.CONFIRMATION_EMAILS_ENABLED?.trim().toLowerCase() === "true";

/** Short, PII-free error description for logs and the notify_error column. */
export function describeMailError(e: unknown): string {
  if (e instanceof MailError) return `${e.code}: ${e.message}`.slice(0, 200);
  return "E_UNKNOWN: unexpected error";
}
