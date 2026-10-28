// Exports the GYMX waitlist from Cloudflare D1 to CSV (read-only).
//   npm run waitlist:export                      -> production database (needs `npx wrangler login`)
//   npm run waitlist:export -- --local           -> local development database
// Options: --database <name|binding> (default DB), --config <path>, --persist-to <dir>, --out <file>
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const local = args.includes("--local");
const database = opt("database", "DB");
const config = opt("config", "wrangler.jsonc");
const persistTo = opt("persist-to", null);
const stamp = new Date().toISOString().slice(0, 10);
const out = opt("out", join("exports", `waitlist-${local ? "local-" : ""}${stamp}.csv`));

const COLUMNS = [
  "id", "kind", "email", "full_name", "created_at", "source",
  "age_range", "confirmed_age_13", "fitness_level", "user_type", "struggle", "beta_tester", "heard_from",
  "handle", "coach_type", "audience_size", "help_most", "lead_beta",
  "channel", "hero_variant", "utm", "referrer_host",
  "notify_status", "notify_attempts", "notify_error", "notified_at", "confirmation_status",
];
const sql = `SELECT ${COLUMNS.join(", ")} FROM waitlist_signups ORDER BY created_at`;

const wranglerArgs = ["d1", "execute", database, local ? "--local" : "--remote", "--json", "--config", config, "--command", sql];
if (persistTo) wranglerArgs.push("--persist-to", persistTo);

// Run the project's Wrangler directly with Node (no shell), so paths and SQL with spaces stay intact.
const require = createRequire(import.meta.url);
const wranglerPkgPath = require.resolve("wrangler/package.json");
const wranglerBin = join(dirname(wranglerPkgPath), JSON.parse(readFileSync(wranglerPkgPath, "utf8")).bin.wrangler);

let raw;
try {
  raw = execFileSync(process.execPath, [wranglerBin, ...wranglerArgs], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 256 * 1024 * 1024 });
} catch {
  console.error("\nExport failed. For production run `npx wrangler login` first; use --local for the local database.");
  process.exit(1);
}
const results = JSON.parse(raw.slice(raw.indexOf("[")))[0]?.results ?? [];

const cell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formulas and quote everything else safely.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const csv = [COLUMNS.join(","), ...results.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\r\n") + "\r\n";

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, csv, "utf8");
console.log(`Exported ${results.length} registration(s) to ${out}`);
