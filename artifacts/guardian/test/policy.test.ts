import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CategoryId, ContentType, ModerationStatus } from "../src/contract.ts";
import { decideFromRules } from "../src/policy/decide.ts";
import { RuleEngine } from "../src/policy/engine.ts";
import { normalizeText } from "../src/policy/normalize.ts";

const engine = new RuleEngine();

function check(type: ContentType, text: string) {
  const ra = engine.evaluate(type, text);
  return { ...decideFromRules(ra), findings: ra.findings };
}

type Expect = { status: ModerationStatus | "blocked_or_review"; category?: CategoryId; label?: CategoryId };

function expectCase(type: ContentType, text: string, e: Expect) {
  const d = check(type, text);
  if (e.status === "blocked_or_review") assert.notEqual(d.status, "approved", `"${text}" should not be approved`);
  else assert.equal(d.status, e.status, `"${text}" → ${d.status} (${d.categories.join(",")}): ${d.reason}`);
  if (e.category) assert.ok(d.categories.includes(e.category), `"${text}" should be flagged ${e.category}, got [${d.categories}]`);
  if (e.label) assert.ok(d.labels.includes(e.label), `"${text}" should carry label ${e.label}, got [${d.labels}]`);
  if (e.status === "approved") assert.deepEqual(d.categories, [], `"${text}" should have no violation categories`);
}

describe("safe workout content", () => {
  for (const text of [
    "Day 42. Finally hit 225 on bench. Keep showing up.",
    "Beginner push day routine — save this for your next workout.",
    "3 squat form tips every beginner should know.",
    "Ass to grass squats, 5x5 at 315.",
    "Going to kill this workout and destroy leg day.",
    "Your fat loss progress is insane, proud of you!",
    "Omega-3 fatty acids help recovery after heavy sessions.",
    "New gym gear drop this Friday!",
    "DM me for my program, it's free.",
    "Smash your PR at the meet this weekend.",
  ]) {
    it(`approves: ${text}`, () => expectCase("post", text, { status: "approved" }));
  }
  it("labels everyday training talk as safe fitness", () => expectCase("post", "Leg day: 4 sets of squats and RDLs", { status: "approved", label: "safe_fitness" }));
});

describe("PED policy: disclosure is allowed, promotion is not", () => {
  const allowed: [string, CategoryId][] = [
    ["I'm not natty.", "ped_disclosure"],
    ["I use PEDs, but I'm not recommending them.", "ped_disclosure"],
    ["This transformation was enhanced.", "ped_disclosure"],
    ["I regret taking steroids.", "ped_disclosure"],
    ["There are serious risks associated with PED use.", "ped_risk_discussion"],
    ["Don't buy steroids from random sources online, it's dangerous.", "ped_risk_discussion"],
    ["Never use SARMs as a teenager. The side effects are real.", "ped_risk_discussion"],
    ["My first steroid cycle wrecked my hormones. Not worth it.", "ped_risk_discussion"],
  ];
  for (const [text, label] of allowed) it(`allows: ${text}`, () => expectCase("post", text, { status: "approved", label }));

  it("rejects sourcing: DM me for gear", () => expectCase("post", "DM me for gear.", { status: "rejected", category: "drug_sales" }));
  it("rejects sourcing: buy from my source", () => expectCase("post", "Buy steroids from my source.", { status: "rejected", category: "drug_sales" }));
  it("rejects obfuscated sourcing", () => expectCase("comment", "dm me 4 g3ar bro", { status: "rejected", category: "drug_sales" }));
  it("rejects sales listings", () => expectCase("post", "Tren and test in stock, ships discreetly", { status: "rejected", category: "drug_sales" }));
  it("rejects cycle sharing", () => expectCase("post", "Here's my steroid cycle.", { status: "rejected", category: "ped_promotion" }));
  it("rejects dosing", () => expectCase("post", "Run 500mg test a week for your first cycle", { status: "rejected", category: "ped_promotion" }));
  it("rejects 'use SARMs to get huge fast'", () => expectCase("post", "Use SARMs to get huge fast.", { status: "rejected", category: "ped_promotion" }));
  it("holds 'Take this dosage' for review (substance unclear)", () => expectCase("post", "Take this dosage.", { status: "needs_review", category: "ped_promotion" }));
  it("holds 'Everyone should hop on' for review (slang, unclear)", () => expectCase("post", "Everyone should hop on.", { status: "needs_review", category: "ped_promotion" }));
  it("does not keep the disclosure label on promotion", () => {
    const d = check("post", "I'm not natty, DM me for gear");
    assert.equal(d.status, "rejected");
    assert.ok(!d.labels.includes("ped_disclosure"));
  });
});

describe("eating disorder: encouragement vs recovery", () => {
  it("rejects starvation encouragement", () => expectCase("post", "Stop eating for a week to get shredded.", { status: "rejected", category: "eating_disorder" }));
  it("rejects pro-ana language", () => expectCase("post", "If you're hungry you're winning #thinspo", { status: "rejected", category: "eating_disorder" }));
  it("reviews very-low-calorie promotion", () => expectCase("post", "Eat under 600 calories a day for a month.", { status: "needs_review", category: "eating_disorder" }));
  it("allows recovery stories that mention starvation", () => expectCase("post", "Starvation wrecked my metabolism. Recovery is possible, please eat enough.", { status: "approved" }));
  it("allows warnings against starving", () => expectCase("post", "Never starve yourself to cut. Fuel your body.", { status: "approved" }));
  it("allows recovery stories with low-calorie history", () => expectCase("post", "I ate 800 calories a day for a year and it took therapy to recover.", { status: "approved" }));
});

describe("body shaming", () => {
  it("rejects degrading insults", () => expectCase("comment", "fat pig get out of the gym", { status: "rejected", category: "body_shaming" }));
  it("reviews negative body comments", () => expectCase("comment", "You look so fat in this one lol", { status: "needs_review", category: "body_shaming" }));
  it("allows people talking about their own past", () => expectCase("post", "I was 280 lbs and felt stuck. Two years later, here I am.", { status: "approved" }));
});

describe("harassment and threats", () => {
  it("rejects telling someone to kill themselves", () => expectCase("comment", "kys nobody wants you here", { status: "rejected", category: "harassment" }));
  it("reviews insults", () => expectCase("comment", "You're pathetic, quit lifting.", { status: "needs_review", category: "harassment" }));
  it("rejects direct threats", () => expectCase("comment", "I'm going to beat you up after class", { status: "rejected", category: "threats_violence" }));
  it("rejects stalking language", () => expectCase("direct_message", "I know where you train. Watch your back.", { status: "rejected", category: "threats_violence" }));
  it("downgrades competition banter to review", () => expectCase("comment", "I'm gonna destroy and beat you at the meet", { status: "needs_review", category: "threats_violence" }));
  it("does not treat gym slang as threats", () => expectCase("post", "Killed my workout, murdered leg day, crushed the PR", { status: "approved" }));
});

describe("hate speech", () => {
  it("rejects dehumanizing statements", () => expectCase("comment", "Immigrants are animals", { status: "rejected", category: "hate_speech" }));
  it("reviews gym exclusion of a group", () => expectCase("comment", "Women don't belong in the weight room", { status: "needs_review", category: "hate_speech" }));
  it("uses a private lexicon when configured", () => {
    const withLexicon = new RuleEngine({ lexicon: ["examplebadterm"] });
    const d = decideFromRules(withLexicon.evaluate("comment", "you examplebadterm"));
    assert.equal(d.status, "rejected");
    assert.deepEqual(d.categories, ["hate_speech"]);
  });
});

describe("sexual content", () => {
  it("rejects solicitation in DMs", () => expectCase("direct_message", "send nudes", { status: "rejected", category: "sexual_content" }));
  it("reviews adult promotion", () => expectCase("profile_bio", "Lifter | link in bio for spicy content", { status: "needs_review", category: "sexual_content" }));
});

describe("privacy", () => {
  it("rejects doxxing", () => expectCase("post", "Her address is 123 Main Street lol", { status: "rejected", category: "privacy_violation" }));
  it("reviews covert recordings of gym-goers", () => expectCase("post", "Caught this random guy curling in the squat rack", { status: "needs_review", category: "privacy_violation" }));
  it("reviews phone numbers in public posts", () => expectCase("comment", "call me 555-123-4567", { status: "needs_review", category: "privacy_violation" }));
  it("allows people sharing their own number in a DM", () => expectCase("direct_message", "my number is 555-123-4567, text me about the meetup", { status: "approved" }));
});

describe("unsafe fitness advice", () => {
  it("rejects DNP", () => expectCase("post", "Use DNP for a fast cut", { status: "rejected", category: "dangerous_advice" }));
  it("allows DNP warnings", () => expectCase("post", "DNP is dangerous and has killed people. Never touch it.", { status: "approved" }));
  it("reviews training through injury", () => expectCase("post", "Push through the back pain, no excuses", { status: "needs_review", category: "dangerous_advice" }));
  it("allows safety advice about pain", () => expectCase("post", "Never push through sharp pain.", { status: "approved" }));
  it("reviews dry scooping", () => expectCase("post", "Dry scoop your pre for the best pump", { status: "needs_review", category: "dangerous_advice" }));
});

describe("scams and false claims", () => {
  it("rejects get-rich scams", () => expectCase("comment", "Send $50 to my CashApp and I'll double your money", { status: "rejected", category: "scam" }));
  it("rejects prize scams", () => expectCase("direct_message", "Congrats you've won a free iPhone, claim your prize", { status: "rejected", category: "scam" }));
  it("reviews payment requests", () => expectCase("comment", "Venmo me $40 for the full program", { status: "needs_review", category: "scam" }));
  it("reviews cure claims", () => expectCase("post", "This detox tea cures diabetes", { status: "needs_review", category: "false_medical_claims" }));
  it("reviews miracle results", () => expectCase("post", "Gain 20 lbs of muscle in a week with this stack", { status: "needs_review", category: "false_medical_claims" }));
  it("allows personal mental-health benefit stories", () => expectCase("post", "Lifting helped my depression more than anything.", { status: "approved" }));
});

describe("copyright and usernames", () => {
  it("reviews reposted content", () => expectCase("post", "Not my video, credit to the owner", { status: "needs_review", category: "copyright_concern" }));
  it("reviews impersonating usernames", () => expectCase("profile_username", "gymverse_official", { status: "needs_review", category: "needs_human_review" }));
  it("reviews usernames impersonating the GYMX brand", () => expectCase("profile_username", "gymx_official", { status: "needs_review", category: "needs_human_review" }));
  it("reviews GYMX impersonation regardless of case or separators", () => expectCase("profile_username", "GymX.Support", { status: "needs_review", category: "needs_human_review" }));
  it("rejects abusive usernames", () => expectCase("profile_username", "fat_pig_hater", { status: "rejected", category: "body_shaming" }));
  it("allows normal usernames", () => expectCase("profile_username", "griffin_lifts", { status: "approved" }));
});

describe("normalization", () => {
  it("removes zero-width characters and de-obfuscates leetspeak", () => {
    assert.equal(normalizeText("s\u200Bt3r0ids").folded, "steroids");
  });
  it("keeps numbers like weights intact", () => {
    assert.equal(normalizeText("225 lbs 5x5").folded, "225 lbs 5x5");
  });
  it("omits excerpts for private messages", () => {
    const ra = engine.evaluate("direct_message", "dm me for gear");
    assert.ok(ra.findings.length > 0);
    assert.ok(ra.findings.every((f) => f.excerpt === undefined));
  });
});
