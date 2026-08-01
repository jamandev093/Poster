import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeRequiredReportText,
  type AdminReportStatus,
} from "./admin-report.types.js";

import type {
  AdminReportAuditEventRecord,
  AppendAdminReportAuditEventInput,
} from "./admin-report-audit.types.js";

interface AdminReportAuditDatabaseRow
  extends QueryResultRow {
  id: string;

  report_id: string;

  action: string;

  actor_user_id:
    string |
    null;

  actor_label: string;

  previous_status:
    AdminReportStatus |
    null;

  resulting_status:
    AdminReportStatus |
    null;

  metadata:
    Record<
      string,
      unknown
    >;

  occurred_at: Date;
}

const ADMIN_REPORT_AUDIT_COLUMNS = `
  id,
  report_id,
  action,
  actor_user_id,
  actor_label,
  previous_status,
  resulting_status,
  metadata,
  occurred_at
`;

function mapAdminReportAuditRow(
  row:
    AdminReportAuditDatabaseRow
): AdminReportAuditEventRecord {
  return {
    id:
      row.id,

    reportId:
      row.report_id,

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

export async function appendAdminReportAuditEvent(
  input:
    AppendAdminReportAuditEventInput,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportAuditEventRecord> {
  const result =
    await executeDatabaseQuery<
      AdminReportAuditDatabaseRow
    >(
      `
        INSERT INTO app.admin_report_audit_events (
          report_id,
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
          ${ADMIN_REPORT_AUDIT_COLUMNS}
      `,
      [
        input.reportId,

        normalizeRequiredReportText(
          input.action
        ),

        input.actorUserId,

        normalizeRequiredReportText(
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
      "PostgreSQL did not return the Admin report audit event."
    );
  }

  return mapAdminReportAuditRow(
    record
  );
}

export async function listAdminReportAuditEvents(
  reportId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportAuditEventRecord[]> {
  const result =
    await executeDatabaseQuery<
      AdminReportAuditDatabaseRow
    >(
      `
        SELECT
          ${ADMIN_REPORT_AUDIT_COLUMNS}
        FROM app.admin_report_audit_events
        WHERE report_id =
          $1::uuid
        ORDER BY
          occurred_at DESC,
          id DESC
      `,
      [
        reportId,
      ],
      executor
    );

  return result.rows.map(
    mapAdminReportAuditRow
  );
}