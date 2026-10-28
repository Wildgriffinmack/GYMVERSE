// Waitlist API: storage, duplicates, validation, abuse controls, notifications and privacy.
// Uses Node's built-in SQLite (the engine behind Cloudflare D1) so constraints are exercised for real.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { afterSignup, handleWaitlistPost, sanitizeContext } from "../lib/server/handler.ts";
import { RATE_LIMIT_MAX, resetSchemaCache } from "../lib/server/store.ts";
import { SCHEMA_STATEMENTS } from "../lib/server/schema.ts";
import { CONFIRMATION_SUBJECT, buildTeamNotification, getMailer } from "../lib/server/email.ts";
import { buildMimeMessage, encodeHeader, sendViaSmtp } from "../lib/server/smtp.ts";
import { createApiAdapter } from "../lib/submit.ts";
import { EMPTY_MEMBER, prepareMember } from "../lib/waitlist.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const NOW = new Date("2026-10-28T12:00:00Z");

/** Cloudflare D1-shaped wrapper around node:sqlite. */
function d1(path = ":memory:") {
  const raw = new DatabaseSync(path);
  const statement = (sql, params = []) => ({
    bind: (...p) => statement(sql, p),
    first: async () => raw.prepare(sql).get(...params) ?? null,
    run: async () => ({ meta: { changes: Number(raw.prepare(sql).run(...params).changes) } }),
    exec: () => raw.prepare(sql).run(...params),
  });
  return {
    raw,
    prepare: (sql) => statement(sql),
    batch: async (stmts) => {
      raw.exec("BEGIN");
      try {
        const out = stmts.map((s) => s.exec());
        raw.exec("COMMIT");
        return out;
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

function emailBinding({ fail = null } = {}) {
  return {
    sent: [],
    async send(message) {
      if (fail) throw Object.assign(new Error(fail.message), { code: fail.code });
      this.sent.push(message);
      return { messageId: `m${this.sent.length}` };
    },
  };
}

const memberValues = {
  fullName: "Maya Brooks",
  email: "Maya@Example.com",
  ageRange: "18_24",
  confirmedAge13: false,
  fitnessLevel: "inconsistent",
  userType: "student",
  struggle: "gym_anxiety",
  betaTester: true,
  source: "tiktok",
};
const coachValues = {
  fullName: "Dre Coleman",
  email: "dre@coachdre.fit",
  handle: "@coach.dre",
  coachType: "online_coach",
  audienceSize: "5k_20k",
  helpMost: "Running beginner challenges.",
  leadBeta: true,
};
const context = { heroVariant: "2", channel: "tiktok", utm: { utm_source: "tiktok", utm_campaign: "beta_waitlist" }, referrerHost: "" };

function req(body, { ip = "203.0.113.7", origin = "https://gymx.life", type = "application/json", raw } = {}) {
  const headers = { "Content-Type": type, "CF-Connecting-IP": ip };
  if (origin) headers.Origin = origin;
  return new Request("https://gymx.life/api/waitlist", { method: "POST", headers, body: raw ?? JSON.stringify(body) });
}

async function call(env, body, opts, handlerOpts = {}) {
  const pending = [];
  const res = await handleWaitlistPost(req(body, opts), env, (p) => pending.push(p), { now: () => NOW, ...handlerOpts });
  await Promise.all(pending);
  return { res, body: await res.json(), background: pending.length };
}

const rows = (db) =>
  db.raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'waitlist_signups'").get()
    ? db.raw.prepare("SELECT * FROM waitlist_signups ORDER BY created_at").all()
    : [];

let db;
let mail;
let env;
beforeEach(() => {
  resetSchemaCache();
  db = d1();
  mail = emailBinding();
  env = { DB: db, EMAIL: mail, NOTIFY_TO: "team@gymx.life" };
});

describe("schema", () => {
  it("migration file and runtime schema stay in sync", () => {
    const migration = readFileSync(join(ROOT, "migrations/0001_create_waitlist.sql"), "utf8").replace(/--[^\n]*/g, "").replace(/\s+/g, " ");
    for (const stmt of SCHEMA_STATEMENTS) assert.ok(migration.includes(stmt.replace(/\s+/g, " ").trim()), stmt.slice(0, 60));
  });
  it("enforces one row per email per signup type at the database level", async () => {
    await call(env, { kind: "member", values: memberValues, context });
    assert.throws(() =>
      db.raw.prepare("INSERT INTO waitlist_signups (id, kind, email, full_name, source, created_at) VALUES ('x', 'member', 'maya@example.com', 'X', 's', 't')").run(),
    /UNIQUE constraint failed/);
  });
});

describe("saving signups", () => {
  it("stores a valid member signup with id, timestamp, source and normalized email", async () => {
    const { res, body } = await call(env, { kind: "member", values: memberValues, context });
    assert.equal(res.status, 200);
    assert.deepEqual(body, { ok: true });
    const [row] = rows(db);
    assert.match(row.id, /^[0-9a-f-]{36}$/);
    assert.equal(row.kind, "member");
    assert.equal(row.email, "maya@example.com");
    assert.equal(row.full_name, "Maya Brooks");
    assert.equal(row.source, "gymx.life website");
    assert.equal(row.created_at, "2026-10-28T12:00:00.000Z");
    assert.equal(row.struggle, "gym_anxiety");
    assert.equal(row.beta_tester, 1);
    assert.equal(row.heard_from, "tiktok");
    assert.equal(row.hero_variant, "2");
    assert.deepEqual(JSON.parse(row.utm), { utm_source: "tiktok", utm_campaign: "beta_waitlist" });
  });
  it("stores coach applications separately from member signups", async () => {
    await call(env, { kind: "member", values: { ...memberValues, email: "dre@coachdre.fit" }, context });
    await call(env, { kind: "coach", values: coachValues, context });
    const all = rows(db);
    assert.deepEqual(all.map((r) => r.kind).sort(), ["coach", "member"]);
    const coach = all.find((r) => r.kind === "coach");
    assert.equal(coach.handle, "@coach.dre");
    assert.equal(coach.lead_beta, 1);
  });
  it("duplicates (any casing/spacing) are not stored twice, get the same response, and send no second notification", async () => {
    const first = await call(env, { kind: "member", values: memberValues, context });
    const second = await call(env, { kind: "member", values: { ...memberValues, email: "  MAYA@example.COM " }, context, }, { ip: "198.51.100.9" });
    assert.deepEqual(second.body, first.body);
    assert.equal(second.res.status, first.res.status);
    assert.equal(rows(db).length, 1);
    assert.equal(mail.sent.length, 1);
    assert.equal(second.background, 0);
  });
  it("concurrent identical submissions still create exactly one row", async () => {
    await Promise.all([1, 2, 3].map((i) => call(env, { kind: "member", values: memberValues, context }, { ip: `192.0.2.${i}` })));
    assert.equal(rows(db).length, 1);
    assert.equal(mail.sent.length, 1);
  });
  it("records survive a restart (new connection, new isolate)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "gymx-d1-"));
    try {
      const file = join(dir, "waitlist.sqlite");
      const first = d1(file);
      await call({ DB: first }, { kind: "member", values: memberValues, context });
      first.raw.close();
      resetSchemaCache();
      const reopened = d1(file);
      assert.equal(rows(reopened).length, 1);
      await call({ DB: reopened }, { kind: "member", values: memberValues, context });
      assert.equal(rows(reopened).length, 1, "duplicate still blocked after restart");
      reopened.raw.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("validation and abuse controls", () => {
  it("rejects invalid emails server-side with field names only", async () => {
    for (const email of ["", "nope", "a@b", "a b@c.com"]) {
      const { res, body } = await call(env, { kind: "member", values: { ...memberValues, email }, context }, { ip: `10.0.0.${email.length}` });
      assert.equal(res.status, 400, email);
      assert.equal(body.error, "invalid");
      assert.ok(body.fields.includes("email"));
      assert.ok(!JSON.stringify(body).includes("Maya"), "no input echoed back");
    }
    assert.equal(rows(db).length, 0);
  });
  it("rejects values outside the offered options and unknown signup types", async () => {
    assert.equal((await call(env, { kind: "member", values: { ...memberValues, ageRange: "12" }, context })).res.status, 400);
    assert.equal((await call(env, { kind: "admin", values: memberValues, context })).res.status, 400);
    assert.equal(rows(db).length, 0);
  });
  it("requires the 13+ confirmation for under-18 signups on the server too", async () => {
    const { res, body } = await call(env, { kind: "member", values: { ...memberValues, ageRange: "under_18" }, context });
    assert.equal(res.status, 400);
    assert.deepEqual(body.fields, ["confirmedAge13"]);
  });
  it("ignores unknown fields and wrong types instead of storing them", async () => {
    await call(env, { kind: "member", values: { ...memberValues, isAdmin: true, betaTester: "yes", notes: "x".repeat(5000) }, context });
    const [row] = rows(db);
    assert.equal(row.beta_tester, 0);
    assert.ok(!("is_admin" in row) && !("notes" in row));
  });
  it("blocks malformed, oversized, wrong-type and cross-site requests", async () => {
    assert.equal((await call(env, null, { raw: "{not json" })).res.status, 400);
    assert.equal((await call(env, null, { raw: JSON.stringify({ kind: "member", values: { fullName: "x".repeat(9000) } }) })).res.status, 413);
    assert.equal((await call(env, { kind: "member", values: memberValues }, { type: "text/plain" })).res.status, 415);
    assert.equal((await call(env, { kind: "member", values: memberValues }, { origin: "https://evil.example" })).res.status, 403);
    assert.equal(rows(db).length, 0);
  });
  it("silently drops submissions that fill the hidden honeypot field", async () => {
    const { res, body } = await call(env, { kind: "member", values: memberValues, context, website: "http://spam.example" });
    assert.equal(res.status, 200);
    assert.deepEqual(body, { ok: true });
    assert.equal(rows(db).length, 0);
    assert.equal(mail.sent.length, 0);
  });
  it(`rate limits to ${RATE_LIMIT_MAX} submissions per IP per 10 minutes without storing raw IPs`, async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const r = await call(env, { kind: "member", values: { ...memberValues, email: `m${i}@example.com` }, context }, { ip: "198.51.100.1" });
      assert.equal(r.res.status, 200);
    }
    const blocked = await call(env, { kind: "member", values: { ...memberValues, email: "late@example.com" }, context }, { ip: "198.51.100.1" });
    assert.equal(blocked.res.status, 429);
    assert.equal(blocked.res.headers.get("Retry-After"), "600");
    assert.equal(blocked.body.error, "rate_limited");
    assert.equal((await call(env, { kind: "member", values: { ...memberValues, email: "other@example.com" }, context }, { ip: "198.51.100.2" })).res.status, 200);
    const keys = db.raw.prepare("SELECT key FROM waitlist_rate_limits").all().map((r) => r.key);
    assert.ok(keys.every((k) => /^[0-9a-f]{64}$/.test(k)), "only hashes stored");
    assert.ok(!JSON.stringify(rows(db)).includes("198.51.100"), "no IPs in signups");
  });
  it("sanitizes client attribution", () => {
    assert.deepEqual(sanitizeContext({ heroVariant: "9", channel: "evil", utm: { utm_source: "TikTok", bad: "x", utm_term: 5 }, referrerHost: "<script>" }), {
      heroVariant: "1",
      channel: "direct",
      utm: { utm_source: "tiktok" },
      referrerHost: "",
    });
  });
  it("reports unavailable (and stores nothing) when the database is not bound", async () => {
    const { res, body } = await call({ EMAIL: mail }, { kind: "member", values: memberValues, context });
    assert.equal(res.status, 503);
    assert.equal(body.error, "unavailable");
  });
  it("responses never expose stored data", async () => {
    await call(env, { kind: "member", values: memberValues, context });
    const { body } = await call(env, { kind: "member", values: memberValues, context });
    assert.deepEqual(Object.keys(body), ["ok"]);
  });
});

describe("team notifications", () => {
  const errors = [];
  const origError = console.error;
  const origWarn = console.warn;
  beforeEach(() => {
    errors.length = 0;
    console.error = (...a) => errors.push(a.join(" "));
    console.warn = (...a) => errors.push(a.join(" "));
  });
  after(() => {
    console.error = origError;
    console.warn = origWarn;
  });

  it("emails team@gymx.life once per new signup with email, time and totals", async () => {
    await call(env, { kind: "coach", values: coachValues, context });
    await call(env, { kind: "member", values: memberValues, context }, { ip: "192.0.2.50" });
    assert.equal(mail.sent.length, 2);
    const m = mail.sent[1];
    assert.equal(m.to, "team@gymx.life");
    assert.equal(m.subject, "New GYMX waitlist signup");
    assert.match(m.text, /Email: maya@example\.com/);
    assert.match(m.text, /Registered: Wed, 28 Oct 2026 12:00:00 UTC/);
    assert.match(m.text, /Total registrations: 2 \(1 waitlist, 1 coach applications\)/);
    assert.equal(mail.sent[0].subject, "New GYMX founding coach application");
    assert.deepEqual(rows(db).map((r) => r.notify_status), ["sent", "sent"]);
  });
  it("a failed email never removes the saved signup; the failure is recorded and logged without personal data", async () => {
    env.EMAIL = emailBinding({ fail: { code: "E_SENDER_NOT_VERIFIED", message: "Sender domain not verified" } });
    const { res } = await call(env, { kind: "member", values: memberValues, context });
    assert.equal(res.status, 200);
    const [row] = rows(db);
    assert.equal(row.email, "maya@example.com");
    assert.equal(row.notify_status, "failed");
    assert.equal(row.notify_attempts, 1);
    assert.match(row.notify_error, /^E_SENDER_NOT_VERIFIED/);
    assert.ok(errors.some((e) => e.includes("waitlist_notify_failed")));
    assert.ok(!errors.join(" ").includes("maya@example.com"), "email address not logged");
  });
  it("saves signups and marks notifications skipped when no email provider is configured", async () => {
    delete env.EMAIL;
    await call(env, { kind: "member", values: memberValues, context });
    const [row] = rows(db);
    assert.equal(row.notify_status, "skipped");
    assert.equal(row.notify_attempts, 0);
  });
  it("Resend provider: server-side request with secret key, idempotency key and team recipient", async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, init });
      return new Response("{}", { status: 200 });
    };
    const s = prepareMember({ ...EMPTY_MEMBER, ...memberValues }, context, NOW).submission;
    const resendEnv = { DB: db, RESEND_API_KEY: "re_test_key", NOTIFY_FROM: "GYMX <waitlist@send.gymx.life>" };
    await call(resendEnv, { kind: "member", values: memberValues, context }, { ip: "192.0.2.77" });
    const id = rows(db)[0].id;
    calls.length = 0;
    await afterSignup(resendEnv, s, id, fetchImpl);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    assert.equal(calls[0].init.headers.Authorization, "Bearer re_test_key");
    assert.equal(calls[0].init.headers["Idempotency-Key"], `${id}:team`);
    const sent = JSON.parse(calls[0].init.body);
    assert.deepEqual(sent.to, ["team@gymx.life"]);
    assert.equal(sent.from, "GYMX <waitlist@send.gymx.life>");
    assert.equal(rows(db)[0].notify_status, "sent");
    const failing = getMailer({ RESEND_API_KEY: "k" }, async () => new Response("{}", { status: 422 }));
    await assert.rejects(failing.send({ to: "a@b.co", from: "x@y.co", subject: "s", text: "t", html: "h" }, "k"), /HTTP 422/);
  });
  it("confirmation emails are off by default and only sent when explicitly enabled", async () => {
    await call(env, { kind: "member", values: memberValues, context });
    assert.equal(mail.sent.length, 1);
    assert.equal(rows(db)[0].confirmation_status, "disabled");

    resetSchemaCache();
    db = d1();
    mail = emailBinding();
    const on = { DB: db, EMAIL: mail, CONFIRMATION_EMAILS_ENABLED: "true", CONFIRMATION_FROM: "The GYMX Team <hello@gymx.life>" };
    await call(on, { kind: "member", values: memberValues, context });
    assert.equal(mail.sent.length, 2);
    assert.equal(mail.sent[1].to, "maya@example.com");
    assert.equal(mail.sent[1].subject, CONFIRMATION_SUBJECT);
    assert.match(mail.sent[1].text, /You're officially on the waitlist/);
    assert.equal(rows(db)[0].confirmation_status, "sent");
  });
  it("escapes user-provided text in HTML emails", () => {
    const m = buildTeamNotification({ kind: "member", email: "<b>x</b>@example.com", createdAt: NOW.toISOString(), totals: null }, "t@x.co", "f@x.co");
    assert.ok(!m.html.includes("<b>x</b>"));
    assert.ok(m.html.includes("&lt;b&gt;"));
  });
});

/** In-memory SMTP server speaking just enough of Gmail's dialogue, exposed as a `cloudflare:sockets` connect(). */
function fakeSmtp({ authOk = true, silent = false } = {}) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const state = { commands: [], data: "", address: null, options: null, closed: false };
  state.connect = (address, options) => {
    state.address = address;
    state.options = options;
    let ctrl;
    let buf = "";
    let inData = false;
    const reply = (s) => ctrl.enqueue(enc.encode(`${s}\r\n`));
    const readable = new ReadableStream({
      start(c) {
        ctrl = c;
        if (!silent) reply("220 smtp.gmail.com ESMTP ready");
      },
    });
    const writable = new WritableStream({
      write(chunk) {
        buf += dec.decode(chunk);
        for (;;) {
          if (inData) {
            const end = buf.indexOf("\r\n.\r\n");
            if (end < 0) return;
            state.data = buf.slice(0, end);
            buf = buf.slice(end + 5);
            inData = false;
            reply("250 2.0.0 OK queued");
            continue;
          }
          const i = buf.indexOf("\r\n");
          if (i < 0) return;
          const line = buf.slice(0, i);
          buf = buf.slice(i + 2);
          state.commands.push(line);
          if (line.startsWith("EHLO")) reply("250-smtp.gmail.com at your service\r\n250-AUTH LOGIN PLAIN\r\n250 SMTPUTF8");
          else if (line.startsWith("AUTH")) reply(authOk ? "235 2.7.0 Accepted" : "535-5.7.8 Username and Password not accepted for sender@gymx.life\r\n535 5.7.8 https://support.google.com/mail");
          else if (line.startsWith("MAIL FROM") || line.startsWith("RCPT TO")) reply("250 2.1.0 OK");
          else if (line === "DATA") {
            inData = true;
            reply("354 Go ahead");
          } else if (line === "QUIT") reply("221 2.0.0 closing connection");
        }
      },
    });
    return { readable, writable, close: async () => void (state.closed = true) };
  };
  return state;
}

const decodeParts = (data) => [...data.matchAll(/base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--/g)].map((m) => Buffer.from(m[1].replace(/\r\n/g, ""), "base64").toString("utf8"));

describe("Gmail (Google Workspace SMTP) provider", () => {
  const errors = [];
  const origError = console.error;
  beforeEach(() => {
    errors.length = 0;
    console.error = (...a) => errors.push(a.join(" "));
  });
  after(() => {
    console.error = origError;
  });
  const gmailEnv = () => ({ DB: db, NOTIFY_TO: "team@gymx.life", GMAIL_USER: "sender@gymx.life", GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop" });

  it("signs in with the app password over TLS on port 465 and delivers the notification to the team inbox", async () => {
    const smtp = fakeSmtp();
    const { res } = await call(gmailEnv(), { kind: "member", values: memberValues, context }, undefined, { connect: smtp.connect });
    assert.equal(res.status, 200);
    assert.deepEqual(smtp.address, { hostname: "smtp.gmail.com", port: 465 });
    assert.equal(smtp.options.secureTransport, "on");
    assert.equal(smtp.commands[0], "EHLO gymx.life");
    assert.equal(Buffer.from(smtp.commands[1].replace("AUTH PLAIN ", ""), "base64").toString(), "\0sender@gymx.life\0abcdefghijklmnop");
    assert.equal(smtp.commands[2], "MAIL FROM:<sender@gymx.life>");
    assert.equal(smtp.commands[3], "RCPT TO:<team@gymx.life>");
    assert.match(smtp.data, /^From: "GYMX Waitlist" <sender@gymx\.life>\r\n/m);
    assert.match(smtp.data, /^To: <team@gymx\.life>\r$/m);
    assert.match(smtp.data, /^Subject: New GYMX waitlist signup\r$/m);
    const [text, html] = decodeParts(smtp.data);
    assert.match(text, /Email: maya@example\.com/);
    assert.match(text, /Total registrations: 1/);
    assert.match(html, /maya@example\.com/);
    assert.ok(smtp.closed, "socket closed");
    assert.equal(rows(db)[0].notify_status, "sent");
  });
  it("a rejected login marks the notification failed without losing the signup or logging addresses", async () => {
    const smtp = fakeSmtp({ authOk: false });
    await call(gmailEnv(), { kind: "member", values: memberValues, context }, undefined, { connect: smtp.connect });
    const [row] = rows(db);
    assert.equal(row.email, "maya@example.com");
    assert.equal(row.notify_status, "failed");
    assert.match(row.notify_error, /^SMTP_535: Gmail: login rejected/);
    assert.ok(!row.notify_error.includes("sender@gymx.life"));
    assert.ok(errors.some((e) => e.includes('"provider":"gmail"')));
    assert.ok(!errors.join(" ").includes("@"), "no email addresses logged");
    assert.ok(smtp.closed);
  });
  it("only sends once per new email", async () => {
    const smtp = fakeSmtp();
    await call(gmailEnv(), { kind: "member", values: memberValues, context }, undefined, { connect: smtp.connect });
    smtp.commands.length = 0;
    await call(gmailEnv(), { kind: "member", values: memberValues, context }, undefined, { connect: smtp.connect });
    assert.equal(smtp.commands.length, 0);
  });
  it("times out instead of hanging when the server never answers", async () => {
    const smtp = fakeSmtp({ silent: true });
    await assert.rejects(sendViaSmtp({ connect: smtp.connect, user: "a@b.co", password: "p", message: { to: "t@x.co", from: "f@x.co", subject: "s", text: "t", html: "h" }, messageId: "m", timeoutMs: 50 }), /timed out/);
    assert.ok(smtp.closed);
  });
  it("is used only when both secrets and sockets are available, after Cloudflare and Resend", () => {
    const smtp = fakeSmtp();
    assert.equal(getMailer({ GMAIL_USER: "a@b.co", GMAIL_APP_PASSWORD: "p" }), null, "no sockets → no Gmail");
    assert.equal(getMailer({ GMAIL_USER: "a@b.co" }, fetch, smtp.connect), null);
    assert.equal(getMailer({ GMAIL_USER: "a@b.co", GMAIL_APP_PASSWORD: "p" }, fetch, smtp.connect).provider, "gmail");
    assert.equal(getMailer({ RESEND_API_KEY: "k", GMAIL_USER: "a@b.co", GMAIL_APP_PASSWORD: "p" }, fetch, smtp.connect).provider, "resend");
  });
  it("keeps headers on one line and encodes non-ASCII", () => {
    assert.equal(encodeHeader("Hi\r\nBcc: x@y.co"), "Hi Bcc: x@y.co");
    assert.equal(encodeHeader("Café"), "=?UTF-8?B?Q2Fmw6k=?=");
    const mime = buildMimeMessage({ to: "t@x.co", from: "f@x.co", subject: "a\r\nb", text: "t", html: "h" }, { name: "", address: "f@x.co" }, "id:team", NOW);
    assert.match(mime, /^Subject: a b\r$/m);
    assert.match(mime, /^Message-ID: <idteam@gymx\.life>\r$/m);
    assert.ok(!/[^\r]\n/.test(mime), "CRLF line endings only");
  });
});

describe("browser adapter", () => {
  const s = prepareMember({ ...EMPTY_MEMBER, ...memberValues }, context, NOW).submission;
  it("posts the form to /api/waitlist and reports a real save", async () => {
    let sent;
    const adapter = createApiAdapter("/api/waitlist", async (url, init) => {
      sent = { url, body: JSON.parse(init.body), headers: init.headers };
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    assert.equal(adapter.persistent, true);
    assert.deepEqual(await adapter.submit(s, { honeypot: "" }), { ok: true, persisted: true });
    assert.equal(sent.url, "/api/waitlist");
    assert.equal(sent.body.kind, "member");
    assert.equal(sent.body.values.email, "maya@example.com");
    assert.equal(sent.body.website, "");
  });
  it("turns failures into clear messages", async () => {
    const respond = (status, body) => createApiAdapter("/api/waitlist", async () => new Response(JSON.stringify(body), { status }));
    assert.match((await respond(429, { ok: false, error: "rate_limited" }).submit(s)).message, /Too many attempts/);
    assert.match((await respond(400, { ok: false, error: "invalid" }).submit(s)).message, /check the form/);
    assert.match((await respond(503, { ok: false, error: "unavailable" }).submit(s)).message, /couldn’t save your signup/);
    const offline = createApiAdapter("/api/waitlist", async () => { throw new TypeError("Failed to fetch"); });
    assert.match((await offline.submit(s)).message, /Check your connection/);
  });
});
