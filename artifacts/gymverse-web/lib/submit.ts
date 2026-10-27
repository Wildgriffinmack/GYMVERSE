import type { WaitlistSubmission } from "./waitlist.ts";

export type SubmitResult = { ok: true; persisted: boolean } | { ok: false; message: string };

/** Swap point for a real backend (database, email tool, or an API route). */
export interface WaitlistAdapter {
  readonly name: string;
  /** False when signups are not stored anywhere. The success screen shows a preview notice. */
  readonly persistent: boolean;
  submit(submission: WaitlistSubmission): Promise<SubmitResult>;
}

/** Preview adapter: nothing is stored or sent anywhere. Replace before launch. */
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

export const activeAdapter: WaitlistAdapter = createPreviewAdapter();

export async function submitWaitlist(submission: WaitlistSubmission, adapter: WaitlistAdapter = activeAdapter): Promise<SubmitResult> {
  try {
    return await adapter.submit(submission);
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
