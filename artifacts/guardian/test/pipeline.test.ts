import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAssessment, ModelOutputError } from "../src/model/adapter.ts";
import { BoundedQueue, QueueFullError, TaskTimeoutError } from "../src/model/queue.ts";
import { FakeModel, answer, buildTestGuardian, never, req } from "./helpers.ts";

describe("rules-only mode (no model)", () => {
  it("approves safe content without a model", async () => {
    const { guardian } = buildTestGuardian();
    const d = await guardian.moderate(req("post", "Hit a 405 deadlift today!"));
    assert.equal(d.status, "approved");
    assert.equal(d.source, "local_rules");
    assert.equal(d.review_id, undefined);
  });

  it("queues ambiguous content for a human and returns a review id", async () => {
    const { guardian, store } = buildTestGuardian();
    const d = await guardian.moderate(req("post", "Everyone should hop on."));
    assert.equal(d.status, "needs_review");
    assert.equal(d.requires_human_review, true);
    assert.ok(d.review_id);
    assert.equal(store.get(d.review_id!).status, "pending");
  });

  it("records automatic rejections in the audit history", async () => {
    const { guardian, store } = buildTestGuardian();
    const d = await guardian.moderate(req("comment", "DM me for gear"));
    assert.equal(d.status, "rejected");
    assert.equal(store.history(5)[0].action, "auto_reject");
  });

  it("uses the documented response shape", async () => {
    const { guardian } = buildTestGuardian();
    const d = await guardian.moderate(req("post", "Take this dosage.", { client_ref: "abc-1" }));
    for (const key of ["status", "risk_score", "categories", "reason", "source", "requires_human_review", "decision_id", "policy_version"]) assert.ok(key in d, key);
    assert.ok(d.risk_score >= 0 && d.risk_score <= 1);
    assert.equal(d.client_ref, "abc-1");
  });
});

describe("model unavailable", () => {
  it("never approves content that needs assessment when the model times out", async () => {
    const model = never();
    const { guardian } = buildTestGuardian({ model, timeoutMs: 50 });
    const d = await guardian.moderate(req("post", "Everyone should hop on."));
    assert.equal(d.status, "needs_review");
    assert.equal(d.retryable, true);
    assert.match(d.reason, /unavailable \(timed out\)/);
    assert.equal(model.calls.length, 1);
  });

  it("holds content for review when the model returns garbage", async () => {
    const model = new FakeModel(async () => parseAssessment("not json at all"));
    const { guardian } = buildTestGuardian({ model });
    const d = await guardian.moderate(req("comment", "You look so fat lol"));
    assert.equal(d.status, "needs_review");
    assert.match(d.reason, /invalid model output/);
  });

  it("holds content for review when the runtime is unreachable", async () => {
    const model = new FakeModel(async () => {
      throw new TypeError("fetch failed");
    });
    const { guardian } = buildTestGuardian({ model });
    const d = await guardian.moderate(req("post", "Take this dosage."));
    assert.equal(d.status, "needs_review");
    assert.equal(d.retryable, true);
  });

  it("returns a retryable pending state when the queue is full", async () => {
    const model = never();
    const { guardian } = buildTestGuardian({ model, concurrency: 1, maxWaiting: 0, timeoutMs: 200 });
    const first = guardian.moderate(req("post", "Everyone should hop on."));
    const second = await guardian.moderate(req("post", "Take this dosage."));
    assert.equal(second.status, "needs_review");
    assert.match(second.reason, /queue full/);
    assert.equal((await first).status, "needs_review");
  });

  it("does not call the model for clear-cut content", async () => {
    const model = answer({ verdict: "allow", categories: [], confidence: 1, rationale: "fine" });
    const { guardian } = buildTestGuardian({ model });
    await guardian.moderate(req("post", "Squats today."));
    await guardian.moderate(req("post", "DM me for gear"));
    assert.equal(model.calls.length, 0);
  });
});

describe("combining rules with a model", () => {
  it("lets a confident model clear an ambiguous, non-sensitive flag", async () => {
    const model = answer({ verdict: "allow", categories: ["safe_fitness"], confidence: 0.95, rationale: "Means hopping on the bike for cardio." });
    const { guardian } = buildTestGuardian({ model });
    const d = await guardian.moderate(req("post", "Everyone should hop on."));
    assert.equal(d.status, "approved");
    assert.equal(d.source, "rules_and_model");
    assert.deepEqual(d.categories, []);
  });

  it("keeps sensitive categories with a human even if the model says allow", async () => {
    const model = answer({ verdict: "allow", categories: [], confidence: 0.99, rationale: "Looks harmless." });
    const { guardian } = buildTestGuardian({ model });
    const d = await guardian.moderate(req("post", "Caught this random guy curling in the squat rack"));
    assert.equal(d.status, "needs_review");
    assert.ok(d.categories.includes("privacy_violation"));
  });

  it("does not let a low-confidence model approve", async () => {
    const model = answer({ verdict: "allow", categories: [], confidence: 0.6, rationale: "Probably fine." });
    const { guardian } = buildTestGuardian({ model });
    const d = await guardian.moderate(req("comment", "You look so fat lol"));
    assert.equal(d.status, "needs_review");
  });

  it("only blocks when rules and model agree on a severe category", async () => {
    const agrees = answer({ verdict: "block", categories: ["body_shaming"], confidence: 0.95, rationale: "Mocks someone's body." });
    const { guardian } = buildTestGuardian({ model: agrees });
    assert.equal((await guardian.moderate(req("comment", "You look so fat lol"))).status, "rejected");

    const unrelated = answer({ verdict: "block", categories: ["scam"], confidence: 0.95, rationale: "Scam." });
    const g2 = buildTestGuardian({ model: unrelated }).guardian;
    assert.equal((await g2.moderate(req("comment", "You look so fat lol"))).status, "needs_review");
  });

  it("screen-all mode lets the model flag content the rules missed", async () => {
    const model = answer({ verdict: "review", categories: ["harassment"], confidence: 0.8, rationale: "Subtle mockery." });
    const { guardian } = buildTestGuardian({ model, screenAll: true });
    const d = await guardian.moderate(req("comment", "nice try I guess, maybe next year"));
    assert.equal(d.status, "needs_review");
    assert.equal(d.source, "local_model");
  });

  it("screen-all mode keeps rule-approved content approved if the model is down", async () => {
    const { guardian } = buildTestGuardian({ model: never(), screenAll: true, timeoutMs: 30 });
    const d = await guardian.moderate(req("post", "Bench day"));
    assert.equal(d.status, "approved");
  });

  it("passes rule hints but not decisions to the model", async () => {
    const model = answer({ verdict: "review", categories: [], confidence: 0.5, rationale: "Unsure." });
    const { guardian } = buildTestGuardian({ model });
    await guardian.moderate(req("post", "Take this dosage."));
    assert.deepEqual(model.calls[0].rule_hints, [{ category: "ped_promotion", rule_id: "ped.dosage_generic" }]);
  });
});

describe("media, reports and direct messages", () => {
  it("never claims to have analyzed media", async () => {
    const { guardian } = buildTestGuardian();
    const d = await guardian.moderate({ content_type: "image", media: [{ kind: "image", ref: "u/1.jpg" }] });
    assert.equal(d.status, "needs_review");
    assert.match(d.reason, /not implemented/);
  });

  it("still rejects a violating caption on a media post", async () => {
    const { guardian } = buildTestGuardian();
    const d = await guardian.moderate({ content_type: "post", text: "DM me for gear", media: [{ kind: "video" }] });
    assert.equal(d.status, "rejected");
  });

  it("sends every user report to human review", async () => {
    const { guardian } = buildTestGuardian();
    const d = await guardian.moderate({ content_type: "user_report", report: { reason: "harassment", target_content_type: "comment", target_text: "great set!" } });
    assert.equal(d.status, "needs_review");
    assert.ok(d.categories.includes("harassment"));
    assert.ok(d.review_id);
  });

  it("withholds direct-message text from the review queue", async () => {
    const { guardian, store } = buildTestGuardian();
    const d = await guardian.moderate(req("direct_message", "Everyone should hop on."));
    const item = store.get(d.review_id!);
    assert.equal(item.private, true);
    assert.equal(item.text, null);
    assert.match(item.content_note ?? "", /withheld/);
  });

  it("purges private text after a decision", async () => {
    const { guardian, store } = buildTestGuardian();
    const d = await guardian.moderate(req("direct_message", "Everyone should hop on."));
    assert.equal(store.reveal(d.review_id!, "ts").text, "Everyone should hop on.");
    store.act(d.review_id!, "reject", "ts");
    assert.equal(store.reveal(d.review_id!, "ts").text, null);
  });
});

describe("moderator actions", () => {
  it("approve, reject and request edit are recorded and final", async () => {
    const { guardian, store } = buildTestGuardian();
    const ids = await Promise.all(["Everyone should hop on.", "Take this dosage.", "You look so fat lol"].map(async (t) => (await guardian.moderate(req("post", t))).review_id!));
    assert.equal(store.act(ids[0], "approve", "mod", "bike context").status, "approved");
    assert.equal(store.act(ids[1], "reject", "mod").status, "rejected");
    assert.equal(store.act(ids[2], "request_edit", "mod", "Please remove the insult").status, "edit_requested");
    assert.throws(() => store.act(ids[0], "reject", "mod"), /already approved/);
    assert.deepEqual(store.history(3).map((h) => h.action), ["request_edit", "reject", "approve"]);
    assert.equal(store.list().length, 0);
  });
});

describe("bounded queue", () => {
  it("limits concurrency", async () => {
    const q = new BoundedQueue({ concurrency: 2, maxWaiting: 10, timeoutMs: 1000 });
    let running = 0;
    let peak = 0;
    const task = () => q.run(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 20));
      running--;
    });
    await Promise.all(Array.from({ length: 6 }, task));
    assert.equal(peak, 2);
  });

  it("rejects when full and times out waiting tasks", async () => {
    const q = new BoundedQueue({ concurrency: 1, maxWaiting: 1, timeoutMs: 40 });
    const hang = (s: AbortSignal) => new Promise<void>((_r, rej) => s.addEventListener("abort", () => rej(s.reason)));
    const a = q.run(hang);
    const b = q.run(hang);
    await assert.rejects(q.run(hang), QueueFullError);
    await assert.rejects(a, TaskTimeoutError);
    await assert.rejects(b, TaskTimeoutError);
    assert.deepEqual(q.stats().active, 0);
  });
});

describe("model output validation", () => {
  it("accepts valid output and drops unknown categories", () => {
    const a = parseAssessment('{"verdict":"review","categories":["harassment","made_up"],"confidence":0.7,"rationale":"x"}');
    assert.deepEqual(a.categories, ["harassment"]);
  });
  for (const bad of ['{"verdict":"maybe","categories":[],"confidence":0.5,"rationale":"x"}', '{"verdict":"allow","categories":[],"confidence":2,"rationale":"x"}', '{"verdict":"allow","categories":"none","confidence":0.5,"rationale":"x"}', '{"verdict":"allow","categories":[],"confidence":0.5}', "[]"]) {
    it(`rejects ${bad}`, () => assert.throws(() => parseAssessment(bad), ModelOutputError));
  }
});
