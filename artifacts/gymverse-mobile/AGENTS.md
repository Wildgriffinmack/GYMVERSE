This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## GYMX design system

All styling decisions live in `src/theme.ts` (tokens) and `src/components/ui.tsx` (shared primitives). Compose these instead of hard-coding values.

- **Tokens:** `SURFACE` (page → raised → sheet), `TEXT` (primary/secondary/tertiary/disabled, all AA on dark), `LINE`, `TINT`, `TYPE` (hero, title, section, metric, heading, body, eyebrow, button, tag), `SPACE` (4-pt), `GUTTER` (20), `RADIUS`, `ICON`, `HIT` (44pt min touch target), `ELEVATION`, `MOTION`.
- **Primitives:** `PageHeader` (top-level screens), `TopBar` (detail screens whose hero carries the headline), `SectionHeader`, `Button` (`primary` | `gold` | `solid` | `tinted` | `secondary` | `ghost`), `Tag`, `IconMark`, `ListGroup` + `ListRow` (grouped settings-style rows instead of stacked cards), `Divider`, `IconBtn`, `Cta` (one per screen).
- **Gradient policy:** the Inferno gradient (`GRAD`) is for brand moments only — the primary CTA, the wordmark X, active indicators and achievements (PRs, streaks). Gold (`GRAD_GOLD`) signals premium/membership. Never use gradients for borders or decorative boxes.
- **Surfaces, not outlines:** separate content with whitespace and lighter surfaces. Reserve borders for state (selection, validation errors).
- **Feed icons** are monochrome at rest; Inferno appears only when an action is active (liked, saved).
- **Motion:** perpetual/decorative loops must check `useReducedMotion()` and stay still when the OS setting is on.
- **Membership:** paid plans always read "Coming Soon". No prices, billing copy or purchase actions (enforced by `tests/membership.test.mjs`).
