import {
  createHash,
} from "node:crypto";

import type {
  AdvertisingAiScoreComponents,
  AdvertisingAiScoreRequest,
  AdvertisingAiScoreResult,
} from "../../domains/advertising-ai/index.js";

import {
  createAdvertisingAiScoringService,
  type AdvertisingAiScoringService,
} from "./advertising-ai-scoring.service.js";

const PROMOTED_MODEL_TYPE =
  "hashed_logistic_ad_response_v1";

const PROMOTED_FEATURE_VERSION =
  "advertising-campaign-placement-v1";

const FEATURE_DIMENSION =
  256;

export interface AdvertisingAiPromotedModelRuntimeRecord {
  readonly modelId:
    string;

  readonly status:
    string;

  readonly modelType:
    string;

  readonly featureVersion:
    string;

  readonly featureDimension:
    number;

  readonly intercept:
    number;

  readonly weights:
    readonly number[];
}

interface ParsedPromotedModel {
  readonly modelId:
    string;

  readonly intercept:
    number;

  readonly weights:
    readonly number[];
}

export interface AdvertisingAiPromotedModelScoringServiceDependencies {
  readonly model:
    AdvertisingAiPromotedModelRuntimeRecord;

  readonly fallbackScoringService?:
    AdvertisingAiScoringService;
}

function boundedScore(
  value:
    number
): number {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function parsePromotedModel(
  model:
    AdvertisingAiPromotedModelRuntimeRecord
): ParsedPromotedModel |
  null {
  const modelId =
    model.modelId
      .trim();

  if (
    modelId.length === 0 ||
    model.status !==
      "promoted" ||
    model.modelType !==
      PROMOTED_MODEL_TYPE ||
    model.featureVersion !==
      PROMOTED_FEATURE_VERSION ||
    model.featureDimension !==
      FEATURE_DIMENSION ||
    !Number.isFinite(
      model.intercept
    ) ||
    model.weights.length !==
      FEATURE_DIMENSION
  ) {
    return null;
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
      return null;
    }
  }

  return {
    modelId,

    intercept:
      model.intercept,

    weights:
      model.weights,
  };
}

function hashFeature(
  value:
    string,

  dimension:
    number
): {
  readonly index:
    number;

  readonly sign:
    number;
} {
  /*
   * Python uses strip().casefold().
   * Advertising runtime features are ASCII campaign ids plus
   * the fixed ASCII placement vocabulary, so trim/lowercase
   * reproduces that contract exactly here.
   */
  const cleaned =
    value
      .trim()
      .toLowerCase();

  const digest =
    createHash(
      "sha256"
    )
      .update(
        cleaned,
        "utf8"
      )
      .digest();

  let firstEight =
    0n;

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    firstEight =
      (
        firstEight <<
        8n
      ) |
      BigInt(
        digest[index] ??
        0
      );
  }

  return {
    /*
     * Index zero is intentionally reserved.
     * Match Python:
     * 1 + hash % (dimension - 1)
     */
    index:
      1 +
      Number(
        firstEight %
        BigInt(
          dimension -
          1
        )
      ),

    sign:
      (
        (
          digest[8] ??
          0
        ) &
        1
      ) ===
        0
        ? 1
        : -1,
  };
}

function addHashedFeature(
  score:
    number,

  weights:
    readonly number[],

  feature:
    string
): number {
  const hashed =
    hashFeature(
      feature,
      weights.length
    );

  const weight =
    weights[
      hashed.index
    ];

  if (
    weight ===
    undefined
  ) {
    throw new Error(
      "Advertising AI promoted model feature index is unavailable."
    );
  }

  return (
    score +
    (
      weight *
      hashed.sign
    )
  );
}

function sigmoid(
  value:
    number
): number {
  /*
   * Match Python _sigmoid() numerical bounding.
   */
  const bounded =
    Math.max(
      -35,
      Math.min(
        35,
        value
      )
    );

  return (
    1 /
    (
      1 +
      Math.exp(
        -bounded
      )
    )
  );
}

function promotedProbability(
  model:
    ParsedPromotedModel,

  campaignId:
    string,

  placement:
    AdvertisingAiScoreRequest[
      "candidate"
    ][
      "placement"
    ]
): number |
  null {
  const campaign =
    campaignId
      .trim();

  if (!campaign) {
    return null;
  }

  /*
   * Python _event_features() reserves index 0, but
   * Python _linear_score() explicitly skips index 0.
   * The trained intercept is the model bias term.
   */
  let score =
    model.intercept;

  score =
    addHashedFeature(
      score,
      model.weights,
      `campaign:${campaign}`
    );

  score =
    addHashedFeature(
      score,
      model.weights,
      `placement:${placement}`
    );

  score =
    addHashedFeature(
      score,
      model.weights,
      `campaign-placement:${campaign}:${placement}`
    );

  const result =
    sigmoid(
      score
    );

  return Number.isFinite(
    result
  )
    ? boundedScore(
        result
      )
    : null;
}

function weightedScore(
  components:
    AdvertisingAiScoreComponents
): number {
  /*
   * Preserve the existing locked S03 weighting exactly.
   */
  return boundedScore(
    (
      components
        .contextualRelevance *
      0.4
    ) +
    (
      components
        .personalization *
      0.15
    ) +
    (
      components
        .quality *
      0.15
    ) +
    (
      components
        .advertisingPerformance *
      0.15
    ) +
    (
      components
        .value *
      0.1
    ) +
    (
      components
        .basePriority *
      0.05
    )
  );
}

export function createAdvertisingAiPromotedModelScoringService(
  dependencies:
    AdvertisingAiPromotedModelScoringServiceDependencies
):
  AdvertisingAiScoringService {
  const fallback =
    dependencies
      .fallbackScoringService ??
    createAdvertisingAiScoringService();

  const model =
    parsePromotedModel(
      dependencies.model
    );

  return {
    score(
      request
    ):
      AdvertisingAiScoreResult {
      /*
       * Run existing deterministic scorer first.
       * This preserves its authoritative hard-eligibility check.
       */
      const deterministic =
        fallback.score(
          request
        );

      if (
        !deterministic
          .eligible ||
        model ===
          null ||
        request.candidate
          .campaignId ===
          null
      ) {
        return deterministic;
      }

      let probability:
        number |
        null;

      try {
        probability =
          promotedProbability(
            model,
            request.candidate
              .campaignId,
            request.candidate
              .placement
          );
      }
      catch {
        /*
         * Learned scoring is never allowed to break delivery.
         */
        return deterministic;
      }

      if (
        probability ===
        null
      ) {
        return deterministic;
      }

      const components:
        AdvertisingAiScoreComponents =
        {
          ...deterministic
            .components,

          advertisingPerformance:
            probability,
        };

      return {
        ...deterministic,

        score:
          weightedScore(
            components
          ),

        components,

        engine:
          "promoted_model_v1",

        modelVersion:
          model.modelId,
      };
    },
  };
}