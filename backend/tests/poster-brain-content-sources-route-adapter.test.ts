import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainContentSourcesRouteAdapterService,
  type PosterBrainContentSourceIngestionRunExecutor,
  type PosterBrainContentSourceIngestionRunExecutorInput,
  type PosterBrainContentSourceRegistryRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainContentSourcesListInput,
} from "../src/routes/poster-brain-content-sources.routes.js";

class RecordingSourceRegistryRepository
  implements PosterBrainContentSourceRegistryRepository {
  readonly calls:
    PosterBrainContentSourcesListInput[] =
    [];

  async listSources(
    input: PosterBrainContentSourcesListInput
  ) {
    this.calls.push(
      input
    );

    return [
      {
        sourceKey:
          "publisher_ai_daily",
        displayName:
          "Publisher AI Daily",
        feedUrl:
          "https://publisher.example.com/rss.xml",
        status:
          "active" as const,
        health:
          "healthy" as const,
        priority:
          92.3,
        lastFetchedAt:
          new Date(
            "2026-08-09T00:00:00.000Z"
          ),
        nextAllowedAt:
          "2026-08-09T01:00:00.000Z",
      },
      {
        sourceKey:
          "publisher_policy_weekly",
        displayName:
          "Publisher Policy Weekly",
        feedUrl:
          "https://policy.example.com/feed",
        status:
          "paused" as const,
        health:
          null,
        priority:
          150,
        lastFetchedAt:
          "not-a-date",
        nextAllowedAt:
          null,
      },
    ];
  }
}

class RecordingIngestionRunExecutor
  implements PosterBrainContentSourceIngestionRunExecutor {
  readonly calls:
    PosterBrainContentSourceIngestionRunExecutorInput[] =
    [];

  async requestRun(
    input: PosterBrainContentSourceIngestionRunExecutorInput
  ) {
    this.calls.push(
      input
    );

    return {
      runId:
        "run-0001",
      status:
        "accepted" as const,
      requestedAt:
        input.requestedAt,
      summary: {
        plannedSources:
          input.sourceKeys?.length ?? input.maxSources,
        attemptedSources:
          0,
        succeededSources:
          0,
        failedSources:
          0,
        persistedItems:
          0,
      },
    };
  }
}

describe("Poster Brain content sources route adapter", () => {
  it("maps registry source rows into route DTOs", async () => {
    const repository =
      new RecordingSourceRegistryRepository();

    const executor =
      new RecordingIngestionRunExecutor();

    const service =
      createPosterBrainContentSourcesRouteAdapterService({
        sourceRegistryRepository:
          repository,
        ingestionRunExecutor:
          executor,
        now:
          () => "2026-08-09T00:50:00.000Z",
      });

    const result =
      await service.listSources({
        actorUserId:
          "user-0001",
        status:
          "active",
        search:
          "ai",
        limit:
          20,
      });

    expect(
      repository.calls
    ).toEqual([
      {
        actorUserId:
          "user-0001",
        status:
          "active",
        search:
          "ai",
        limit:
          20,
      },
    ]);

    expect(
      result
    ).toEqual({
      generatedAt:
        "2026-08-09T00:50:00.000Z",
      totalSources:
        2,
      sources: [
        {
          sourceKey:
            "publisher_ai_daily",
          displayName:
            "Publisher AI Daily",
          feedUrl:
            "https://publisher.example.com/rss.xml",
          status:
            "active",
          health:
            "healthy",
          priority:
            92,
          lastFetchedAt:
            "2026-08-09T00:00:00.000Z",
          nextAllowedAt:
            "2026-08-09T01:00:00.000Z",
        },
        {
          sourceKey:
            "publisher_policy_weekly",
          displayName:
            "Publisher Policy Weekly",
          feedUrl:
            "https://policy.example.com/feed",
          status:
            "paused",
          health:
            "unknown",
          priority:
            100,
          lastFetchedAt:
            null,
          nextAllowedAt:
            null,
        },
      ],
    });
  });

  it("requests ingestion runs with source keys and requested timestamp", async () => {
    const executor =
      new RecordingIngestionRunExecutor();

    const service =
      createPosterBrainContentSourcesRouteAdapterService({
        sourceRegistryRepository:
          new RecordingSourceRegistryRepository(),
        ingestionRunExecutor:
          executor,
        now:
          () => "2026-08-09T00:55:00.000Z",
      });

    const result =
      await service.requestIngestionRun({
        actorUserId:
          "admin-0001",
        sourceKeys: [
          "publisher_ai_daily",
          "publisher_policy_weekly",
        ],
        maxSources:
          10,
        force:
          true,
      });

    expect(
      executor.calls
    ).toEqual([
      {
        actorUserId:
          "admin-0001",
        sourceKeys: [
          "publisher_ai_daily",
          "publisher_policy_weekly",
        ],
        maxSources:
          10,
        force:
          true,
        requestedAt:
          "2026-08-09T00:55:00.000Z",
      },
    ]);

    expect(
      result
    ).toMatchObject({
      runId:
        "run-0001",
      status:
        "accepted",
      requestedAt:
        "2026-08-09T00:55:00.000Z",
      summary: {
        plannedSources:
          2,
      },
    });
  });

  it("omits optional sourceKeys for broad ingestion runs", async () => {
    const executor =
      new RecordingIngestionRunExecutor();

    const service =
      createPosterBrainContentSourcesRouteAdapterService({
        sourceRegistryRepository:
          new RecordingSourceRegistryRepository(),
        ingestionRunExecutor:
          executor,
        now:
          () => "2026-08-09T01:00:00.000Z",
      });

    await service.requestIngestionRun({
      actorUserId:
        "admin-0001",
      maxSources:
        5,
      force:
        false,
    });

    expect(
      executor.calls
    ).toEqual([
      {
        actorUserId:
          "admin-0001",
        maxSources:
          5,
        force:
          false,
        requestedAt:
          "2026-08-09T01:00:00.000Z",
      },
    ]);
  });

  it("keeps list and ingestion dependencies isolated", async () => {
    const repository =
      new RecordingSourceRegistryRepository();

    const executor =
      new RecordingIngestionRunExecutor();

    const service =
      createPosterBrainContentSourcesRouteAdapterService({
        sourceRegistryRepository:
          repository,
        ingestionRunExecutor:
          executor,
        now:
          () => "2026-08-09T01:05:00.000Z",
      });

    await service.listSources({
      actorUserId:
        "user-0001",
      limit:
        50,
    });

    expect(
      executor.calls
    ).toHaveLength(
      0
    );
  });
});