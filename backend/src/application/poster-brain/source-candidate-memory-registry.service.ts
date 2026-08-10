import type {
  PosterBrainSourceCandidate,
} from "./source-candidate.types.js";

export interface PosterBrainSourceCandidateMemoryRegistry {
  observe(
    candidate:
      PosterBrainSourceCandidate
  ):
    PosterBrainSourceCandidate;

  get(
    candidateKey:
      string
  ):
    PosterBrainSourceCandidate |
    null;

  list():
    readonly PosterBrainSourceCandidate[];
}

function uniqueStrings(
  values:
    readonly string[]
): readonly string[] {
  return [
    ...new Set(
      values
        .map(
          value =>
            value.trim()
        )
        .filter(Boolean)
    ),
  ].sort();
}

function mergeEvidence(
  left:
    PosterBrainSourceCandidate["evidence"],
  right:
    PosterBrainSourceCandidate["evidence"]
): PosterBrainSourceCandidate["evidence"] {
  const byKey =
    new Map<
      string,
      PosterBrainSourceCandidate["evidence"][number]
    >();

  for (
    const evidence
    of [
      ...left,
      ...right,
    ]
  ) {
    const key =
      [
        evidence.providerKey,
        evidence.externalContentId,
        evidence.originalUrl,
      ].join("|");

    if (!byKey.has(key)) {
      byKey.set(
        key,
        evidence
      );
    }
  }

  return [
    ...byKey.values(),
  ].sort(
    (
      a,
      b
    ) =>
      a.observedAt.localeCompare(
        b.observedAt
      )
  );
}

function earlier(
  left:
    string,
  right:
    string
): string {
  return left <= right
    ? left
    : right;
}

function later(
  left:
    string,
  right:
    string
): string {
  return left >= right
    ? left
    : right;
}

function mergeCandidate(
  current:
    PosterBrainSourceCandidate,
  incoming:
    PosterBrainSourceCandidate
): PosterBrainSourceCandidate {
  if (
    current.candidateKey !==
    incoming.candidateKey
  ) {
    throw new Error(
      "Cannot merge different source candidates."
    );
  }

  const evidence =
    mergeEvidence(
      current.evidence,
      incoming.evidence
    );

  return {
    ...current,

    /*
     * Do not downgrade lifecycle state simply because another
     * provider observed the same source.
     */
    status:
      current.status,

    sourceExternalIds:
      uniqueStrings([
        ...current.sourceExternalIds,
        ...incoming.sourceExternalIds,
      ]),

    providerKeys:
      uniqueStrings([
        ...current.providerKeys,
        ...incoming.providerKeys,
      ]),

    evidence,

    firstSeenAt:
      earlier(
        current.firstSeenAt,
        incoming.firstSeenAt
      ),

    lastSeenAt:
      later(
        current.lastSeenAt,
        incoming.lastSeenAt
      ),

    /*
     * Count actual observations, not unique evidence only.
     */
    observationCount:
      current.observationCount +
      incoming.observationCount,
  };
}

export function createPosterBrainSourceCandidateMemoryRegistry():
  PosterBrainSourceCandidateMemoryRegistry {
  const candidates =
    new Map<
      string,
      PosterBrainSourceCandidate
    >();

  return {
    observe(
      candidate
    ) {
      const current =
        candidates.get(
          candidate.candidateKey
        );

      const next =
        current === undefined
          ? candidate
          : mergeCandidate(
              current,
              candidate
            );

      candidates.set(
        candidate.candidateKey,
        next
      );

      return next;
    },

    get(
      candidateKey
    ) {
      return (
        candidates.get(
          candidateKey
        ) ??
        null
      );
    },

    list() {
      return [
        ...candidates.values(),
      ].sort(
        (
          a,
          b
        ) =>
          a.candidateKey.localeCompare(
            b.candidateKey
          )
      );
    },
  };
}