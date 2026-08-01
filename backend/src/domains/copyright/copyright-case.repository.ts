import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeCopyrightUrl,
  normalizeOptionalCopyrightText,
  normalizeRequiredCopyrightText,
  type CopyrightCaseAction,
  type CopyrightCaseRecord,
  type CopyrightCaseStatus,
  type CopyrightRequestType,
  type CopyrightVerificationStatus,
  type CreateCopyrightCaseInput,
  type ResolveCopyrightCaseInput,
} from "./copyright-case.types.js";

interface CopyrightCaseDatabaseRow
  extends QueryResultRow {
  id: string;

  public_id: string;

  request_type:
    CopyrightRequestType;

  status:
    CopyrightCaseStatus;

  content_id: string;

  claimant_name: string;

  claimant_type: string;

  claimant_business_email:
    string |
    null;

  claimant_website_url:
    string |
    null;

  claimant_reference:
    string |
    null;

  request_reason: string;

  submitted_original_url:
    string |
    null;

  supporting_information:
    string |
    null;

  verification_status:
    CopyrightVerificationStatus;

  action_taken:
    CopyrightCaseAction |
    null;

  prevent_reimport: boolean;

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

const COPYRIGHT_CASE_COLUMNS = `
  id,
  public_id,
  request_type,
  status,
  content_id,
  claimant_name,
  claimant_type,
  claimant_business_email,
  claimant_website_url,
  claimant_reference,
  request_reason,
  submitted_original_url,
  supporting_information,
  verification_status,
  action_taken,
  prevent_reimport,
  received_at,
  resolved_at,
  resolved_by_user_id,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapCopyrightCaseRow(
  row:
    CopyrightCaseDatabaseRow
): CopyrightCaseRecord {
  return {
    id:
      row.id,

    publicId:
      row.public_id,

    requestType:
      row.request_type,

    status:
      row.status,

    contentId:
      row.content_id,

    claimantName:
      row.claimant_name,

    claimantType:
      row.claimant_type,

    claimantBusinessEmail:
      row.claimant_business_email,

    claimantWebsiteUrl:
      row.claimant_website_url,

    claimantReference:
      row.claimant_reference,

    requestReason:
      row.request_reason,

    submittedOriginalUrl:
      row.submitted_original_url,

    supportingInformation:
      row.supporting_information,

    verificationStatus:
      row.verification_status,

    actionTaken:
      row.action_taken,

    preventReimport:
      row.prevent_reimport,

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

function mapOptionalCopyrightCaseRow(
  row:
    CopyrightCaseDatabaseRow |
    undefined
): CopyrightCaseRecord | null {
  return row
    ? mapCopyrightCaseRow(
        row
      )
    : null;
}

export async function createCopyrightCase(
  input:
    CreateCopyrightCaseInput,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightCaseRecord> {
  const result =
    await executeDatabaseQuery<
      CopyrightCaseDatabaseRow
    >(
      `
        INSERT INTO app.copyright_cases (
          public_id,
          request_type,
          content_id,
          claimant_name,
          claimant_type,
          claimant_business_email,
          claimant_website_url,
          claimant_reference,
          request_reason,
          submitted_original_url,
          supporting_information,
          received_at
        )
        VALUES (
          $1,
          $2,
          $3::uuid,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12
        )
        RETURNING
          ${COPYRIGHT_CASE_COLUMNS}
      `,
      [
        normalizeRequiredCopyrightText(
          input.publicId
        ),

        input.requestType,
        input.contentId,

        normalizeRequiredCopyrightText(
          input.claimantName
        ),

        normalizeRequiredCopyrightText(
          input.claimantType
        ),

        normalizeOptionalCopyrightText(
          input.claimantBusinessEmail
        ),

        normalizeCopyrightUrl(
          input.claimantWebsiteUrl
        ),

        normalizeOptionalCopyrightText(
          input.claimantReference
        ),

        normalizeRequiredCopyrightText(
          input.requestReason
        ),

        normalizeCopyrightUrl(
          input.submittedOriginalUrl
        ),

        normalizeOptionalCopyrightText(
          input.supportingInformation
        ),

        input.receivedAt,
      ],
      executor
    );

  const record =
    mapOptionalCopyrightCaseRow(
      result.rows[0]
    );

  if (
    !record
  ) {
    throw new Error(
      "PostgreSQL did not return the created copyright case."
    );
  }

  return record;
}

export async function findCopyrightCaseById(
  caseId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightCaseRecord | null> {
  const result =
    await executeDatabaseQuery<
      CopyrightCaseDatabaseRow
    >(
      `
        SELECT
          ${COPYRIGHT_CASE_COLUMNS}
        FROM app.copyright_cases
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        caseId,
      ],
      executor
    );

  return mapOptionalCopyrightCaseRow(
    result.rows[0]
  );
}

export async function findCopyrightCaseByPublicId(
  publicId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightCaseRecord | null> {
  const result =
    await executeDatabaseQuery<
      CopyrightCaseDatabaseRow
    >(
      `
        SELECT
          ${COPYRIGHT_CASE_COLUMNS}
        FROM app.copyright_cases
        WHERE public_id = $1
        LIMIT 1
      `,
      [
        normalizeRequiredCopyrightText(
          publicId
        ),
      ],
      executor
    );

  return mapOptionalCopyrightCaseRow(
    result.rows[0]
  );
}

export async function listCopyrightCases(
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightCaseRecord[]> {
  const result =
    await executeDatabaseQuery<
      CopyrightCaseDatabaseRow
    >(
      `
        SELECT
          ${COPYRIGHT_CASE_COLUMNS}
        FROM app.copyright_cases
        ORDER BY
          CASE status
            WHEN 'needs_action'
              THEN 0
            WHEN 'removed'
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
    mapCopyrightCaseRow
  );
}

export async function resolveCopyrightCase(
  input:
    ResolveCopyrightCaseInput,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightCaseRecord | null> {
  const result =
    await executeDatabaseQuery<
      CopyrightCaseDatabaseRow
    >(
      `
        UPDATE app.copyright_cases
        SET
          status = $3,
          action_taken = $4,
          prevent_reimport = $5,
          resolved_at = $6,
          resolved_by_user_id = $7::uuid
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
        RETURNING
          ${COPYRIGHT_CASE_COLUMNS}
      `,
      [
        input.caseId,
        input.expectedRowVersion,
        input.status,
        input.actionTaken,
        input.preventReimport,
        input.resolvedAt,
        input.resolvedByUserId,
      ],
      executor
    );

  return mapOptionalCopyrightCaseRow(
    result.rows[0]
  );
}

export async function reopenCopyrightCase(
  input: {
    caseId: string;

    expectedRowVersion: string;
  },
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightCaseRecord | null> {
  const result =
    await executeDatabaseQuery<
      CopyrightCaseDatabaseRow
    >(
      `
        UPDATE app.copyright_cases
        SET
          status = 'needs_action',
          action_taken = NULL,
          prevent_reimport = false,
          resolved_at = NULL,
          resolved_by_user_id = NULL
        WHERE
          id = $1::uuid
          AND row_version =
            $2::bigint
        RETURNING
          ${COPYRIGHT_CASE_COLUMNS}
      `,
      [
        input.caseId,
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalCopyrightCaseRow(
    result.rows[0]
  );
}