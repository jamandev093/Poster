import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeOptionalCopyrightText,
  normalizeRequiredCopyrightText,
} from "./copyright-case.types.js";

import type {
  AppendCopyrightEvidenceReferenceInput,
  CopyrightEvidenceReferenceRecord,
  CopyrightEvidenceType,
} from "./copyright-evidence.types.js";

interface EvidenceDatabaseRow
  extends QueryResultRow {
  id: string;

  case_id: string;

  evidence_type:
    CopyrightEvidenceType;

  label: string;

  reference_value: string;

  storage_object_key:
    string |
    null;

  sha256_digest:
    string |
    null;

  submitted_at: Date;

  created_at: Date;
}

const EVIDENCE_COLUMNS = `
  id,
  case_id,
  evidence_type,
  label,
  reference_value,
  storage_object_key,
  sha256_digest,
  submitted_at,
  created_at
`;

function mapEvidenceRow(
  row:
    EvidenceDatabaseRow
): CopyrightEvidenceReferenceRecord {
  return {
    id:
      row.id,

    caseId:
      row.case_id,

    evidenceType:
      row.evidence_type,

    label:
      row.label,

    referenceValue:
      row.reference_value,

    storageObjectKey:
      row.storage_object_key,

    sha256Digest:
      row.sha256_digest,

    submittedAt:
      row.submitted_at,

    createdAt:
      row.created_at,
  };
}

export async function appendCopyrightEvidenceReference(
  input:
    AppendCopyrightEvidenceReferenceInput,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightEvidenceReferenceRecord> {
  const result =
    await executeDatabaseQuery<
      EvidenceDatabaseRow
    >(
      `
        INSERT INTO app.copyright_evidence_references (
          case_id,
          evidence_type,
          label,
          reference_value,
          storage_object_key,
          sha256_digest,
          submitted_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING
          ${EVIDENCE_COLUMNS}
      `,
      [
        input.caseId,
        input.evidenceType,

        normalizeRequiredCopyrightText(
          input.label
        ),

        normalizeRequiredCopyrightText(
          input.referenceValue
        ),

        normalizeOptionalCopyrightText(
          input.storageObjectKey
        ),

        normalizeOptionalCopyrightText(
          input.sha256Digest
        )?.toLowerCase() ??
        null,

        input.submittedAt,
      ],
      executor
    );

  const record =
    result.rows[0];

  if (
    !record
  ) {
    throw new Error(
      "PostgreSQL did not return the copyright evidence reference."
    );
  }

  return mapEvidenceRow(
    record
  );
}

export async function listCopyrightEvidenceReferences(
  caseId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<CopyrightEvidenceReferenceRecord[]> {
  const result =
    await executeDatabaseQuery<
      EvidenceDatabaseRow
    >(
      `
        SELECT
          ${EVIDENCE_COLUMNS}
        FROM app.copyright_evidence_references
        WHERE case_id = $1::uuid
        ORDER BY
          submitted_at DESC,
          id DESC
      `,
      [
        caseId,
      ],
      executor
    );

  return result.rows.map(
    mapEvidenceRow
  );
}