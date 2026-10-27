// Phase 5 — Coach Pro demonstrations. Run: npm run test:membership
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { COACH_FEATURES, CREATOR_FEATURES, PRO_FEATURES, TIER_INHERITS, hasEntitlement, resolveEntitlements } from "../src/membership/entitlements.ts";
import { TIERS } from "../src/membership/tiers.ts";
import {
  COACH_COPY,
  COACH_FEATURE_INFO,
  DEFAULT_COACH_STATE,
  DEMO_LEADS,
  EMPTY_INQUIRY,
  EXAMPLE_INQUIRY,
  LEAD_STATUSES,
  PARTNERSHIPS,
  PROGRAMS,
  SERVICES,
  SLOT_TIMES,
  TESTIMONIALS,
  addFollowUp,
  availableSlots,
  bookingDays,
  businessInsights,
  cancelBooking,
  coachTotals,
  createBooking,
  filterLeads,
  funnel,
  inquiriesChart,
  inquirySources,
  isBlocked,
  isVerifiedCoach,
  leadFromInquiry,
  milestoneDays,
  pinTestimonial,
  rescheduleBooking,
  setFeaturedService,
  setLeadStatus,
  slotAvailable,
  statusCounts,
  toggleFollowUp,
  toggleServiceVisibility,
  validateChallenge,
  validateInquiry,
} from "../src/coach/coachData.ts";

const PERIODS = ["7d", "30d", "90d"];
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const coachFiles = readdirSync(new URL("../src/coach/", import.meta.url)).map((f) => [f, src(`src/coach/${f}`)]);

describe("coach entitlements", () => {
  it("defines 11 coach features, each with a locked explanation", () => {
    assert.equal(COACH_FEATURES.length, 11);
    for (const f of COACH_FEATURES) assert.ok(COACH_FEATURE_INFO[f]?.body, f);
  });
  it("Coach Pro unlocks every coach tool and inherits GYMX Pro", () => {
    for (const f of [...COACH_FEATURES, ...PRO_FEATURES]) assert.equal(hasEntitlement("COACH_PRO", f), true, f);
    assert.deepEqual(TIER_INHERITS.COACH_PRO, ["GYMVERSE_PRO"]);
  });
  it("Free, GYMX Pro and Creator Pro cannot use coach tools", () => {
    for (const tier of ["FREE", "GYMVERSE_PRO", "CREATOR_PRO"]) for (const f of COACH_FEATURES) assert.equal(hasEntitlement(tier, f), false, `${tier} ${f}`);
  });
  it("Coach Pro does not get Creator Pro-only tools", () => {
    for (const f of CREATOR_FEATURES) assert.equal(hasEntitlement("COACH_PRO", f), false, f);
    assert.ok(!resolveEntitlements("COACH_PRO").includes("creator_analytics"));
  });
  it("every coach section is gated through the shared entitlement check", () => {
    const ui = coachFiles.filter(([f]) => f.endsWith(".tsx")).map(([, t]) => t).join("\n");
    const gated = [...ui.matchAll(/feature="([a-z_]+)"/g)].map((m) => m[1]);
    for (const f of COACH_FEATURES) assert.ok(gated.includes(f), `section for ${f}`);
    assert.ok(gated.every((f) => COACH_FEATURES.includes(f)), "coach screen only gates coach features");
    assert.doesNotMatch(ui, /membership\.tier\s*===|tier === "COACH_PRO"/, "no second access-control path");
  });
  it("badge reads COACH PRO", () => {
    assert.equal(TIERS.COACH_PRO.badge.label, "COACH PRO");
    assert.equal(COACH_COPY.badgeCoachPro, "COACH PRO");
  });
});

describe("dashboard data", () => {
  it("30-day figures match the documented demo numbers", () => {
    const t = coachTotals("30d");
    assert.deepEqual(
      [t.profileVisits, t.inquiries, t.newLeads, t.qualifiedLeads, t.bookingRequests, t.consultations],
      [2480, 46, 32, 21, 18, 12],
    );
  });
  it("conversion rates use their documented denominators", () => {
    for (const p of PERIODS) {
      const t = coachTotals(p);
      const r = (n, d) => Math.round((n / d) * 1000) / 10;
      assert.equal(t.profileToInquiryRate, r(t.inquiries, t.profileVisits), p);
      assert.equal(t.qualificationRate, r(t.qualifiedLeads, t.newLeads), p);
      assert.equal(t.leadConversionRate, r(t.consultations, t.newLeads), p);
      assert.equal(t.consultationRate, r(t.consultations, t.inquiries), p);
    }
    const t = coachTotals("30d");
    assert.deepEqual([t.profileToInquiryRate, t.qualificationRate, t.leadConversionRate, t.consultationRate], [1.9, 65.6, 37.5, 26.1]);
  });
  it("periods change the numbers and grow monotonically", () => {
    const [a, b, c] = PERIODS.map(coachTotals);
    for (const k of Object.keys(a).filter((k) => !k.endsWith("Rate"))) {
      assert.ok(a[k] <= b[k] && b[k] <= c[k], k);
    }
    assert.notEqual(a.inquiries, b.inquiries);
  });
  for (const p of PERIODS) {
    it(`${p}: funnel never grows, chart and sources sum to inquiries`, () => {
      const f = funnel(p);
      for (let i = 1; i < f.length; i++) assert.ok(f[i].value <= f[i - 1].value, `${f[i].label} ≤ ${f[i - 1].label}`);
      const t = coachTotals(p);
      assert.equal(inquiriesChart(p).reduce((s, x) => s + x.value, 0), t.inquiries);
      assert.equal(inquirySources(p).reduce((s, x) => s + x.value, 0), t.inquiries);
      assert.ok(t.activeConversations <= t.qualifiedLeads);
    });
  }
  it("insights are derived from the demo data", () => {
    const [top, online, evening] = businessInsights("30d");
    assert.match(top, /strength-training content \(16 of 46/);
    assert.match(online, /online coaching/);
    assert.match(evening, /6–9 PM/);
  });
});

describe("lead management", () => {
  it("allows only defined status transitions", () => {
    const moved = setLeadStatus(DEMO_LEADS, "ld1", "contacted");
    assert.equal(moved.find((l) => l.id === "ld1").status, "contacted");
    assert.equal(DEMO_LEADS.find((l) => l.id === "ld1").status, "new", "input not mutated");
    assert.equal(setLeadStatus(DEMO_LEADS, "ld1", "active"), DEMO_LEADS, "new → active is not allowed");
    assert.equal(setLeadStatus(DEMO_LEADS, "missing", "contacted"), DEMO_LEADS);
    const reopened = setLeadStatus(DEMO_LEADS, "ld7", "new");
    assert.equal(reopened.find((l) => l.id === "ld7").status, "new");
  });
  it("supports all five statuses", () => {
    assert.deepEqual(LEAD_STATUSES.map((s) => s.label), ["New Inquiry", "Contacted", "Consultation Scheduled", "Active Client", "Closed"]);
    const counts = statusCounts(DEMO_LEADS);
    assert.equal(counts.all, DEMO_LEADS.length);
    assert.equal(counts.new + counts.contacted + counts.consultation + counts.active + counts.closed, counts.all);
  });
  it("filters by status and searches name, goal, interest and source", () => {
    assert.ok(filterLeads(DEMO_LEADS, "new", "").every((l) => l.status === "new"));
    assert.deepEqual(filterLeads(DEMO_LEADS, "all", "riley").map((l) => l.id), ["ld1"]);
    assert.deepEqual(filterLeads(DEMO_LEADS, "all", "BENCH").map((l) => l.id), ["ld7"]);
    assert.ok(filterLeads(DEMO_LEADS, "all", "online coaching").length >= 2);
    assert.ok(filterLeads(DEMO_LEADS, "all", "transformation showcases").every((l) => l.source === "transformation"));
    assert.equal(filterLeads(DEMO_LEADS, "closed", "riley").length, 0);
  });
  it("adds and completes follow-up notes", () => {
    const withNote = addFollowUp(DEMO_LEADS, "ld2", "  Send demo times  ", "n1");
    const lead = withNote.find((l) => l.id === "ld2");
    assert.deepEqual(lead.followUps, [{ id: "n1", text: "Send demo times", done: false }]);
    assert.equal(addFollowUp(DEMO_LEADS, "ld2", "   ", "n2"), DEMO_LEADS, "empty notes rejected");
    assert.equal(addFollowUp(DEMO_LEADS, "ld2", "x".repeat(121), "n3"), DEMO_LEADS, "long notes rejected");
    const done = toggleFollowUp(withNote, "ld2", "n1");
    assert.equal(done.find((l) => l.id === "ld2").followUps[0].done, true);
  });
  it("uses clearly fabricated identities and no contact details", () => {
    for (const l of DEMO_LEADS) {
      assert.match(l.name, /Sample|Demo|Example|Test|Mock|Fictional|Placeholder/, l.name);
      assert.doesNotMatch(JSON.stringify(l), /@[a-z0-9-]+\.[a-z]{2,}|\d{3}[\s.-]\d{3,4}/i);
    }
  });
});

describe("inquiry form", () => {
  it("reports every missing required field", () => {
    const e = validateInquiry(EMPTY_INQUIRY);
    assert.deepEqual(Object.keys(e).sort(), ["coachingType", "contact", "experience", "goal", "name"]);
    assert.deepEqual(validateInquiry(EXAMPLE_INQUIRY), {});
  });
  it("rejects real-looking contact details and over-long messages", () => {
    assert.ok(validateInquiry({ ...EXAMPLE_INQUIRY, message: "email me at a@b.com" }).message);
    assert.ok(validateInquiry({ ...EXAMPLE_INQUIRY, message: "call 555 123 4567" }).message);
    assert.ok(validateInquiry({ ...EXAMPLE_INQUIRY, message: "x".repeat(281) }).message);
  });
  it("creates a session-only new lead from a valid form, nothing from an invalid one", () => {
    const lead = leadFromInquiry(EXAMPLE_INQUIRY, "lead-x");
    assert.equal(lead.status, "new");
    assert.equal(lead.source, "inquiry_form");
    assert.equal(lead.sessionOnly, true);
    assert.equal(leadFromInquiry(EMPTY_INQUIRY, "lead-y"), null);
  });
  it("never asks for sensitive health information", () => {
    assert.doesNotMatch(Object.keys(EMPTY_INQUIRY).join(" "), /medic|diagnos|health|injur|condition|weight|phone|email|address/i);
    assert.equal(COACH_COPY.inquirySent, "Demo inquiry created — no message was sent.");
  });
});

describe("booking preview", () => {
  const base = DEFAULT_COACH_STATE.bookings;
  it("offers only future days", () => {
    assert.deepEqual(bookingDays().map((d) => d.offset), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(slotAvailable(base, 0, "9:00 AM"), false, "today is not bookable");
    assert.equal(slotAvailable(base, -1, "9:00 AM"), false, "past is not bookable");
    assert.equal(slotAvailable(base, 8, "9:00 AM"), false, "outside the window");
    assert.equal(slotAvailable(base, 1, "3:15 AM"), false, "unknown time");
  });
  it("excludes blocked and already-booked slots", () => {
    const blocked = SLOT_TIMES.find((t) => isBlocked(2, t));
    assert.ok(blocked);
    assert.ok(!availableSlots(base, 2).includes(blocked));
    assert.ok(!availableSlots(base, 2).includes("5:30 PM"), "demo booking occupies 5:30 PM");
  });
  it("creates, reschedules and cancels bookings", () => {
    const made = createBooking(base, { id: "b1", type: "assessment", dayOffset: 1, time: "9:00 AM", withName: "Demo client" });
    assert.equal(made.length, 2);
    assert.equal(made[0].id, "b1", "sorted by date");
    assert.equal(createBooking(made, { id: "b2", type: "intro", dayOffset: 1, time: "9:00 AM", withName: "x" }), made, "no double booking");
    assert.equal(createBooking(base, { id: "b3", type: "nope", dayOffset: 1, time: "9:00 AM", withName: "x" }), base, "unknown type");
    const moved = rescheduleBooking(made, "b1", 6, "12:30 PM");
    assert.equal(moved.find((b) => b.id === "b1").dayOffset, 6);
    assert.equal(rescheduleBooking(made, "b1", 0, "12:30 PM"), made, "can't move into the past");
    assert.equal(cancelBooking(moved, "b1").length, 1);
    assert.equal(COACH_COPY.bookingCreated, "Demo booking created — no real appointment has been scheduled.");
  });
});

describe("services, results, programs, challenges", () => {
  const svc = DEFAULT_COACH_STATE.services;
  it("featuring requires a visible service; hiding the featured one moves the feature", () => {
    assert.equal(setFeaturedService(svc, "sv4"), svc, "hidden service can't be featured");
    assert.equal(setFeaturedService(svc, "sv1").featuredId, "sv1");
    const hidden = toggleServiceVisibility(svc, "sv2");
    assert.equal(hidden.visible.sv2, false);
    assert.equal(hidden.featuredId, "sv1");
    let none = svc;
    for (const s of SERVICES) if (none.visible[s.id]) none = toggleServiceVisibility(none, s.id);
    assert.equal(none.featuredId, null);
  });
  it("services have no prices", () => {
    assert.doesNotMatch(JSON.stringify(SERVICES), /\$|price|per month|\/mo\b/i);
  });
  it("pins and unpins one testimonial; all are labelled fictional", () => {
    assert.equal(pinTestimonial("t1", "t2"), "t2");
    assert.equal(pinTestimonial("t2", "t2"), null);
    assert.equal(pinTestimonial("t1", "missing"), "t1");
    assert.ok(TESTIMONIALS.every((t) => t.fictional && /fictional/i.test(t.alias)));
    assert.equal(COACH_COPY.testimonialTag, "SAMPLE TESTIMONIAL — FICTIONAL");
  });
  it("program previews are internally consistent", () => {
    assert.deepEqual(PROGRAMS.map((p) => p.title), ["8-Week Strength Foundation", "Beginner Training Fundamentals", "Upper/Lower Hypertrophy Split", "General Fitness Consistency Program"]);
    for (const p of PROGRAMS) {
      assert.equal(p.sessions.length, p.daysPerWeek, p.title);
      assert.ok(p.sessions.every((s) => s.exercises.length > 0));
    }
    assert.equal(PROGRAMS[0].weeks, 8);
  });
  it("validates the challenge preview and spaces milestones", () => {
    assert.deepEqual(validateChallenge(DEFAULT_COACH_STATE.challenge), {});
    const bad = validateChallenge({ title: "ab", duration: 5, objective: "x", milestones: [], sponsor: "Real Brand" });
    assert.deepEqual(Object.keys(bad).sort(), ["duration", "milestones", "objective", "sponsor", "title"]);
    assert.ok(validateChallenge({ ...DEFAULT_COACH_STATE.challenge, milestones: ["a", "b", "c", "d", "e"] }).milestones);
    const days = milestoneDays(DEFAULT_COACH_STATE.challenge);
    assert.deepEqual(days.map((d) => d.day), [10, 20, 30]);
  });
});

describe("honesty, verification and isolation", () => {
  it("every partnership is fictional, tagged and promises no earnings", () => {
    assert.equal(PARTNERSHIPS.length, 3);
    assert.ok(PARTNERSHIPS.every((p) => p.fictional === true));
    assert.equal(COACH_COPY.partnershipTag, "DEMO OPPORTUNITY · NOT A LIVE PARTNERSHIP");
    assert.doesNotMatch(JSON.stringify(PARTNERSHIPS), /earn|income|revenue|commission|\$\d|paid/i);
  });
  it("Coach Pro never grants professional verification", () => {
    assert.equal(isVerifiedCoach(), false);
    assert.equal(COACH_COPY.verificationPreview, "VERIFICATION PREVIEW — NOT VERIFIED");
    assert.equal(DEFAULT_COACH_STATE.profile.showVerificationPreview, false);
    const profile = src("src/screens/Profile.tsx");
    assert.match(profile, /\{coach \? null : <Verified/, "generic check mark is hidden under the coach look");
    for (const [f, t] of coachFiles) assert.doesNotMatch(t, /<Verified\b|BadgeCheck/, f);
  });
  it("no payment, network, messaging or price code in src/coach", () => {
    for (const [f, t] of coachFiles) {
      assert.doesNotMatch(t, /fetch\(|XMLHttpRequest|axios|WebSocket|stripe|revenuecat|calendly|sendgrid|twilio|checkout|purchase\(|\bsubscribe\b|\$\d|Linking\.openURL|expo-mail|expo-sms/i, f);
    }
  });
  it("coach demo state lives apart from posts and creator state in App", () => {
    const app = src("App.tsx");
    const m = app.match(/<CoachCommandCenter[\s\S]*?\/>/);
    assert.ok(m, "Coach route found");
    assert.match(m[0], /setCoachState/);
    assert.doesNotMatch(m[0], /setPosts|setCreatorState|setCosmetics/);
    assert.match(app, /membership\.can\("coach_profile_customization"\)/, "coach look gated by entitlement");
  });
  it("Premium sheet offers all three previews, with no prices", () => {
    const premium = src("src/membership/PremiumScreen.tsx");
    for (const label of ["Preview Pro progress tools", "Preview Creator Studio", "Preview Coach Command Center"]) assert.ok(premium.includes(label), label);
    const app = src("App.tsx");
    assert.match(app, /plan === "COACH_PRO" \? openCoach\("premium"\)/);
  });
  it("Back navigation can't ping-pong between Premium and a preview screen", () => {
    const app = src("App.tsx");
    assert.match(app, /if \(backTargets\[from\] === "premium"\) \{ navigate\("premium"\); return; \}/);
    assert.match(app, /if \(from === "premium" && premiumFrom === "coach_center"\) \{ navigate\("coach_center"\); return; \}/);
    assert.match(app, /if \(screen === "coach_center"\) \{ navigate\(coachFrom\); return true; \}/, "Android back handled");
  });
});
