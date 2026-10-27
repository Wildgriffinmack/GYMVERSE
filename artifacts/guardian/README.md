# GYMX Guardian

Self-hosted moderation for GYMX. Runs on a laptop today and moves to a Linux GPU server later. No paid moderation APIs and no external AI calls.

> **Status: Stage 1 prototype.** Rule-based moderation, the human-review queue, the moderator dashboard and the Stage 2 model plumbing are implemented and tested. The review store is in memory (resets on restart). Image and video moderation are **not implemented**; media always goes to human review. This is not production-ready security; see [Before production](#before-production).

## Architecture

```
GYMX app (Expo)      ──POST /v1/moderate──▶  Guardian API (Node 24, no runtime deps)
                                               ├─ normalize text (NFKC, zero-width, leetspeak)
                                               ├─ policy rules + context (negation, disclosure, recovery, risk)
                                               ├─ decision policy (block only high-confidence severe hits)
                                               ├─ optional local model via ModelAdapter ──▶ Ollama (later llama.cpp / vLLM)
                                               │     bounded queue · timeout · validated JSON · never auto-approves on failure
                                               └─ review queue + audit history ◀── moderator dashboard (/admin, localhost only)
```

| Path | What it is |
| --- | --- |
| `src/contract.ts` | Shared request/response types (the app imports these as types only) |
| `src/policy/` | Categories, normalization, rules, rule engine, decision policy |
| `src/model/` | `ModelAdapter` interface, Ollama adapter, prompt, bounded queue |
| `src/media/` | Stage 3 interfaces (unimplemented provider holds media for review) |
| `src/review/` | Review queue, moderator actions, audit history, demo seed data |
| `src/http/` | HTTP server, validation, auth, rate limiting |
| `admin/` | Moderator dashboard (vanilla HTML/CSS/JS) |
| `test/` | `node:test` suites for policy, pipeline, Ollama adapter and HTTP |

## Response

```json
{
  "status": "needs_review",
  "risk_score": 0.6,
  "categories": ["ped_promotion"],
  "labels": [],
  "reason": "Possible ped promotion: Gym slang for starting PEDs; context unclear.",
  "source": "local_rules",
  "requires_human_review": true,
  "retryable": false,
  "review_id": "rv_…",
  "findings": [{ "category": "ped_promotion", "rule_id": "ped.hop_on", "confidence": "medium" }],
  "policy_version": "2026-10-23.1"
}
```

`risk_score` is an internal heuristic, not a calibrated probability. `labels` carries allowed context such as `ped_disclosure`, `ped_risk_discussion` or `safe_fitness`.

Decision policy:
- **rejected**: a high-confidence rule in a high or critical category (e.g. "DM me for gear", direct threats). Recorded in the audit history so moderators can spot false positives. No account-level enforcement is automated.
- **needs_review**: anything ambiguous, all user reports, all media, and anything that needed the model while the model was unavailable.
- **approved**: nothing flagged, or a confident model cleared an ambiguous, non-sensitive flag. Threats, hate, privacy, eating-disorder and copyright cases always reach a human.

## Run locally

Requires Node 24.

```powershell
cd "C:\Users\LStAm\GYMVERSE REPO\GYMVERSE\artifacts\guardian"
npm install          # dev tools only (TypeScript, Node types)
npm test             # 119 tests
npm start            # this computer only
npm run start:lan    # also reachable from phones on the same Wi-Fi
```

The startup banner prints the API address, the phone (LAN) address, the dashboard URL and a one-time moderator token. Open `http://127.0.0.1:8787/admin` on the laptop and paste the token.

Configuration lives in `.env` (copy `.env.example`). Nothing is hard-coded to localhost: the model endpoint, ports and hosts all come from the environment.

## Expo Go

1. Start Guardian with `npm run start:lan`. Windows may ask to allow Node.js on private networks; allow it.
2. In `artifacts/gymverse-mobile`, copy `.env.example` to `.env.local` (`EXPO_PUBLIC_GUARDIAN_URL=auto`).
3. Restart Expo (`npm.cmd start`) and open the app in Expo Go on the same Wi-Fi.

`auto` sends moderation requests to the computer that serves the Expo bundle, on port 8787. All inference stays on the laptop. With Guardian off or unset, the app behaves exactly as before.

- Phones can reach `/v1/moderate` and `/v1/reports` only. The moderator API and dashboard answer **only on the laptop itself** (loopback), even in LAN mode.
- Expo **tunnel** mode cannot reach Guardian automatically. Remote testers need a separately secured URL in `EXPO_PUBLIC_GUARDIAN_URL`. Do not expose Guardian publicly without TLS, authentication and rate limiting in front.
- If Guardian is unreachable, the app holds posts and comments as "in review" instead of publishing them.

## Local model (Stage 2)

Measured on this machine: Intel i9-14900K, 48 GB RAM, RTX 4090 (24 GB). Ollama is **not installed** and no model has been downloaded.

| Model (Ollama tag) | Size | License | Why |
| --- | --- | --- | --- |
| `qwen3:4b` | 2.5 GB | Apache 2.0 | Smallest practical start; runs on modest GPUs or CPU. Benchmark first. |
| `gpt-oss-safeguard:20b` | 14 GB | Apache 2.0 | Built to follow a custom moderation policy; fits a 16–24 GB GPU. |

When approved:

```powershell
winget install Ollama.Ollama
ollama pull qwen3:4b
# .env
GUARDIAN_MODEL_PROVIDER=ollama
GUARDIAN_MODEL=qwen3:4b
```

The model is only asked about content the rules mark ambiguous (or everything with `GUARDIAN_MODEL_SCREEN_ALL=true`). Output is constrained to a JSON schema and validated; malformed answers, timeouts and a full queue all result in `needs_review` with `retryable: true`. To use llama.cpp or vLLM later, implement `ModelAdapter` in `src/model/` and select it in `buildModel()`.

## Privacy and security in this prototype

- Logs contain ids, content type, decision and timing, never content or tokens.
- Direct-message text is withheld from the review queue. Revealing it requires a separate Trust & Safety token, is written to the audit history, and DM text is purged once a decision is made.
- Tokens are compared in constant time. Admin endpoints require a Bearer token and loopback access by default.
- Request bodies are size-limited and schema-validated; public endpoints are rate limited per client.
- The dashboard is served with a strict Content-Security-Policy and renders user content as text only.
- A hate-speech slur lexicon is **not** shipped. Point `GUARDIAN_LEXICON_PATH` at a private file.

## Before production

- Persistent, access-controlled storage (replace `ReviewStore`), retention rules for reports and DMs.
- Real moderator identity (SSO / per-moderator accounts, roles) instead of shared tokens.
- TLS and an authenticated reverse proxy; shared rate limiting across instances.
- App authentication so `author_id` is verified server-side, not client-supplied.
- Appeals flow for users, and evaluation datasets to measure precision/recall per category.
- Image/video moderation (Stage 3) implemented and tested before it is enabled.
- Legal review of reporting obligations (e.g. CSAM, credible threats).
