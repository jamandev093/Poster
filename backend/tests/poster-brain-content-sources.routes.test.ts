import type {
  FastifyInstance,
  FastifyRequest,
} from "fastify";

import Fastify from "fastify";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  posterBrainContentSourcesRoutes,
  type PosterBrainContentSourceIngestionRunInput,
  type PosterBrainContentSourcesListInput,
  type PosterBrainContentSourcesRouteService,
} from "../src/routes/poster-brain-content-sources.routes.js";

const AUTHORIZATION_CONTEXT = {
  userId:
    "00000000-0000-4000-8000-000000000111",
  sessionId:
    "session-0001",
  platformRoles:
    [
      "admin",
    ],
  organizationMemberships:
    [],
};

class RecordingContentSourcesService
  implements PosterBrainContentSourcesRouteService {
  readonly listCalls:
    PosterBrainContentSourcesListInput[] =
    [];

  readonly runCalls:
    PosterBrainContentSourceIngestionRunInput[] =
    [];

  async listSources(
    input: PosterBrainContentSourcesListInput
  ) {
    this.listCalls.push(
      input
    );

    return {
      generatedAt:
        "2026-08-09T00:45:00.000Z",
      totalSources:
        1,
      sources: [
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
            90,
          lastFetchedAt:
            "2026-08-09T00:00:00.000Z",
          nextAllowedAt:
            "2026-08-09T01:00:00.000Z",
        },
      ],
    };
  }

  async requestIngestionRun(
    input: PosterBrainContentSourceIngestionRunInput
  ) {
    this.runCalls.push(
      input
    );

    return {
      runId:
        "run-0001",
      status:
        "accepted" as const,
      requestedAt:
        "2026-08-09T00:45:00.000Z",
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

async function createRouteApp(input: {
  readonly authenticated: boolean;
  readonly service: PosterBrainContentSourcesRouteService;
}): Promise<FastifyInstance> {
  const app =
    Fastify({
      logger:
        false,
    });

  if (input.authenticated) {
    app.addHook(
      "preHandler",
      async (
        request: FastifyRequest
      ) => {
        (
          request as unknown as {
            authorizationContext: typeof AUTHORIZATION_CONTEXT;
          }
        ).authorizationContext =
          AUTHORIZATION_CONTEXT;
      }
    );
  }

  await app.register(
    posterBrainContentSourcesRoutes,
    {
      prefix:
        "/api/v1/poster-brain",
      service:
        input.service,
    }
  );

  return app;
}

describe("Poster Brain content sources routes", () => {
  let app:
    FastifyInstance | null =
    null;

  afterEach(
    async () => {
      if (app) {
        await app.close();
        app = null;
      }
    }
  );

  it("lists content sources with authenticated query contract", async () => {
    const service =
      new RecordingContentSourcesService();

    app =
      await createRouteApp({
        authenticated:
          true,
        service,
      });

    const response =
      await app.inject({
        method:
          "GET",
        url:
          "/api/v1/poster-brain/sources?status=active&search=ai&limit=25",
      });

    expect(
      response.statusCode
    ).toBe(
      200
    );

    expect(
      service.listCalls
    ).toEqual([
      {
        actorUserId:
          "00000000-0000-4000-8000-000000000111",
        status:
          "active",
        search:
          "ai",
        limit:
          25,
      },
    ]);

    expect(
      response.json()
    ).toMatchObject({
      query: {
        status:
          "active",
        search:
          "ai",
        limit:
          25,
      },
      totalSources:
        1,
      sources: [
        {
          sourceKey:
            "publisher_ai_daily",
          status:
            "active",
          health:
            "healthy",
        },
      ],
    });
  });

  it("defaults source list query safely", async () => {
    const service =
      new RecordingContentSourcesService();

    app =
      await createRouteApp({
        authenticated:
          true,
        service,
      });

    const response =
      await app.inject({
        method:
          "GET",
        url:
          "/api/v1/poster-brain/sources",
      });

    expect(
      response.statusCode
    ).toBe(
      200
    );

    expect(
      service.listCalls[0]
    ).toEqual({
      actorUserId:
        "00000000-0000-4000-8000-000000000111",
      limit:
        50,
    });
  });

  it("accepts ingestion run requests with source keys", async () => {
    const service =
      new RecordingContentSourcesService();

    app =
      await createRouteApp({
        authenticated:
          true,
        service,
      });

    const response =
      await app.inject({
        method:
          "POST",
        url:
          "/api/v1/poster-brain/sources/ingestion-runs",
        payload: {
          sourceKeys: [
            "publisher_ai_daily",
            "publisher_policy_weekly",
          ],
          maxSources:
            10,
          force:
            true,
        },
      });

    expect(
      response.statusCode
    ).toBe(
      202
    );

    expect(
      service.runCalls
    ).toEqual([
      {
        actorUserId:
          "00000000-0000-4000-8000-000000000111",
        sourceKeys: [
          "publisher_ai_daily",
          "publisher_policy_weekly",
        ],
        maxSources:
          10,
        force:
          true,
      },
    ]);

    expect(
      response.json()
    ).toMatchObject({
      run: {
        runId:
          "run-0001",
        status:
          "accepted",
        summary: {
          plannedSources:
            2,
        },
      },
    });
  });

  it("rejects unauthenticated source API requests", async () => {
    const service =
      new RecordingContentSourcesService();

    app =
      await createRouteApp({
        authenticated:
          false,
        service,
      });

    const response =
      await app.inject({
        method:
          "GET",
        url:
          "/api/v1/poster-brain/sources",
      });

    expect(
      response.statusCode
    ).toBe(
      401
    );

    expect(
      service.listCalls
    ).toHaveLength(
      0
    );
  });

  it("rejects invalid source route inputs before service execution", async () => {
    const service =
      new RecordingContentSourcesService();

    app =
      await createRouteApp({
        authenticated:
          true,
        service,
      });

    const response =
      await app.inject({
        method:
          "POST",
        url:
          "/api/v1/poster-brain/sources/ingestion-runs",
        payload: {
          sourceKeys:
            [],
          maxSources:
            500,
        },
      });

    expect(
      response.statusCode
    ).toBe(
      400
    );

    expect(
      service.runCalls
    ).toHaveLength(
      0
    );
  });
});