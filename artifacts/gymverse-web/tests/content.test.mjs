// Brand, copy and structure checks against the GYMX website brief.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  AGE_RANGES,
  AUDIENCES,
  AUDIENCE_SIZES,
  CHALLENGE,
  COACHES,
  COACH_TYPES,
  FEATURES,
  FITNESS_LEVELS,
  FOOTER,
  HERO,
  HERO_VARIANTS,
  NAV,
  PERKS,
  PROBLEM,
  SOURCES,
  STRUGGLES,
  USER_TYPES,
  WAITLIST,
  headlineText,
} from "../lib/content.ts";
import { resolveHeroVariant } from "../lib/variants.ts";
import { LEGAL_LINKS, SOCIAL_LINKS } from "../lib/site.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

function sourceFiles(dir) {
  const out = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...sourceFiles(rel));
    else if (/\.(tsx?|css|svg)$/.test(name)) out.push(rel);
  }
  return out;
}
const ALL_SOURCE = ["app", "components", "lib"].flatMap(sourceFiles);
const labels = (opts) => opts.map((o) => o.label);

describe("brand palette", () => {
  const css = read("app/globals.css");
  it("uses the exact Iron Inferno colors", () => {
    for (const [name, hex] of [
      ["charcoal", "#090909"],
      ["iron", "#1A1A1A"],
      ["flame", "#FF5A1F"],
      ["hot", "#FF2E2E"],
      ["warm", "#FFF7ED"],
      ["ash", "#A3A3A3"],
      ["gold", "#FFD166"],
    ]) {
      assert.match(css, new RegExp(`--color-${name}: ${hex};`), name);
    }
  });
  it("uses the exact CTA and hero gradients", () => {
    assert.match(css, /linear-gradient\(135deg, #FF5A1F 0%, #FF2E2E 100%\)/);
    for (const layer of [
      "radial-gradient(circle at 50% 42%, rgba(255, 90, 31, 0.32), transparent 34%)",
      "radial-gradient(circle at 70% 68%, rgba(255, 46, 46, 0.22), transparent 36%)",
      "radial-gradient(circle at 25% 78%, rgba(255, 209, 102, 0.10), transparent 32%)",
      "linear-gradient(180deg, #090909 0%, #120807 52%, #090909 100%)",
    ]) {
      assert.ok(css.includes(layer), layer);
    }
  });
  it("avoids generic blue SaaS colors in components", () => {
    for (const file of ALL_SOURCE) {
      assert.doesNotMatch(read(file), /\b(?:bg|text|border|from|to|ring)-(?:blue|sky|indigo|cyan)-\d/, file);
    }
  });
});

describe("brand voice", () => {
  it("uses the GYMX name everywhere, always uppercase in copy", () => {
    for (const file of ALL_SOURCE) {
      const text = read(file);
      assert.doesNotMatch(text, /gym[\s_-]?verse/i, `old brand name in ${file}`);
      for (const m of text.matchAll(/gymx\w*/gi)) assert.ok(m[0] === "GYMX" || /^gymx$/.test(m[0]), `${file}: "${m[0]}"`);
      assert.doesNotMatch(text, /\bGym[Xx]\b/, `mixed-case brand in ${file}`);
    }
    const lowercase = ALL_SOURCE.flatMap((f) => [...read(f).matchAll(/[^\n]*\bgymx\b[^\n]*/g)].map((m) => m[0].trim()));
    for (const line of lowercase) assert.match(line, /gymx: \{|\{ traditional, gymx \}|gymx\.(title|items)|https:\/\/gymx\.life/, `lowercase gymx outside an identifier: ${line}`);
  });
  it("logo and share image read GYM + X", () => {
    assert.match(read("components/ui/Logo.tsx"), /text-warm">GYM<\/span>\s*<span className="text-gradient">X<\/span>/);
    assert.match(read("app/opengraph-image.tsx"), /<span>GYM<\/span>\s*<span style=\{\{ color: "#FF5A1F" \}\}>X<\/span>/);
    assert.match(read("app/layout.tsx"), /const title = "GYMX \| /);
  });
  const BANNED = [
    "no excuses",
    "go hard or go home",
    "stop being lazy",
    "only the strong survive",
    "weakness is a choice",
    "real lifters only",
    "beat everyone",
    "you failed",
    "get on our level",
    "beach body",
    "shred fat fast",
  ];
  it("never uses banned phrases anywhere in the site source", () => {
    for (const file of ALL_SOURCE) {
      const text = read(file).toLowerCase();
      for (const phrase of BANNED) assert.ok(!text.includes(phrase), `"${phrase}" found in ${file}`);
    }
  });
  it("shows no prices, purchase flows, login or dashboard", () => {
    for (const file of ALL_SOURCE) {
      const text = read(file);
      assert.doesNotMatch(text, /\$\s?\d/, `price-like text in ${file}`);
      assert.doesNotMatch(text, /\b(?:checkout|subscribe now|log in|sign in|dashboard|per month|\/mo)\b/i, file);
    }
  });
});

describe("hero and A/B headlines", () => {
  it("has the three requested headlines, default first", () => {
    assert.deepEqual(HERO_VARIANTS.map(headlineText), [
      "Fitness without judgment or distraction.",
      "No judgment. No distractions. Just progress together.",
      "Your fitness space, without the noise.",
    ]);
  });
  it("resolves ?v= safely and falls back to the default", () => {
    assert.equal(resolveHeroVariant(undefined).id, "1");
    assert.equal(resolveHeroVariant("2").id, "2");
    assert.equal(resolveHeroVariant(" 3 ").id, "3");
    assert.equal(resolveHeroVariant(["3", "1"]).id, "3");
    for (const bad of ["", "4", "0", "<script>", "2;drop"]) assert.equal(resolveHeroVariant(bad).id, "1", bad);
  });
  it("uses the brief's eyebrow, CTAs and hype line", () => {
    assert.equal(`${HERO.eyebrow} | ${HERO.eyebrowGold}`, "Early Access Now Open | Founding 500");
    assert.equal(HERO.primaryCta, "Join the Early Access Waitlist");
    assert.equal(HERO.secondaryCta, "Apply to Become a Founding Coach");
    assert.equal(HERO.hype, "Help shape the first version of GYMX before launch.");
    for (const word of ["beginners", "students", "lifters", "coaches", "share progress", "ask questions", "build habits", "toxic comparison", "social media noise"]) {
      assert.ok(HERO.subheadline.includes(word), word);
    }
  });
});

describe("sections match the brief", () => {
  it("header", () => {
    assert.equal(NAV.badge, "Beta Access");
    assert.equal(NAV.cta, "Join Waitlist");
    assert.deepEqual(NAV.links.map((l) => l.label), ["Why GYMX", "Waitlist", "Coaches"]);
  });
  it("problem + comparison grid", () => {
    assert.equal(PROBLEM.title, "Fitness content is everywhere. Real support is harder to find.");
    assert.equal(PROBLEM.points.length, 5);
    assert.deepEqual(PROBLEM.comparison.traditional.items, ["Random algorithms", "Toxic comparison", "Highlight reels", "Intimidating comments", "Distraction from goals"]);
    assert.deepEqual(PROBLEM.comparison.gymx.items, [
      "A feed built for your goals",
      "Supportive fitness-only community",
      "Real progress and small wins",
      "Beginner-friendly Q&A",
      "Less distraction, more direction",
    ]);
  });
  it("feature and audience cards", () => {
    assert.equal(FEATURES.title, "A fitness community made for real people.");
    assert.deepEqual(FEATURES.items.map((f) => f.title), ["Share Progress", "Ask Questions", "Stay Accountable", "Find Your People"]);
    assert.equal(FEATURES.items[1].body, "Get beginner-friendly support from real people and future verified coaches.");
    assert.equal(AUDIENCES.title, "Built for people who want to start, restart, or stay consistent.");
    assert.deepEqual(AUDIENCES.items.map((a) => a.title), ["Beginners", "Students", "Casual Gym-Goers", "Inconsistent Lifters", "Coaches and Creators", "Local Gyms"]);
  });
  it("waitlist copy, tabs and success state", () => {
    assert.equal(WAITLIST.title, "Join the early GYMX community.");
    assert.equal(WAITLIST.tabs.member, "I want beta access");
    assert.equal(WAITLIST.tabs.coach, "I’m a coach / creator");
    assert.equal(WAITLIST.member.cta, "Join the Early Access Waitlist");
    assert.equal(WAITLIST.coach.cta, "Apply to Become a Founding Coach");
    assert.equal(
      `${WAITLIST.success.title} ${WAITLIST.success.body}`,
      "You’re on the list. We’ll send early updates, beta invites, and community access as GYMX gets closer to launch.",
    );
  });
  it("form options match the brief exactly", () => {
    assert.deepEqual(labels(AGE_RANGES), ["Under 18", "18–24", "25+"]);
    assert.deepEqual(labels(FITNESS_LEVELS), ["Brand new", "Beginner", "Inconsistent", "Consistent", "Advanced"]);
    assert.deepEqual(labels(USER_TYPES), ["Beginner", "Student", "Casual gym-goer", "Athlete", "Fitness creator", "Coach/trainer", "Gym owner"]);
    assert.deepEqual(labels(STRUGGLES), ["Staying consistent", "Knowing what to do", "Gym anxiety", "Nutrition", "Motivation", "Finding community", "Tracking progress", "Other"]);
    assert.deepEqual(labels(SOURCES), ["TikTok", "Instagram", "YouTube Shorts", "Friend", "Flyer/QR code", "Coach/creator", "Other"]);
    assert.deepEqual(labels(COACH_TYPES), ["Personal trainer", "Online coach", "Fitness creator", "Gym owner", "Athlete", "Other"]);
    assert.deepEqual(labels(AUDIENCE_SIZES), ["Under 1k", "1k–5k", "5k–20k", "20k–50k", "50k+"]);
  });
  it("perks, challenge, coaches and footer", () => {
    assert.equal(PERKS.title, "Join early. Help shape what GYMX becomes.");
    assert.deepEqual(PERKS.items.map((p) => p.title), [
      "Founding Member badge",
      "First 500 badge",
      "Beta Tester badge",
      "Founding Coach badge",
      "Early challenge access",
      "Vote on features",
      "Private community invite",
      "Early coach Q&As",
    ]);
    assert.equal(CHALLENGE.title, "The first challenge: 7-Day Show Up.");
    assert.deepEqual(CHALLENGE.actions.map((a) => a.label), ["Gym workout", "Walk", "Stretch", "Home workout", "Meal prep", "Progress photo", "Ask a question"]);
    assert.equal(CHALLENGE.cta, "Join the waitlist to get the challenge invite.");
    assert.equal(COACHES.title, "Coaches and creators: build where fitness lives.");
    assert.equal(COACHES.cta, "Apply to Become a Founding Coach");
    assert.equal(FOOTER.mission, "Your fitness space, without the noise.");
    assert.deepEqual(SOCIAL_LINKS.map((l) => l.label), ["TikTok", "Instagram", "YouTube Shorts", "Discord"]);
    assert.deepEqual(LEGAL_LINKS.map((l) => l.label), ["Community Guidelines", "Contact", "Privacy", "Terms"]);
  });
  it("renders sections in the brief's order", () => {
    const page = read("app/page.tsx");
    const order = ["<Hero", "<Problem", "<Features", "<Audience", "<WaitlistSection", "<Perks", "<Challenge", "<Coaches", "<Footer"];
    const positions = order.map((tag) => page.indexOf(tag));
    assert.ok(positions.every((p) => p > 0), "all sections rendered");
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
    assert.ok(page.indexOf("<Header") < positions[0]);
  });
  it("every in-page link points at an element that exists", () => {
    const all = ALL_SOURCE.map(read).join("\n");
    const hrefs = new Set([...all.matchAll(/href[=:]\s*["'`{]+#([a-z-]+)/g)].map((m) => m[1]));
    for (const l of NAV.links) hrefs.add(l.href.slice(1));
    hrefs.add("apply-coach");
    for (const id of hrefs) {
      const declared = new RegExp(`id=(?:"${id}"|\\{COACH_ANCHOR\\})`).test(all) || (id === "apply-coach" && /COACH_ANCHOR = "apply-coach"/.test(all));
      assert.ok(declared, `#${id} has no matching id`);
    }
  });
});
