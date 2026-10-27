export type WaitlistTab = "member" | "coach";

export const TAB_EVENT = "gv:waitlist-tab";

/** In-page anchor that opens the waitlist on the coach tab (shareable: /#apply-coach). */
export const COACH_ANCHOR = "apply-coach";

export function selectWaitlistTab(tab: WaitlistTab): void {
  window.dispatchEvent(new CustomEvent<WaitlistTab>(TAB_EVENT, { detail: tab }));
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
