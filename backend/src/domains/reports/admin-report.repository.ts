import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeOptionalReportText,
  normalizeRequiredReportText,
  type AdminReportAffectedKind,
  type AdminReportRecord,
  type AdminReportStatus,
  type AdminReportType,
  type CreateAdminReportInput,
  type ReopenAdminReportInput,
  type ResolveAdminReportInput,
  type RouteAdminReportToCopyrightInput,
} from "./admin-report.types.js";

interface AdminReportDatabaseRow
  extends QueryResultRow {
  id: string;

  public_id: string;

  report_type:
    AdminReportType;

  status:
    AdminReportStatus;

  reporter_name: string;

  reporter_reference: string;

  affected_kind:
    AdminReportAffectedKind;

  affected_record_id: string;

  affected_title: string;

  affected_metadata: string;

  reason: string;

  routed_to_copyright: boolean;

  copyright_case_id:
    string |
    null;

  resolution_note:
    string |
    null;

  received_at: Date;

  resolved_at:
    Date |
    null;

  resolved_by_user_id:
    string |
    null;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const ADMIN_REPORT_COLUMNS = `
  id,
  public_id,
  report_type,
  status,
  reporter_name,
  reporter_reference,
  affected_kind,
  affected_record_id,
  affected_title,
  affected_metadata,
  reason,
  routed_to_copyright,
  copyright_case_id,
  resolution_note,
  received_at,
  resolved_at,
  resolved_by_user_id,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapAdminReportRow(
  row:
    AdminReportDatabaseRow
): AdminReportRecord {
  return {
    id:
      row.id,

    publicId:
      row.public_id,

    reportType:
      row.report_type,

    status:
      row.status,

    reporterName:
      row.reporter_name,

    reporterReference:
      row.reporter_reference,

    affectedKind:
      row.affected_kind,

    affectedRecordId:
      row.affected_record_id,

    affectedTitle:
      row.affected_title,

    affectedMetadata:
      row.affected_metadata,

    reason:
      row.reason,

    routedToCopyright:
      row.routed_to_copyright,

    copyrightCaseId:
      row.copyright_case_id,

    resolutionNote:
      row.resolution_note,

    receivedAt:
      row.received_at,

    resolvedAt:
      row.resolved_at,

    resolvedByUserId:
      row.resolved_by_user_id,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalAdminReportRow(
  row:
    AdminReportDatabaseRow |
    undefined
): AdminReportRecord | null {
  return row
    ? mapAdminReportRow(
        row
      )
    : null;
}

export async function createAdminReport(
  input:
    CreateAdminReportInput,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        INSERT INTO app.admin_reports (
          public_id,
          report_type,
          reporter_name,
          reporter_reference,
          affected_kind,
          affected_record_id,
          affected_title,
          affected_metadata,
          reason,
          received_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
        RETURNING
          ${ADMIN_REPORT_COLUMNS}
      `,
      [
        normalizeRequiredReportText(
          input.publicId
        ),

        input.reportType,

        normalizeRequiredReportText(
          input.reporterName
        ),

        normalizeRequiredReportText(
          input.reporterReference
        ),

        input.affectedKind,

        normalizeRequiredReportText(
          input.affectedRecordId
        ),

        normalizeRequiredReportText(
          input.affectedTitle
        ),

        normalizeRequiredReportText(
          input.affectedMetadata
        ),

        normalizeRequiredReportText(
          input.reason
        ),

        input.receivedAt,
      ],
      executor
    );

  const record =
    mapOptionalAdminReportRow(
      result.rows[0]
    );

  if (
    !record
  ) {
    throw new Error(
      "PostgreSQL did not return the created Admin report."
    );
  }

  return record;
}

export async function findAdminReportById(
  reportId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord | null> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        SELECT
          ${ADMIN_REPORT_COLUMNS}
        FROM app.admin_reports
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        reportId,
      ],
      executor
    );

  return mapOptionalAdminReportRow(
    result.rows[0]
  );
}

export async function findAdminReportByPublicId(
  publicId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord | null> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        SELECT
          ${ADMIN_REPORT_COLUMNS}
        FROM app.admin_reports
        WHERE public_id = $1
        LIMIT 1
      `,
      [
        normalizeRequiredReportText(
          publicId
        ),
      ],
      executor
    );

  return mapOptionalAdminReportRow(
    result.rows[0]
  );
}

export async function listAdminReports(
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord[]> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        SELECT
          ${ADMIN_REPORT_COLUMNS}
        FROM app.admin_reports
        ORDER BY
          CASE status
            WHEN 'needs_action'
              THEN 0
            WHEN 'resolved'
              THEN 1
            ELSE 2
          END,
          received_at DESC,
          id DESC
      `,
      [],
      executor
    );

  return result.rows.map(
    mapAdminReportRow
  );
}

export async function listActionableAdminReports(
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord[]> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        SELECT
          ${ADMIN_REPORT_COLUMNS}
        FROM app.admin_reports
        WHERE status = 'needs_action'
        ORDER BY
          received_at DESC,
          id DESC
      `,
      [],
      executor
    );

  return result.rows.map(
    mapAdminReportRow
  );
}

export async function resolveAdminReport(
  input:
    ResolveAdminReportInput,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord | null> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        UPDATE app.admin_reports
        SET
          status = $3,
          resolution_note = $4,
          resolved_at = $5,
          resolved_by_user_id = $6::uuid
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
          AND status =
            'needs_action'
        RETURNING
          ${ADMIN_REPORT_COLUMNS}
      `,
      [
        input.reportId,
        input.expectedRowVersion,
        input.status,

        normalizeOptionalReportText(
          input.resolutionNote
        ),

        input.resolvedAt,
        input.resolvedByUserId,
      ],
      executor
    );

  return mapOptionalAdminReportRow(
    result.rows[0]
  );
}

export async function routeAdminReportToCopyright(
  input:
    RouteAdminReportToCopyrightInput,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord | null> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        UPDATE app.admin_reports
        SET
          status = 'resolved',
          routed_to_copyright = true,
          copyright_case_id =
            $3::uuid,
          resolution_note = $4,
          resolved_at = $5,
          resolved_by_user_id =
            $6::uuid
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
          AND status =
            'needs_action'
          AND report_type =
            'copyright'
        RETURNING
          ${ADMIN_REPORT_COLUMNS}
      `,
      [
        input.reportId,
        input.expectedRowVersion,
        input.copyrightCaseId,

        normalizeOptionalReportText(
          input.resolutionNote
        ),

        input.resolvedAt,
        input.resolvedByUserId,
      ],
      executor
    );

  return mapOptionalAdminReportRow(
    result.rows[0]
  );
}

export async function reopenAdminReport(
  input:
    ReopenAdminReportInput,
  executor?:
    DatabaseQueryExecutor
): Promise<AdminReportRecord | null> {
  const result =
    await executeDatabaseQuery<
      AdminReportDatabaseRow
    >(
      `
        UPDATE app.admin_reports
        SET
          status = 'needs_action',
          routed_to_copyright = false,
          copyright_case_id = NULL,
          resolution_note = NULL,
          resolved_at = NULL,
          resolved_by_user_id = NULL
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
        RETURNING
          ${ADMIN_REPORT_COLUMNS}
      `,
      [
        input.reportId,
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalAdminReportRow(
    result.rows[0]
  );
}