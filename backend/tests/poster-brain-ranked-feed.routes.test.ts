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
  posterBrainRankedFeedRoutes,
  type PosterBrainRankedFeedRouteService,
  type PosterBrainRankedFeedRouteServiceInput,
} from "../src/routes/poster-brain-ranked-feed.routes.js";

const AUTHORIZATION_CONTEXT = {
  userId:
    "00000000-0000-4000-8000-000000000111",
  sessionId:
    "session-0001",
  platformRoles:
    [],
  organizationMemberships:
    [],
};

class RecordingRankedFeedService
  implements PosterBrainRankedFeedRouteService {
  readonly calls:
    PosterBrainRankedFeedRouteServiceInput[] =
    [];

  async readRankedFeed(
    input: PosterBrainRankedFeedRouteServiceInput
  ) {
    this.calls.push(
      input
    );

    return {
      generatedAt:
        "2026-08-08T12:00:00.000Z",
      totalItems:
        1,
      items: [
        {
          id:
            "content-0001",
          title:
            "AI policy update",
          originalUrl:
            "https://publisher.example.com/ai-policy",
          publisherName:
            "Publisher Example",
          score:
            0.91,
          publishedAt:
            "2026-08-08T11:00:00.000Z",
          metadata: {
            source:
              "poster_brain_test",
          },
        },
      ],
    };
  }
}

async function createRouteApp(input: {
  readonly authenticated: boolean;
  readonly service: PosterBrainRankedFeedRouteService;
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
    posterBrainRankedFeedRoutes,
    {
      prefix:
        "/api/v1/poster-brain",
      service:
        input.service,
    }
  );

  return app;
}

describe("Poster Brain ranked feed routes", () => {
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

  it("serves authenticated ranked feed with route query contract", async () => {
    const service =
      new RecordingRankedFeedService();

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
          "/api/v1/poster-brain/ranked-feed?surface=search&searchQuery=machine%20learning&languageCode=en&regionCode=IN&category=technology&limit=12&candidatePoolLimit=80",
      });

    expect(
      response.statusCode
    ).toBe(
      200
    );

    expect(
      service.calls
    ).toEqual([
      {
        actorUserId:
          "00000000-0000-4000-8000-000000000111",
        surface:
          "search",
        searchQuery:
          "machine learning",
        languageCode:
          "en",
        regionCode:
          "IN",
        category:
          "technology",
        limit:
          12,
        candidatePoolLimit:
          80,
      },
    ]);

    expect(
      response.json()
    ).toMatchObject({
      surface:
        "search",
      query: {
        searchQuery:
          "machine learning",
        languageCode:
          "en",
        regionCode:
          "IN",
        category:
          "technology",
        limit:
          12,
        candidatePoolLimit:
          80,
      },
      generatedAt:
        "2026-08-08T12:00:00.000Z",
      totalItems:
        1,
      items: [
        {
          id:
            "content-0001",
          title:
            "AI policy update",
          publisherName:
            "Publisher Example",
          score:
            0.91,
        },
      ],
    });
  });

  it("defaults to home ranked feed with safe limits", async () => {
    const service =
      new RecordingRankedFeedService();

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
          "/api/v1/poster-brain/ranked-feed",
      });

    expect(
      response.statusCode
    ).toBe(
      200
    );

    expect(
      service.calls[0]
    ).toEqual({
      actorUserId:
        "00000000-0000-4000-8000-000000000111",
      surface:
        "home",
      limit:
        20,
    });

    expect(
      response.json()
    ).toMatchObject({
      surface:
        "home",
      query: {
        searchQuery:
          null,
        languageCode:
          null,
        regionCode:
          null,
        category:
          null,
        limit:
          20,
        candidatePoolLimit:
          null,
      },
    });
  });

  it("rejects unauthenticated ranked feed requests", async () => {
    const service =
      new RecordingRankedFeedService();

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
          "/api/v1/poster-brain/ranked-feed",
      });

    expect(
      response.statusCode
    ).toBe(
      401
    );
    expect(
      service.calls
    ).toHaveLength(
      0
    );
  });

  it("rejects invalid ranked feed query params before service execution", async () => {
    const service =
      new RecordingRankedFeedService();

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
          "/api/v1/poster-brain/ranked-feed?surface=unknown&limit=500",
      });

    expect(
      response.statusCode
    ).toBe(
      400
    );
    expect(
      service.calls
    ).toHaveLength(
      0
    );
  });
});