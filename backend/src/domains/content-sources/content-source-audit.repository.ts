import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeRequiredSourceText,
} from "./content-source.types.js";

import type {
  AppendContentAuditEventInput,
  AppendSourceAuditEventInput,
  ContentSourceAuditEntityType,
  ContentSourceAuditEventRecord,
} from "./content-source-audit.types.js";

interface AuditEventDatabaseRow
  extends QueryResultRow {
  id: string;

  entity_type:
    ContentSourceAuditEntityType;

  source_id:
    string |
    null;

  content_id:
    string |
    null;

  action: string;

  actor_user_id:
    string |
    null;

  actor_label: string;

  metadata:
    Record<
      string,
      unknown
    >;

  occurred_at: Date;
}

const AUDIT_COLUMNS = `
  id,
  entity_type,
  source_id,
  content_id,
  action,
  actor_user_id,
  actor_label,
  metadata,
  occurred_at
`;

function mapAuditRow(
  row:
    AuditEventDatabaseRow
): ContentSourceAuditEventRecord {
  return {
    id:
      row.id,

    entityType:
      row.entity_type,

    sourceId:
      row.source_id,

    contentId:
      row.content_id,

    action:
      row.action,

    actorUserId:
      row.actor_user_id,

    actorLabel:
      row.actor_label,

    metadata:
      row.metadata,

    occurredAt:
      row.occurred_at,
  };
}

async function appendAuditEvent(
  input: {
    entityType:
      ContentSourceAuditEntityType;

    sourceId:
      string |
      null;

    contentId:
      string |
      null;

    action: string;

    actorUserId:
      string |
      null;

    actorLabel: string;

    metadata:
      Record<
        string,
        unknown
      >;

    occurredAt: Date;
  },
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceAuditEventRecord> {
  const result =
    await executeDatabaseQuery<
      AuditEventDatabaseRow
    >(
      `
        INSERT INTO app.content_source_audit_events (
          entity_type,
          source_id,
          content_id,
          action,
          actor_user_id,
          actor_label,
          metadata,
          occurred_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4,
          $5::uuid,
          $6,
          $7::jsonb,
          $8
        )
        RETURNING
          ${AUDIT_COLUMNS}
      `,
      [
        input.entityType,
        input.sourceId,
        input.contentId,

        normalizeRequiredSourceText(
          input.action
        ),

        input.actorUserId,

        normalizeRequiredSourceText(
          input.actorLabel
        ),

        JSON.stringify(
          input.metadata
        ),

        input.occurredAt,
      ],
      executor
    );

  const row =
    result.rows[0];

  if (
    !row
  ) {
    throw new Error(
      "PostgreSQL did not return the appended content/source audit event."
    );
  }

  return mapAuditRow(
    row
  );
}

export async function appendSourceAuditEvent(
  input:
    AppendSourceAuditEventInput,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceAuditEventRecord> {
  return await appendAuditEvent(
    {
      entityType:
        "source",

      sourceId:
        input.sourceId,

      contentId:
        null,

      action:
        input.action,

      actorUserId:
        input.actorUserId ??
        null,

      actorLabel:
        input.actorLabel,

      metadata:
        input.metadata ??
        {},

      occurredAt:
        input.occurredAt,
    },
    executor
  );
}

export async function appendContentAuditEvent(
  input:
    AppendContentAuditEventInput,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceAuditEventRecord> {
  return await appendAuditEvent(
    {
      entityType:
        "content",

      sourceId:
        null,

      contentId:
        input.contentId,

      action:
        input.action,

      actorUserId:
        input.actorUserId ??
        null,

      actorLabel:
        input.actorLabel,

      metadata:
        input.metadata ??
        {},

      occurredAt:
        input.occurredAt,
    },
    executor
  );
}

export async function listSourceAuditEvents(
  sourceId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceAuditEventRecord[]> {
  const result =
    await executeDatabaseQuery<
      AuditEventDatabaseRow
    >(
      `
        SELECT
          ${AUDIT_COLUMNS}
        FROM app.content_source_audit_events
        WHERE source_id =
          $1::uuid
        ORDER BY
          occurred_at DESC,
          id DESC
      `,
      [
        sourceId,
      ],
      executor
    );

  return result.rows.map(
    mapAuditRow
  );
}

export async function listContentAuditEvents(
  contentId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<ContentSourceAuditEventRecord[]> {
  const result =
    await executeDatabaseQuery<
      AuditEventDatabaseRow
    >(
      `
        SELECT
          ${AUDIT_COLUMNS}
        FROM app.content_source_audit_events
        WHERE content_id =
          $1::uuid
        ORDER BY
          occurred_at DESC,
          id DESC
      `,
      [
        contentId,
      ],
      executor
    );

  return result.rows.map(
    mapAuditRow
  );
}