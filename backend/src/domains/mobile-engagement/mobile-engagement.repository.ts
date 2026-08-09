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
} from "./mobile-engagement.types.js";

interface QueryResult<TRow> {
  rows:
    TRow[];

  rowCount:
    number |
    null;
}

export interface MobileEngagementQueryExecutor {
  query<TRow = Record<string, unknown>>(
    sql:
      string,
    values?:
      readonly unknown[]
  ): Promise<QueryResult<TRow>>;
}

interface IdentifierRow {
  id:
    string;
}

function stringifyMetadata(
  value:
    Record<string, unknown> |
    null |
    undefined
): string {
  return JSON.stringify(
    value ?? {}
  );
}

export class PostgresMobileEngagementRepository
  implements MobileEngagementRepository {
  constructor(
    private readonly database:
      MobileEngagementQueryExecutor
  ) {}

  async recordShareEvent(
    input:
      RecordMobileShareEventInput
  ): Promise<RecordMobileShareEventResult> {
    const result =
      await this.database.query<IdentifierRow>(
        `
          INSERT INTO app.mobile_user_share_events (
            user_id,
            content_id,
            original_url,
            publisher,
            share_target,
            activity_type,
            metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
          RETURNING id
        `,
        [
          input.userId,
          input.contentId,
          input.originalUrl,
          input.publisher,
          input.shareTarget ??
            null,
          input.activityType ??
            null,
          stringifyMetadata(
            input.metadata
          ),
        ]
      );

    const row =
      result.rows[0];

    if (!row) {
      throw new Error(
        "Share event could not be recorded."
      );
    }

    return {
      success:
        true,

      eventId:
        row.id,
    };
  }

  async recordReportEvent(
    input:
      RecordMobileReportEventInput
  ): Promise<RecordMobileReportEventResult> {
    const result =
      await this.database.query<IdentifierRow>(
        `
          INSERT INTO app.mobile_user_report_events (
            user_id,
            content_id,
            reason_id,
            details,
            report_context
          )
          VALUES ($1, $2, $3, $4, $5::jsonb)
          ON CONFLICT (user_id, content_id, reason_id)
            WHERE status IN ('pending', 'triaged')
          DO NOTHING
          RETURNING id
        `,
        [
          input.userId,
          input.contentId,
          input.reasonId,
          input.details ??
            null,
          stringifyMetadata(
            input.reportContext
          ),
        ]
      );

    const row =
      result.rows[0] ??
      null;

    return {
      success:
        true,

      duplicate:
        row === null,

      reportId:
        row?.id ??
        null,
    };
  }

  async recordOrganicContentEvent(
    input:
      RecordMobileOrganicContentEventInput
  ): Promise<RecordMobileOrganicContentEventResult> {
    const result =
      await this.database.query<IdentifierRow>(
        `
          INSERT INTO app.mobile_user_content_events (
            user_id,
            content_id,
            event_type,
            surface,
            source_context,
            deduplication_key,
            occurred_at,
            metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, NOW()), $8::jsonb)
          ON CONFLICT (deduplication_key)
            WHERE deduplication_key IS NOT NULL
          DO NOTHING
          RETURNING id
        `,
        [
          input.userId,
          input.contentId,
          input.eventType,
          input.surface,
          input.sourceContext ??
            null,
          input.deduplicationKey ??
            null,
          input.occurredAt ??
            null,
          stringifyMetadata(
            input.metadata
          ),
        ]
      );

    const row =
      result.rows[0] ??
      null;

    return {
      success:
        true,

      duplicate:
        row === null,

      eventId:
        row?.id ??
        null,
    };
  }

  async recordAdInteraction(
    input:
      RecordMobileAdInteractionInput
  ): Promise<RecordMobileAdInteractionResult> {
    const result =
      await this.database.query<IdentifierRow>(
        `
          INSERT INTO app.mobile_ad_interactions (
            user_id,
            event_type,
            placement,
            ad_slot_id,
            campaign_id,
            creative_id,
            content_id,
            deduplication_key,
            occurred_at,
            metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, NOW()), $10::jsonb)
          ON CONFLICT (deduplication_key)
            WHERE deduplication_key IS NOT NULL
          DO NOTHING
          RETURNING id
        `,
        [
          input.userId,
          input.eventType,
          input.placement,
          input.adSlotId ??
            null,
          input.campaignId ??
            null,
          input.creativeId ??
            null,
          input.contentId ??
            null,
          input.deduplicationKey ??
            null,
          input.occurredAt ??
            null,
          stringifyMetadata(
            input.metadata
          ),
        ]
      );

    const row =
      result.rows[0] ??
      null;

    return {
      success:
        true,

      duplicate:
        row === null,

      interactionId:
        row?.id ??
        null,
    };
  }
}

export function createPostgresMobileEngagementRepository(
  database:
    MobileEngagementQueryExecutor
): MobileEngagementRepository {
  return new PostgresMobileEngagementRepository(
    database
  );
}
