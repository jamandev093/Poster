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
  MobileEngagementService,
} from "../src/application/mobile-engagement/index.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000201";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000301";

const AUTHORIZATION_CONTEXT =
  {
    userId:
      USER_ID,

    sessionId:
      SESSION_ID,

    email:
      "reader@example.com",

    fullName:
      "Poster Reader",

    accountStatus:
      "active",

    platformRoles:
      [],
  } as unknown as AuthorizationContext;

function createAuthorizationContextService():
  AuthorizationContextService {
  return {
    resolve:
      vi.fn(
        async () =>
          AUTHORIZATION_CONTEXT
      ),
  } as unknown as AuthorizationContextService;
}

function createMobileEngagementService():
  MobileEngagementService {
  return {
    recordShareEvent:
      vi.fn(
        async () => ({
          success:
            true as const,

          eventId:
            "share-event-1",
        })
      ),

    recordReportEvent:
      vi.fn(
        async () => ({
          success:
            true as const,

          duplicate:
            false,

          reportId:
            "report-event-1",
        })
      ),

    recordAdInteraction:
      vi.fn(
        async () => ({
          success:
            true as const,

          duplicate:
            false,

          interactionId:
            "ad-interaction-1",
        })
      ),
  };
}

describe(
  "Mobile engagement app wiring",
  () => {
    let app:
      FastifyInstance |
      undefined;

    afterEach(
      async () => {
        await app?.close();

        app =
          undefined;
      }
    );

    it(
      "registers Mobile engagement routes in the main app behind auth context",
      async () => {
        const authorizationContextService =
          createAuthorizationContextService();

        const mobileEngagementService =
          createMobileEngagementService();

        app =
          await buildApp({
            authorizationContextService,

            mobileEngagementService,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/mobile/actions/share",

            headers: {
              authorization:
                "Bearer valid.mobile",
            },

            payload: {
              contentId:
                CONTENT_ID,

              originalUrl:
                "https://publisher.example/story",

              publisher:
                "Example Publisher",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          authorizationContextService.resolve
        ).toHaveBeenCalledWith(
          "valid.mobile"
        );

        expect(
          mobileEngagementService
            .recordShareEvent
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          contentId:
            CONTENT_ID,

          originalUrl:
            "https://publisher.example/story",

          publisher:
            "Example Publisher",

          shareTarget:
            null,

          activityType:
            null,

          metadata:
            {},
        });

        expect(
          response.json()
        ).toEqual({
          success:
            true as const,

          eventId:
            "share-event-1",
        });
      }
    );
  }
);
