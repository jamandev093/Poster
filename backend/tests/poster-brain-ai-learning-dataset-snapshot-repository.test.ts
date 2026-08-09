import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPostgreSqlPosterBrainAiLearningDatasetSnapshotRepository,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot.repository.js";

import type {
  PosterBrainAiLearningDatasetSnapshotDatabase,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot.repository.js";

import type {
  PosterBrainAiLearningDatasetEvent,
} from "../src/application/poster-brain/ai-learning-dataset.types.js";

interface RecordedQuery {
  readonly text:
    string;

  readonly values:
    readonly unknown[] |
    undefined;
}

class RecordingDatabase
  implements PosterBrainAiLearningDatasetSnapshotDatabase
{
  readonly calls:
    RecordedQuery[] =
    [];

  private readonly results:
    readonly (readonly unknown[])[];

  private resultIndex =
    0;

  constructor(
    results:
      readonly (readonly unknown[])[]
  ) {
    this.results =
      results;
  }

  async query<Row>(
    text:
      string,
    values?:
      readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }> {
    this.calls.push({
      text,
      values,
    });

    const rows =
      this.results[
        this.resultIndex
      ] ??
      [];

    this.resultIndex +=
      1;

    return {
      rows:
        rows as readonly Row[],
    };
  }
}

function createSnapshotRow(input: {
  readonly status:
    "building" |
    "ready" |
    "failed";

  readonly materializedEventCount?:
    number;

  readonly materializedContentCount?:
    number;

  readonly datasetChecksum?:
    string |
    null;

  readonly failureReason?:
    string |
    null;

  readonly completedAt?:
    string |
    null;
}) {
  return {
    id:
      "11111111-1111-4111-8111-111111111111",

    schemaVersion:
      1,

    status:
      input.status,

    sourceEventCount:
      "12000",

    materializedEventCount:
      input.materializedEventCount ??
      0,

    materializedContentCount:
      input.materializedContentCount ??
      0,

    sourceCutoffAt:
      "2026-08-09T16:00:00.000Z",

    firstEventAt:
      input.status === "ready"
        ? "2026-08-01T00:00:00.000Z"
        : null,

    lastEventAt:
      input.status === "ready"
        ? "2026-08-09T15:59:00.000Z"
        : null,

    datasetChecksum:
      input.datasetChecksum ??
      null,

    failureReason:
      input.failureReason ??
      null,

    createdAt:
      "2026-08-09T16:01:00.000Z",

    completedAt:
      input.completedAt ??
      null,
  };
}

const learningEvents:
  readonly PosterBrainAiLearningDatasetEvent[] =
  [
    {
      schemaVersion:
        1,

      eventKey:
        "organic_content_event:event-1",

      source:
        "organic_content_event",

      sourceEventId:
        "event-1",

      signalType:
        "open_original_click",

      occurredAt:
        "2026-08-09T15:30:00.000Z",

      surface:
        "home",

      reasonId:
        null,

      reportStatus:
        null,

      bookmarkActive:
        null,

      content: {
        contentId:
          "22222222-2222-4222-8222-222222222222",

        sourceKey:
          "example-feed",

        publisherName:
          "Example Publisher",

        title:
          "Example title",

        excerpt:
          "Example excerpt",

        mediaType:
          "article",

        languageCode:
          "en",

        regionCode:
          "IN",

        category:
          "technology",

        canonicalTopicIds:
          [
            "ai",
          ],

        evolvingTopicIds:
          [
            "agents",
          ],

        tags:
          [
            "AI",
          ],

        searchKeywords:
          [
            "artificial intelligence",
          ],

        aiClassification: {
          category:
            "technology",
        },

        qualityScore:
          0.8,

        publishedAt:
          "2026-08-09T14:00:00.000Z",

        contentStatus:
          "active",
      },
    },

    {
      schemaVersion:
        1,

      eventKey:
        "bookmark:bookmark-1",

      source:
        "bookmark",

      sourceEventId:
        "bookmark-1",

      signalType:
        "bookmark",

      occurredAt:
        "2026-08-09T15:20:00.000Z",

      surface:
        null,

      reasonId:
        null,

      reportStatus:
        null,

      bookmarkActive:
        false,

      content: {
        contentId:
          "22222222-2222-4222-8222-222222222222",

        sourceKey:
          "example-feed",

        publisherName:
          "Example Publisher",

        title:
          "Example title",

        excerpt:
          "Example excerpt",

        mediaType:
          "article",

        languageCode:
          "en",

        regionCode:
          "IN",

        category:
          "technology",

        canonicalTopicIds:
          [
            "ai",
          ],

        evolvingTopicIds:
          [
            "agents",
          ],

        tags:
          [
            "AI",
          ],

        searchKeywords:
          [
            "artificial intelligence",
          ],

        aiClassification: {
          category:
            "technology",
        },

        qualityScore:
          0.8,

        publishedAt:
          "2026-08-09T14:00:00.000Z",

        contentStatus:
          "active",
      },
    },
  ];

describe(
  "Poster Brain AI learning dataset snapshot repository",
  () => {
    it(
      "creates a building snapshot with a fixed source cutoff",
      async () => {
        const database =
          new RecordingDatabase([
            [
              createSnapshotRow({
                status:
                  "building",
              }),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotRepository(
            database
          );

        const snapshot =
          await repository.createBuildingSnapshot({
            schemaVersion:
              1,

            sourceEventCount:
              12000,

            sourceCutoffAt:
              "2026-08-09T16:00:00Z",
          });

        expect(
          snapshot.status
        ).toBe(
          "building"
        );

        expect(
          snapshot.sourceEventCount
        ).toBe(
          12000
        );

        expect(
          snapshot.sourceCutoffAt
        ).toBe(
          "2026-08-09T16:00:00.000Z"
        );

        expect(
          database.calls
        ).toHaveLength(
          1
        );

        expect(
          database.calls[0]?.text
        ).toContain(
          "app.poster_brain_ai_learning_datasets"
        );

        expect(
          database.calls[0]?.text
        ).toContain(
          "'building'"
        );

        expect(
          database.calls[0]?.values
        ).toEqual([
          1,
          12000,
          "2026-08-09T16:00:00.000Z",
        ]);
      }
    );

    it(
      "persists privacy-safe frozen content and normalized organic events idempotently",
      async () => {
        const database =
          new RecordingDatabase([
            [
              {
                insertedCount:
                  "1",
              },
            ],

            [
              {
                insertedCount:
                  "2",
              },
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotRepository(
            database
          );

        const result =
          await repository.appendPage({
            datasetId:
              "11111111-1111-4111-8111-111111111111",

            events:
              learningEvents,
          });

        expect(result).toEqual({
          insertedContentCount:
            1,

          insertedEventCount:
            2,
        });

        expect(
          database.calls
        ).toHaveLength(
          2
        );

        const contentSql =
          database.calls[0]?.text ??
          "";

        const eventSql =
          database.calls[1]?.text ??
          "";

        expect(
          contentSql
        ).toContain(
          "app.poster_brain_ai_learning_dataset_contents"
        );

        expect(
          eventSql
        ).toContain(
          "app.poster_brain_ai_learning_dataset_events"
        );

        expect(
          contentSql
        ).toContain(
          "ON CONFLICT"
        );

        expect(
          eventSql
        ).toContain(
          "ON CONFLICT"
        );

        const combinedSql =
          `${contentSql}\n${eventSql}`;

        expect(
          combinedSql
        ).not.toMatch(
          /\buser_id\b/
        );

        expect(
          combinedSql
        ).not.toContain(
          "mobile_ad_interactions"
        );

        const contentPayload =
          JSON.parse(
            String(
              database.calls[0]
                ?.values?.[1]
            )
          ) as readonly Record<
            string,
            unknown
          >[];

        const eventPayload =
          JSON.parse(
            String(
              database.calls[1]
                ?.values?.[1]
            )
          ) as readonly Record<
            string,
            unknown
          >[];

        expect(
          contentPayload
        ).toHaveLength(
          1
        );

        expect(
          eventPayload
        ).toHaveLength(
          2
        );

        expect(
          contentPayload[0]
        ).not.toHaveProperty(
          "userId"
        );

        expect(
          eventPayload[0]
        ).not.toHaveProperty(
          "userId"
        );

        expect(
          eventPayload[0]
        ).not.toHaveProperty(
          "metadata"
        );

        expect(
          eventPayload[0]
        ).not.toHaveProperty(
          "details"
        );

        expect(
          eventPayload[1]
            ?.bookmarkActive
        ).toBe(
          false
        );
      }
    );

    it(
      "marks only a building snapshot ready with deterministic completion metadata",
      async () => {
        const checksum =
          "sha256:dataset-checksum";

        const database =
          new RecordingDatabase([
            [
              createSnapshotRow({
                status:
                  "ready",

                materializedEventCount:
                  12000,

                materializedContentCount:
                  1800,

                datasetChecksum:
                  checksum,

                completedAt:
                  "2026-08-09T16:05:00.000Z",
              }),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotRepository(
            database
          );

        const snapshot =
          await repository.completeSnapshot({
            datasetId:
              "11111111-1111-4111-8111-111111111111",

            materializedEventCount:
              12000,

            materializedContentCount:
              1800,

            firstEventAt:
              "2026-08-01T00:00:00Z",

            lastEventAt:
              "2026-08-09T15:59:00Z",

            datasetChecksum:
              checksum,

            completedAt:
              "2026-08-09T16:05:00Z",
          });

        expect(
          snapshot.status
        ).toBe(
          "ready"
        );

        expect(
          snapshot.datasetChecksum
        ).toBe(
          checksum
        );

        expect(
          snapshot.materializedEventCount
        ).toBe(
          12000
        );

        expect(
          snapshot.materializedContentCount
        ).toBe(
          1800
        );

        const sql =
          database.calls[0]?.text ??
          "";

        expect(
          sql
        ).toContain(
          "status ="
        );

        expect(
          sql
        ).toContain(
          "'ready'"
        );

        expect(
          sql
        ).toContain(
          "AND status ="
        );

        expect(
          sql
        ).toContain(
          "'building'"
        );
      }
    );

    it(
      "records a failed build without converting a non-building snapshot",
      async () => {
        const database =
          new RecordingDatabase([
            [
              createSnapshotRow({
                status:
                  "failed",

                failureReason:
                  "snapshot_page_failure",

                completedAt:
                  "2026-08-09T16:06:00.000Z",
              }),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotRepository(
            database
          );

        const snapshot =
          await repository.failSnapshot({
            datasetId:
              "11111111-1111-4111-8111-111111111111",

            failureReason:
              "snapshot_page_failure",

            completedAt:
              "2026-08-09T16:06:00Z",
          });

        expect(
          snapshot.status
        ).toBe(
          "failed"
        );

        expect(
          snapshot.failureReason
        ).toBe(
          "snapshot_page_failure"
        );

        const sql =
          database.calls[0]?.text ??
          "";

        expect(
          sql
        ).toContain(
          "'failed'"
        );

        expect(
          sql
        ).toContain(
          "AND status ="
        );

        expect(
          sql
        ).toContain(
          "'building'"
        );
      }
    );
  }
);