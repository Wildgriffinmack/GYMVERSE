import type { Guardian } from "../guardian.ts";
import type { ReviewStore } from "./store.ts";

/**
 * Local demo records for the moderator dashboard. Every record is produced by running the real
 * pipeline on sample content, so the dashboard always reflects current policy behavior.
 */
const SAMPLES: { content_type: "post" | "comment" | "profile_bio" | "profile_username" | "direct_message" | "image"; text?: string; author_id: string }[] = [
  { content_type: "post", text: "Day 42. Finally hit 225 on bench. Keep showing up.", author_id: "griffinlifts" },
  { content_type: "post", text: "I'm not natty and I won't pretend. This transformation was enhanced.", author_id: "iron_jay" },
  { content_type: "comment", text: "You look so fat in this one lol", author_id: "anon_lifter22" },
  { content_type: "post", text: "Everyone should hop on, it's the only way to grow.", author_id: "massmonster" },
  { content_type: "post", text: "Take this dosage for the first 4 weeks and thank me later.", author_id: "coach_unknown" },
  { content_type: "comment", text: "Caught this random guy curling in the squat rack 😂", author_id: "gym_cam" },
  { content_type: "post", text: "Eat under 600 calories a day for a month to get shredded.", author_id: "cutcutcut" },
  { content_type: "profile_username", text: "gymverse_official_support", author_id: "new_user_19" },
  { content_type: "direct_message", text: "hey bro dm me for gear, tested and legit", author_id: "dm_seller" },
  { content_type: "direct_message", text: "send nudes or I'm unfollowing", author_id: "dm_creep" },
  { content_type: "direct_message", text: "bro you should hop on, I'll walk you through it", author_id: "dm_coach" },
  { content_type: "post", text: "Not my video, credit to the owner. Insane deadlift.", author_id: "repost_king" },
  { content_type: "comment", text: "Venmo me $40 and I'll send the full program.", author_id: "plan_seller" },
  { content_type: "image", author_id: "maya_moves" },
  { content_type: "comment", text: "You're pathetic, quit the gym.", author_id: "troll_account" },
];

export async function seedDemoData(guardian: Guardian, store: ReviewStore): Promise<void> {
  for (const s of SAMPLES) {
    await guardian.moderate({ content_type: s.content_type, ...(s.text ? { text: s.text } : { media: [{ kind: "image", ref: "demo/upload.jpg" }] }), author_id: s.author_id });
  }
  await guardian.moderate({
    content_type: "user_report",
    author_id: "maya_moves",
    report: { reason: "harassment", target_content_type: "comment", target_text: "nobody likes you, go back to the yoga mat", details: "This account keeps commenting on my posts." },
  });

  // A few prior moderator decisions so the history view has context.
  const pending = store.list({ status: "pending" });
  const byText = (needle: string) => pending.find((i) => i.text?.includes(needle));
  const copy = byText("credit to the owner");
  if (copy) store.act(copy.id, "request_edit", "demo-moderator", "Please tag the original creator.");
  const venmo = byText("Venmo me");
  if (venmo) store.act(venmo.id, "approve", "demo-moderator", "Legit coaching offer from a known coach.");
}
