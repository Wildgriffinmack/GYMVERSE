/**
 * Waitlist database schema. `migrations/0001_create_waitlist.sql` contains the same statements
 * (a test keeps them in sync); the API also applies them with IF NOT EXISTS so a fresh D1
 * database works without a manual migration step.
 */
export const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS waitlist_signups (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('member', 'coach')),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  age_range TEXT,
  confirmed_age_13 INTEGER,
  fitness_level TEXT,
  user_type TEXT,
  struggle TEXT,
  beta_tester INTEGER,
  heard_from TEXT,
  handle TEXT,
  coach_type TEXT,
  audience_size TEXT,
  help_most TEXT,
  lead_beta INTEGER,
  channel TEXT,
  hero_variant TEXT,
  utm TEXT,
  referrer_host TEXT,
  notify_status TEXT NOT NULL DEFAULT 'pending',
  notify_attempts INTEGER NOT NULL DEFAULT 0,
  notify_error TEXT,
  notified_at TEXT,
  confirmation_status TEXT NOT NULL DEFAULT 'disabled',
  UNIQUE (kind, email)
)`,
  `CREATE INDEX IF NOT EXISTS waitlist_signups_created_at ON waitlist_signups (created_at)`,
  `CREATE TABLE IF NOT EXISTS waitlist_rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
)`,
];
