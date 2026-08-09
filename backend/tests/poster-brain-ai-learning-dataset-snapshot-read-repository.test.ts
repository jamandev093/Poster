import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot-read.repository.js";

import type {
  PosterBrainAiLearningDatasetSnapshotReadDatabase,
} from "../src/application/poster-brain/ai-learning-dataset-snapshot-read.repository.js";

interface RecordedQuery {
  readonly text:
    string;

  readonly values:
    readonly unknown[] |
    undefined;
}

class RecordingDatabase
  implements PosterBrainAiLearningDatasetSnapshotReadDatabase
{
  readonly calls:
    RecordedQuery[] =
    [];

  private resultIndex =
    0;

  constructor(
    private readonly results:
      readonly (
        readonly unknown[]
      )[]
  ) {}

  async query<Row>(
    text:
      string,
    values?:
      readonly unknown[]
  ): Promise<{
    rows:
      readonly Row[];
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

function createReadySnapshotRow() {
  return {
    id:
      "11111111-1111-4111-8111-111111111111",

    schemaVersion:
      1,

    status:
      "ready",

    sourceEventCount:
      "10000",

    materializedEventCount:
      "10000",

    materializedContentCount:
      "20",

    sourceCutoffAt:
      "2026-08-09T16:00:00.000Z",

    firstEventAt:
      "2026-08-09T12:00:00.000Z",

    lastEventAt:
      "2026-08-09T15:59:59.000Z",

    datasetChecksum:
      "sha256:" +
      "a".repeat(
        64
      ),

    createdAt:
      "2026-08-09T16:00:00.000Z",

    completedAt:
      "2026-08-09T16:01:00.000Z",
  };
}

function createFrozenEventRow(
  input: {
    readonly eventKey:
      string;

    readonly occurredAt:
      string;

    readonly contentId?:
      string;
  }
) {
  return {
    eventKey:
      input.eventKey,

    source:
      "organic_content_event",

    sourceEventId:
      input.eventKey.replace(
        "organic_content_event:",
        ""
      ),

    signalType:
      "impression",

    occurredAt:
      input.occurredAt,

    surface:
      "home",

    reasonId:
      null,

    reportStatus:
      null,

    bookmarkActive:
      null,

    contentId:
      input.contentId ??
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

    aiClassification:
      {
        category:
          "technology",

        confidence:
          0.91,
      },

    qualityScore:
      "0.8",

    publishedAt:
      "2026-08-09T10:00:00.000Z",

    contentStatus:
      "active",
  };
}

describe(
  "Poster Brain frozen learning dataset snapshot read repository",
  () => {

    it(
      "reads only a ready frozen snapshot manifest",
      async () => {

        const database =
          new RecordingDatabase([
            [
              createReadySnapshotRow(),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
            database
          );

        const snapshot =
          await repository.getReadySnapshot(
            "11111111-1111-4111-8111-111111111111"
          );

        expect(
          snapshot
        ).toEqual({
          ...createReadySnapshotRow(),

          sourceEventCount:
            10000,

          materializedEventCount:
            10000,

          materializedContentCount:
            20,
        });

        expect(
          database.calls
        ).toHaveLength(
          1
        );

        const call =
          database.calls[0]!;

        expect(
          call.text
        ).toContain(
          "FROM app.poster_brain_ai_learning_datasets"
        );

        expect(
          call.text
        ).toContain(
          "status = 'ready'"
        );

        expect(
          call.text
        ).toContain(
          "dataset_checksum IS NOT NULL"
        );

        expect(
          call.values
        ).toEqual([
          "11111111-1111-4111-8111-111111111111",
        ]);
      }
    );

    it(
      "returns null when the requested dataset is not ready or does not exist",
      async () => {

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
            new RecordingDatabase([
              [],
            ])
          );

        await expect(
          repository.getReadySnapshot(
            "11111111-1111-4111-8111-111111111111"
          )
        ).resolves.toBeNull();
      }
    );

    it(
      "pages only frozen snapshot event and content tables in deterministic order",
      async () => {

        const database =
          new RecordingDatabase([
            [
              createFrozenEventRow({
                eventKey:
                  "organic_content_event:event-2",

                occurredAt:
                  "2026-08-09T15:59:59.000Z",
              }),

              createFrozenEventRow({
                eventKey:
                  "organic_content_event:event-1",

                occurredAt:
                  "2026-08-09T15:59:58.000Z",

                contentId:
                  "33333333-3333-4333-8333-333333333333",
              }),
            ],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
            database
          );

        const page =
          await repository.listReadySnapshotPage({
            datasetId:
              "11111111-1111-4111-8111-111111111111",

            limit:
              1,
          });

        expect(
          page.events
        ).toHaveLength(
          1
        );

        expect(
          page.events[0]?.eventKey
        ).toBe(
          "organic_content_event:event-2"
        );

        expect(
          page.events[0]?.content
            .qualityScore
        ).toBe(
          0.8
        );

        expect(
          page.nextCursor
        ).toBe(
          "2026-08-09T15:59:59.000Z|organic_content_event:event-2"
        );

        const call =
          database.calls[0]!;

        expect(
          call.text
        ).toContain(
          "FROM app.poster_brain_ai_learning_dataset_events e"
        );

        expect(
          call.text
        ).toContain(
          "INNER JOIN app.poster_brain_ai_learning_dataset_contents c"
        );

        expect(
          call.text
        ).toContain(
          "INNER JOIN app.poster_brain_ai_learning_datasets d"
        );

        expect(
          call.text
        ).toContain(
          "d.status = 'ready'"
        );

        expect(
          call.text
        ).toContain(
          "e.occurred_at DESC"
        );

        expect(
          call.text
        ).toContain(
          "e.event_key DESC"
        );

        expect(
          call.values
        ).toEqual([
          "11111111-1111-4111-8111-111111111111",
          null,
          null,
          2,
        ]);
      }
    );

    it(
      "continues frozen paging from occurredAt and eventKey without consulting live signal tables",
      async () => {

        const database =
          new RecordingDatabase([
            [],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
            database
          );

        const page =
          await repository.listReadySnapshotPage({
            datasetId:
              "11111111-1111-4111-8111-111111111111",

            limit:
              5000,

            cursor:
              "2026-08-09T15:00:00.000Z|share:event-5",
          });

        expect(
          page.events
        ).toEqual(
          []
        );

        expect(
          page.nextCursor
        ).toBeNull();

        const call =
          database.calls[0]!;

        expect(
          call.values
        ).toEqual([
          "11111111-1111-4111-8111-111111111111",
          "2026-08-09T15:00:00.000Z",
          "share:event-5",
          5001,
        ]);

        expect(
          call.text
        ).not.toContain(
          "mobile_user_content_events"
        );

        expect(
          call.text
        ).not.toContain(
          "mobile_user_share_events"
        );

        expect(
          call.text
        ).not.toContain(
          "mobile_user_report_events"
        );

        expect(
          call.text
        ).not.toContain(
          "mobile_user_bookmarks"
        );

        expect(
          call.text
        ).not.toContain(
          "mobile_user_article_interactions"
        );

        expect(
          call.text
        ).not.toContain(
          "mobile_user_article_feedback"
        );
      }
    );

    it(
      "keeps user identity report free text metadata and ad telemetry outside the frozen reader",
      async () => {

        const database =
          new RecordingDatabase([
            [],
          ]);

        const repository =
          createPostgreSqlPosterBrainAiLearningDatasetSnapshotReadRepository(
            database
          );

        await repository.listReadySnapshotPage({
          datasetId:
            "11111111-1111-4111-8111-111111111111",
        });

        const sql =
          database.calls[0]!
            .text
            .toLowerCase();

        expect(
          sql
        ).not.toContain(
          "user_id"
        );

        expect(
          sql
        ).not.toContain(
          "details"
        );

        expect(
          sql
        ).not.toContain(
          "metadata"
        );

        expect(
          sql
        ).not.toContain(
          "mobile_ad_interactions"
        );
      }
    );
  }
);