import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createMobileEngagementService,
} from "../src/application/mobile-engagement/index.js";

import {
  mobileEngagementRoutes,
} from "../src/routes/mobile-engagement.routes.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/index.js";

import type {
  MobileEngagementRepository,
  RecordMobileAdInteractionInput,
  RecordMobileAdInteractionResult,
  RecordMobileOrganicContentEventInput,
  RecordMobileOrganicContentEventResult,
  RecordMobileReportEventInput,
  RecordMobileReportEventResult,
  RecordMobileShareEventInput,
  RecordMobileShareEventResult,
} from "../src/domains/mobile-engagement/index.js";

import Fastify from "fastify";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000201";

class InMemoryRepository
  implements MobileEngagementRepository {
  readonly organicContentEvents:
    RecordMobileOrganicContentEventInput[] =
    [];

  private readonly dedupe =
    new Set<string>();

  async recordShareEvent(
    input:
      RecordMobileShareEventInput
  ): Promise<RecordMobileShareEventResult> {
    return {
      success:
        true,

      eventId:
        input.contentId,
    };
  }

  async recordReportEvent(
    input:
      RecordMobileReportEventInput
  ): Promise<RecordMobileReportEventResult> {
    return {
      success:
        true,

      duplicate:
        false,

      reportId:
        input.contentId,
    };
  }

  async recordOrganicContentEvent(
    input:
      RecordMobileOrganicContentEventInput
  ): Promise<RecordMobileOrganicContentEventResult> {
    const duplicate =
      input.deduplicationKey
        ? this.dedupe.has(
            input.deduplicationKey
          )
        : false;

    if (input.deduplicationKey) {
      this.dedupe.add(
        input.deduplicationKey
      );
    }

    if (!duplicate) {
      this.organicContentEvents.push(
        input
      );
    }

    return {
      success:
        true,

      duplicate,

      eventId:
        duplicate
          ? null
          : `organic-${this.organicContentEvents.length}`,
    };
  }

  async recordAdInteraction(
    input:
      RecordMobileAdInteractionInput
  ): Promise<RecordMobileAdInteractionResult> {
    return {
      success:
        true,

      duplicate:
        false,

      interactionId:
        input.contentId ??
        null,
    };
  }
}

describe(
  "Mobile organic content engagement events",
  () => {
    it(
      "records deduplicated organic impression and open-original events",
      async () => {
        const repository =
          new InMemoryRepository();

        const service =
          createMobileEngagementService(
            repository
          );

        await expect(
          service.recordOrganicContentEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            eventType:
              "impression",

            surface:
              "home",

            sourceContext:
              "feed",

            deduplicationKey:
              "home:impression:content:1",

            occurredAt:
              "2026-08-09T14:30:00.000Z",

            metadata: {
              rank:
                1,
            },
          })
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            false,

          eventId:
            "organic-1",
        });

        await expect(
          service.recordOrganicContentEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            eventType:
              "open_original_click",

            surface:
              "home",

            deduplicationKey:
              "home:open:content:1",
          })
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            false,

          eventId:
            "organic-2",
        });

        await expect(
          service.recordOrganicContentEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            eventType:
              "open_original_click",

            surface:
              "home",

            deduplicationKey:
              "home:open:content:1",
          })
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            true,

          eventId:
            null,
        });

        expect(
          repository.organicContentEvents
        ).toHaveLength(
          2
        );
      }
    );

    it(
      "rejects invalid organic event contracts before repository writes",
      async () => {
        const repository =
          new InMemoryRepository();

        const service =
          createMobileEngagementService(
            repository
          );

        await expect(
          service.recordOrganicContentEvent({
            userId:
              "bad-user",

            contentId:
              CONTENT_ID,

            eventType:
              "impression",

            surface:
              "home",
          })
        ).rejects.toThrow(
          "User ID must be a valid UUID."
        );

        await expect(
          service.recordOrganicContentEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            eventType:
              "bad-event" as never,

            surface:
              "home",
          })
        ).rejects.toThrow(
          "Organic content event type is invalid."
        );

        await expect(
          service.recordOrganicContentEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            eventType:
              "impression",

            surface:
              "unknown" as never,
          })
        ).rejects.toThrow(
          "Organic content event surface is invalid."
        );

        expect(
          repository.organicContentEvents
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "exposes authenticated organic content event route",
      async () => {
        const app =
          Fastify();

        const service = {
          recordShareEvent:
            vi.fn(),

          recordReportEvent:
            vi.fn(),

          recordAdInteraction:
            vi.fn(),

          recordOrganicContentEvent:
            vi.fn(
              async () => ({
                success:
                  true as const,

                duplicate:
                  false,

                eventId:
                  "organic-route-1",
              })
            ),
        };

        app.addHook(
          "preHandler",
          async request => {
            request.authorizationContext =
              {
                userId:
                  USER_ID,
              } as AuthorizationContext;
          }
        );

        await app.register(
          mobileEngagementRoutes,
          {
            service,
          }
        );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/actions/content-events",

            payload: {
              contentId:
                CONTENT_ID,

              eventType:
                "open_original_click",

              surface:
                "trending",

              sourceContext:
                "feed",

              deduplicationKey:
                "trending:open:content:1",

              metadata: {
                rank:
                  2,
              },
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          service.recordOrganicContentEvent
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          contentId:
            CONTENT_ID,

          eventType:
            "open_original_click",

          surface:
            "trending",

          sourceContext:
            "feed",

          deduplicationKey:
            "trending:open:content:1",

          occurredAt:
            null,

          metadata: {
            rank:
              2,
          },
        });

        await app.close();
      }
    );
  }
);
