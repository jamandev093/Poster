import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiLearningSnapshotRepository,
  type AdvertisingAiLearningSnapshotDatabase,
} from "../src/application/advertising-ai/index.js";

class RecordingDatabase
  implements AdvertisingAiLearningSnapshotDatabase {
  readonly calls:
    {
      readonly text:
        string;

      readonly values:
        readonly unknown[] |
        undefined;
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

  async query<Row>(
    text:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<{
      readonly rows:
        readonly Row[];
    }> {
    this.calls.push({
      text,
      values,
    });

    return {
      rows:
        (
          this.responses[
            this.calls.length -
            1
          ] ??
          []
        ) as
          readonly Row[],
    };
  }
}

const SNAPSHOT = {
  id:
    "00000000-0000-4000-8000-000000000301",

  schema_version:
    1,

  status:
    "building",

  source_event_count:
    "10000",

  materialized_event_count:
    "0",

  source_cutoff_at:
    new Date(
      "2026-08-10T15:00:00.000Z"
    ),

  first_event_at:
    null,

  last_event_at:
    null,

  dataset_checksum:
    null,

  created_at:
    new Date(
      "2026-08-10T15:00:01.000Z"
    ),

  completed_at:
    null,

  failed_at:
    null,

  failure_code:
    null,
};

describe(
  "Advertising AI learning snapshot repository",
  () => {

    it(
      "creates a Backend-owned building snapshot manifest",
      async () => {
        const database =
          new RecordingDatabase([
            [
              SNAPSHOT,
            ],
          ]);

        const repository =
          createAdvertisingAiLearningSnapshotRepository(
            database
          );

        const result =
          await repository
            .createSnapshot({
              sourceEventCount:
                10000,

              sourceCutoffAt:
                "2026-08-10T15:00:00.000Z",
            });

        expect(
          result
        ).toMatchObject({
          status:
            "building",

          sourceEventCount:
            10000,

          materializedEventCount:
            0,
        });

        expect(
          database.calls[0]
            ?.text
        ).toContain(
          "app.advertising_ai_learning_datasets"
        );
      }
    );

    it(
      "bulk-appends only the frozen privacy-safe event contract",
      async () => {
        const database =
          new RecordingDatabase([
            [
              {
                inserted_count:
                  "2",
              },
            ],
          ]);

        const repository =
          createAdvertisingAiLearningSnapshotRepository(
            database
          );

        const inserted =
          await repository
            .appendEvents({
              datasetId:
                "00000000-0000-4000-8000-000000000301",

              events: [
                {
                  eventKey:
                    "advertising:00000000-0000-4000-8000-000000000401",

                  sourceEventId:
                    "00000000-0000-4000-8000-000000000401",

                  campaignId:
                    "00000000-0000-4000-8000-000000000501",

                  eventType:
                    "impression",

                  placement:
                    "home",

                  occurredAt:
                    "2026-08-10T14:00:00.000Z",
                },

                {
                  eventKey:
                    "advertising:00000000-0000-4000-8000-000000000402",

                  sourceEventId:
                    "00000000-0000-4000-8000-000000000402",

                  campaignId:
                    "00000000-0000-4000-8000-000000000501",

                  eventType:
                    "click",

                  placement:
                    "home",

                  occurredAt:
                    "2026-08-10T14:01:00.000Z",
                },
              ],
            });

        expect(
          inserted
        ).toBe(
          2
        );

        const payload =
          String(
            database.calls[0]
              ?.values?.[1]
          );

        expect(
          payload
        ).not.toContain(
          "user"
        );

        expect(
          payload
        ).not.toContain(
          "session"
        );

        expect(
          payload
        ).not.toContain(
          "metadata"
        );
      }
    );

    it(
      "reads ready snapshots and frozen events only",
      async () => {
        const ready = {
          ...SNAPSHOT,

          status:
            "ready",

          materialized_event_count:
            "10000",

          first_event_at:
            new Date(
              "2026-08-01T00:00:00.000Z"
            ),

          last_event_at:
            new Date(
              "2026-08-10T14:00:00.000Z"
            ),

          dataset_checksum:
            "sha256:abc123abc123abc123",

          completed_at:
            new Date(
              "2026-08-10T15:01:00.000Z"
            ),
        };

        const database =
          new RecordingDatabase([
            [
              ready,
            ],

            [
              {
                event_key:
                  "advertising:event-2",

                source_event_id:
                  "00000000-0000-4000-8000-000000000402",

                campaign_id:
                  "00000000-0000-4000-8000-000000000501",

                event_type:
                  "click",

                placement:
                  "home",

                occurred_at:
                  new Date(
                    "2026-08-10T14:01:00.000Z"
                  ),
              },

              {
                event_key:
                  "advertising:event-1",

                source_event_id:
                  "00000000-0000-4000-8000-000000000401",

                campaign_id:
                  "00000000-0000-4000-8000-000000000501",

                event_type:
                  "impression",

                placement:
                  "home",

                occurred_at:
                  new Date(
                    "2026-08-10T14:00:00.000Z"
                  ),
              },
            ],
          ]);

        const repository =
          createAdvertisingAiLearningSnapshotRepository(
            database
          );

        const snapshot =
          await repository
            .getReadySnapshot(
              ready.id
            );

        expect(
          snapshot?.status
        ).toBe(
          "ready"
        );

        const page =
          await repository
            .listFrozenEvents({
              datasetId:
                ready.id,

              limit:
                2,
            });

        expect(
          page.events
        ).toHaveLength(
          2
        );

        expect(
          database.calls[1]
            ?.text
        ).toContain(
          "dataset.status"
        );

        expect(
          database.calls[1]
            ?.text
        ).toContain(
          "'ready'"
        );
      }
    );
  }
);