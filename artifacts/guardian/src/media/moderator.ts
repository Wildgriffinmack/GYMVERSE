import type { MediaRef } from "../contract.ts";

/**
 * Stage 3 media moderation boundary — NOT IMPLEMENTED YET.
 *
 * Planned providers (all local, all swappable):
 * - ImageClassifier: fast NSFW / violence / gore classification on uploads.
 * - VisionLanguageModel: contextual image review against the same policy text the text model uses.
 * - VideoFrameSampler: pulls key frames (e.g. 1 fps + scene changes) and sends them to the image path.
 * - AudioTranscriber: local speech-to-text so spoken PED sourcing or threats hit the text rules.
 * - PrivacyDetector: faces of bystanders, screens, ID cards, license plates in gym footage.
 *
 * Until a provider is implemented and tested, media always goes to human review.
 */
export interface MediaFinding {
  kind: "image" | "video";
  ref?: string;
  note: string;
}

export interface MediaAssessment {
  supported: boolean;
  findings: MediaFinding[];
  note: string;
}

export interface MediaModerator {
  readonly name: string;
  assess(media: MediaRef[], signal: AbortSignal): Promise<MediaAssessment>;
}

export interface ImageClassifier {
  classify(image: Uint8Array, signal: AbortSignal): Promise<{ label: string; score: number }[]>;
}

export interface VideoFrameSampler {
  sample(video: Uint8Array, signal: AbortSignal): AsyncIterable<Uint8Array>;
}

export interface AudioTranscriber {
  transcribe(audio: Uint8Array, signal: AbortSignal): Promise<string>;
}

export class UnimplementedMediaModerator implements MediaModerator {
  readonly name = "unimplemented";

  async assess(media: MediaRef[]): Promise<MediaAssessment> {
    return {
      supported: false,
      findings: media.map((m) => ({ kind: m.kind, ref: m.ref, note: "not analyzed" })),
      note: "Media moderation is not implemented yet; photos and videos are held for human review.",
    };
  }
}
