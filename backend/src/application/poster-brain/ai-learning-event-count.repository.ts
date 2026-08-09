export interface PosterBrainAiLearningEventCountSnapshot {
  readonly organicContentEvents: number;
  readonly shareEvents: number;
  readonly reportEvents: number;
  readonly bookmarkEvents: number;
  readonly articleInteractions: number;
  readonly articleFeedback: number;
  readonly observedEventCount: number;
}

interface PosterBrainAiLearningEventCountRow {
  readonly organicContentEvents: string | number;
  readonly shareEvents: string | number;
  readonly reportEvents: string | number;
  readonly bookmarkEvents: string | number;
  readonly articleInteractions: string | number;
  readonly articleFeedback: string | number;
  readonly observedEventCount: string | number;
}

export interface PosterBrainAiLearningEventCountDatabase {
  query<Row>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{
    rows: readonly Row[];
  }>;
}

export interface PosterBrainAiLearningEventCountRepository {
  getSnapshot(): Promise<PosterBrainAiLearningEventCountSnapshot>;
}

function parseCount(
  value: string | number,
  fieldName: string
): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `Invalid Poster Brain learning count: ${fieldName}`
    );
  }

  return Math.trunc(parsed);
}

export class PostgreSqlPosterBrainAiLearningEventCountRepository
  implements PosterBrainAiLearningEventCountRepository
{
  constructor(
    private readonly database:
      PosterBrainAiLearningEventCountDatabase
  ) {}

  async getSnapshot():
    Promise<PosterBrainAiLearningEventCountSnapshot> {
    const result =
      await this.database.query<
        PosterBrainAiLearningEventCountRow
      >(`
        SELECT
          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_content_events
          ) AS "organicContentEvents",

          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_share_events
          ) AS "shareEvents",

          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_report_events
          ) AS "reportEvents",

          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_bookmarks
          ) AS "bookmarkEvents",

          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_article_interactions
          ) AS "articleInteractions",

          (
            SELECT COUNT(*)::bigint
            FROM app.mobile_user_article_feedback
          ) AS "articleFeedback",

          (
            (SELECT COUNT(*) FROM app.mobile_user_content_events) +
            (SELECT COUNT(*) FROM app.mobile_user_share_events) +
            (SELECT COUNT(*) FROM app.mobile_user_report_events) +
            (SELECT COUNT(*) FROM app.mobile_user_bookmarks) +
            (SELECT COUNT(*) FROM app.mobile_user_article_interactions) +
            (SELECT COUNT(*) FROM app.mobile_user_article_feedback)
          )::bigint AS "observedEventCount"
      `);

    const row =
      result.rows[0];

    if (!row) {
      throw new Error(
        "Poster Brain learning event count query returned no row."
      );
    }

    return {
      organicContentEvents:
        parseCount(
          row.organicContentEvents,
          "organicContentEvents"
        ),

      shareEvents:
        parseCount(
          row.shareEvents,
          "shareEvents"
        ),

      reportEvents:
        parseCount(
          row.reportEvents,
          "reportEvents"
        ),

      bookmarkEvents:
        parseCount(
          row.bookmarkEvents,
          "bookmarkEvents"
        ),

      articleInteractions:
        parseCount(
          row.articleInteractions,
          "articleInteractions"
        ),

      articleFeedback:
        parseCount(
          row.articleFeedback,
          "articleFeedback"
        ),

      observedEventCount:
        parseCount(
          row.observedEventCount,
          "observedEventCount"
        ),
    };
  }
}

export function createPostgreSqlPosterBrainAiLearningEventCountRepository(
  database: PosterBrainAiLearningEventCountDatabase
): PosterBrainAiLearningEventCountRepository {
  return new PostgreSqlPosterBrainAiLearningEventCountRepository(
    database
  );
}