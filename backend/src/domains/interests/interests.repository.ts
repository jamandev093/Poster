import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  assertValidInterestConsent,
  type DeclaredInterestStatus,
  type RemoveUserDeclaredInterestInput,
  type UpdateDeclaredInterestConsentInput,
  type UpsertUserDeclaredInterestInput,
  type UserDeclaredInterestRecord,
} from "./interests.types.js";

interface UserDeclaredInterestDatabaseRow
  extends QueryResultRow {
  user_id: string;

  topic_id: string;

  status:
    DeclaredInterestStatus;

  personalization_allowed: boolean;

  campaign_targeting_allowed: boolean;

  declared_at: Date;

  consent_updated_at: Date;

  removed_at:
    Date |
    null;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const DECLARED_INTEREST_COLUMNS = `
  user_id,
  topic_id,
  status,
  personalization_allowed,
  campaign_targeting_allowed,
  declared_at,
  consent_updated_at,
  removed_at,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapDeclaredInterestRow(
  row:
    UserDeclaredInterestDatabaseRow
): UserDeclaredInterestRecord {
  return {
    userId:
      row.user_id,

    topicId:
      row.topic_id,

    status:
      row.status,

    personalizationAllowed:
      row.personalization_allowed,

    campaignTargetingAllowed:
      row.campaign_targeting_allowed,

    declaredAt:
      row.declared_at,

    consentUpdatedAt:
      row.consent_updated_at,

    removedAt:
      row.removed_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalDeclaredInterestRow(
  row:
    UserDeclaredInterestDatabaseRow |
    undefined
): UserDeclaredInterestRecord | null {
  return row
    ? mapDeclaredInterestRow(
        row
      )
    : null;
}

export async function upsertUserDeclaredInterest(
  input:
    UpsertUserDeclaredInterestInput,
  executor?:
    DatabaseQueryExecutor
): Promise<UserDeclaredInterestRecord> {
  assertValidInterestConsent(
    input.personalizationAllowed,
    input.campaignTargetingAllowed
  );

  const result =
    await executeDatabaseQuery<
      UserDeclaredInterestDatabaseRow
    >(
      `
        INSERT INTO app.user_declared_interests (
          user_id,
          topic_id,
          status,
          personalization_allowed,
          campaign_targeting_allowed,
          declared_at,
          consent_updated_at,
          removed_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          'active',
          $3,
          $4,
          $5,
          $5,
          NULL
        )
        ON CONFLICT (
          user_id,
          topic_id
        )
        DO UPDATE
        SET
          status = 'active',
          personalization_allowed =
            EXCLUDED.personalization_allowed,
          campaign_targeting_allowed =
            EXCLUDED.campaign_targeting_allowed,
          declared_at =
            EXCLUDED.declared_at,
          consent_updated_at =
            EXCLUDED.consent_updated_at,
          removed_at = NULL
        RETURNING
          ${DECLARED_INTEREST_COLUMNS}
      `,
      [
        input.userId,
        input.topicId,
        input.personalizationAllowed,
        input.campaignTargetingAllowed,
        input.changedAt,
      ],
      executor
    );

  const interest =
    mapOptionalDeclaredInterestRow(
      result.rows[0]
    );

  if (
    !interest
  ) {
    throw new Error(
      "PostgreSQL did not return the declared interest."
    );
  }

  return interest;
}

export async function listActiveUserDeclaredInterests(
  userId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<UserDeclaredInterestRecord[]> {
  const result =
    await executeDatabaseQuery<
      UserDeclaredInterestDatabaseRow
    >(
      `
        SELECT
          ${DECLARED_INTEREST_COLUMNS}
        FROM app.user_declared_interests
        WHERE
          user_id = $1::uuid
          AND status = 'active'
        ORDER BY
          declared_at ASC,
          topic_id ASC
      `,
      [
        userId,
      ],
      executor
    );

  return result.rows.map(
    mapDeclaredInterestRow
  );
}

export async function updateDeclaredInterestConsent(
  input:
    UpdateDeclaredInterestConsentInput,
  executor?:
    DatabaseQueryExecutor
): Promise<UserDeclaredInterestRecord | null> {
  assertValidInterestConsent(
    input.personalizationAllowed,
    input.campaignTargetingAllowed
  );

  const result =
    await executeDatabaseQuery<
      UserDeclaredInterestDatabaseRow
    >(
      `
        UPDATE app.user_declared_interests
        SET
          personalization_allowed = $4,
          campaign_targeting_allowed = $5,
          consent_updated_at = $6
        WHERE
          user_id = $1::uuid
          AND topic_id = $2::uuid
          AND row_version =
            $3::bigint
          AND status = 'active'
        RETURNING
          ${DECLARED_INTEREST_COLUMNS}
      `,
      [
        input.userId,
        input.topicId,
        input.expectedRowVersion,
        input.personalizationAllowed,
        input.campaignTargetingAllowed,
        input.changedAt,
      ],
      executor
    );

  return mapOptionalDeclaredInterestRow(
    result.rows[0]
  );
}

export async function removeUserDeclaredInterest(
  input:
    RemoveUserDeclaredInterestInput,
  executor?:
    DatabaseQueryExecutor
): Promise<UserDeclaredInterestRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDeclaredInterestDatabaseRow
    >(
      `
        UPDATE app.user_declared_interests
        SET
          status = 'removed',
          personalization_allowed = false,
          campaign_targeting_allowed = false,
          consent_updated_at = $4,
          removed_at = $4
        WHERE
          user_id = $1::uuid
          AND topic_id = $2::uuid
          AND row_version =
            $3::bigint
          AND status = 'active'
        RETURNING
          ${DECLARED_INTEREST_COLUMNS}
      `,
      [
        input.userId,
        input.topicId,
        input.expectedRowVersion,
        input.removedAt,
      ],
      executor
    );

  return mapOptionalDeclaredInterestRow(
    result.rows[0]
  );
}
