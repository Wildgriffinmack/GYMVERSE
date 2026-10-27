# GYMX website: beta waitlist landing page

A mobile-first, one-page landing page that turns traffic from TikTok, Instagram Reels, YouTube Shorts, gym flyers, campus promotion, creator posts and ads into early beta waitlist signups and founding-coach applications.

> **Status: local prototype.** Signups are **not saved anywhere yet**. The form validates and shows the success screen, plus a visible "Preview build" note. Connect a real backend before sending real traffic (see [Before launch](#before-launch)).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 (Iron Inferno palette defined in [`app/globals.css`](app/globals.css))
- Lucide React icons
- Fonts: Anton, Barlow Condensed and Barlow via `next/font` (self-hosted at build time)
- No Framer Motion: the subtle animations are plain CSS and respect "reduce motion"

## Run it

Requires Node 22.18+ (tests run TypeScript directly).

```powershell
cd "artifacts\gymverse-web"
npm.cmd install          # first time only
npm.cmd run dev          # http://localhost:3100 (hot reload)
```

| Command | What it does |
| --- | --- |
| `npm.cmd run dev` | Development server on port 3100 |
| `npm.cmd run build` | Production build (also type-checks) |
| `npm.cmd run start` | Serve the production build on port 3100 |
| `npm.cmd run start:lan` | Serve the production build to phones on the same Wi-Fi |
| `npm.cmd run typecheck` | TypeScript check |
| `npm.cmd test` | Content, validation and attribution tests |

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

## Connecting a real waitlist (before launch)

Submissions go through one swap point in [`lib/submit.ts`](lib/submit.ts):

```ts
export interface WaitlistAdapter {
  readonly name: string;
  readonly persistent: boolean;   // false shows the "Preview build" note
  submit(submission: WaitlistSubmission): Promise<SubmitResult>;
}
```

Replace `activeAdapter` with one that sends the already-validated, normalized submission to your chosen storage (for example a Next.js route handler writing to a database, or an email-marketing tool). When `persistent` is `true`, the preview note disappears automatically. Re-validate on the server and add spam protection (rate limiting and a honeypot or CAPTCHA) at that point.

## Before launch

- [ ] Connect a real waitlist backend (above). Until then, signups are lost.
- [ ] Publish Privacy and Terms pages; link them, plus Community Guidelines and Contact, in [`lib/site.ts`](lib/site.ts).
- [ ] Add the real TikTok, Instagram, YouTube and Discord URLs in `lib/site.ts` (empty links show as "coming soon").
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real domain so link previews use absolute URLs.
- [ ] Decide on analytics tools and add consent handling if pixels are used.
- [ ] Review the minors flow (13+ confirmation) with whoever handles legal/privacy.
- [ ] Choose hosting that runs Next.js server rendering (the page renders per request for the A/B headline).

## Brand rules enforced by tests

`npm.cmd test` fails if:
- any Iron Inferno color or gradient drifts from the brief,
- any banned phrase appears in the site source (e.g. "no excuses", "beach body"),
- prices, checkout, login or dashboard wording appears,
- section titles, CTAs, form options or the success message stop matching the brief,
- analytics props would include names, emails, handles or free text.
