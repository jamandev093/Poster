import {
  extractPosterBrainSourceCandidate,
} from "./source-candidate-extractor.service.js";

import type {
  PosterBrainSourceCandidateRepository,
} from "./source-candidate.repository.js";

import {
  createPosterBrainSourceDiscoveryPlanner,
  type PosterBrainSourceDiscoveryPlanner,
} from "./source-discovery-planner.service.js";

import type {
  PosterBrainSourceDiscoveryObservation,
  PosterBrainSourceDiscoveryProviderExecutor,
  PosterBrainSourceDiscoveryRunResult,
} from "./source-discovery.types.js";

export interface PosterBrainSourceDiscoveryOrchestrator {
  run(
    input: {
      readonly parentTopicSlug:
        string;

      readonly maxDepth?:
        number;

      readonly maxTopics?:
        number;

      readonly pageSize?:
        number;

      readonly maxPagesPerQuery?:
        number;
    }
  ):
    Promise<
      PosterBrainSourceDiscoveryRunResult
    >;
}

export interface PosterBrainSourceDiscoveryOrchestratorDependencies {
  readonly planner?:
    PosterBrainSourceDiscoveryPlanner;

  readonly providerExecutor:
    PosterBrainSourceDiscoveryProviderExecutor;

  readonly sourceCandidateRepository:
    PosterBrainSourceCandidateRepository;

  readonly now:
    () =>
      string;
}

function boundedInteger(
  value:
    number | undefined,
  fallback:
    number,
  minimum:
    number,
  maximum:
    number,
  field:
    string
): number {
  const resolved =
    value ??
    fallback;

  if (
    !Number.isSafeInteger(
      resolved
    ) ||
    resolved < minimum ||
    resolved > maximum
  ) {
    throw new Error(
      `${field} must be between ${minimum} and ${maximum}.`
    );
  }

  return resolved;
}

function observationIdentity(
  providerKey:
    string,
  externalContentId:
    string,
  candidateKey:
    string
): string {
  return [
    providerKey,
    externalContentId,
    candidateKey,
  ].join("\u0000");
}

function topicObservationIdentity(
  observation:
    PosterBrainSourceDiscoveryObservation
): string {
  return [
    observation.candidateKey,
    observation.topicId,
    observation.providerKey,
    observation.externalContentId,
  ].join("\u0000");
}

export function createPosterBrainSourceDiscoveryOrchestrator(
  dependencies:
    PosterBrainSourceDiscoveryOrchestratorDependencies
): PosterBrainSourceDiscoveryOrchestrator {
  const planner =
    dependencies.planner ??
    createPosterBrainSourceDiscoveryPlanner();

  return {
    async run(
      input
    ) {
      const pageSize =
        boundedInteger(
          input.pageSize,
          50,
          1,
          100,
          "pageSize"
        );

      const maxPagesPerQuery =
        boundedInteger(
          input.maxPagesPerQuery,
          2,
          1,
          5,
          "maxPagesPerQuery"
        );

      const plan =
        await planner.plan({
          parentTopicSlug:
            input.parentTopicSlug,

          ...(input.maxDepth === undefined
            ? {}
            : {
                maxDepth:
                  input.maxDepth,
              }),

          ...(input.maxTopics === undefined
            ? {}
            : {
                maxTopics:
                  input.maxTopics,
              }),
        });

      let providerRequestCount =
        0;

      let succeededRequestCount =
        0;

      let disabledRequestCount =
        0;

      let failedRequestCount =
        0;

      let discoveredItemCount =
        0;

      let rejectedItemCount =
        0;

      let persistedObservationCount =
        0;

      const persistedEvidence =
        new Set<string>();

      const candidateKeys =
        new Set<string>();

      const observationsByKey =
        new Map<
          string,
          PosterBrainSourceDiscoveryObservation
        >();

      /*
       * Queries are sequential inside each provider to respect
       * upstream quota/rate behavior. Different providers can
       * execute concurrently.
       */
      await Promise.all(
        dependencies.providerExecutor
          .providerKeys
          .map(
            async providerKey => {
              for (const query of plan.queries) {
                let cursor:
                  string | undefined =
                  undefined;

                for (
                  let page = 0;
                  page < maxPagesPerQuery;
                  page += 1
                ) {
                  providerRequestCount +=
                    1;

                  let result;

                  try {
                    result =
                      await dependencies
                        .providerExecutor
                        .execute({
                          providerKey,

                          query:
                            query.query,

                          pageSize,

                          ...(cursor === undefined
                            ? {}
                            : {
                                cursor,
                              }),
                        });
                  }
                  catch {
                    failedRequestCount +=
                      1;

                    break;
                  }

                  if (
                    result.status ===
                    "disabled"
                  ) {
                    disabledRequestCount +=
                      1;

                    break;
                  }

                  if (
                    result.status !==
                    "succeeded"
                  ) {
                    failedRequestCount +=
                      1;

                    break;
                  }

                  succeededRequestCount +=
                    1;

                  for (
                    const item
                    of result.items
                  ) {
                    discoveredItemCount +=
                      1;

                    const candidate =
                      extractPosterBrainSourceCandidate({
                        providerKey,

                        externalContentId:
                          item.externalContentId,

                        originalUrl:
                          item.originalUrl,

                        publisherName:
                          item.publisherName,

                        sourceExternalId:
                          item.sourceExternalId,

                        sourceName:
                          item.sourceName,

                        sourceUrl:
                          null,

                        observedAt:
                          dependencies.now(),
                      });

                    if (candidate === null) {
                      rejectedItemCount +=
                        1;

                      continue;
                    }

                    candidateKeys.add(
                      candidate.candidateKey
                    );

                    const observation:
                      PosterBrainSourceDiscoveryObservation =
                      {
                        candidateKey:
                          candidate.candidateKey,

                        topicId:
                          query.topicId,

                        topicSlug:
                          query.topicSlug,

                        queryKey:
                          query.queryKey,

                        providerKey,

                        externalContentId:
                          item.externalContentId,
                      };

                    observationsByKey.set(
                      topicObservationIdentity(
                        observation
                      ),
                      observation
                    );

                    /*
                     * Overlapping taxonomy queries can return the
                     * same provider/content item. Persist that
                     * source observation only once per run.
                     */
                    const evidenceKey =
                      observationIdentity(
                        providerKey,
                        item.externalContentId,
                        candidate.candidateKey
                      );

                    if (
                      persistedEvidence.has(
                        evidenceKey
                      )
                    ) {
                      continue;
                    }

                    persistedEvidence.add(
                      evidenceKey
                    );

                    try {
                      await dependencies
                        .sourceCandidateRepository
                        .observe(
                          candidate
                        );

                      persistedObservationCount +=
                        1;
                    }
                    catch {
                      /*
                       * One bad candidate must not abort source
                       * discovery for unrelated providers/topics.
                       */
                      rejectedItemCount +=
                        1;
                    }
                  }

                  if (
                    result.nextCursor ===
                    null
                  ) {
                    break;
                  }

                  cursor =
                    result.nextCursor;
                }
              }
            }
          )
      );

      return {
        parentTopicId:
          plan.parentTopic.topicId,

        parentTopicSlug:
          plan.parentTopic.slug,

        plannedTopicCount:
          plan.topics.length,

        plannedQueryCount:
          plan.queries.length,

        providerCount:
          dependencies
            .providerExecutor
            .providerKeys
            .length,

        providerRequestCount,
        succeededRequestCount,
        disabledRequestCount,
        failedRequestCount,
        discoveredItemCount,
        rejectedItemCount,
        persistedObservationCount,

        uniqueCandidateCount:
          candidateKeys.size,

        observations:
          [
            ...observationsByKey
              .values(),
          ].sort(
            (
              left,
              right
            ) =>
              left.topicSlug.localeCompare(
                right.topicSlug
              ) ||
              left.providerKey.localeCompare(
                right.providerKey
              ) ||
              left.externalContentId.localeCompare(
                right.externalContentId
              )
          ),
      };
    },
  };
}