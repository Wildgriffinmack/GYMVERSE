import type { ContentType, ModerationRequest, UserReportPayload } from "../contract.ts";
import { isCategoryId } from "../policy/categories.ts";

export class ValidationError extends Error {
  override name = "ValidationError";
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

const TEXT_LIMITS: Record<ContentType, number> = {
  post: 2200,
  comment: 1000,
  profile_username: 30,
  profile_bio: 300,
  direct_message: 2000,
  image: 2200,
  video: 2200,
  user_report: 1000,
};
const CONTENT_TYPES = new Set(Object.keys(TEXT_LIMITS));
const ID = /^[A-Za-z0-9_.:-]{1,64}$/;

function optionalId(o: Record<string, unknown>, key: string): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || !ID.test(v)) throw new ValidationError(key, `${key} must be 1-64 characters of [A-Za-z0-9_.:-]`);
  return v;
}

function optionalText(o: Record<string, unknown>, key: string, max: number): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") throw new ValidationError(key, `${key} must be a string`);
  if (v.length > max) throw new ValidationError(key, `${key} exceeds ${max} characters`);
  return v;
}

export function parseModerationRequest(body: unknown, opts: { allowReport: boolean }): ModerationRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("body", "expected a JSON object");
  const o = body as Record<string, unknown>;
  const type = o.content_type;
  if (typeof type !== "string" || !CONTENT_TYPES.has(type)) throw new ValidationError("content_type", `content_type must be one of ${[...CONTENT_TYPES].join(", ")}`);
  const contentType = type as ContentType;
  if (contentType === "user_report" && !opts.allowReport) throw new ValidationError("content_type", "submit user reports to POST /v1/reports");

  const req: ModerationRequest = { content_type: contentType };
  const text = optionalText(o, "text", TEXT_LIMITS[contentType]);
  if (text !== undefined) req.text = text;
  const author = optionalId(o, "author_id");
  if (author) req.author_id = author;
  const target = optionalId(o, "target_user_id");
  if (target) req.target_user_id = target;
  const ref = optionalId(o, "client_ref");
  if (ref) req.client_ref = ref;

  if (o.media !== undefined) {
    if (!Array.isArray(o.media) || o.media.length > 10) throw new ValidationError("media", "media must be an array of at most 10 items");
    req.media = o.media.map((m, i) => {
      if (!m || typeof m !== "object") throw new ValidationError(`media[${i}]`, "media items must be objects");
      const mm = m as Record<string, unknown>;
      if (mm.kind !== "image" && mm.kind !== "video") throw new ValidationError(`media[${i}].kind`, "kind must be image or video");
      const r = optionalText(mm, "ref", 512);
      return r ? { kind: mm.kind, ref: r } : { kind: mm.kind };
    });
  }

  if (contentType === "user_report") {
    req.report = parseReport(o.report);
  } else if (!req.text?.trim() && !req.media?.length && contentType !== "image" && contentType !== "video") {
    throw new ValidationError("text", "text is required for this content type");
  }
  return req;
}

function parseReport(raw: unknown): UserReportPayload {
  if (!raw || typeof raw !== "object") throw new ValidationError("report", "report is required");
  const r = raw as Record<string, unknown>;
  if (!isCategoryId(r.reason)) throw new ValidationError("report.reason", "report.reason must be a category id");
  const t = r.target_content_type;
  if (typeof t !== "string" || !CONTENT_TYPES.has(t) || t === "user_report") throw new ValidationError("report.target_content_type", "invalid target_content_type");
  const out: UserReportPayload = { reason: r.reason, target_content_type: t as UserReportPayload["target_content_type"] };
  const targetText = optionalText(r, "target_text", 2200);
  if (targetText) out.target_text = targetText;
  const details = optionalText(r, "details", 1000);
  if (details) out.details = details;
  const targetId = optionalId(r, "target_id");
  if (targetId) out.target_id = targetId;
  return out;
}
