export type PosterBrainEvolvingTopicStatus =
  | "discovered"
  | "promotable"
  | "promoted"
  | "rejected";

export interface PosterBrainEvolvingTopicRecord {
  readonly id:
    string;

  readonly slug:
    string;

  readonly displayName:
    string;

  readonly canonicalParentTopicId:
    string | null;

  readonly status:
    PosterBrainEvolvingTopicStatus;

  readonly observationCount:
    number;

  readonly distinctContentCount:
    number;

  readonly providerCount:
    number;

  readonly averageConfidence:
    number;

  readonly firstSeenAt:
    string;

  readonly lastSeenAt:
    string;

  readonly promotedTopicId:
    string | null;
}

export interface PosterBrainEvolvingTopicObservation {
  readonly slug:
    string;

  readonly displayName:
    string;

  readonly canonicalParentTopicId:
    string | null;

  readonly providerKey:
    string;

  readonly modelKey:
    string | null;

  readonly externalContentId:
    string;

  readonly confidence:
    number;

  readonly observedAt:
    string;
}

export interface PosterBrainPreparedEvolvingTopicObservation
  extends PosterBrainEvolvingTopicObservation {
  readonly canonicalParentSlug:
    string | null;
}

export interface PosterBrainEvolvingTopicClassificationInput {
  readonly externalContentId:
    string;

  readonly providerKey:
    string;

  readonly modelKey?:
    string;

  readonly primaryCategory:
    string;

  readonly canonicalTopicIds:
    readonly string[];

  readonly evolvingTopicIds:
    readonly string[];

  readonly topics:
    readonly string[];

  readonly confidence:
    number;

  readonly observedAt:
    string;
}