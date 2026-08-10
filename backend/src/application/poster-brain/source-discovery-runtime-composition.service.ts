import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  listActiveTaxonomyTopics,
} from "../../domains/taxonomy/taxonomy.repository.js";

import {
  createPosterBrainSourceCandidateRepository,
  type PosterBrainSourceCandidateRepository,
} from "./source-candidate.repository.js";

import {
  createPosterBrainSourceDiscoveryOrchestrator,
} from "./source-discovery-orchestrator.service.js";

import {
  createPosterBrainSourceDiscoveryPlanner,
} from "./source-discovery-planner.service.js";

import {
  createPosterBrainSourceDiscoveryProviderExecutor,
} from "./source-discovery-provider-executor.service.js";

import {
  createPosterBrainSourceDiscoveryQualificationService,
} from "./source-discovery-qualification.service.js";

import {
  createPosterBrainSourceDiscoveryRuntimeRepository,
  type PosterBrainSourceDiscoveryRuntimeRepository,
} from "./source-discovery-runtime.repository.js";

import {
  createPosterBrainSourceDiscoveryRuntimeService,
  type PosterBrainSourceDiscoveryRuntimeService,
} from "./source-discovery-runtime.service.js";

import {
  createPosterBrainSourceTopicAffinityRepository,
  type PosterBrainSourceTopicAffinityRepository,
} from "./source-topic-affinity.repository.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

import type {
  PosterBrainSourceDiscoveryProviderExecutor,
  PosterBrainSourceDiscoveryTaxonomyTopic,
} from "./source-discovery.types.js";

export interface PosterBrainSourceDiscoveryRuntimeComposition {
  readonly providerKeys:
    readonly string[];

  readonly runtimeService:
    PosterBrainSourceDiscoveryRuntimeService;
}

export interface PosterBrainSourceDiscoveryRuntimeCompositionDependencies {
  readonly database?:
    DatabaseQueryExecutor;

  readonly environment?:
    Readonly<
      Record<
        string,
        string | undefined
      >
    >;

  readonly fetchImplementation?:
    PosterBrainOfficialApiHttpFetch;

  readonly now?:
    () => string;

  /*
   * Overrides exist for deterministic contract/E2E testing.
   * Production uses the persistent implementations below.
   */
  readonly providerExecutor?:
    PosterBrainSourceDiscoveryProviderExecutor;

  readonly sourceCandidateRepository?:
    PosterBrainSourceCandidateRepository;

  readonly affinityRepository?:
    PosterBrainSourceTopicAffinityRepository;

  readonly runtimeRepository?:
    PosterBrainSourceDiscoveryRuntimeRepository;

  readonly listActiveTopics?:
    () =>
      Promise<
        readonly PosterBrainSourceDiscoveryTaxonomyTopic[]
      >;
}

function requiredDatabase(
  dependencies:
    PosterBrainSourceDiscoveryRuntimeCompositionDependencies
): DatabaseQueryExecutor {
  if (
    dependencies.database ===
    undefined
  ) {
    throw new Error(
      "Poster Brain source discovery runtime requires PostgreSQL."
    );
  }

  return dependencies.database;
}

function repositoryQueryExecutor(
  database:
    DatabaseQueryExecutor
) {
  return {
    async query(
      text:
        string,

      values:
        readonly unknown[] =
        []
    ) {
      const result =
        await database.query(
          text,
          Array.from(
            values
          )
        );

      return {
        rows:
          result.rows as
            readonly Record<
              string,
              unknown
            >[],
      };
    },
  };
}

export function createPosterBrainSourceDiscoveryRuntimeComposition(
  dependencies:
    PosterBrainSourceDiscoveryRuntimeCompositionDependencies = {}
): PosterBrainSourceDiscoveryRuntimeComposition {
  const now =
    dependencies.now ??
    (
      () =>
        new Date()
          .toISOString()
    );

  const providerExecutor =
    dependencies.providerExecutor ??
    createPosterBrainSourceDiscoveryProviderExecutor({
      ...(
        dependencies.environment ===
        undefined
          ? {}
          : {
              environment:
                dependencies.environment,
            }
      ),

      ...(
        dependencies.fetchImplementation ===
        undefined
          ? {}
          : {
              fetchImplementation:
                dependencies.fetchImplementation,
            }
      ),
    });

  const sourceCandidateRepository =
    dependencies.sourceCandidateRepository ??
    createPosterBrainSourceCandidateRepository(
      repositoryQueryExecutor(
        requiredDatabase(
          dependencies
        )
      )
    );

  const affinityRepository =
    dependencies.affinityRepository ??
    createPosterBrainSourceTopicAffinityRepository(
      repositoryQueryExecutor(
        requiredDatabase(
          dependencies
        )
      )
    );

  const planner =
    createPosterBrainSourceDiscoveryPlanner({
      listActiveTopics:
        dependencies.listActiveTopics ??
        (
          async () => {
            const topics =
              await listActiveTaxonomyTopics(
                requiredDatabase(
                  dependencies
                )
              );

            return topics.map(
              topic => ({
                id:
                  topic.id,

                slug:
                  topic.slug,

                name:
                  topic.name,

                description:
                  topic.description,

                parentTopicId:
                  topic.parentTopicId,

                sortOrder:
                  topic.sortOrder,
              })
            );
          }
        ),
    });

  const discoveryOrchestrator =
    createPosterBrainSourceDiscoveryOrchestrator({
      planner,
      providerExecutor,
      sourceCandidateRepository,
      now,
    });

  const qualificationService =
    createPosterBrainSourceDiscoveryQualificationService({
      discoveryOrchestrator,
      sourceCandidateRepository,
      affinityRepository,
      now,
    });

  const runtimeRepository =
    dependencies.runtimeRepository ??
    createPosterBrainSourceDiscoveryRuntimeRepository(
      repositoryQueryExecutor(
        requiredDatabase(
          dependencies
        )
      )
    );

  return {
    providerKeys: [
      ...providerExecutor
        .providerKeys,
    ],

    runtimeService:
      createPosterBrainSourceDiscoveryRuntimeService({
        repository:
          runtimeRepository,

        qualificationService,
        now,
      }),
  };
}