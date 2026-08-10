import type {
  AdvertisingAiRankingRequest,
  AdvertisingAiRankingResult,
} from "../../domains/advertising-ai/index.js";

import {
  createAdvertisingAiRankingService,
  type AdvertisingAiRankingService,
} from "./advertising-ai-ranking.service.js";

import {
  createAdvertisingAiPromotedModelScoringService,
  type AdvertisingAiPromotedModelRuntimeRecord,
} from "./advertising-ai-promoted-model-scoring.service.js";

export interface AdvertisingAiPromotedModelReader {
  getPromotedModel():
    Promise<
      AdvertisingAiPromotedModelRuntimeRecord |
      null
    >;
}

export interface AdvertisingAiRuntimeRankingService {
  rank(
    request:
      AdvertisingAiRankingRequest
  ):
    Promise<
      AdvertisingAiRankingResult
    >;
}

export interface AdvertisingAiRuntimeRankingServiceDependencies {
  readonly modelRegistryRepository:
    AdvertisingAiPromotedModelReader;

  readonly fallbackRankingService?:
    AdvertisingAiRankingService;
}

export function createAdvertisingAiRuntimeRankingService(
  dependencies:
    AdvertisingAiRuntimeRankingServiceDependencies
):
  AdvertisingAiRuntimeRankingService {
  const fallbackRankingService =
    dependencies
      .fallbackRankingService ??
    createAdvertisingAiRankingService();

  return {
    async rank(
      request
    ) {
      let promotedModel:
        AdvertisingAiPromotedModelRuntimeRecord |
        null;

      try {
        promotedModel =
          await dependencies
            .modelRegistryRepository
            .getPromotedModel();
      }
      catch {
        /*
         * Registry/database availability must never turn an
         * otherwise valid delivery decision into a failure.
         */
        return fallbackRankingService
          .rank(
            request
          );
      }

      if (
        promotedModel ===
        null
      ) {
        return fallbackRankingService
          .rank(
            request
          );
      }

      const scoringService =
        createAdvertisingAiPromotedModelScoringService({
          model:
            promotedModel,
        });

      /*
       * Reuse the locked S03 ranking layer.
       * Eligibility still executes before scoring.
       */
      return createAdvertisingAiRankingService({
        scoringService,
      }).rank(
        request
      );
    },
  };
}