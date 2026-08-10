export type PosterBrainSourceCandidateType =
  | "publisher"
  | "institution"
  | "platform"
  | "channel"
  | "unknown";

export type PosterBrainSourceCandidateStatus =
  | "discovered"
  | "qualified"
  | "rejected";

export interface PosterBrainSourceCandidateEvidence {
  readonly providerKey:
    string;

  readonly externalContentId:
    string;

  readonly originalUrl:
    string;

  readonly observedAt:
    string;
}

export interface PosterBrainSourceCandidate {
  readonly candidateKey:
    string;

  readonly canonicalHost:
    string;

  readonly canonicalOrigin:
    string;

  readonly displayName:
    string;

  readonly sourceType:
    PosterBrainSourceCandidateType;

  readonly status:
    PosterBrainSourceCandidateStatus;

  readonly sourceExternalIds:
    readonly string[];

  readonly providerKeys:
    readonly string[];

  readonly evidence:
    readonly PosterBrainSourceCandidateEvidence[];

  readonly firstSeenAt:
    string;

  readonly lastSeenAt:
    string;

  readonly observationCount:
    number;
}

export interface PosterBrainSourceCandidateInput {
  readonly providerKey:
    string;

  readonly externalContentId:
    string;

  readonly originalUrl:
    string;

  readonly publisherName:
    string;

  readonly sourceExternalId:
    string | null;

  readonly sourceName:
    string | null;

  readonly sourceUrl:
    string | null;

  readonly observedAt?:
    string;
}