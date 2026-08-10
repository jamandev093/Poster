import type {
  AdvertisingAiLearningDatasetEvent,
} from "./advertising-ai-learning-dataset.types.js";

import type {
  AdvertisingAiFrozenLearningPage,
  AdvertisingAiLearningSnapshot,
} from "./advertising-ai-learning-snapshot.types.js";

interface QueryResult<Row> {
  readonly rows:
    readonly Row[];
}

export interface AdvertisingAiLearningSnapshotDatabase {
  query<Row>(
    text:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<
      QueryResult<Row>
    >;
}

interface SnapshotRow {
  readonly id:
    string;

  readonly schema_version:
    number |
    string;

  readonly status:
    string;

  readonly source_event_count:
    number |
    string;

  readonly materialized_event_count:
    number |
    string;

  readonly source_cutoff_at:
    string |
    Date;

  readonly first_event_at:
    string |
    Date |
    null;

  readonly last_event_at:
    string |
    Date |
    null;

  readonly dataset_checksum:
    string |
    null;

  readonly created_at:
    string |
    Date;

  readonly completed_at:
    string |
    Date |
    null;

  readonly failed_at:
    string |
    Date |
    null;

  readonly failure_code:
    string |
    null;
}

interface FrozenEventRow {
  readonly event_key:
    string;

  readonly source_event_id:
    string;

  readonly campaign_id:
    string;

  readonly event_type:
    "impression" |
    "click" |
    "conversion";

  readonly placement:
    "home" |
    "search" |
    "trending";

  readonly occurred_at:
    string |
    Date;
}

export interface AdvertisingAiLearningSnapshotRepository {
  createSnapshot(
    input: {
      readonly sourceEventCount:
        number;

      readonly sourceCutoffAt:
        string;
    }
  ):
    Promise<
      AdvertisingAiLearningSnapshot
    >;

  appendEvents(
    input: {
      readonly datasetId:
        string;

      readonly events:
        readonly AdvertisingAiLearningDatasetEvent[];
    }
  ):
    Promise<number>;

  completeSnapshot(
    input: {
      readonly datasetId:
        string;

      readonly materializedEventCount:
        number;

      readonly firstEventAt:
        string;

      readonly lastEventAt:
        string;

      readonly datasetChecksum:
        string;

      readonly completedAt:
        string;
    }
  ):
    Promise<
      AdvertisingAiLearningSnapshot
    >;

  failSnapshot(
    input: {
      readonly datasetId:
        string;

      readonly failureCode:
        string;

      readonly failedAt:
        string;
    }
  ):
    Promise<
      AdvertisingAiLearningSnapshot
    >;

  getReadySnapshot(
    datasetId:
      string
  ):
    Promise<
      AdvertisingAiLearningSnapshot |
      null
    >;

  listFrozenEvents(
    input: {
      readonly datasetId:
        string;

      readonly limit?:
        number;

      readonly cursor?:
        string |
        null;
    }
  ):
    Promise<
      AdvertisingAiFrozenLearningPage
    >;
}

const SNAPSHOT_COLUMNS = `
  id,
  schema_version,
  status,
  source_event_count,
  materialized_event_count,
  source_cutoff_at,
  first_event_at,
  last_event_at,
  dataset_checksum,
  created_at,
  completed_at,
  failed_at,
  failure_code
`;

function timestamp(
  value:
    string |
    Date,

  field:
    string
): string {
  const parsed =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `Advertising AI ${field} is invalid.`
    );
  }

  return parsed.toISOString();
}

function nullableTimestamp(
  value:
    string |
    Date |
    null,

  field:
    string
): string | null {
  return value === null
    ? null
    : timestamp(
        value,
        field
      );
}

function count(
  value:
    string |
    number,

  field:
    string
): number {
  const result =
    Number(
      value
    );

  if (
    !Number.isSafeInteger(
      result
    ) ||
    result < 0
  ) {
    throw new Error(
      `Advertising AI ${field} is invalid.`
    );
  }

  return result;
}

function mapSnapshot(
  row:
    SnapshotRow
): AdvertisingAiLearningSnapshot {
  if (
    Number(
      row.schema_version
    ) !==
    1
  ) {
    throw new Error(
      "Advertising AI snapshot schema version is unsupported."
    );
  }

  if (
    row.status !==
      "building" &&
    row.status !==
      "ready" &&
    row.status !==
      "failed"
  ) {
    throw new Error(
      "Advertising AI snapshot status is invalid."
    );
  }

  return {
    id:
      row.id,

    schemaVersion:
      1,

    status:
      row.status,

    sourceEventCount:
      count(
        row.source_event_count,
        "source event count"
      ),

    materializedEventCount:
      count(
        row.materialized_event_count,
        "materialized event count"
      ),

    sourceCutoffAt:
      timestamp(
        row.source_cutoff_at,
        "source cutoff"
      ),

    firstEventAt:
      nullableTimestamp(
        row.first_event_at,
        "first event timestamp"
      ),

    lastEventAt:
      nullableTimestamp(
        row.last_event_at,
        "last event timestamp"
      ),

    datasetChecksum:
      row.dataset_checksum,

    createdAt:
      timestamp(
        row.created_at,
        "created timestamp"
      ),

    completedAt:
      nullableTimestamp(
        row.completed_at,
        "completed timestamp"
      ),

    failedAt:
      nullableTimestamp(
        row.failed_at,
        "failed timestamp"
      ),

    failureCode:
      row.failure_code,
  };
}

function pageLimit(
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
      "Advertising AI frozen page limit must be between 1 and 5000."
    );
  }

  return value;
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

  readonly eventKey:
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

      eventKey:
        null,
    };
  }

  const separator =
    value.indexOf(
      "|"
    );

  if (
    separator <= 0 ||
    separator ===
      value.length - 1
  ) {
    throw new Error(
      "Advertising AI frozen event cursor is invalid."
    );
  }

  return {
    occurredAt:
      timestamp(
        value.slice(
          0,
          separator
        ),
        "frozen cursor timestamp"
      ),

    eventKey:
      value.slice(
        separator + 1
      ),
  };
}

function mapFrozenEvent(
  row:
    FrozenEventRow
): AdvertisingAiLearningDatasetEvent {
  return {
    eventKey:
      row.event_key,

    sourceEventId:
      row.source_event_id,

    campaignId:
      row.campaign_id,

    eventType:
      row.event_type,

    placement:
      row.placement,

    occurredAt:
      timestamp(
        row.occurred_at,
        "frozen event timestamp"
      ),
  };
}

function requireSnapshot(
  rows:
    readonly SnapshotRow[],

  operation:
    string
): AdvertisingAiLearningSnapshot {
  const row =
    rows[0];

  if (row === undefined) {
    throw new Error(
      `Advertising AI snapshot ${operation} returned no row.`
    );
  }

  return mapSnapshot(
    row
  );
}

export function createAdvertisingAiLearningSnapshotRepository(
  database:
    AdvertisingAiLearningSnapshotDatabase
): AdvertisingAiLearningSnapshotRepository {
  return {
    async createSnapshot(
      input
    ) {
      const result =
        await database
          .query<SnapshotRow>(
            `
              INSERT INTO app.advertising_ai_learning_datasets (
                source_event_count,
                source_cutoff_at
              )
              VALUES (
                $1,
                $2::timestamptz
              )
              RETURNING
                ${SNAPSHOT_COLUMNS}
            `,
            [
              input.sourceEventCount,
              input.sourceCutoffAt,
            ]
          );

      return requireSnapshot(
        result.rows,
        "create"
      );
    },

    async appendEvents(
      input
    ) {
      if (
        input.events.length ===
        0
      ) {
        return 0;
      }

      const payload =
        input.events.map(
          event => ({
            eventKey:
              event.eventKey,

            sourceEventId:
              event.sourceEventId,

            campaignId:
              event.campaignId,

            eventType:
              event.eventType,

            placement:
              event.placement,

            occurredAt:
              event.occurredAt,
          })
        );

      const result =
        await database.query<{
          readonly inserted_count:
            string |
            number;
        }>(
          `
            WITH inserted AS (
              INSERT INTO app.advertising_ai_learning_dataset_events (
                dataset_id,
                event_key,
                source_event_id,
                campaign_id,
                event_type,
                placement,
                occurred_at
              )
              SELECT
                $1::uuid,
                row.event_key,
                row.source_event_id::uuid,
                row.campaign_id::uuid,
                row.event_type,
                row.placement,
                row.occurred_at::timestamptz
              FROM jsonb_to_recordset(
                $2::jsonb
              ) AS row (
                event_key text,
                source_event_id text,
                campaign_id text,
                event_type text,
                placement text,
                occurred_at text
              )
              ON CONFLICT DO NOTHING
              RETURNING 1
            )
            SELECT
              COUNT(*)::bigint
                AS inserted_count
            FROM inserted
          `,
          [
            input.datasetId,

            JSON.stringify(
              payload.map(
                row => ({
                  event_key:
                    row.eventKey,

                  source_event_id:
                    row.sourceEventId,

                  campaign_id:
                    row.campaignId,

                  event_type:
                    row.eventType,

                  placement:
                    row.placement,

                  occurred_at:
                    row.occurredAt,
                })
              )
            ),
          ]
        );

      return count(
        result.rows[0]
          ?.inserted_count ??
          0,
        "inserted event count"
      );
    },

    async completeSnapshot(
      input
    ) {
      const result =
        await database
          .query<SnapshotRow>(
            `
              UPDATE app.advertising_ai_learning_datasets
              SET
                status =
                  'ready',

                materialized_event_count =
                  $2,

                first_event_at =
                  $3::timestamptz,

                last_event_at =
                  $4::timestamptz,

                dataset_checksum =
                  $5,

                completed_at =
                  $6::timestamptz,

                failed_at =
                  NULL,

                failure_code =
                  NULL

              WHERE
                id =
                  $1::uuid

                AND status =
                  'building'

              RETURNING
                ${SNAPSHOT_COLUMNS}
            `,
            [
              input.datasetId,
              input.materializedEventCount,
              input.firstEventAt,
              input.lastEventAt,
              input.datasetChecksum,
              input.completedAt,
            ]
          );

      return requireSnapshot(
        result.rows,
        "completion"
      );
    },

    async failSnapshot(
      input
    ) {
      const result =
        await database
          .query<SnapshotRow>(
            `
              UPDATE app.advertising_ai_learning_datasets
              SET
                status =
                  'failed',

                failed_at =
                  $3::timestamptz,

                failure_code =
                  $2,

                completed_at =
                  NULL

              WHERE
                id =
                  $1::uuid

                AND status =
                  'building'

              RETURNING
                ${SNAPSHOT_COLUMNS}
            `,
            [
              input.datasetId,
              input.failureCode,
              input.failedAt,
            ]
          );

      return requireSnapshot(
        result.rows,
        "failure"
      );
    },

    async getReadySnapshot(
      datasetId
    ) {
      const result =
        await database
          .query<SnapshotRow>(
            `
              SELECT
                ${SNAPSHOT_COLUMNS}

              FROM app.advertising_ai_learning_datasets

              WHERE
                id =
                  $1::uuid

                AND status =
                  'ready'

              LIMIT 1
            `,
            [
              datasetId,
            ]
          );

      const row =
        result.rows[0];

      return row === undefined
        ? null
        : mapSnapshot(
            row
          );
    },

    async listFrozenEvents(
      input
    ) {
      const limit =
        pageLimit(
          input.limit
        );

      const cursor =
        parseCursor(
          input.cursor
        );

      const result =
        await database
          .query<FrozenEventRow>(
            `
              SELECT
                event.event_key,
                event.source_event_id,
                event.campaign_id,
                event.event_type,
                event.placement,
                event.occurred_at

              FROM app.advertising_ai_learning_dataset_events
                AS event

              INNER JOIN app.advertising_ai_learning_datasets
                AS dataset
                ON dataset.id =
                  event.dataset_id

              WHERE
                event.dataset_id =
                  $1::uuid

                AND dataset.status =
                  'ready'

                AND (
                  $2::timestamptz IS NULL

                  OR (
                    event.occurred_at,
                    event.event_key
                  ) < (
                    $2::timestamptz,
                    $3
                  )
                )

              ORDER BY
                event.occurred_at DESC,
                event.event_key DESC

              LIMIT $4
            `,
            [
              input.datasetId,
              cursor.occurredAt,
              cursor.eventKey,
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
            mapFrozenEvent
          );

      const last =
        events[
          events.length - 1
        ];

      return {
        events,

        nextCursor:
          hasMore &&
          last !== undefined
            ? [
                last.occurredAt,
                last.eventKey,
              ].join(
                "|"
              )
            : null,
      };
    },
  };
}