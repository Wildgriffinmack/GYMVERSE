import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { loadConfig } from "../src/config.ts";
import type { GuardianConfig } from "../src/config.ts";
import { isLoopback } from "../src/http/auth.ts";
import { createGuardianServer } from "../src/http/server.ts";
import { silentLogger } from "../src/log.ts";
import { buildTestGuardian } from "./helpers.ts";

const ADMIN = "moderator-token-for-tests-123456";
const TS = "trust-safety-token-for-tests-1234";

async function start(env: Record<string, string> = {}): Promise<{ server: Server; base: string; config: GuardianConfig }> {
  const config = loadConfig({ GUARDIAN_ADMIN_TOKEN: ADMIN, GUARDIAN_TRUST_SAFETY_TOKEN: TS, GUARDIAN_RATE_LIMIT_PER_MIN: "1000", ...env });
  const { guardian, store, queue } = buildTestGuardian();
  const server = createGuardianServer({ config, guardian, store, queue, log: silentLogger, modelHealth: async () => null });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { server, base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, config };
}

const json = (body: unknown, token?: string) => ({
  method: "POST",
  headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});
const auth = (token: string) => ({ headers: { authorization: `Bearer ${token}` } });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = async (url: string, init?: RequestInit): Promise<any> => (await fetch(url, init)).json();

describe("HTTP API", () => {
  let server: Server;
  let base = "";
  before(async () => ({ server, base } = await start()));
  after(() => server.close());

  it("serves health and readiness", async () => {
    assert.deepEqual(await call(`${base}/healthz`), { ok: true });
    const ready = (await call(`${base}/readyz`)) as { model: { provider: string } };
    assert.equal(ready.model.provider, "none");
  });

  it("moderates content end to end", async () => {
    const ok = await call(`${base}/v1/moderate`, json({ content_type: "post", text: "PR day: 315 squat" }));
    assert.equal(ok.status, "approved");
    const bad = await call(`${base}/v1/moderate`, json({ content_type: "comment", text: "DM me for gear" }));
    assert.equal(bad.status, "rejected");
    const review = await call(`${base}/v1/moderate`, json({ content_type: "post", text: "Everyone should hop on." }));
    assert.equal(review.status, "needs_review");
    assert.match(review.review_id, /^rv_/);
  });

  it("validates input", async () => {
    assert.equal((await fetch(`${base}/v1/moderate`, json({ content_type: "tweet", text: "x" }))).status, 400);
    assert.equal((await fetch(`${base}/v1/moderate`, json({ content_type: "comment" }))).status, 400);
    assert.equal((await fetch(`${base}/v1/moderate`, json({ content_type: "profile_username", text: "x".repeat(31) }))).status, 400);
    assert.equal((await fetch(`${base}/v1/moderate`, { method: "POST", headers: { "content-type": "text/plain" }, body: "hi" })).status, 415);
    assert.equal((await fetch(`${base}/v1/moderate`, { method: "POST", headers: { "content-type": "application/json" }, body: "{oops" })).status, 400);
    assert.equal((await fetch(`${base}/v1/moderate`, json({ content_type: "post", text: "a".repeat(40000) }))).status, 413);
    assert.equal((await fetch(`${base}/v1/moderate`)).status, 405);
  });

  it("accepts user reports on their own endpoint", async () => {
    const r = await call(`${base}/v1/reports`, json({ report: { reason: "harassment", target_content_type: "comment", target_text: "loser" } }));
    assert.equal(r.status, "needs_review");
    assert.equal(r.content_type, "user_report");
  });

  it("requires a moderator token for the review API", async () => {
    assert.equal((await fetch(`${base}/v1/review/queue`)).status, 401);
    assert.equal((await fetch(`${base}/v1/review/queue`, auth("wrong-token-wrong-token-xx"))).status, 401);
    assert.equal((await fetch(`${base}/v1/review/queue`, auth(ADMIN))).status, 200);
  });

  it("filters the queue and applies moderator actions", async () => {
    const created = await call(`${base}/v1/moderate`, json({ content_type: "comment", text: "You look so fat lol" }));
    const q = await call(`${base}/v1/review/queue?content_type=comment&severity=high`, auth(ADMIN));
    assert.ok(q.items.some((i: { id: string }) => i.id === created.review_id));
    assert.equal((await fetch(`${base}/v1/review/queue?status=bogus`, auth(ADMIN))).status, 400);

    const acted = await call(`${base}/v1/review/items/${created.review_id}/actions`, json({ action: "request_edit", note: "Remove the insult" }, ADMIN));
    assert.equal(acted.status, "edit_requested");
    assert.equal((await fetch(`${base}/v1/review/items/${created.review_id}/actions`, json({ action: "approve" }, ADMIN))).status, 409);
    assert.equal((await fetch(`${base}/v1/review/items/${created.review_id}/actions`, json({ action: "delete" }, ADMIN))).status, 400);

    const hist = await call(`${base}/v1/review/history?limit=5`, auth(ADMIN));
    assert.equal(hist.entries[0].action, "request_edit");
    assert.equal(hist.entries[0].note, "Remove the insult");
  });

  it("keeps direct messages private; only Trust & Safety can reveal, and it is audited", async () => {
    const dm = await call(`${base}/v1/moderate`, json({ content_type: "direct_message", text: "Everyone should hop on, DM me later" }));
    const item = await call(`${base}/v1/review/items/${dm.review_id}`, auth(ADMIN));
    assert.equal(item.text, null);
    assert.equal(item.private, true);
    assert.equal((await fetch(`${base}/v1/review/items/${dm.review_id}/reveal`, json({}, ADMIN))).status, 403);
    const revealed = await call(`${base}/v1/review/items/${dm.review_id}/reveal`, json({ note: "Report investigation" }, TS));
    assert.match(revealed.text, /hop on/);
    const hist = await call(`${base}/v1/review/history?limit=1`, auth(ADMIN));
    assert.equal(hist.entries[0].action, "reveal_private");
    assert.equal(hist.entries[0].actor, "trust-safety");
  });

  it("serves the dashboard with a strict content security policy", async () => {
    const res = await fetch(`${base}/admin`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-security-policy") ?? "", /script-src 'self'/);
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.match(await res.text(), /GUARDIAN/);
  });
});

describe("HTTP hardening", () => {
  it("rate limits public moderation per client", async () => {
    const { server, base } = await start({ GUARDIAN_RATE_LIMIT_PER_MIN: "3" });
    try {
      const codes: number[] = [];
      for (let i = 0; i < 5; i++) codes.push((await fetch(`${base}/v1/moderate`, json({ content_type: "post", text: "hi" }))).status);
      assert.deepEqual(codes, [200, 200, 200, 429, 429]);
    } finally {
      server.close();
    }
  });

  it("recognizes loopback addresses only", () => {
    for (const a of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) assert.equal(isLoopback(a), true, a);
    for (const a of ["192.168.68.84", "10.0.2.2", "::ffff:192.168.1.5", undefined]) assert.equal(isLoopback(a), false, String(a));
  });

  it("refuses weak or duplicate tokens and invalid model settings", () => {
    assert.throws(() => loadConfig({ GUARDIAN_ADMIN_TOKEN: "short" }), /at least 24/);
    assert.throws(() => loadConfig({ GUARDIAN_ADMIN_TOKEN: ADMIN, GUARDIAN_TRUST_SAFETY_TOKEN: ADMIN }), /must differ/);
    assert.throws(() => loadConfig({ GUARDIAN_MODEL_PROVIDER: "ollama" }), /GUARDIAN_MODEL is required/);
    assert.throws(() => loadConfig({ GUARDIAN_MODEL_PROVIDER: "openai", GUARDIAN_MODEL: "x" }), /none or ollama/);
  });

  it("generates a one-time admin token when none is configured and binds to localhost by default", () => {
    const c = loadConfig({});
    assert.equal(c.adminTokenGenerated, true);
    assert.ok(c.adminToken.length >= 24);
    assert.equal(c.host, "127.0.0.1");
    assert.equal(loadConfig({}, { lan: true }).host, "0.0.0.0");
  });
});
