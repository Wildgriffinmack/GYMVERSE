import type { ConnectFn, EmailMessageInput, SocketLike } from "./env.ts";

export const GMAIL_SMTP_HOST = "smtp.gmail.com";
/** Implicit TLS (SMTPS). Port 25 is blocked on Workers; 465 is not. */
export const GMAIL_SMTP_PORT = 465;
const SMTP_TIMEOUT_MS = 15000;

export class SmtpError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const wrap76 = (s: string) => s.replace(/.{1,76}/g, "$&\r\n").trimEnd();
/** Strips CR/LF so values can't inject extra headers or SMTP commands. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** RFC 2047 encoded-word for non-ASCII header text. */
export function encodeHeader(value: string): string {
  const clean = oneLine(value);
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${base64(clean)}?=`;
}

/** "Name <addr@x>" → { name, address }; a bare address has an empty name. */
export function parseAddress(value: string): { name: string; address: string } {
  const m = oneLine(value).match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  if (m) return { name: m[1].replace(/^"|"$/g, "").trim(), address: m[2] };
  return { name: "", address: oneLine(value) };
}

function formatAddress(name: string, address: string): string {
  if (!name) return `<${address}>`;
  const encoded = encodeHeader(name);
  return encoded === name ? `"${name.replace(/["\\]/g, "")}" <${address}>` : `${encoded} <${address}>`;
}

/** Builds a multipart/alternative (text + HTML) message with CRLF line endings and base64 bodies. */
export function buildMimeMessage(message: EmailMessageInput, from: { name: string; address: string }, messageId: string, date = new Date()): string {
  const boundary = `GYMX-${messageId.replace(/[^A-Za-z0-9]/g, "").slice(0, 32)}-alt`;
  const to = parseAddress(message.to);
  const headers = [
    `From: ${formatAddress(from.name, from.address)}`,
    `To: ${formatAddress(to.name, to.address)}`,
    ...(message.replyTo ? [`Reply-To: ${formatAddress("", parseAddress(message.replyTo).address)}`] : []),
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${date.toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${messageId.replace(/[^A-Za-z0-9._-]/g, "")}@gymx.life>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const part = (type: string, body: string) => [`--${boundary}`, `Content-Type: ${type}; charset=UTF-8`, "Content-Transfer-Encoding: base64", "", wrap76(base64(body))].join("\r\n");
  return [...headers, "", part("text/plain", message.text), part("text/html", message.html), `--${boundary}--`, ""].join("\r\n");
}

/** Reads complete SMTP replies (single or multi-line) from the socket. */
class ReplyReader {
  private buffer = "";
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  constructor(reader: ReadableStreamDefaultReader<Uint8Array>) {
    this.reader = reader;
  }

  async read(): Promise<{ code: number; text: string }> {
    for (;;) {
      const lines = this.buffer.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const m = lines[i].match(/^(\d{3})([ -])(.*)$/);
        if (m && m[2] === " ") {
          const text = lines.slice(0, i + 1).map((l) => l.slice(4)).join(" ");
          this.buffer = lines.slice(i + 1).join("\r\n");
          return { code: Number(m[1]), text };
        }
      }
      const { value, done } = await this.reader.read();
      if (done) throw new SmtpError("E_CLOSED", "SMTP server closed the connection");
      this.buffer += decoder.decode(value, { stream: true });
    }
  }
}

export interface SmtpSendOptions {
  connect: ConnectFn;
  user: string;
  password: string;
  message: EmailMessageInput;
  messageId: string;
  host?: string;
  port?: number;
  timeoutMs?: number;
  now?: Date;
}

/**
 * Sends one message through an authenticated SMTP server over implicit TLS
 * (Gmail / Google Workspace with an app password). The From address is always the signed-in account.
 */
export async function sendViaSmtp(opts: SmtpSendOptions): Promise<void> {
  const socket: SocketLike = opts.connect({ hostname: opts.host ?? GMAIL_SMTP_HOST, port: opts.port ?? GMAIL_SMTP_PORT }, { secureTransport: "on", allowHalfOpen: false });
  const writer = socket.writable.getWriter();
  const replies = new ReplyReader(socket.readable.getReader());
  let timer: ReturnType<typeof setTimeout> | undefined;

  const write = (data: string) => writer.write(encoder.encode(data));
  const expect = async (step: string, ok: number[]) => {
    const reply = await replies.read();
    if (!ok.includes(reply.code)) {
      // Server text can echo addresses; keep only the code and a short, generic hint.
      const hint = reply.code === 535 || reply.code === 534 ? "login rejected (check GMAIL_USER and GMAIL_APP_PASSWORD)" : `${step} rejected`;
      throw new SmtpError(`SMTP_${reply.code}`, hint);
    }
    return reply;
  };
  const command = async (line: string, step: string, ok: number[]) => {
    await write(`${line}\r\n`);
    return expect(step, ok);
  };

  const conversation = (async () => {
    await expect("greeting", [220]);
    await command("EHLO gymx.life", "EHLO", [250]);
    await command(`AUTH PLAIN ${base64(`\0${opts.user}\0${opts.password}`)}`, "AUTH", [235]);
    await command(`MAIL FROM:<${opts.user}>`, "MAIL FROM", [250]);
    await command(`RCPT TO:<${parseAddress(opts.message.to).address}>`, "RCPT TO", [250, 251]);
    await command("DATA", "DATA", [354]);
    const from = { name: parseAddress(opts.message.from).name, address: opts.user };
    const body = buildMimeMessage(opts.message, from, opts.messageId, opts.now)
      .split("\r\n")
      .map((l) => (l.startsWith(".") ? `.${l}` : l))
      .join("\r\n");
    await write(`${body}\r\n.\r\n`);
    await expect("message", [250]);
    await write("QUIT\r\n").catch(() => {});
  })();

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SmtpError("E_TIMEOUT", "SMTP conversation timed out")), opts.timeoutMs ?? SMTP_TIMEOUT_MS);
  });

  try {
    await Promise.race([conversation, timeout]);
  } catch (e) {
    if (e instanceof SmtpError) throw e;
    throw new SmtpError("E_NETWORK", "could not reach the SMTP server");
  } finally {
    clearTimeout(timer);
    conversation.catch(() => {});
    await socket.close().catch(() => {});
  }
}
