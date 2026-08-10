import type {
  MonetizationEventPlacement,
  MonetizationEventType,
} from "../../domains/monetization/index.js";

import type {
  AdvertisingAiLearningDatasetEvent,
  AdvertisingAiLearningDatasetPage,
  AdvertisingAiLearningDatasetPageInput,
  AdvertisingAiLearningEventCountSnapshot,
} from "./advertising-ai-learning-dataset.types.js";

interface AdvertisingAiLearningQueryResult<TRow> {
  readonly rows:
    readonly TRow[];
}

export interface AdvertisingAiLearningDatasetDatabase {
  query<TRow>(
    text:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<
      AdvertisingAiLearningQueryResult<TRow>
    >;
}

interface EventCountRow {
  readonly total_event_count:
    string |
    number;

  readonly impression_event_count:
    string |
    number;

  readonly click_event_count:
    string |
    number;

  readonly conversion_event_count:
    string |
    number;

  readonly first_event_at:
    string |
    Date |
    null;

  readonly last_event_at:
    string |
    Date |
    null;
}

interface LearningEventRow {
  readonly id:
    string;

  readonly campaign_id:
    string;

  readonly event_type:
    MonetizationEventType;

  readonly placement:
    MonetizationEventPlacement;

  readonly occurred_at:
    string |
    Date;
}

export interface AdvertisingAiLearningDatasetRepository {
  readEventCounts(
    sourceCutoffAt:
      string
  ):
    Promise<
      AdvertisingAiLearningEventCountSnapshot
    >;

  listEvents(
    input:
      AdvertisingAiLearningDatasetPageInput
  ):
    Promise<
      AdvertisingAiLearningDatasetPage
    >;
}

function normalizeTimestamp(
  value:
    string |
    Date,

  field:
    string
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `Advertising AI ${field} is invalid.`
    );
  }

  return date.toISOString();
}

function normalizeNullableTimestamp(
  value:
    string |
    Date |
    null,

  field:
    string
): string | null {
  return value === null
    ? null
    : normalizeTimestamp(
        value,
        field
      );
}

function integerCount(
  value:
    string |
    number,

  field:
    string
): number {
  const count =
    Number(
      value
    );

  if (
    !Number.isSafeInteger(
      count
    ) ||
    count < 0
  ) {
    throw new Error(
      `Advertising AI ${field} is invalid.`
    );
  }

  return count;
}

function normalizeLimit(
  value:
    number |
    undefined
): number {
  if (value === undefined) {
    return 1000;
  }

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 1 ||
    value > 5000
  ) {
    throw new Error(
      "Advertising AI learning page limit must be between 1 and 5000."
    );
  }

  return value;
}

function normalizeUuid(
  value:
    string,

  field:
    string
): string {
  const cleaned =
    value
      .trim()
      .toLowerCase();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      .test(
        cleaned
      )
  ) {
    throw new Error(
      `Advertising AI ${field} is invalid.`
    );
  }

  return cleaned;
}

function parseCursor(
  value:
    string |
    null |
    undefined
): {
  readonly occurredAt:
    string |
    null;

  readonly sourceEventId:
    string |
    null;
} {
  if (
    value === undefined ||
    value === null
  ) {
    return {
      occurredAt:
        null,

      sourceEventId:
        null,
    };
  }

  const parts =
    value.split(
      "|"
    );

  if (parts.length !== 2) {
    throw new Error(
      "Advertising AI learning cursor is invalid."
    );
  }

  return {
    occurredAt:
      normalizeTimestamp(
        parts[0]!,
        "learning cursor timestamp"
      ),

    sourceEventId:
      normalizeUuid(
        parts[1]!,
        "learning cursor event id"
      ),
  };
}

function encodeCursor(
  event:
    AdvertisingAiLearningDatasetEvent
): string {
  return [
    event.occurredAt,
    event.sourceEventId,
  ].join(
    "|"
  );
}

function mapEvent(
  row:
    LearningEventRow
): AdvertisingAiLearningDatasetEvent {
  const sourceEventId =
    normalizeUuid(
      row.id,
      "source event id"
    );

  return {
    /*
     * Never expose the original client-provided event_key.
     */
    eventKey:
      `advertising:${sourceEventId}`,

    sourceEventId,

    campaignId:
      normalizeUuid(
        row.campaign_id,
        "campaign id"
      ),

    eventType:
      row.event_type,

    placement:
      row.placement,

    occurredAt:
      normalizeTimestamp(
        row.occurred_at,
        "event timestamp"
      ),
  };
}

export function createAdvertisingAiLearningDatasetRepository(
  database:
    AdvertisingAiLearningDatasetDatabase
): AdvertisingAiLearningDatasetRepository {
  return {
    async readEventCounts(
      sourceCutoffAt
    ) {
      const cutoff =
        normalizeTimestamp(
          sourceCutoffAt,
          "source cutoff"
        );

      const result =
        await database
          .query<EventCountRow>(
            `
              SELECT
                COUNT(*)::bigint
                  AS total_event_count,

                COUNT(*) FILTER (
                  WHERE event.event_type =
                    'impression'
                )::bigint
                  AS impression_event_count,

                COUNT(*) FILTER (
                  WHERE event.event_type =
                    'click'
                )::bigint
                  AS click_event_count,

                COUNT(*) FILTER (
                  WHERE event.event_type =
                    'conversion'
                )::bigint
                  AS conversion_event_count,

                MIN(
                  event.occurred_at
                )
                  AS first_event_at,

                MAX(
                  event.occurred_at
                )
                  AS last_event_at

              FROM app.monetization_campaign_events
                AS event

              INNER JOIN app.monetization_campaign_event_validations
                AS validation
                ON validation.event_id =
                  event.id

              WHERE
                validation.validation_status =
                  'valid'

                AND validation.validated_at IS NOT NULL

                AND validation.validated_at <=
                  $1::timestamptz

                AND event.occurred_at <=
                  $1::timestamptz
            `,
            [
              cutoff,
            ]
          );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Advertising AI event count query returned no row."
        );
      }

      const clickEventCount =
        integerCount(
          row.click_event_count,
          "click event count"
        );

      const conversionEventCount =
        integerCount(
          row.conversion_event_count,
          "conversion event count"
        );

      return {
        totalEventCount:
          integerCount(
            row.total_event_count,
            "total event count"
          ),

        impressionEventCount:
          integerCount(
            row.impression_event_count,
            "impression event count"
          ),

        clickEventCount,

        conversionEventCount,

        positiveEventCount:
          clickEventCount +
          conversionEventCount,

        firstEventAt:
          normalizeNullableTimestamp(
            row.first_event_at,
            "first event timestamp"
          ),

        lastEventAt:
          normalizeNullableTimestamp(
            row.last_event_at,
            "last event timestamp"
          ),

        sourceCutoffAt:
          cutoff,
      };
    },

    async listEvents(
      input
    ) {
      const cutoff =
        normalizeTimestamp(
          input.sourceCutoffAt,
          "source cutoff"
        );

      const limit =
        normalizeLimit(
          input.limit
        );

      const cursor =
        parseCursor(
          input.cursor
        );

      const result =
        await database
          .query<LearningEventRow>(
            `
              SELECT
                event.id,
                event.campaign_id,
                event.event_type,
                event.placement,
                event.occurred_at

              FROM app.monetization_campaign_events
                AS event

              INNER JOIN app.monetization_campaign_event_validations
                AS validation
                ON validation.event_id =
                  event.id

              WHERE
                validation.validation_status =
                  'valid'

                AND validation.validated_at IS NOT NULL

                AND validation.validated_at <=
                  $1::timestamptz

                AND event.occurred_at <=
                  $1::timestamptz

                AND (
                  $2::timestamptz IS NULL

                  OR (
                    event.occurred_at,
                    event.id
                  ) < (
                    $2::timestamptz,
                    $3::uuid
                  )
                )

              ORDER BY
                event.occurred_at DESC,
                event.id DESC

              LIMIT $4
            `,
            [
              cutoff,
              cursor.occurredAt,
              cursor.sourceEventId,
              limit + 1,
            ]
          );

      const hasMore =
        result.rows.length >
        limit;

      const events =
        result.rows
          .slice(
            0,
            limit
          )
          .map(
            mapEvent
          );

      return {
        events,

        nextCursor:
          hasMore &&
          events.length > 0
            ? encodeCursor(
                events[
                  events.length -
                  1
                ]!
              )
            : null,

        sourceCutoffAt:
          cutoff,
      };
    },
  };
}