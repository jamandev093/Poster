import type {
  PosterBrainJsonObject,
} from "./content-persistence.types.js";

export type PosterBrainContentSafetyStatus =
  | "safe"
  | "needs_review"
  | "blocked";

export interface PosterBrainContentClassificationResult {
  readonly category: string | null;
  readonly canonicalTopicIds: readonly string[];
  readonly evolvingTopicIds: readonly string[];
  readonly qualityScore: number;
  readonly safetyStatus: PosterBrainContentSafetyStatus;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly aiClassification: PosterBrainJsonObject;
}