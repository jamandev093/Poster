import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeRequiredAnalyticsText,
} from "./analytics-event.types.js";

import type {
  CompleteEventValidationInput,
  CreatePendingEventValidationInput,
  MonetizationEventValidationRecord,
  MonetizationEventValidationStatus,
} from "./analytics-validation.types.js";

interface EventValidationDatabaseRow
  extends QueryResultRow {
  event_id: string;

  validation_status:
    MonetizationEventValidationStatus;

  invalid_reason_codes:
    string[];

  duplicate_of_event_id:
    string |
    null;

  validator_version:
    string |
    null;

  validated_at:
    Date |
    null;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const EVENT_VALIDATION_COLUMNS = `
  event_id,
  validation_status,
  invalid_reason_codes,
  duplicate_of_event_id,
  validator_version,
  validated_at,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapEventValidationRow(
  row:
    EventValidationDatabaseRow
): MonetizationEventValidationRecord {
  return {
    eventId:
      row.event_id,

    validationStatus:
      row.validation_status,

    invalidReasonCodes:
      row.invalid_reason_codes,

    duplicateOfEventId:
      row.duplicate_of_event_id,

    validatorVersion:
      row.validator_version,

    validatedAt:
      row.validated_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalEventValidationRow(
  row:
    EventValidationDatabaseRow |
    undefined
): MonetizationEventValidationRecord | null {
  return row
    ? mapEventValidationRow(
        row
      )
    : null;
}

export async function createPendingMonetizationEventValidation(
  input:
    CreatePendingEventValidationInput,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationEventValidationRecord> {
  const result =
    await executeDatabaseQuery<
      EventValidationDatabaseRow
    >(
      `
        INSERT INTO app.monetization_campaign_event_validations (
          event_id
        )
        VALUES (
          $1::uuid
        )
        ON CONFLICT (
          event_id
        )
        DO NOTHING
        RETURNING
          ${EVENT_VALIDATION_COLUMNS}
      `,
      [
        input.eventId,
      ],
      executor
    );

  const created =
    result.rows[0];

  if (
    created
  ) {
    return mapEventValidationRow(
      created
    );
  }

  const existing =
    await findMonetizationEventValidation(
      input.eventId,
      executor
    );

  if (
    !existing
  ) {
    throw new Error(
      "PostgreSQL did not return or locate the pending monetization event validation."
    );
  }

  return existing;
}

export async function findMonetizationEventValidation(
  eventId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationEventValidationRecord | null> {
  const result =
    await executeDatabaseQuery<
      EventValidationDatabaseRow
    >(
      `
        SELECT
          ${EVENT_VALIDATION_COLUMNS}
        FROM app.monetization_campaign_event_validations
        WHERE event_id = $1::uuid
        LIMIT 1
      `,
      [
        eventId,
      ],
      executor
    );

  return mapOptionalEventValidationRow(
    result.rows[0]
  );
}

export async function completeMonetizationEventValidation(
  input:
    CompleteEventValidationInput,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationEventValidationRecord | null> {
  const result =
    await executeDatabaseQuery<
      EventValidationDatabaseRow
    >(
      `
        UPDATE app.monetization_campaign_event_validations
        SET
          validation_status = $3,
          invalid_reason_codes =
            $4::text[],
          duplicate_of_event_id =
            $5::uuid,
          validator_version = $6,
          validated_at = $7
        WHERE
          event_id = $1::uuid
          AND row_version =
            $2::bigint
          AND validation_status =
            'pending'
        RETURNING
          ${EVENT_VALIDATION_COLUMNS}
      `,
      [
        input.eventId,
        input.expectedRowVersion,
        input.validationStatus,

        input.invalidReasonCodes.map(
          normalizeRequiredAnalyticsText
        ),

        input.duplicateOfEventId,

        normalizeRequiredAnalyticsText(
          input.validatorVersion
        ),

        input.validatedAt,
      ],
      executor
    );

  return mapOptionalEventValidationRow(
    result.rows[0]
  );
}