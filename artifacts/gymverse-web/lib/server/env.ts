/** Minimal shapes of the Cloudflare bindings this site uses (kept local so Node tests can supply fakes). */

export interface D1Result {
  meta?: { changes?: number };
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface EmailMessageInput {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/** Cloudflare Email Service `send_email` binding. */
export interface SendEmailBinding {
  send(message: EmailMessageInput): Promise<{ messageId: string }>;
}

/** Subset of a `cloudflare:sockets` Socket used by the SMTP sender. */
export interface SocketLike {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  close(): Promise<void>;
}

/** `connect()` from `cloudflare:sockets`, injected by the route so Node tests can pass a fake. */
export type ConnectFn = (address: { hostname: string; port: number }, options?: { secureTransport?: "off" | "on" | "starttls"; allowHalfOpen?: boolean }) => SocketLike;

/**
 * Worker environment. Every field is optional so the site degrades safely:
 * no DB → the API reports "unavailable"; no mail provider → signups are saved and notifications are skipped.
 */
export interface WaitlistEnv {
  /** D1 database binding (wrangler.jsonc → d1_databases). */
  DB?: D1Database;
  /** Cloudflare Email Service binding (optional provider). */
  EMAIL?: SendEmailBinding;
  /** Resend API key (optional provider). Secret: add it under the Worker's Settings → Variables and Secrets, or `wrangler secret put`. */
  RESEND_API_KEY?: string;
  /** Google Workspace / Gmail account that sends notifications over SMTP (optional provider). Secret. */
  GMAIL_USER?: string;
  /** 16-character Google app password for GMAIL_USER. Secret. */
  GMAIL_APP_PASSWORD?: string;
  /** Team inbox for signup notifications. */
  NOTIFY_TO?: string;
  /** IANA time zone for times in team notifications (default "America/Los_Angeles"). */
  NOTIFY_TIMEZONE?: string;
  /** Sender for team notifications, e.g. "GYMX Waitlist <waitlist@gymx.life>". Must be on a verified sending domain. */
  NOTIFY_FROM?: string;
  /** "true" turns on confirmation emails to new members. Off by default. */
  CONFIRMATION_EMAILS_ENABLED?: string;
  /** Sender for member confirmation emails. */
  CONFIRMATION_FROM?: string;
  /** Secret salt for hashing IP addresses in rate limiting. */
  WAITLIST_HASH_SALT?: string;
}
