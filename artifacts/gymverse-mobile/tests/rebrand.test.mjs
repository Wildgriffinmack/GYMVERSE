// GYMX rebrand: user-facing brand is GYMX; legacy technical identifiers are intentionally preserved.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { TIERS } from "../src/membership/tiers.ts";
import { PREMIUM_COPY } from "../src/membership/premiumContent.ts";
import { FOUNDER_COPY } from "../src/founders/foundersData.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

function sourceFiles(dir) {
  const out = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...sourceFiles(rel));
    else if (/\.(tsx?|json)$/.test(name)) out.push(rel);
  }
  return out;
}
const APP_SOURCE = ["App.tsx", "app.json", ...sourceFiles("src")];

/** Technical identifiers kept on purpose (see the rebrand report); everything else must say GYMX. */
const LEGACY_IDENTIFIERS = [
  /\bGYMVERSE_PRO\b/g, // membership tier id used in state, entitlements and tests
  /<Gymverse \/>|function Gymverse\(\)/g, // root component name in App.tsx
  /mockups\/gymverse\/_parts\/data\.ts/g, // path to the mirrored mock data file
  /"slug": "gymverse"/g, // Expo slug (project identity; see report before changing)
];

describe("GYMX rebrand", () => {
  it("Expo display name is GYMX; slug and native identifiers are untouched", () => {
    const { expo } = JSON.parse(read("app.json"));
    assert.equal(expo.name, "GYMX");
    assert.equal(expo.slug, "gymverse");
    assert.equal(expo.ios?.bundleIdentifier, undefined);
    assert.equal(expo.android?.package, undefined);
    assert.equal(expo.scheme, undefined);
  });

  it("no user-facing GYMVERSE remains in the app source", () => {
    for (const file of APP_SOURCE) {
      let text = read(file);
      for (const allowed of LEGACY_IDENTIFIERS) text = text.replace(allowed, "");
      assert.doesNotMatch(text, /gym[\s_-]?verse/i, file);
    }
  });

  it("brand is always uppercase GYMX in user-facing text (no GymX / Gymx)", () => {
    for (const file of APP_SOURCE) {
      for (const m of read(file).matchAll(/gymx\w*/gi)) {
        const ok = m[0] === "GYMX" || m[0] === "gymx_demo_feed";
        assert.ok(ok, `${file}: unexpected brand casing "${m[0]}"`);
      }
    }
  });

  it("wordmarks render GYM + gradient X", () => {
    for (const file of ["src/components/ui.tsx", "src/screens/Welcome.tsx"]) {
      const src = read(file);
      assert.match(src, />GYM<\/Text>/, file);
      assert.match(src, />X<\/GradText>/, file);
      assert.doesNotMatch(src, />VERSE</, file);
    }
  });

  it("membership and founder copy carries the new name", () => {
    assert.equal(TIERS.FREE.displayName, "GYMX");
    assert.equal(TIERS.GYMVERSE_PRO.displayName, "GYMX Pro");
    assert.equal(PREMIUM_COPY.heading, "UNLOCK YOUR GYMX POTENTIAL");
    assert.equal(FOUNDER_COPY.badge, "GYMX FOUNDER");
  });
});
