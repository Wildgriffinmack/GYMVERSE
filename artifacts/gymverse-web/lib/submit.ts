import { WAITLIST } from "./content.ts";
import type { WaitlistSubmission } from "./waitlist.ts";

export type SubmitResult = { ok: true; persisted: boolean } | { ok: false; message: string };

/** Extra, non-form data sent with a submission (the hidden anti-bot field). */
export interface SubmitExtras {
  honeypot?: string;
}

/** Swap point for the signup backend. */
export interface WaitlistAdapter {
  readonly name: string;
  /** False when signups are not stored anywhere. The success screen shows a preview notice. */
  readonly persistent: boolean;
  submit(submission: WaitlistSubmission, extras?: SubmitExtras): Promise<SubmitResult>;
}

/** Preview adapter: nothing is stored or sent anywhere (tests and offline previews). */
export function createPreviewAdapter(delayMs = 450): WaitlistAdapter {
  return {
    name: "preview",
    persistent: false,
    async submit() {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return { ok: true, persisted: false };
    },
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  rate_limited: WAITLIST.errors.rateLimited,
  invalid: WAITLIST.errors.invalid,
};

/** Production adapter: POSTs to the site's own API, which stores the signup in Cloudflare D1. */
export function createApiAdapter(endpoint = "/api/waitlist", fetchImpl: typeof fetch = (...args) => fetch(...args)): WaitlistAdapter {
  return {
    name: "api",
    persistent: true,
    async submit(submission, extras = {}) {
      const { kind, context } = submission;
      const values =
        submission.kind === "member"
          ? {
              fullName: submission.fullName,
              email: submission.email,
              ageRange: submission.ageRange,
              confirmedAge13: submission.confirmedAge13 ?? false,
              fitnessLevel: submission.fitnessLevel,
              userType: submission.userType,
              struggle: submission.struggle,
              betaTester: submission.betaTester,
              source: submission.source ?? "",
            }
          : {
              fullName: submission.fullName,
              email: submission.email,
              handle: submission.handle,
              coachType: submission.coachType,
              audienceSize: submission.audienceSize,
              helpMost: submission.helpMost,
              leadBeta: submission.leadBeta,
            };
      let res: Response;
      try {
        res = await fetchImpl(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, values, context, website: extras.honeypot ?? "" }),
        });
      } catch {
        return { ok: false, message: WAITLIST.errors.network };
      }
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && body?.ok) return { ok: true, persisted: true };
      return { ok: false, message: ERROR_MESSAGES[body?.error ?? ""] ?? WAITLIST.submitError };
    },
  };
}

export const activeAdapter: WaitlistAdapter = createApiAdapter();

export async function submitWaitlist(submission: WaitlistSubmission, extras?: SubmitExtras, adapter: WaitlistAdapter = activeAdapter): Promise<SubmitResult> {
  try {
    return await adapter.submit(submission, extras);
  } catch {
    return { ok: false, message: WAITLIST.submitError };
  }
}
