# GYMX website: beta waitlist landing page

A mobile-first, one-page landing page that turns traffic from TikTok, Instagram Reels, YouTube Shorts, gym flyers, campus promotion, creator posts and ads into early beta waitlist signups and founding-coach applications.

> **Status:** signups are stored in Cloudflare D1. Team email notifications need an email provider, such as a Gmail app password (see [Team notifications](#team-notifications-teamgymxlife)).

## Stack

- Next.js 16 App Router code, built and served on Cloudflare Workers by [vinext](https://github.com/cloudflare/vinext) (Vite) + TypeScript
- Cloudflare D1 for waitlist storage
- Tailwind CSS 4 (Iron Inferno palette defined in [`app/globals.css`](app/globals.css))
- Lucide React icons
- Fonts: Anton, Barlow Condensed and Barlow via `next/font` (self-hosted at build time)
- No Framer Motion: the subtle animations are plain CSS and respect "reduce motion"

## Run it

Requires Node 22.18+ (tests run TypeScript directly). The Cloudflare build uses the version in `.node-version`.

```powershell
cd "artifacts\gymverse-web"
npm.cmd install          # first time only
npm.cmd run dev          # http://localhost:3100 (hot reload, local D1 + email simulator)
```

| Command | What it does |
| --- | --- |
| `npm.cmd run dev` | Development server on port 3100 (page + API, local D1) |
| `npm.cmd run build` | Production Worker build into `dist/` |
| `npm.cmd run start` | Run the built Worker locally (Cloudflare workerd runtime) on port 3100 |
| `npm.cmd run start:lan` | Serve the production build to phones on the same Wi-Fi |
| `npm.cmd run typecheck` | TypeScript check |
| `npm.cmd test` | Content, validation, attribution and waitlist API tests |
| `npm.cmd run waitlist:export` | Export registrations to CSV (see below) |

### Test on your phone

1. `npm.cmd run build` and then `npm.cmd run start:lan`.
2. Find your laptop's Wi-Fi IP (`ipconfig`, the IPv4 address, e.g. `192.168.1.20`).
3. On the phone (same Wi-Fi) open `http://192.168.1.20:3100`. Allow Node through the Windows firewall if asked.

This is for local testing only. Do not expose it to the internet.

## Page structure

All copy lives in [`lib/content.ts`](lib/content.ts), so messaging can be edited without touching layout code.

1. Sticky header: logo, Beta Access badge, nav (Why GYMX, Waitlist, Coaches), Join Waitlist CTA; mobile menu below 768px
2. Hero: eyebrow, A/B headline, subheadline, two CTAs, hype line, illustrative feed preview
3. Problem: five pain points and a Traditional Social Feeds vs GYMX comparison grid
4. What GYMX will be: four feature cards
5. Who it is for: six audience cards
6. Waitlist: two tabs ("I want beta access" / "I’m a coach / creator"), validation, success state
7. Founding perks: eight perk cards (gold only here and on achievements)
8. 7-Day Show Up challenge
9. Founding coach / creator section
10. Footer: mission line, social links, legal links, copyright

### Waitlist form behavior

- Every CTA scrolls smoothly to the form; coach CTAs open the coach tab.
- Shareable deep link to the coach tab: `/#apply-coach` (useful for coach-recruiting QR codes).
- Client-side validation with supportive messages; on an invalid submit, focus moves to the first problem.
- **Under 18:** choosing it shows a required "I’m 13 or older" confirmation with a parent/guardian note.
- "Add another signup" resets the form, e.g. for a tablet at a campus table.

## A/B headline testing

| URL | Headline |
| --- | --- |
| `/` or `/?v=1` (default) | Fitness without judgment or distraction. |
| `/?v=2` | No judgment. No distractions. Just progress together. |
| `/?v=3` | Your fitness space, without the noise. |

The variant is rendered on the server (no flicker) and attached to every analytics event and signup as `hero_variant`. Give each ad or post a variant in its link, then compare signups per variant.

## Analytics and tracking plan

### What happens today

[`lib/analytics.ts`](lib/analytics.ts) pushes events to `window.dataLayer` (the format Google Tag Manager and GA4 read). **No third-party scripts are loaded, nothing is stored on the device, and no names, emails, handles or free text are ever tracked.**

| Event | When | Useful properties |
| --- | --- | --- |
| `page_view` | Page load | `channel`, `utm_*`, `hero_variant` |
| `cta_click` | Any CTA | `location` (header, hero_primary, challenge…), `target` |
| `waitlist_tab_select` | Tab switch | `tab` |
| `form_start` | First interaction with a form | `form` (member / coach) |
| `form_submit_error` | Submit blocked by validation | `form`, `error_count` |
| `waitlist_signup` | Member signup | `age_range`, `fitness_level`, `user_type`, `struggle`, `beta_tester`, `heard_from` |
| `coach_application` | Coach application | `coach_type`, `audience_size`, `lead_beta` |

Every event also carries `channel`, `hero_variant` and any `utm_*` tags.

**Metrics this enables**
- Conversion rate = `waitlist_signup` ÷ `page_view` (per channel and per variant)
- Form completion rate = signups ÷ `form_start`
- CTA performance by `location`
- Most common fitness struggle (`struggle`) and user type (`user_type`)
- Coach applications by `coach_type` and `audience_size`

### Traffic channels

[`lib/attribution.ts`](lib/attribution.ts) assigns each visit to one channel from its UTM tags (or referrer when tags are missing):

| Channel | Example link |
| --- | --- |
| TikTok (organic) | `?utm_source=tiktok&utm_medium=social&utm_campaign=beta_waitlist` |
| Instagram Reels / bio | `?utm_source=instagram&utm_medium=reels&utm_campaign=beta_waitlist` |
| YouTube Shorts | `?utm_source=youtube&utm_medium=shorts&utm_campaign=beta_waitlist` |
| Paid ads (any platform) | `?utm_source=tiktok&utm_medium=paid_social&utm_campaign=beta_waitlist&utm_content=hook_a&v=2` |
| Gym flyer QR | `?utm_source=gym_ironhouse&utm_medium=qr&utm_campaign=flyer_nov` |
| Campus promotion | `?utm_source=campus_ucla&utm_medium=qr&utm_campaign=campus_week` |
| Creator posts | `?utm_source=jaytrains&utm_medium=creator&utm_campaign=founding_creators` |

Rules of thumb:
- **Use UTM links everywhere.** In-app browsers (TikTok, Instagram) often hide the referrer.
- **One QR code per placement** (each gym, each campus, each flyer batch, each creator) so you can see which ones work.
- Paid mediums (`cpc`, `paid_social`, `paid`, …) are always counted as **paid**, whatever the platform.
- Use `utm_content` to tell ad creatives apart and `v=` to test headlines.

### Recommended tools (not installed)

| Tool | Why | Notes |
| --- | --- | --- |
| Google Analytics 4 (via Google Tag Manager) | Funnels, channels, conversions | GTM reads the existing `dataLayer` events directly |
| Meta Pixel | Optimize and retarget Instagram/Facebook ads | Map `waitlist_signup` → `Lead`, `coach_application` → `SubmitApplication` |
| TikTok Pixel | Optimize TikTok ads | Map `waitlist_signup` → `SubmitForm` / `CompleteRegistration` |

Pixels set cookies and share data with Meta and TikTok. Before adding them: add a cookie-consent banner (required for EU/UK visitors), update the privacy policy, and offer a CCPA "Do not sell or share" option for California. Never send names or emails to pixels.

## Waitlist storage and notifications

Signups are saved by the site's own API (`POST /api/waitlist`, [`app/api/waitlist/route.ts`](app/api/waitlist/route.ts)) into **Cloudflare D1** (binding `DB`, database `gymx-waitlist`, included in Workers Free).

- **Table** `waitlist_signups`: id (UUID), kind (`member` / `coach`), email (lowercased), name, the form answers, source, attribution, `created_at` (UTC), and notification status. Schema: [`migrations/0001_create_waitlist.sql`](migrations/0001_create_waitlist.sql); the API also applies it automatically (`IF NOT EXISTS`).
- **Duplicates**: `UNIQUE (kind, email)` in the database. A repeat signup gets the same "You're on the list" response (no enumeration), is not stored twice and sends no second notification. The same email can be both a member and a coach applicant.
- **Validation**: the same rules run in the browser and on the server ([`lib/waitlist.ts`](lib/waitlist.ts)); the server ignores unknown fields.
- **Abuse protection**: same-origin check, 8 KB body limit, JSON only, hidden honeypot field, and 5 submissions per IP per 10 minutes (IP stored only as a salted SHA-256 hash).
- **Privacy**: no endpoint returns stored data. View or export the list with Wrangler or the Cloudflare D1 console only.
- **Success state** appears only after the API confirms the save; failures show a specific message.

### Team notifications (`team@gymx.life`)

After a new signup is saved, the Worker emails the team in the background (`waitUntil`), so a slow or failed email never affects the signup. Each row records `notify_status` (`sent` / `failed` / `skipped`), attempts and a short error code; failures are logged as `waitlist_notify_failed` without personal data.

Provider (configure one; with none, signups are saved and notifications are `skipped`):

| Provider | Setting | Cost |
| --- | --- | --- |
| Cloudflare Email Service | `send_email` binding named `EMAIL` in `wrangler.jsonc` | Sending from `gymx.life` requires Workers Paid (includes 3,000 emails/month) |
| Resend | secret `RESEND_API_KEY` | Free tier available (check Resend's current limits) |
| Gmail / Google Workspace (SMTP) | secrets `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Free with the existing Workspace account (Google's daily sending limits apply) |

If more than one is configured, the first in this table wins.

**Gmail setup:** the account in `GMAIL_USER` needs 2-Step Verification and an [app password](https://myaccount.google.com/apppasswords). The Worker signs in to `smtp.gmail.com:465` over TLS (`cloudflare:sockets`) and sends from `GMAIL_USER`, keeping the display name from `NOTIFY_FROM` (for example "GYMX Waitlist"). Add both values in Cloudflare → Workers & Pages → `gymx-web` → Settings → Variables and Secrets as type **Secret**; never put them in `wrangler.jsonc`. A wrong password shows up as `notify_error = SMTP_535: Gmail: login rejected…`.

Variables: `NOTIFY_TO` (default `team@gymx.life`), `NOTIFY_TIMEZONE` (default `America/Los_Angeles`; times in team emails), `NOTIFY_FROM` (must be on your verified sending domain), `CONFIRMATION_EMAILS_ENABLED` (`true`), `CONFIRMATION_FROM`. Secrets: `RESEND_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `WAITLIST_HASH_SALT`.

Member confirmation emails ("You're on the GYMX Waitlist!") are built in [`lib/server/email.ts`](lib/server/email.ts). They are **on** (`CONFIRMATION_EMAILS_ENABLED` is `true` in `wrangler.jsonc`) and go out once per new email address, from "The GYMX Team" via the configured provider; set it to `false` to stop them. `confirmation_status` on each row records `sent` / `failed` / `disabled`.

### View and export registrations

```powershell
npx.cmd wrangler login                       # once
npm.cmd run waitlist:export                  # writes exports/waitlist-YYYY-MM-DD.csv (git-ignored)
npx.cmd wrangler d1 execute DB --remote --command "SELECT kind, COUNT(*) FROM waitlist_signups GROUP BY kind"
```

Or open Cloudflare → Storage & databases → D1 → `gymx-waitlist` → Explore data. Exports contain personal data: keep them out of Git and shared drives.
## Before launch

- [x] Waitlist storage in Cloudflare D1 (see [Waitlist storage and notifications](#waitlist-storage-and-notifications)).
- [ ] Configure an email provider (Gmail app password or Resend) so `team@gymx.life` gets notifications.
- [ ] Publish Privacy and Terms pages; link them, plus Community Guidelines and Contact, in [`lib/site.ts`](lib/site.ts).
- [ ] Add the real TikTok, Instagram, YouTube and Discord URLs in `lib/site.ts` (empty links show as "coming soon").
- [x] Production URL defaults to `https://gymx.life` ([`lib/site.ts`](lib/site.ts)); `NEXT_PUBLIC_SITE_URL` overrides it.
- [ ] Decide on analytics tools and add consent handling if pixels are used.
- [ ] Review the minors flow (13+ confirmation) with whoever handles legal/privacy.
- [x] Hosting: Cloudflare Workers via vinext (see [Deploy to Cloudflare Workers](#deploy-to-cloudflare-workers)).

## Deploy to Cloudflare Workers

The site deploys to Cloudflare Workers (Free plan) with [vinext](https://github.com/cloudflare/vinext), Cloudflare's recommended Next.js-on-Workers path. vinext is in beta; this project uses its stable Wrangler setup (`vinext init --legacy-wrangler-cloudflare-init`). `next build` is no longer used: the waitlist API runs only on the Workers runtime.

| Cloudflare Workers Builds setting | Value |
| --- | --- |
| Root directory | `artifacts/gymverse-web` |
| Build command | `npm run build` (same as `npm run build:vinext`) |
| Deploy command | `npx vinext-cloudflare deploy --config dist/server/wrangler.json --skip-build` |
| Worker name | `gymx-web` (must match [`wrangler.jsonc`](wrangler.jsonc)) |
| Node.js | from [`.node-version`](.node-version) |
| Build watch paths | `artifacts/gymverse-web/*` |

- [`wrangler.jsonc`](wrangler.jsonc): Worker name, `nodejs_compat`, static assets, the D1 `DB` binding (free) and non-secret variables. No `database_id`: Cloudflare creates the database on the first deploy (or add the ID of one you created).
- [`vite.config.ts`](vite.config.ts): vinext + Cloudflare Vite plugin; Tailwind runs through `@tailwindcss/vite`.
- `package.json` `overrides` pin patched `undici` and `fflate` versions inside build tooling.

Local checks before deploying:

```powershell
npm.cmd run build:vinext   # production Worker build into dist/
npm.cmd run start:vinext   # run the built Worker locally (Cloudflare workerd runtime)
npx.cmd vinext-cloudflare deploy --config dist/server/wrangler.json --skip-build --dry-run
```

The custom domain (`gymx.life`) is attached in the Cloudflare dashboard (Workers → gymx-web → Domains & Routes), not in this repo.

## Brand rules enforced by tests

`npm.cmd test` fails if:
- any Iron Inferno color or gradient drifts from the brief,
- any banned phrase appears in the site source (e.g. "no excuses", "beach body"),
- prices, checkout, login or dashboard wording appears,
- section titles, CTAs, form options or the success message stop matching the brief,
- analytics props would include names, emails, handles or free text.
