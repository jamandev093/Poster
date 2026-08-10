import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiLearningDatasetRepository,
  createAdvertisingAiLearningDatasetService,
  type AdvertisingAiLearningDatasetDatabase,
} from "../src/application/advertising-ai/index.js";

class CapturingDatabase
  implements AdvertisingAiLearningDatasetDatabase {
  readonly calls:
    {
      readonly text:
        string;

      readonly values:
        readonly unknown[];
    }[] =
    [];

  constructor(
    private readonly responses:
      readonly (
        readonly Record<
          string,
          unknown
        >[]
      )[]
  ) {}

  async query<TRow>(
    text:
      string,

    values:
      readonly unknown[] =
      []
  ):
    Promise<{
      readonly rows:
        readonly TRow[];
    }> {
    this.calls.push({
      text,
      values,
    });

    const rows =
      this.responses[
        this.calls.length -
        1
      ] ??
      [];

    return {
      rows:
        rows as
        readonly TRow[],
    };
  }
}

describe(
  "Advertising AI learning dataset",
  () => {

    it(
      "counts only trusted validated monetization events before the frozen cutoff",
      async () => {
        const database =
          new CapturingDatabase([
            [
              {
                total_event_count:
                  "12000",

                impression_event_count:
                  "11000",

                click_event_count:
                  "900",

                conversion_event_count:
                  "100",

                first_event_at:
                  new Date(
                    "2026-08-01T00:00:00.000Z"
                  ),

                last_event_at:
                  new Date(
                    "2026-08-10T12:00:00.000Z"
                  ),
              },
            ],
          ]);

        const repository =
          createAdvertisingAiLearningDatasetRepository(
            database
          );

        const result =
          await repository
            .readEventCounts(
              "2026-08-10T15:00:00.000Z"
            );

        expect(
          result
        ).toEqual({
          totalEventCount:
            12000,

          impressionEventCount:
            11000,

          clickEventCount:
            900,

          conversionEventCount:
            100,

          positiveEventCount:
            1000,

          firstEventAt:
            "2026-08-01T00:00:00.000Z",

          lastEventAt:
            "2026-08-10T12:00:00.000Z",

          sourceCutoffAt:
            "2026-08-10T15:00:00.000Z",
        });

        const sql =
          database.calls[0]!
            .text;

        expect(
          sql
        ).toContain(
          "app.monetization_campaign_events"
        );

        expect(
          sql
        ).toContain(
          "app.monetization_campaign_event_validations"
        );

        expect(
          sql
        ).toContain(
          "validation.validation_status"
        );

        expect(
          sql
        ).toContain(
          "'valid'"
        );

        expect(
          sql
        ).toContain(
          "validation.validated_at <="
        );

        expect(
          sql
        ).not.toContain(
          "mobile_user_content_events"
        );

        expect(
          sql
        ).not.toContain(
          "mobile_ad_interactions"
        );
      }
    );

    it(
      "returns a privacy-safe bounded advertising dataset page",
      async () => {
        const database =
          new CapturingDatabase([
            [
              {
                id:
                  "00000000-0000-4000-8000-000000000103",

                campaign_id:
                  "00000000-0000-4000-8000-000000000201",

                event_type:
                  "click",

                placement:
                  "home",

                occurred_at:
                  new Date(
                    "2026-08-10T14:03:00.000Z"
                  ),
              },

              {
                id:
                  "00000000-0000-4000-8000-000000000102",

                campaign_id:
                  "00000000-0000-4000-8000-000000000201",

                event_type:
                  "impression",

                placement:
                  "home",

                occurred_at:
                  new Date(
                    "2026-08-10T14:02:00.000Z"
                  ),
              },

              {
                id:
                  "00000000-0000-4000-8000-000000000101",

                campaign_id:
                  "00000000-0000-4000-8000-000000000201",

                event_type:
                  "impression",

                placement:
                  "home",

                occurred_at:
                  new Date(
                    "2026-08-10T14:01:00.000Z"
                  ),
              },
            ],
          ]);

        const repository =
          createAdvertisingAiLearningDatasetRepository(
            database
          );

        const page =
          await repository
            .listEvents({
              sourceCutoffAt:
                "2026-08-10T15:00:00.000Z",

              limit:
                2,
            });

        expect(
          page.events
        ).toEqual([
          {
            eventKey:
              "advertising:00000000-0000-4000-8000-000000000103",

            sourceEventId:
              "00000000-0000-4000-8000-000000000103",

            campaignId:
              "00000000-0000-4000-8000-000000000201",

            eventType:
              "click",

            placement:
              "home",

            occurredAt:
              "2026-08-10T14:03:00.000Z",
          },

          {
            eventKey:
              "advertising:00000000-0000-4000-8000-000000000102",

            sourceEventId:
              "00000000-0000-4000-8000-000000000102",

            campaignId:
              "00000000-0000-4000-8000-000000000201",

            eventType:
              "impression",

            placement:
              "home",

            occurredAt:
              "2026-08-10T14:02:00.000Z",
          },
        ]);

        expect(
          page.nextCursor
        ).toBe(
          "2026-08-10T14:02:00.000Z|00000000-0000-4000-8000-000000000102"
        );

        const sql =
          database.calls[0]!
            .text;

        /*
         * These privacy-sensitive/raw fields must never enter
         * the Advertising AI learning dataset projection.
         */
        expect(
          sql
        ).not.toContain(
          "user_key_hash"
        );

        expect(
          sql
        ).not.toContain(
          "session_key_hash"
        );

        expect(
          sql
        ).not.toContain(
          "request_key_hash"
        );

        expect(
          sql
        ).not.toContain(
          "metadata"
        );

        expect(
          sql
        ).not.toContain(
          "destination_host"
        );

        expect(
          sql
        ).not.toContain(
          "event.event_key"
        );
      }
    );

    it(
      "requires both enough trusted events and enough real positive advertising response",
      async () => {
        const repository = {
          async readEventCounts() {
            return {
              totalEventCount:
                10000,

              impressionEventCount:
                9950,

              clickEventCount:
                40,

              conversionEventCount:
                10,

              positiveEventCount:
                50,

              firstEventAt:
                "2026-08-01T00:00:00.000Z",

              lastEventAt:
                "2026-08-10T00:00:00.000Z",

              sourceCutoffAt:
                "2026-08-10T15:00:00.000Z",
            };
          },

          async listEvents() {
            return {
              events:
                [],

              nextCursor:
                null,

              sourceCutoffAt:
                "2026-08-10T15:00:00.000Z",
            };
          },
        };

        const service =
          createAdvertisingAiLearningDatasetService({
            repository,

            trainingMinEvents:
              10000,

            trainingMinPositiveEvents:
              100,
          });

        const result =
          await service
            .getReadiness(
              "2026-08-10T15:00:00.000Z"
            );

        expect(
          result.status
        ).toBe(
          "collecting"
        );

        expect(
          result.remainingEventCount
        ).toBe(
          0
        );

        expect(
          result.remainingPositiveEventCount
        ).toBe(
          50
        );

        expect(
          result.canBuildTrainingSnapshot
        ).toBe(
          false
        );
      }
    );

    it(
      "becomes ready only from real trusted advertising telemetry",
      async () => {
        const repository = {
          async readEventCounts() {
            return {
              totalEventCount:
                12000,

              impressionEventCount:
                11000,

              clickEventCount:
                900,

              conversionEventCount:
                100,

              positiveEventCount:
                1000,

              firstEventAt:
                "2026-08-01T00:00:00.000Z",

              lastEventAt:
                "2026-08-10T00:00:00.000Z",

              sourceCutoffAt:
                "2026-08-10T15:00:00.000Z",
            };
          },

          async listEvents() {
            return {
              events:
                [],

              nextCursor:
                null,

              sourceCutoffAt:
                "2026-08-10T15:00:00.000Z",
            };
          },
        };

        const service =
          createAdvertisingAiLearningDatasetService({
            repository,
          });

        const result =
          await service
            .getReadiness(
              "2026-08-10T15:00:00.000Z"
            );

        expect(
          result.status
        ).toBe(
          "ready"
        );

        expect(
          result.canBuildTrainingSnapshot
        ).toBe(
          true
        );

        expect(
          result.organicEventsIncluded
        ).toBe(
          false
        );

        expect(
          result.userIdentityIncluded
        ).toBe(
          false
        );

        expect(
          result.financialLedgerIncluded
        ).toBe(
          false
        );
      }
    );

    it(
      "rejects oversized learning pages and malformed cursors",
      async () => {
        const database =
          new CapturingDatabase([]);

        const repository =
          createAdvertisingAiLearningDatasetRepository(
            database
          );

        await expect(
          repository.listEvents({
            sourceCutoffAt:
              "2026-08-10T15:00:00.000Z",

            limit:
              5001,
          })
        ).rejects.toThrow(
          "learning page limit"
        );

        await expect(
          repository.listEvents({
            sourceCutoffAt:
              "2026-08-10T15:00:00.000Z",

            cursor:
              "broken",
          })
        ).rejects.toThrow(
          "learning cursor"
        );
      }
    );
  }
);