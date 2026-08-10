import {
  createHash,
} from "node:crypto";

import type {
  AdvertisingAiCandidateEvaluationResult,
  AdvertisingAiStoredModel,
} from "./advertising-ai-model-lifecycle.types.js";

export interface AdvertisingAiFrozenEvaluationEvent {
  readonly eventKey:
    string;

  readonly sourceEventId:
    string;

  readonly campaignId:
    string;

  readonly eventType:
    "impression" |
    "click" |
    "conversion";

  readonly placement:
    "home" |
    "search" |
    "trending";

  readonly occurredAt:
    string;
}

export interface AdvertisingAiFrozenEvaluationSnapshot {
  readonly id:
    string;

  readonly status:
    "ready";

  readonly materializedEventCount:
    number;

  readonly datasetChecksum:
    string |
    null;
}

export interface AdvertisingAiFrozenEvaluationSnapshotReader {
  getReadySnapshot(
    datasetId:
      string
  ):
    Promise<
      AdvertisingAiFrozenEvaluationSnapshot |
      null
    >;

  listFrozenEvents(
    input: {
      readonly datasetId:
        string;

      readonly limit:
        number;

      readonly cursor:
        string |
        null;
    }
  ):
    Promise<{
      readonly events:
        readonly AdvertisingAiFrozenEvaluationEvent[];

      readonly nextCursor:
        string |
        null;
    }>;
}

export interface AdvertisingAiIndependentChallengerEvaluationService {
  evaluate(
    input: {
      readonly candidate:
        AdvertisingAiStoredModel;

      readonly incumbent:
        AdvertisingAiStoredModel |
        null;
    }
  ):
    Promise<
      AdvertisingAiCandidateEvaluationResult
    >;
}

interface Metrics {
  readonly eventCount:
    number;

  readonly positiveCount:
    number;

  readonly negativeCount:
    number;

  readonly accuracy:
    number;

  readonly logLoss:
    number;

  readonly rocAuc:
    number |
    null;
}

interface ScoredLabel {
  readonly score:
    number;

  readonly label:
    0 |
    1;
}

const FEATURE_DIMENSION =
  256;

const VALIDATION_BUCKET_PERCENT =
  20;

const MINIMUM_VALIDATION_EVENTS =
  20;

const MINIMUM_LOG_LOSS_IMPROVEMENT =
  0.001;

function firstEightBytesAsBigInt(
  digest:
    Buffer
): bigint {
  let value =
    0n;

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    value =
      (
        value <<
        8n
      ) |
      BigInt(
        digest[index] ??
        0
      );
  }

  return value;
}

function hashFeature(
  value:
    string
): {
  readonly index:
    number;

  readonly sign:
    number;
} {
  const digest =
    createHash(
      "sha256"
    )
      .update(
        value
          .trim()
          .toLowerCase(),
        "utf8"
      )
      .digest();

  const index =
    1 +
    Number(
      firstEightBytesAsBigInt(
        digest
      ) %
      BigInt(
        FEATURE_DIMENSION -
        1
      )
    );

  const sign =
    (
      (
        digest[8] ??
        0
      ) &
      1
    ) ===
      0
      ? 1
      : -1;

  return {
    index,
    sign,
  };
}

function isValidationEvent(
  sourceEventId:
    string
): boolean {
  const digest =
    createHash(
      "sha256"
    )
      .update(
        `advertising-validation:${sourceEventId}`,
        "utf8"
      )
      .digest();

  const bucket =
    Number(
      firstEightBytesAsBigInt(
        digest
      ) %
      100n
    );

  return (
    bucket <
    VALIDATION_BUCKET_PERCENT
  );
}

function sigmoid(
  value:
    number
): number {
  if (value >= 0) {
    const exponent =
      Math.exp(
        -value
      );

    return (
      1 /
      (
        1 +
        exponent
      )
    );
  }

  const exponent =
    Math.exp(
      value
    );

  return (
    exponent /
    (
      1 +
      exponent
    )
  );
}

function assertModelContract(
  model:
    AdvertisingAiStoredModel,

  expectedStatus:
    "candidate" |
    "promoted"
): void {
  if (
    model.status !==
    expectedStatus
  ) {
    throw new Error(
      `Advertising AI ${expectedStatus} lifecycle state is invalid.`
    );
  }

  if (
    model.modelType !==
      "hashed_logistic_ad_response_v1" ||
    model.featureVersion !==
      "advertising-campaign-placement-v1" ||
    model.featureDimension !==
      FEATURE_DIMENSION ||
    model.weights.length !==
      FEATURE_DIMENSION
  ) {
    throw new Error(
      `Advertising AI ${expectedStatus} feature contract is incompatible.`
    );
  }

  for (
    const weight of
    model.weights
  ) {
    if (
      !Number.isFinite(
        weight
      )
    ) {
      throw new Error(
        `Advertising AI ${expectedStatus} model contains an invalid weight.`
      );
    }
  }

  if (
    !Number.isFinite(
      model.intercept
    )
  ) {
    throw new Error(
      `Advertising AI ${expectedStatus} model intercept is invalid.`
    );
  }
}

function score(
  model:
    AdvertisingAiStoredModel,

  event:
    AdvertisingAiFrozenEvaluationEvent
): number {
  let value =
    model.intercept;

  const features = [
    `campaign:${event.campaignId}`,
    `placement:${event.placement}`,
    (
      "campaign-placement:" +
      `${event.campaignId}:` +
      event.placement
    ),
  ];

  for (
    const feature of
    features
  ) {
    const hashed =
      hashFeature(
        feature
      );

    const weight =
      model.weights[
        hashed.index
      ];

    if (
      weight ===
      undefined
    ) {
      throw new Error(
        "Advertising AI model feature index is unavailable."
      );
    }

    value +=
      (
        weight *
        hashed.sign
      );
  }

  return sigmoid(
    value
  );
}

function label(
  eventType:
    AdvertisingAiFrozenEvaluationEvent[
      "eventType"
    ]
): 0 | 1 {
  return (
    eventType ===
      "impression"
      ? 0
      : 1
  );
}

function auc(
  values:
    readonly ScoredLabel[]
): number | null {
  const positiveCount =
    values.filter(
      item =>
        item.label ===
        1
    ).length;

  const negativeCount =
    values.length -
    positiveCount;

  if (
    positiveCount ===
      0 ||
    negativeCount ===
      0
  ) {
    return null;
  }

  const sorted =
    [...values].sort(
      (
        left,
        right
      ) =>
        left.score -
        right.score
    );

  let positiveRankSum =
    0;

  let start =
    0;

  while (
    start <
    sorted.length
  ) {
    let end =
      start +
      1;

    while (
      end <
        sorted.length &&
      sorted[end]
        ?.score ===
        sorted[start]
          ?.score
    ) {
      end +=
        1;
    }

    const averageRank =
      (
        (
          start +
          1
        ) +
        end
      ) /
      2;

    for (
      let index =
        start;
      index <
        end;
      index +=
        1
    ) {
      if (
        sorted[index]
          ?.label ===
        1
      ) {
        positiveRankSum +=
          averageRank;
      }
    }

    start =
      end;
  }

  return (
    (
      positiveRankSum -
      (
        positiveCount *
        (
          positiveCount +
          1
        )
      ) /
      2
    ) /
    (
      positiveCount *
      negativeCount
    )
  );
}

function metrics(
  model:
    AdvertisingAiStoredModel,

  events:
    readonly AdvertisingAiFrozenEvaluationEvent[]
): Metrics {
  let positiveCount =
    0;

  let correct =
    0;

  let loss =
    0;

  const scored:
    ScoredLabel[] =
    [];

  for (
    const event of
    events
  ) {
    const expected =
      label(
        event.eventType
      );

    const probability =
      score(
        model,
        event
      );

    const clipped =
      Math.min(
        Math.max(
          probability,
          1e-12
        ),
        1 -
        1e-12
      );

    if (
      expected ===
      1
    ) {
      positiveCount +=
        1;

      loss -=
        Math.log(
          clipped
        );
    }
    else {
      loss -=
        Math.log(
          1 -
          clipped
        );
    }

    const predicted:
      0 | 1 =
      probability >=
        0.5
        ? 1
        : 0;

    if (
      predicted ===
      expected
    ) {
      correct +=
        1;
    }

    scored.push({
      score:
        probability,

      label:
        expected,
    });
  }

  return {
    eventCount:
      events.length,

    positiveCount,

    negativeCount:
      events.length -
      positiveCount,

    accuracy:
      correct /
      events.length,

    logLoss:
      loss /
      events.length,

    rocAuc:
      auc(
        scored
      ),
  };
}

function prevalenceLogLoss(
  positiveCount:
    number,

  negativeCount:
    number
): number {
  const total =
    positiveCount +
    negativeCount;

  const probability =
    positiveCount /
    total;

  if (
    probability <=
      0 ||
    probability >=
      1
  ) {
    return 0;
  }

  return -(
    probability *
      Math.log(
        probability
      ) +
    (
      1 -
      probability
    ) *
      Math.log(
        1 -
        probability
      )
  );
}

function result(
  input: {
    readonly decision:
      "pass" |
      "fail";

    readonly reason:
      string;

    readonly baselineLogLoss:
      number;

    readonly candidate:
      Metrics;
  }
):
  AdvertisingAiCandidateEvaluationResult {
  return {
    decision:
      input.decision,

    reason:
      input.reason,

    baselineLogLoss:
      input.baselineLogLoss,

    candidateLogLoss:
      input.candidate.logLoss,

    candidateRocAuc:
      input.candidate.rocAuc,

    candidateAccuracy:
      input.candidate.accuracy,

    validationEventCount:
      input.candidate.eventCount,

    validationPositiveCount:
      input.candidate.positiveCount,

    validationNegativeCount:
      input.candidate.negativeCount,
  };
}

export function createAdvertisingAiIndependentChallengerEvaluationService(
  snapshotReader:
    AdvertisingAiFrozenEvaluationSnapshotReader
):
  AdvertisingAiIndependentChallengerEvaluationService {
  return {
    async evaluate(
      input
    ) {
      assertModelContract(
        input.candidate,
        "candidate"
      );

      if (
        input.incumbent !==
        null
      ) {
        assertModelContract(
          input.incumbent,
          "promoted"
        );
      }

      const snapshot =
        await snapshotReader
          .getReadySnapshot(
            input.candidate
              .datasetId
          );

      if (
        snapshot ===
        null
      ) {
        throw new Error(
          "Advertising AI frozen candidate dataset was not found."
        );
      }

      if (
        snapshot.datasetChecksum ===
          null ||
        snapshot.datasetChecksum !==
          input.candidate
            .datasetChecksum
      ) {
        throw new Error(
          "Advertising AI frozen candidate dataset checksum mismatch."
        );
      }

      if (
        snapshot
          .materializedEventCount !==
        input.candidate
          .materializedEventCount
      ) {
        throw new Error(
          "Advertising AI frozen candidate dataset count mismatch."
        );
      }

      const validationEvents:
        AdvertisingAiFrozenEvaluationEvent[] =
        [];

      let observed =
        0;

      let cursor:
        string |
        null =
        null;

      while (true) {
        const page =
          await snapshotReader
            .listFrozenEvents({
              datasetId:
                snapshot.id,

              limit:
                5000,

              cursor,
            });

        if (
          page.events.length ===
            0 &&
          page.nextCursor !==
            null
        ) {
          throw new Error(
            "Advertising AI frozen evaluation returned an empty non-final page."
          );
        }

        for (
          const event of
          page.events
        ) {
          observed +=
            1;

          if (
            isValidationEvent(
              event.sourceEventId
            )
          ) {
            validationEvents.push(
              event
            );
          }
        }

        if (
          page.nextCursor ===
          null
        ) {
          break;
        }

        cursor =
          page.nextCursor;
      }

      if (
        observed !==
        snapshot
          .materializedEventCount
      ) {
        throw new Error(
          "Advertising AI frozen evaluation event count changed."
        );
      }

      if (
        validationEvents.length <
        MINIMUM_VALIDATION_EVENTS
      ) {
        throw new Error(
          "Advertising AI independent validation sample is insufficient."
        );
      }

      const candidateMetrics =
        metrics(
          input.candidate,
          validationEvents
        );

      if (
        candidateMetrics
          .positiveCount ===
          0 ||
        candidateMetrics
          .negativeCount ===
          0
      ) {
        return result({
          decision:
            "fail",

          reason:
            "independent_validation_class_diversity_insufficient",

          baselineLogLoss:
            Number.MAX_VALUE,

          candidate:
            candidateMetrics,
        });
      }

      if (
        candidateMetrics
          .rocAuc !==
          null &&
        candidateMetrics
          .rocAuc <
          0.5
      ) {
        const baseline =
          input.incumbent ===
            null
            ? prevalenceLogLoss(
                candidateMetrics
                  .positiveCount,
                candidateMetrics
                  .negativeCount
              )
            : metrics(
                input.incumbent,
                validationEvents
              ).logLoss;

        return result({
          decision:
            "fail",

          reason:
            "independent_candidate_auc_below_random",

          baselineLogLoss:
            baseline,

          candidate:
            candidateMetrics,
        });
      }

      if (
        input.incumbent ===
        null
      ) {
        const baseline =
          prevalenceLogLoss(
            candidateMetrics
              .positiveCount,
            candidateMetrics
              .negativeCount
          );

        if (
          candidateMetrics
            .logLoss +
            MINIMUM_LOG_LOSS_IMPROVEMENT >
          baseline
        ) {
          return result({
            decision:
              "fail",

            reason:
              "independent_candidate_does_not_beat_prevalence_baseline",

            baselineLogLoss:
              baseline,

            candidate:
              candidateMetrics,
          });
        }

        return result({
          decision:
            "pass",

          reason:
            "independent_candidate_beats_prevalence_baseline",

          baselineLogLoss:
            baseline,

          candidate:
            candidateMetrics,
        });
      }

      const incumbentMetrics =
        metrics(
          input.incumbent,
          validationEvents
        );

      if (
        candidateMetrics
          .logLoss +
          MINIMUM_LOG_LOSS_IMPROVEMENT >
        incumbentMetrics
          .logLoss
      ) {
        return result({
          decision:
            "fail",

          reason:
            "independent_candidate_does_not_beat_incumbent",

          baselineLogLoss:
            incumbentMetrics
              .logLoss,

          candidate:
            candidateMetrics,
        });
      }

      return result({
        decision:
          "pass",

        reason:
          "independent_candidate_beats_incumbent",

        baselineLogLoss:
          incumbentMetrics
            .logLoss,

        candidate:
          candidateMetrics,
      });
    },
  };
}