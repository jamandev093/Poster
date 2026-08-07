import type {
  MobileActionArticleSnapshot,
  MobileArticleInteractionType,
  MobileUserActionsRepository,
  MobileUserBookmarkRecord,
  MobileUserInteractionState,
  RemoveMobileUserBookmarkInput,
  SaveMobileArticleFeedbackInput,
  SaveMobileArticleFeedbackResult,
  SaveMobileArticleInteractionInput,
  SaveMobileArticleInteractionResult,
  SaveMobileUserBookmarkInput,
} from "./mobile-actions.types.js";

interface QueryResult<TRow> {
  rows:
    TRow[];

  rowCount:
    number |
    null;
}

export interface MobileActionsQueryExecutor {
  query<TRow = Record<string, unknown>>(
    sql:
      string,
    values?:
      readonly unknown[]
  ): Promise<QueryResult<TRow>>;
}

interface BookmarkRow {
  id:
    string;

  user_id:
    string;

  content_id:
    string;

  article_snapshot:
    unknown;

  created_at:
    Date |
    string;
}

interface InteractionStateRow {
  content_id:
    string;

  interaction_type:
    MobileArticleInteractionType;
}

function toIsoString(
  value:
    Date |
    string
): string {
  return value instanceof Date
    ? value.toISOString()
    : value;
}

function parseArticleSnapshot(
  value:
    unknown
): MobileActionArticleSnapshot | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  const snapshot =
    value as Partial<MobileActionArticleSnapshot>;

  if (
    typeof snapshot.title !== "string" ||
    typeof snapshot.summary !== "string" ||
    typeof snapshot.publisher !== "string" ||
    typeof snapshot.publisherUrl !== "string" ||
    typeof snapshot.image !== "string" ||
    typeof snapshot.publishedAt !== "string" ||
    typeof snapshot.discoveredAt !== "string" ||
    typeof snapshot.category !== "string" ||
    typeof snapshot.originalUrl !== "string" ||
    typeof snapshot.verified !== "boolean"
  ) {
    return null;
  }

  return {
    title:
      snapshot.title,

    summary:
      snapshot.summary,

    publisher:
      snapshot.publisher,

    publisherUrl:
      snapshot.publisherUrl,

    image:
      snapshot.image,

    publishedAt:
      snapshot.publishedAt,

    discoveredAt:
      snapshot.discoveredAt,

    category:
      snapshot.category,

    originalUrl:
      snapshot.originalUrl,

    verified:
      snapshot.verified,
  };
}

function mapBookmarkRow(
  row:
    BookmarkRow
): MobileUserBookmarkRecord {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    contentId:
      row.content_id,

    articleSnapshot:
      parseArticleSnapshot(
        row.article_snapshot
      ),

    createdAt:
      toIsoString(
        row.created_at
      ),
  };
}

export class PostgresMobileUserActionsRepository
  implements MobileUserActionsRepository {
  constructor(
    private readonly database:
      MobileActionsQueryExecutor
  ) {}

  async listBookmarks(
    userId:
      string
  ): Promise<MobileUserBookmarkRecord[]> {
    const result =
      await this.database.query<BookmarkRow>(
        `
          SELECT
            id,
            user_id,
            content_id,
            article_snapshot,
            created_at
          FROM app.mobile_user_bookmarks
          WHERE user_id = $1
            AND deleted_at IS NULL
          ORDER BY created_at DESC, id DESC
        `,
        [
          userId,
        ]
      );

    return result.rows.map(
      mapBookmarkRow
    );
  }

  async listInteractionState(
    userId:
      string
  ): Promise<MobileUserInteractionState> {
    const [
      bookmarks,
      interactions,
    ] =
      await Promise.all([
        this.database.query<{
          content_id:
            string;
        }>(
          `
            SELECT content_id
            FROM app.mobile_user_bookmarks
            WHERE user_id = $1
              AND deleted_at IS NULL
            ORDER BY created_at DESC, id DESC
          `,
          [
            userId,
          ]
        ),

        this.database.query<InteractionStateRow>(
          `
            SELECT content_id, interaction_type
            FROM app.mobile_user_article_interactions
            WHERE user_id = $1
          `,
          [
            userId,
          ]
        ),
      ]);

    return {
      bookmarkedIds:
        bookmarks.rows.map(
          (row) => row.content_id
        ),

      recommendedIds:
        interactions.rows
          .filter(
            (row) =>
              row.interaction_type ===
              "worth_reading"
          )
          .map(
            (row) => row.content_id
          ),

      helpfulIds:
        interactions.rows
          .filter(
            (row) =>
              row.interaction_type ===
              "helpful"
          )
          .map(
            (row) => row.content_id
          ),
    };
  }

  async findActiveBookmark(
    input:
      RemoveMobileUserBookmarkInput
  ): Promise<MobileUserBookmarkRecord | null> {
    const result =
      await this.database.query<BookmarkRow>(
        `
          SELECT
            id,
            user_id,
            content_id,
            article_snapshot,
            created_at
          FROM app.mobile_user_bookmarks
          WHERE user_id = $1
            AND content_id = $2
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [
          input.userId,
          input.contentId,
        ]
      );

    const row =
      result.rows[0];

    return row
      ? mapBookmarkRow(row)
      : null;
  }

  async saveBookmark(
    input:
      SaveMobileUserBookmarkInput
  ): Promise<MobileUserBookmarkRecord> {
    const articleSnapshot =
      input.articleSnapshot ??
      null;

    const result =
      await this.database.query<BookmarkRow>(
        `
          INSERT INTO app.mobile_user_bookmarks (
            user_id,
            content_id,
            article_snapshot,
            deleted_at
          )
          VALUES ($1, $2, COALESCE($3::jsonb, '{}'::jsonb), NULL)
          ON CONFLICT (user_id, content_id)
            WHERE deleted_at IS NULL
          DO UPDATE SET
            article_snapshot = EXCLUDED.article_snapshot,
            updated_at = NOW(),
            deleted_at = NULL
          RETURNING
            id,
            user_id,
            content_id,
            article_snapshot,
            created_at
        `,
        [
          input.userId,
          input.contentId,
          articleSnapshot
            ? JSON.stringify(
                articleSnapshot
              )
            : null,
        ]
      );

    const row =
      result.rows[0];

    if (!row) {
      throw new Error(
        "Bookmark could not be saved."
      );
    }

    return mapBookmarkRow(
      row
    );
  }

  async removeBookmark(
    input:
      RemoveMobileUserBookmarkInput
  ): Promise<boolean> {
    const result =
      await this.database.query(
        `
          UPDATE app.mobile_user_bookmarks
          SET
            deleted_at = NOW(),
            updated_at = NOW()
          WHERE user_id = $1
            AND content_id = $2
            AND deleted_at IS NULL
        `,
        [
          input.userId,
          input.contentId,
        ]
      );

    return (
      result.rowCount ??
      0
    ) > 0;
  }

  async saveInteraction(
    input:
      SaveMobileArticleInteractionInput
  ): Promise<SaveMobileArticleInteractionResult> {
    const result =
      await this.database.query<{
        interaction_type:
          MobileArticleInteractionType;
      }>(
        `
          INSERT INTO app.mobile_user_article_interactions (
            user_id,
            content_id,
            interaction_type
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, content_id, interaction_type)
          DO NOTHING
          RETURNING interaction_type
        `,
        [
          input.userId,
          input.contentId,
          input.interactionType,
        ]
      );

    return {
      interactionType:
        input.interactionType,

      created:
        result.rows.length > 0,
    };
  }

  async saveFeedback(
    input:
      SaveMobileArticleFeedbackInput
  ): Promise<SaveMobileArticleFeedbackResult> {
    const result =
      await this.database.query(
        `
          INSERT INTO app.mobile_user_article_feedback (
            user_id,
            content_id,
            reason_id
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, content_id, reason_id)
          DO NOTHING
        `,
        [
          input.userId,
          input.contentId,
          input.reasonId,
        ]
      );

    return {
      success:
        true,

      duplicate:
        (
          result.rowCount ??
          0
        ) === 0,
    };
  }
}

export function createPostgresMobileUserActionsRepository(
  database:
    MobileActionsQueryExecutor
): MobileUserActionsRepository {
  return new PostgresMobileUserActionsRepository(
    database
  );
}
