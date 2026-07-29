import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  CommercialDecisionInput,
  CommercialRequestListResult,
  CommercialRequestRecord,
  CommercialRequestStatus,
  CommercialRequestType,
  CreateCommercialRequestInput,
  ListCommercialRequestsInput,
  MonetizationPlacement,
  ResubmitCommercialRequestInput,
} from "./commercial.types.js";

interface CommercialRequestDatabaseRow
  extends QueryResultRow {
  id: string;
  request_reference: string;
  organization_id: string;
  submitted_by_user_id: string;
  request_type: CommercialRequestType;
  status: CommercialRequestStatus;
  title: string;
  objective: string;
  destination_url: string;
  requested_placements: MonetizationPlacement[];
  requested_start_date: string;
  requested_end_date: string;
  budget_minor_units: string | null;
  currency_code: string | null;
  creative_spec: Record<string, unknown>;
  commercial_terms: Record<string, unknown>;
  submitted_at: Date;
  decided_at: Date | null;
  decided_by_user_id: string | null;
  decision_note: string | null;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

interface CountDatabaseRow
  extends QueryResultRow {
  total: string;
}

const COMMERCIAL_REQUEST_COLUMNS = `
  id,
  request_reference,
  organization_id,
  submitted_by_user_id,
  request_type,
  status,
  title,
  objective,
  destination_url,
  requested_placements,
  requested_start_date::text
    AS requested_start_date,
  requested_end_date::text
    AS requested_end_date,
  budget_minor_units::text
    AS budget_minor_units,
  currency_code,
  creative_spec,
  commercial_terms,
  submitted_at,
  decided_at,
  decided_by_user_id,
  decision_note,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

export function mapCommercialRequestDatabaseRow(
  row: CommercialRequestDatabaseRow
): CommercialRequestRecord {
  return {
    id: row.id,
    requestReference: row.request_reference,
    organizationId: row.organization_id,
    submittedByUserId: row.submitted_by_user_id,
    requestType: row.request_type,
    status: row.status,
    title: row.title,
    objective: row.objective,
    destinationUrl: row.destination_url,
    requestedPlacements: row.requested_placements,
    requestedStartDate: row.requested_start_date,
    requestedEndDate: row.requested_end_date,
    budgetMinorUnits: row.budget_minor_units,
    currencyCode: row.currency_code,
    creativeSpec: row.creative_spec,
    commercialTerms: row.commercial_terms,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    decidedByUserId: row.decided_by_user_id,
    decisionNote: row.decision_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalCommercialRequestRow(
  row: CommercialRequestDatabaseRow | undefined
): CommercialRequestRecord | null {
  return row
    ? mapCommercialRequestDatabaseRow(row)
    : null;
}

export async function createCommercialRequest(
  input: CreateCommercialRequestInput,
  executor?: DatabaseQueryExecutor
): Promise<CommercialRequestRecord> {
  const result =
    await executeDatabaseQuery<CommercialRequestDatabaseRow>(
      `
        INSERT INTO app.commercial_requests (
          request_reference,
          organization_id,
          submitted_by_user_id,
          request_type,
          status,
          title,
          objective,
          destination_url,
          requested_placements,
          requested_start_date,
          requested_end_date,
          budget_minor_units,
          currency_code,
          creative_spec,
          commercial_terms,
          submitted_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4,
          'pending_review',
          $5,
          $6,
          $7,
          $8::text[],
          $9::date,
          $10::date,
          $11::bigint,
          $12,
          $13::jsonb,
          $14::jsonb,
          $15
        )
        RETURNING
          ${COMMERCIAL_REQUEST_COLUMNS}
      `,
      [
        input.requestReference,
        input.organizationId,
        input.submittedByUserId,
        input.requestType,
        input.title.trim(),
        input.objective.trim(),
        input.destinationUrl.trim(),
        [...input.requestedPlacements],
        input.requestedStartDate,
        input.requestedEndDate,
        input.budgetMinorUnits == null
          ? null
          : input.budgetMinorUnits.toString(),
        input.currencyCode?.trim().toUpperCase() ?? null,
        input.creativeSpec,
        input.commercialTerms,
        input.submittedAt,
      ],
      executor
    );

  const created =
    mapOptionalCommercialRequestRow(result.rows[0]);

  if (!created) {
    throw new Error(
      "PostgreSQL did not return the created commercial request."
    );
  }

  return created;
}

export async function findCommercialRequestById(
  requestId: string,
  executor?: DatabaseQueryExecutor
): Promise<CommercialRequestRecord | null> {
  const result =
    await executeDatabaseQuery<CommercialRequestDatabaseRow>(
      `
        SELECT
          ${COMMERCIAL_REQUEST_COLUMNS}
        FROM app.commercial_requests
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        requestId,
      ],
      executor
    );

  return mapOptionalCommercialRequestRow(result.rows[0]);
}

export async function findCommercialRequestByIdForUpdate(
  requestId: string,
  executor: DatabaseQueryExecutor
): Promise<CommercialRequestRecord | null> {
  const result =
    await executeDatabaseQuery<CommercialRequestDatabaseRow>(
      `
        SELECT
          ${COMMERCIAL_REQUEST_COLUMNS}
        FROM app.commercial_requests
        WHERE id = $1::uuid
        LIMIT 1
        FOR UPDATE
      `,
      [
        requestId,
      ],
      executor
    );

  return mapOptionalCommercialRequestRow(result.rows[0]);
}

export async function listCommercialRequests(
  input: ListCommercialRequestsInput,
  executor?: DatabaseQueryExecutor
): Promise<CommercialRequestListResult> {
  const filterParameters = [
    input.organizationId ?? null,
    input.status ?? null,
    input.requestType ?? null,
  ];

  const whereClause = `
    WHERE
      (
        $1::uuid IS NULL
        OR organization_id = $1::uuid
      )
      AND (
        $2::text IS NULL
        OR status = $2
      )
      AND (
        $3::text IS NULL
        OR request_type = $3
      )
  `;

  const itemResult =
    await executeDatabaseQuery<CommercialRequestDatabaseRow>(
      `
        SELECT
          ${COMMERCIAL_REQUEST_COLUMNS}
        FROM app.commercial_requests
        ${whereClause}
        ORDER BY
          submitted_at DESC,
          id DESC
        LIMIT $4::integer
        OFFSET $5::integer
      `,
      [
        ...filterParameters,
        input.limit,
        input.offset,
      ],
      executor
    );

  const countResult =
    await executeDatabaseQuery<CountDatabaseRow>(
      `
        SELECT
          count(*)::text
            AS total
        FROM app.commercial_requests
        ${whereClause}
      `,
      filterParameters,
      executor
    );

  return {
    items:
      itemResult.rows.map(
        mapCommercialRequestDatabaseRow
      ),

    total:
      Number.parseInt(
        countResult.rows[0]?.total ?? "0",
        10
      ),

    limit:
      input.limit,

    offset:
      input.offset,
  };
}

export async function updateCommercialRequestForResubmission(
  input: ResubmitCommercialRequestInput,
  executor: DatabaseQueryExecutor
): Promise<CommercialRequestRecord | null> {
  const result =
    await executeDatabaseQuery<CommercialRequestDatabaseRow>(
      `
        UPDATE app.commercial_requests
        SET
          submitted_by_user_id = $4::uuid,
          request_type = $5,
          status = 'pending_review',
          title = $6,
          objective = $7,
          destination_url = $8,
          requested_placements = $9::text[],
          requested_start_date = $10::date,
          requested_end_date = $11::date,
          budget_minor_units = $12::bigint,
          currency_code = $13,
          creative_spec = $14::jsonb,
          commercial_terms = $15::jsonb,
          submitted_at = $16,
          decided_at = NULL,
          decided_by_user_id = NULL,
          decision_note = NULL
        WHERE
          id = $1::uuid
          AND organization_id = $2::uuid
          AND row_version = $3::bigint
          AND status = 'changes_requested'
        RETURNING
          ${COMMERCIAL_REQUEST_COLUMNS}
      `,
      [
        input.requestId,
        input.organizationId,
        input.expectedRowVersion,
        input.submittedByUserId,
        input.requestType,
        input.title.trim(),
        input.objective.trim(),
        input.destinationUrl.trim(),
        [...input.requestedPlacements],
        input.requestedStartDate,
        input.requestedEndDate,
        input.budgetMinorUnits == null
          ? null
          : input.budgetMinorUnits.toString(),
        input.currencyCode?.trim().toUpperCase() ?? null,
        input.creativeSpec,
        input.commercialTerms,
        input.submittedAt,
      ],
      executor
    );

  return mapOptionalCommercialRequestRow(result.rows[0]);
}

async function markCommercialRequestDecision(
  input: CommercialDecisionInput,
  status:
    | "changes_requested"
    | "approved"
    | "rejected",
  executor: DatabaseQueryExecutor
): Promise<CommercialRequestRecord | null> {
  const result =
    await executeDatabaseQuery<CommercialRequestDatabaseRow>(
      `
        UPDATE app.commercial_requests
        SET
          status = $5,
          decided_at = $4,
          decided_by_user_id = $3::uuid,
          decision_note = $6
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND status = 'pending_review'
        RETURNING
          ${COMMERCIAL_REQUEST_COLUMNS}
      `,
      [
        input.requestId,
        input.expectedRowVersion,
        input.actorUserId,
        input.decidedAt,
        status,
        input.decisionNote,
      ],
      executor
    );

  return mapOptionalCommercialRequestRow(result.rows[0]);
}

export async function markCommercialRequestChangesRequested(
  input: CommercialDecisionInput,
  executor: DatabaseQueryExecutor
): Promise<CommercialRequestRecord | null> {
  return await markCommercialRequestDecision(
    input,
    "changes_requested",
    executor
  );
}

export async function markCommercialRequestRejected(
  input: CommercialDecisionInput,
  executor: DatabaseQueryExecutor
): Promise<CommercialRequestRecord | null> {
  return await markCommercialRequestDecision(
    input,
    "rejected",
    executor
  );
}

export async function markCommercialRequestApproved(
  input: CommercialDecisionInput,
  executor: DatabaseQueryExecutor
): Promise<CommercialRequestRecord | null> {
  return await markCommercialRequestDecision(
    input,
    "approved",
    executor
  );
}
