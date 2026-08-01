import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeRequiredCopyrightText,
  type CopyrightCaseStatus,
} from "./copyright-case.types.js";

import type {
  AppendCopyrightAuditEventInput,
  CopyrightAuditEventRecord,
} from "./copyright-audit.types.js";

interface AuditDatabaseRow
  extends QueryResultRow {
  id: string;

  case_id: string;

  action: string;

  actor_user_id:
    string |
    null;

  actor_label: string;

  previous_status:
    CopyrightCaseStatus |
    null;

  resulting_status:
    CopyrightCaseStatus |
    null;

  metadata:
    Record<
      string,
      unknown
    >;

  occurred_at: Date;
}

const AUDIT_COLUMNS = `
  id,
  case_id,
  action,
  actor_user_id,
  actor_label,
  previous_status,
  resulting_status,
  metadata,
  occurred_at
`;

function mapAuditRow(
  row:
    AuditDatabaseRow
): CopyrightAuditEventRecord {
  return {
    id:
      row.id,

    caseId:
      row.case_id,

    action:
      row.action,

    actorUserId:
      row.actor_user_id,

    actorLabel:
      row.actor_label,

    previousStatus:
      row.previous_status,

    resultingStatus:
      row.resulting_status,

    metadata:
      row.metadata,

    occurredAt:
      row.occurred_at,
  };
}

export async function appendCopyrightAuditEvent(
  input:
    AppendCopyrightAuditEventInput,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightAuditEventRecord> {
  const result =
    await executeDatabaseQuery<
      AuditDatabaseRow
    >(
      `
        INSERT INTO app.copyright_case_audit_events (
          case_id,
          action,
          actor_user_id,
          actor_label,
          previous_status,
          resulting_status,
          metadata,
          occurred_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3::uuid,
          $4,
          $5,
          $6,
          $7::jsonb,
          $8
        )
        RETURNING
          ${AUDIT_COLUMNS}
      `,
      [
        input.caseId,

        normalizeRequiredCopyrightText(
          input.action
        ),

        input.actorUserId,

        normalizeRequiredCopyrightText(
          input.actorLabel
        ),

        input.previousStatus,
        input.resultingStatus,

        JSON.stringify(
          input.metadata ??
          {}
        ),

        input.occurredAt,
      ],
      executor
    );

  const record =
    result.rows[0];

  if (
    !record
  ) {
    throw new Error(
      "PostgreSQL did not return the copyright audit event."
    );
  }

  return mapAuditRow(
    record
  );
}

export async function listCopyrightAuditEvents(
  caseId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightAuditEventRecord[]> {
  const result =
    await executeDatabaseQuery<
      AuditDatabaseRow
    >(
      `
        SELECT
          ${AUDIT_COLUMNS}
        FROM app.copyright_case_audit_events
        WHERE case_id = $1::uuid
        ORDER BY
          occurred_at DESC,
          id DESC
      `,
      [
        caseId,
      ],
      executor
    );

  return result.rows.map(
    mapAuditRow
  );
}