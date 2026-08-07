import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createMobileEngagementService,
} from "../src/application/mobile-engagement/index.js";

import type {
  MobileEngagementRepository,
  RecordMobileAdInteractionInput,
  RecordMobileAdInteractionResult,
  RecordMobileReportEventInput,
  RecordMobileReportEventResult,
  RecordMobileShareEventInput,
  RecordMobileShareEventResult,
} from "../src/domains/mobile-engagement/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000201";

const AD_SLOT_ID =
  "00000000-0000-4000-8000-000000000301";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000000401";

class InMemoryMobileEngagementRepository
  implements MobileEngagementRepository {
  readonly shares:
    RecordMobileShareEventInput[] =
    [];

  readonly reports:
    RecordMobileReportEventInput[] =
    [];

  readonly adInteractions:
    RecordMobileAdInteractionInput[] =
    [];

  private readonly reportKeys =
    new Set<string>();

  private readonly adDeduplicationKeys =
    new Set<string>();

  async recordShareEvent(
    input:
      RecordMobileShareEventInput
  ): Promise<RecordMobileShareEventResult> {
    this.shares.push(
      input
    );

    return {
      success:
        true,

      eventId:
        `share-${this.shares.length}`,
    };
  }

  async recordReportEvent(
    input:
      RecordMobileReportEventInput
  ): Promise<RecordMobileReportEventResult> {
    const key =
      [
        input.userId,
        input.contentId,
        input.reasonId,
      ].join(
        ":"
      );

    const duplicate =
      this.reportKeys.has(
        key
      );

    this.reportKeys.add(
      key
    );

    if (!duplicate) {
      this.reports.push(
        input
      );
    }

    return {
      success:
        true,

      duplicate,

      reportId:
        duplicate
          ? null
          : `report-${this.reports.length}`,
    };
  }

  async recordAdInteraction(
    input:
      RecordMobileAdInteractionInput
  ): Promise<RecordMobileAdInteractionResult> {
    const deduplicationKey =
      input.deduplicationKey ??
      null;

    const duplicate =
      deduplicationKey
        ? this.adDeduplicationKeys.has(
            deduplicationKey
          )
        : false;

    if (
      deduplicationKey
    ) {
      this.adDeduplicationKeys.add(
        deduplicationKey
      );
    }

    if (!duplicate) {
      this.adInteractions.push(
        input
      );
    }

    return {
      success:
        true,

      duplicate,

      interactionId:
        duplicate
          ? null
          : `ad-${this.adInteractions.length}`,
    };
  }
}

function createSubject() {
  const repository =
    new InMemoryMobileEngagementRepository();

  return {
    repository,

    service:
      createMobileEngagementService(
        repository
      ),
  };
}

describe(
  "Mobile engagement service",
  () => {
    it(
      "records share events while preserving original publisher metadata",
      async () => {
        const {
          repository,
          service,
        } =
          createSubject();

        await expect(
          service.recordShareEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            originalUrl:
              "https://publisher.example/story?utm_source=test",

            publisher:
              " Example Publisher ",

            shareTarget:
              " system_share_sheet ",

            activityType:
              " com.apple.UIKit.activity.CopyToPasteboard ",

            metadata: {
              surface:
                "home",
            },
          })
        ).resolves.toEqual({
          success:
            true,

          eventId:
            "share-1",
        });

        expect(
          repository.shares[0]
        ).toMatchObject({
          userId:
            USER_ID,

          contentId:
            CONTENT_ID,

          originalUrl:
            "https://publisher.example/story?utm_source=test",

          publisher:
            "Example Publisher",

          shareTarget:
            "system_share_sheet",

          metadata: {
            surface:
              "home",
          },
        });
      }
    );

    it(
      "deduplicates active report events by user, content, and reason",
      async () => {
        const {
          service,
        } =
          createSubject();

        await expect(
          service.recordReportEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            reasonId:
              "Misleading",

            details:
              "This needs moderator review.",
          })
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            false,

          reportId:
            "report-1",
        });

        await expect(
          service.recordReportEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            reasonId:
              "misleading",
          })
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            true,

          reportId:
            null,
        });
      }
    );

    it(
      "records ad interactions and deduplicates repeated event keys",
      async () => {
        const {
          service,
        } =
          createSubject();

        const input:
          RecordMobileAdInteractionInput = {
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

          deduplicationKey:
            "home-feed-after-3:impression:001",

          occurredAt:
            "2026-08-07T17:30:00.000Z",

          metadata: {
            surface:
              "home",
          },
        };

        await expect(
          service.recordAdInteraction(
            input
          )
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            false,

          interactionId:
            "ad-1",
        });

        await expect(
          service.recordAdInteraction(
            input
          )
        ).resolves.toEqual({
          success:
            true,

          duplicate:
            true,

          interactionId:
            null,
        });
      }
    );

    it(
      "rejects invalid share report and ad contracts before repository writes",
      async () => {
        const {
          repository,
          service,
        } =
          createSubject();

        await expect(
          service.recordShareEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            originalUrl:
              "ftp://publisher.example/story",

            publisher:
              "Publisher",
          })
        ).rejects.toThrow(
          "Original URL must be a valid publisher URL."
        );

        await expect(
          service.recordReportEvent({
            userId:
              USER_ID,

            contentId:
              CONTENT_ID,

            reasonId:
              "bad reason!",
          })
        ).rejects.toThrow(
          "Report reason is invalid."
        );

        await expect(
          service.recordAdInteraction({
            userId:
              USER_ID,

            eventType:
              "conversion" as never,

            placement:
              "home",
          })
        ).rejects.toThrow(
          "Ad interaction event type is invalid."
        );

        expect(
          repository.shares
        ).toHaveLength(
          0
        );

        expect(
          repository.reports
        ).toHaveLength(
          0
        );

        expect(
          repository.adInteractions
        ).toHaveLength(
          0
        );
      }
    );
  }
);
