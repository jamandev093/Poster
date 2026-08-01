import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeOptionalAnalyticsText,
  normalizeRequiredAnalyticsText,
  type CreateMonetizationCampaignEventInput,
  type MonetizationCampaignEventRecord,
  type MonetizationEventPlacement,
  type MonetizationEventType,
} from "./analytics-event.types.js";

interface CampaignEventDatabaseRow
  extends QueryResultRow {
  id: string;

  event_key: string;

  campaign_id: string;

  event_type:
    MonetizationEventType;

  placement:
    MonetizationEventPlacement;

  occurred_at: Date;

  received_at: Date;

  source: string;

  schema_version: number;

  session_key_hash:
    string |
    null;

  user_key_hash:
    string |
    null;

  request_key_hash:
    string |
    null;

  destination_host:
    string |
    null;

  metadata:
    Record<
      string,
      unknown
    >;
}

const CAMPAIGN_EVENT_COLUMNS = `
  id,
  event_key,
  campaign_id,
  event_type,
  placement,
  occurred_at,
  received_at,
  source,
  schema_version,
  session_key_hash,
  user_key_hash,
  request_key_hash,
  destination_host,
  metadata
`;

function mapCampaignEventRow(
  row:
    CampaignEventDatabaseRow
): MonetizationCampaignEventRecord {
  return {
    id:
      row.id,

    eventKey:
      row.event_key,

    campaignId:
      row.campaign_id,

    eventType:
      row.event_type,

    placement:
      row.placement,

    occurredAt:
      row.occurred_at,

    receivedAt:
      row.received_at,

    source:
      row.source,

    schemaVersion:
      row.schema_version,

    sessionKeyHash:
      row.session_key_hash,

    userKeyHash:
      row.user_key_hash,

    requestKeyHash:
      row.request_key_hash,

    destinationHost:
      row.destination_host,

    metadata:
      row.metadata,
  };
}

function mapOptionalCampaignEventRow(
  row:
    CampaignEventDatabaseRow |
    undefined
): MonetizationCampaignEventRecord | null {
  return row
    ? mapCampaignEventRow(
        row
      )
    : null;
}

export async function createMonetizationCampaignEvent(
  input:
    CreateMonetizationCampaignEventInput,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationCampaignEventRecord | null> {
  const result =
    await executeDatabaseQuery<
      CampaignEventDatabaseRow
    >(
      `
        INSERT INTO app.monetization_campaign_events (
          event_key,
          campaign_id,
          event_type,
          placement,
          occurred_at,
          received_at,
          source,
          schema_version,
          session_key_hash,
          user_key_hash,
          request_key_hash,
          destination_host,
          metadata
        )
        VALUES (
          $1,
          $2::uuid,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13::jsonb
        )
        ON CONFLICT (
          event_key
        )
        DO NOTHING
        RETURNING
          ${CAMPAIGN_EVENT_COLUMNS}
      `,
      [
        normalizeRequiredAnalyticsText(
          input.eventKey
        ),

        input.campaignId,
        input.eventType,
        input.placement,
        input.occurredAt,
        input.receivedAt,

        normalizeRequiredAnalyticsText(
          input.source
        ),

        input.schemaVersion ??
        1,

        normalizeOptionalAnalyticsText(
          input.sessionKeyHash
        ),

        normalizeOptionalAnalyticsText(
          input.userKeyHash
        ),

        normalizeOptionalAnalyticsText(
          input.requestKeyHash
        ),

        normalizeOptionalAnalyticsText(
          input.destinationHost
        ),

        JSON.stringify(
          input.metadata ??
          {}
        ),
      ],
      executor
    );

  return mapOptionalCampaignEventRow(
    result.rows[0]
  );
}

export async function findMonetizationCampaignEventById(
  eventId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationCampaignEventRecord | null> {
  const result =
    await executeDatabaseQuery<
      CampaignEventDatabaseRow
    >(
      `
        SELECT
          ${CAMPAIGN_EVENT_COLUMNS}
        FROM app.monetization_campaign_events
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        eventId,
      ],
      executor
    );

  return mapOptionalCampaignEventRow(
    result.rows[0]
  );
}

export async function findMonetizationCampaignEventByKey(
  eventKey: string,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationCampaignEventRecord | null> {
  const result =
    await executeDatabaseQuery<
      CampaignEventDatabaseRow
    >(
      `
        SELECT
          ${CAMPAIGN_EVENT_COLUMNS}
        FROM app.monetization_campaign_events
        WHERE event_key = $1
        LIMIT 1
      `,
      [
        normalizeRequiredAnalyticsText(
          eventKey
        ),
      ],
      executor
    );

  return mapOptionalCampaignEventRow(
    result.rows[0]
  );
}

export async function listMonetizationCampaignEventsForValidation(
  input: {
    limit: number;
  },
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationCampaignEventRecord[]> {
  const result =
    await executeDatabaseQuery<
      CampaignEventDatabaseRow
    >(
      `
        SELECT
          ${CAMPAIGN_EVENT_COLUMNS}
        FROM app.monetization_campaign_events
          AS event
        LEFT JOIN app.monetization_campaign_event_validations
          AS validation
          ON validation.event_id =
            event.id
        WHERE
          validation.event_id IS NULL
          OR validation.validation_status =
            'pending'
        ORDER BY
          event.received_at ASC,
          event.id ASC
        LIMIT $1
      `,
      [
        input.limit,
      ],
      executor
    );

  return result.rows.map(
    mapCampaignEventRow
  );
}
export async function findTrustedDuplicateMonetizationCampaignEvent(
  input: {
    eventId: string;

    campaignId: string;

    eventType:
      MonetizationEventType;

    placement:
      MonetizationEventPlacement;

    requestKeyHash:
      string |
      null;

    occurredAt: Date;

    duplicateWindowSeconds: number;
  },
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationCampaignEventRecord | null> {
  if (
    !input.requestKeyHash
  ) {
    return null;
  }

  const result =
    await executeDatabaseQuery<
      CampaignEventDatabaseRow
    >(
      `
        SELECT
          ${CAMPAIGN_EVENT_COLUMNS}
        FROM app.monetization_campaign_events
          AS event
        INNER JOIN app.monetization_campaign_event_validations
          AS validation
          ON validation.event_id =
            event.id
        WHERE
          event.id <>
            $1::uuid
          AND event.campaign_id =
            $2::uuid
          AND event.event_type =
            $3
          AND event.placement =
            $4
          AND event.request_key_hash =
            $5
          AND validation.validation_status =
            'valid'
          AND event.occurred_at <=
            $6
          AND event.occurred_at >=
            $6 -
            make_interval(
              secs =>
                $7
            )
        ORDER BY
          event.occurred_at ASC,
          event.id ASC
        LIMIT 1
      `,
      [
        input.eventId,
        input.campaignId,
        input.eventType,
        input.placement,
        input.requestKeyHash,
        input.occurredAt,
        input.duplicateWindowSeconds,
      ],
      executor
    );

  return mapOptionalCampaignEventRow(
    result.rows[0]
  );
}
