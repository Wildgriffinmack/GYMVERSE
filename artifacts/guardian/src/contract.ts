/**
 * GYMVERSE Guardian — shared moderation contract.
 *
 * Types only (no runtime code), so the Expo app can `import type` this file
 * without bundling anything from the service.
 */

export type ContentType =
  | "post"
  | "comment"
  | "profile_username"
  | "profile_bio"
  | "direct_message"
  | "image"
  | "video"
  | "user_report";

export type ModerationStatus = "approved" | "needs_review" | "rejected";

export type CategoryId =
  | "safe_fitness"
  | "body_shaming"
  | "harassment"
  | "hate_speech"
  | "threats_violence"
  | "sexual_content"
  | "privacy_violation"
  | "dangerous_advice"
  | "eating_disorder"
  | "false_medical_claims"
  | "scam"
  | "ped_disclosure"
  | "ped_risk_discussion"
  | "ped_promotion"
  | "drug_sales"
  | "copyright_concern"
  | "needs_human_review";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type DecisionSource = "local_rules" | "local_model" | "rules_and_model" | "human_moderator" | "client_fallback";

export interface MediaRef {
  kind: "image" | "video";
  /** Opaque reference (upload id or URI). Guardian does not fetch remote media in the prototype. */
  ref?: string;
}

export interface UserReportPayload {
  reason: CategoryId;
  target_content_type: Exclude<ContentType, "user_report">;
  target_id?: string;
  target_text?: string;
  details?: string;
}

export interface ModerationRequest {
  content_type: ContentType;
  text?: string;
  media?: MediaRef[];
  author_id?: string;
  /** Recipient for direct messages, or the reported item's owner for reports. */
  target_user_id?: string;
  report?: UserReportPayload;
  /** Caller's own reference, echoed back. */
  client_ref?: string;
}

export interface ModerationFinding {
  category: CategoryId;
  rule_id: string;
  confidence: "high" | "medium";
  /** Short matched fragment. Omitted for direct messages. */
  excerpt?: string;
  note?: string;
}

export interface ModerationDecision {
  decision_id: string;
  content_type: ContentType;
  status: ModerationStatus;
  /** Internal heuristic in [0, 1]. Not a calibrated probability. */
  risk_score: number;
  /** Violation categories (empty when nothing was flagged). */
  categories: CategoryId[];
  /** Allowed, informational labels such as `ped_disclosure` or `safe_fitness`. */
  labels: CategoryId[];
  reason: string;
  source: DecisionSource;
  requires_human_review: boolean;
  /** True when the decision is provisional because an assessor was unavailable. */
  retryable: boolean;
  findings: ModerationFinding[];
  policy_version: string;
  /** Present when the item was placed in the human-review queue. */
  review_id?: string;
  client_ref?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected" | "edit_requested";
export type ModeratorActionType = "approve" | "reject" | "request_edit";

export interface ReviewItemView {
  id: string;
  decision_id: string;
  content_type: ContentType;
  status: ReviewStatus;
  severity: Severity;
  risk_score: number;
  categories: CategoryId[];
  labels: CategoryId[];
  reason: string;
  source: DecisionSource;
  /** Null when the content is private (direct messages) or was purged after a decision. */
  text: string | null;
  private: boolean;
  content_note?: string;
  author_id?: string;
  findings: ModerationFinding[];
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  item_id: string;
  content_type: ContentType;
  action: ModeratorActionType | "auto_reject" | "reveal_private";
  actor: string;
  note?: string;
  categories: CategoryId[];
}
