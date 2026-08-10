import type {
  PosterBrainSourceCandidateRepository,
} from "./source-candidate.repository.js";

import type {
  PosterBrainSourceDiscoveryOrchestrator,
} from "./source-discovery-orchestrator.service.js";

import {
  createPosterBrainSourceQualificationService,
  type PosterBrainSourceQualificationDecision,
  type PosterBrainSourceQualificationService,
} from "./source-qualification.service.js";

import type {
  PosterBrainSourceTopicAffinityRepository,
} from "./source-topic-affinity.repository.js";

export interface PosterBrainQualifiedSourceDiscoveryRun {
  readonly discovery:
    Awaited<
      ReturnType<
        PosterBrainSourceDiscoveryOrchestrator["run"]
      >
    >;

  readonly affinityInsertedCount:
    number;

  readonly affinityDuplicateCount:
    number;

  readonly affinityFailureCount:
    number;

  readonly qualifiedCandidateCount:
    number;

  readonly qualificationFailureCount:
    number;

  readonly decisions:
    readonly PosterBrainSourceQualificationDecision[];
}

export interface PosterBrainSourceDiscoveryQualificationService {
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
  ): Promise<PosterBrainQualifiedSourceDiscoveryRun>;
}

export interface PosterBrainSourceDiscoveryQualificationDependencies {
  readonly discoveryOrchestrator:
    PosterBrainSourceDiscoveryOrchestrator;

  readonly sourceCandidateRepository:
    PosterBrainSourceCandidateRepository;

  readonly affinityRepository:
    PosterBrainSourceTopicAffinityRepository;

  readonly qualificationService?:
    PosterBrainSourceQualificationService;

  readonly now:
    () => string;
}

export function createPosterBrainSourceDiscoveryQualificationService(
  dependencies:
    PosterBrainSourceDiscoveryQualificationDependencies
): PosterBrainSourceDiscoveryQualificationService {
  const qualificationService =
    dependencies.qualificationService ??
    createPosterBrainSourceQualificationService();

  return {
    async run(
      input
    ) {
      const discovery =
        await dependencies
          .discoveryOrchestrator
          .run(
            input
          );

      let affinityInsertedCount =
        0;

      let affinityDuplicateCount =
        0;

      let affinityFailureCount =
        0;

      let qualifiedCandidateCount =
        0;

      let qualificationFailureCount =
        0;

      const qualificationCandidates =
        new Set<string>();

      for (
        const observation
        of discovery.observations
      ) {
        try {
          const result =
            await dependencies
              .affinityRepository
              .observe({
                candidateKey:
                  observation.candidateKey,

                topicId:
                  observation.topicId,

                providerKey:
                  observation.providerKey,

                externalContentId:
                  observation.externalContentId,

                observedAt:
                  dependencies.now(),
              });

          qualificationCandidates.add(
            observation.candidateKey
          );

          if (result.inserted) {
            affinityInsertedCount +=
              1;
          }
          else {
            affinityDuplicateCount +=
              1;
          }
        }
        catch {
          affinityFailureCount +=
            1;
        }
      }

      const decisions:
        PosterBrainSourceQualificationDecision[] =
        [];

      for (
        const candidateKey
        of [
          ...qualificationCandidates,
        ].sort()
      ) {
        try {
          const candidate =
            await dependencies
              .sourceCandidateRepository
              .get(
                candidateKey
              );

          if (candidate === null) {
            qualificationFailureCount +=
              1;

            continue;
          }

          const evidence =
            await dependencies
              .affinityRepository
              .summarizeCandidate(
                candidateKey
              );

          if (evidence === null) {
            qualificationFailureCount +=
              1;

            continue;
          }

          const decision =
            qualificationService
              .evaluate(
                candidate,
                evidence
              );

          decisions.push(
            decision
          );

          if (
            decision.shouldQualify
          ) {
            await dependencies
              .sourceCandidateRepository
              .setStatus(
                candidateKey,
                "qualified"
              );

            qualifiedCandidateCount +=
              1;
          }
        }
        catch {
          qualificationFailureCount +=
            1;
        }
      }

      return {
        discovery,
        affinityInsertedCount,
        affinityDuplicateCount,
        affinityFailureCount,
        qualifiedCandidateCount,
        qualificationFailureCount,

        decisions:
          decisions.sort(
            (
              left,
              right
            ) =>
              left.candidateKey.localeCompare(
                right.candidateKey
              )
          ),
      };
    },
  };
}