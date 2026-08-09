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

const AD_SLOT_ID =
  "00000000-0000-4000-8000-000000000401";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000000501";

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

function createAuthorizationContextService(
  authorizationContext:
    AuthorizationContext |
    null =
    AUTHORIZATION_CONTEXT
): AuthorizationContextService {
  return {
    resolve:
      vi.fn(
        async () =>
          authorizationContext
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

    recordOrganicContentEvent:
      vi.fn(
        async () => ({
          success:
            true as const,

          duplicate:
            false,

          eventId:
            "organic-content-event-1",
        })
      ),
  };
}

describe(
  "Mobile engagement routes",
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
      "records authenticated Mobile share events",
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

              shareTarget:
                "system_share_sheet",

              activityType:
                "copy",

              metadata: {
                surface:
                  "home",
              },
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
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
            "system_share_sheet",

          activityType:
            "copy",

          metadata: {
            surface:
              "home",
          },
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

    it(
      "records authenticated Mobile report events",
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
              "/api/v1/mobile/actions/report",

            headers: {
              authorization:
                "Bearer valid.mobile",
            },

            payload: {
              contentId:
                CONTENT_ID,

              reasonId:
                "Misleading",

              details:
                "This needs moderator review.",

              reportContext: {
                surface:
                  "trending",
              },
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mobileEngagementService
            .recordReportEvent
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          contentId:
            CONTENT_ID,

          reasonId:
            "misleading",

          details:
            "This needs moderator review.",

          reportContext: {
            surface:
              "trending",
          },
        });

        expect(
          response.json()
        ).toEqual({
          success:
            true as const,

          duplicate:
            false,

          reportId:
            "report-event-1",
        });
      }
    );

    it(
      "records authenticated Mobile ad interactions",
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
              "/api/v1/mobile/ads/interactions",

            headers: {
              authorization:
                "Bearer valid.mobile",
            },

            payload: {
              eventType:
                "impression",

              placement:
                "home-feed-after-3",

              adSlotId:
                AD_SLOT_ID,

              campaignId:
                CAMPAIGN_ID,

              contentId:
                CONTENT_ID,

              deduplicationKey:
                "home-feed-after-3:impression:001",

              occurredAt:
                "2026-08-07T17:30:00.000Z",

              metadata: {
                surface:
                  "home",
              },
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mobileEngagementService
            .recordAdInteraction
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          eventType:
            "impression",

          placement:
            "home-feed-after-3",

          adSlotId:
            AD_SLOT_ID,

          campaignId:
            CAMPAIGN_ID,

          creativeId:
            null,

          contentId:
            CONTENT_ID,

          deduplicationKey:
            "home-feed-after-3:impression:001",

          occurredAt:
            "2026-08-07T17:30:00.000Z",

          metadata: {
            surface:
              "home",
          },
        });

        expect(
          response.json()
        ).toEqual({
          success:
            true as const,

          duplicate:
            false,

          interactionId:
            "ad-interaction-1",
        });
      }
    );

    it(
      "rejects invalid Mobile engagement payloads before service calls",
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
              "/api/v1/mobile/ads/interactions",

            headers: {
              authorization:
                "Bearer valid.mobile",
            },

            payload: {
              eventType:
                "conversion",

              placement:
                "home",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          mobileEngagementService
            .recordAdInteraction
        ).not.toHaveBeenCalled();
      }
    );
  }
);
