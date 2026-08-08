import type {
  FastifyInstance,
} from "fastify";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/authorization.types.js";

import type {
  PosterBrainRankedFeedRouteService,
  PosterBrainRankedFeedRouteServiceInput,
} from "../src/routes/poster-brain-ranked-feed.routes.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000111";

const AUTHORIZED_CONTEXT = {
  userId:
    USER_ID,
  sessionId:
    "00000000-0000-4000-8000-000000000222",
  email:
    "reader@getpostar.com",
  fullName:
    "Poster Reader",
  accountStatus:
    "active",
  platformRoles:
    [],
  platformPermissions:
    [],
  organizationMemberships:
    [],
} as unknown as AuthorizationContext;

function createAuthorizationContextService(
  context: AuthorizationContext
): AuthorizationContextService {
  return {
    resolve:
      vi
        .fn<AuthorizationContextService["resolve"]>()
        .mockResolvedValue(
          context
        ),
  };
}

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
        "2026-08-09T00:00:00.000Z",
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
            0.92,
          publishedAt:
            "2026-08-08T23:00:00.000Z",
          metadata: {
            source:
              "poster_brain_app_test",
          },
        },
      ],
    };
  }
}

describe("Poster Brain ranked feed app wiring", () => {
  let app:
    FastifyInstance |
    null =
    null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("registers the Poster Brain ranked feed route in buildApp", async () => {
    const service =
      new RecordingRankedFeedService();

    app =
      await buildApp({
        authorizationContextService:
          createAuthorizationContextService(
            AUTHORIZED_CONTEXT
          ),

        posterBrainRankedFeedService:
          service,
      });

    const response =
      await app.inject({
        method:
          "GET",
        url:
          "/api/v1/poster-brain/ranked-feed?surface=home&limit=5",
        headers: {
          authorization:
            "Bearer valid.mobile",
        },
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
          USER_ID,
        surface:
          "home",
        limit:
          5,
      },
    ]);

    expect(
      response.json()
    ).toMatchObject({
      surface:
        "home",
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
            0.92,
        },
      ],
    });
  });

  it("rejects unauthenticated app-level ranked feed requests", async () => {
    const service =
      new RecordingRankedFeedService();

    app =
      await buildApp({
        authorizationContextService:
          createAuthorizationContextService(
            AUTHORIZED_CONTEXT
          ),

        posterBrainRankedFeedService:
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
});