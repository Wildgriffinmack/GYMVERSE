// Waitlist form validation, submissions, privacy of analytics props, and the preview adapter.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COACH_FIELDS,
  EMPTY_COACH,
  EMPTY_MEMBER,
  MEMBER_FIELDS,
  analyticsPropsFor,
  isValidEmail,
  prepareCoach,
  prepareMember,
  validateCoach,
  validateMember,
} from "../lib/waitlist.ts";
import { createPreviewAdapter, submitWaitlist } from "../lib/submit.ts";

const CTX = { heroVariant: "2", channel: "tiktok", utm: { utm_source: "tiktok" }, referrerHost: "" };
const NOW = new Date("2026-10-25T18:00:00Z");

const validMember = {
  ...EMPTY_MEMBER,
  fullName: "  Maya Brooks ",
  email: "  Maya@Example.COM ",
  ageRange: "18_24",
  fitnessLevel: "inconsistent",
  userType: "student",
  struggle: "gym_anxiety",
  betaTester: true,
};

const validCoach = {
  ...EMPTY_COACH,
  fullName: "Dre Coleman",
  email: "dre@coachdre.fit",
  handle: " @coach.dre ",
  coachType: "online_coach",
  audienceSize: "5k_20k",
  helpMost: "  Answering beginner questions and running challenges. ",
  leadBeta: true,
};

describe("email validation", () => {
  it("accepts normal addresses (case and whitespace insensitive)", () => {
    for (const e of ["a@b.co", " Name.Surname+gv@gmail.com ", "x@sub.domain.org"]) assert.ok(isValidEmail(e), e);
  });
  it("rejects malformed addresses", () => {
    for (const e of ["", "plainaddress", "a@b", "a@.com", "a b@c.com", "a@b..com", "@b.com", `${"a".repeat(250)}@b.com`]) assert.ok(!isValidEmail(e), e);
  });
});

describe("everyday user form", () => {
  it("passes when every required field is filled (source and beta checkbox optional)", () => {
    assert.deepEqual(validateMember(validMember), {});
    assert.deepEqual(validateMember({ ...validMember, betaTester: false, source: "" }), {});
  });
  it("flags every required field on an empty form, in render order", () => {
    const errors = validateMember(EMPTY_MEMBER);
    assert.deepEqual(Object.keys(errors).sort(), ["ageRange", "email", "fitnessLevel", "fullName", "struggle", "userType"].sort());
    const firstInvalid = MEMBER_FIELDS.find((f) => errors[f]);
    assert.equal(firstInvalid, "fullName");
  });
  it("rejects values that are not one of the offered options", () => {
    const errors = validateMember({ ...validMember, ageRange: "12", fitnessLevel: "elite", userType: "robot", struggle: "x", source: "radio" });
    assert.deepEqual(Object.keys(errors).sort(), ["ageRange", "fitnessLevel", "source", "struggle", "userType"].sort());
  });
  it("requires the 13+ confirmation only for Under 18", () => {
    assert.equal(validateMember({ ...validMember, ageRange: "under_18" }).confirmedAge13, "Please confirm you’re 13 or older to join.");
    assert.deepEqual(validateMember({ ...validMember, ageRange: "under_18", confirmedAge13: true }), {});
    assert.equal(validateMember({ ...validMember, ageRange: "25_plus", confirmedAge13: false }).confirmedAge13, undefined);
  });
  it("uses supportive, non-shaming error messages", () => {
    const messages = Object.values(validateMember(EMPTY_MEMBER)).join(" ").toLowerCase();
    for (const harsh of ["invalid", "failed", "wrong!", "error"]) assert.ok(!messages.includes(harsh), harsh);
  });
  it("builds a normalized submission with campaign context", () => {
    const r = prepareMember(validMember, CTX, NOW);
    assert.ok(r.ok);
    assert.equal(r.submission.fullName, "Maya Brooks");
    assert.equal(r.submission.email, "maya@example.com");
    assert.equal(r.submission.confirmedAge13, null);
    assert.equal(r.submission.source, null);
    assert.equal(r.submission.submittedAt, "2026-10-25T18:00:00.000Z");
    assert.deepEqual(r.submission.context, CTX);
    const minor = prepareMember({ ...validMember, ageRange: "under_18", confirmedAge13: true }, CTX, NOW);
    assert.ok(minor.ok);
    assert.equal(minor.submission.confirmedAge13, true);
  });
  it("refuses to build a submission from an invalid form", () => {
    const r = prepareMember({ ...validMember, email: "nope" }, CTX, NOW);
    assert.equal(r.ok, false);
    assert.ok(r.errors.email);
  });
});

describe("coach / creator form", () => {
  it("passes with all required fields; Q&A checkbox optional", () => {
    assert.deepEqual(validateCoach(validCoach), {});
    assert.deepEqual(validateCoach({ ...validCoach, leadBeta: false }), {});
  });
  it("flags every required field on an empty form, in render order", () => {
    const errors = validateCoach(EMPTY_COACH);
    assert.deepEqual(Object.keys(errors).sort(), ["audienceSize", "coachType", "email", "fullName", "handle", "helpMost"].sort());
    assert.equal(COACH_FIELDS.find((f) => errors[f]), "fullName");
  });
  it("enforces length limits", () => {
    assert.ok(validateCoach({ ...validCoach, handle: "x".repeat(121) }).handle);
    assert.ok(validateCoach({ ...validCoach, helpMost: "x".repeat(501) }).helpMost);
    assert.ok(validateCoach({ ...validCoach, helpMost: "  a " }).helpMost);
  });
  it("builds a trimmed submission", () => {
    const r = prepareCoach(validCoach, CTX, NOW);
    assert.ok(r.ok);
    assert.equal(r.submission.handle, "@coach.dre");
    assert.equal(r.submission.helpMost, "Answering beginner questions and running challenges.");
    assert.equal(r.submission.kind, "coach");
  });
});

describe("analytics privacy", () => {
  it("never puts names, emails, handles or free text into tracking props", () => {
    const member = prepareMember({ ...validMember, source: "tiktok" }, CTX, NOW).submission;
    const coach = prepareCoach(validCoach, CTX, NOW).submission;
    for (const s of [member, coach]) {
      const props = JSON.stringify(analyticsPropsFor(s)).toLowerCase();
      for (const secret of ["maya", "example.com", "dre", "coachdre", "@coach", "answering"]) assert.ok(!props.includes(secret), `${secret} leaked: ${props}`);
    }
    assert.deepEqual(analyticsPropsFor(member), {
      age_range: "18_24",
      fitness_level: "inconsistent",
      user_type: "student",
      struggle: "gym_anxiety",
      beta_tester: true,
      heard_from: "tiktok",
    });
    assert.deepEqual(analyticsPropsFor(coach), { coach_type: "online_coach", audience_size: "5k_20k", lead_beta: true });
  });
});

describe("submission adapter", () => {
  it("preview adapter succeeds but reports that nothing was saved", async () => {
    const s = prepareMember(validMember, CTX, NOW).submission;
    const adapter = createPreviewAdapter(0);
    assert.equal(adapter.persistent, false);
    assert.deepEqual(await submitWaitlist(s, adapter), { ok: true, persisted: false });
  });
  it("a failing backend produces a friendly retry message instead of throwing", async () => {
    const s = prepareMember(validMember, CTX, NOW).submission;
    const broken = { name: "broken", persistent: true, submit: async () => { throw new Error("db down"); } };
    const result = await submitWaitlist(s, broken);
    assert.equal(result.ok, false);
    assert.equal(result.message, "Something went wrong. Please try again.");
  });
});
