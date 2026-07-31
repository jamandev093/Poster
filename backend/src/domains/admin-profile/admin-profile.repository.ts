import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeIdentityEmail,
  normalizeOptionalIdentityText,
  normalizeRequiredIdentityText,
} from "../identity/identity.types.js";

import type {
  AdminProfileRecord,
  UpdateAdminProfileInput,
} from "./admin-profile.types.js";

interface AdminProfileDatabaseRow
  extends QueryResultRow {
  user_id: string;

  login_email: string;

  full_name: string;

  display_name: string;

  job_title:
    | string
    | null;

  business_email:
    | string
    | null;

  primary_phone:
    | string
    | null;

  alternate_phone:
    | string
    | null;

  signal_account:
    | string
    | null;

  telegram_username:
    | string
    | null;

  preferred_language:
    | "en"
    | "hi";

  time_zone: string;

  email_verified_at:
    | Date
    | null;

  last_login_at:
    | Date
    | null;

  account_created_at: Date;

  profile_created_at: Date;

  profile_updated_at: Date;

  row_version: string;
}

const PROFILE_SELECT = `
  SELECT
    users.id
      AS user_id,

    users.email
      AS login_email,

    users.full_name,

    profiles.display_name,
    profiles.job_title,
    profiles.business_email,
    profiles.primary_phone,
    profiles.alternate_phone,
    profiles.signal_account,
    profiles.telegram_username,
    profiles.preferred_language,
    profiles.time_zone,

    users.email_verified_at,
    users.last_login_at,

    users.created_at
      AS account_created_at,

    profiles.created_at
      AS profile_created_at,

    profiles.updated_at
      AS profile_updated_at,

    profiles.row_version::text
      AS row_version

  FROM app.users AS users

  INNER JOIN app.admin_profiles AS profiles
    ON profiles.user_id = users.id
`;

function mapProfileRow(
  row:
    AdminProfileDatabaseRow
): AdminProfileRecord {
  return {
    userId:
      row.user_id,

    loginEmail:
      row.login_email,

    fullName:
      row.full_name,

    displayName:
      row.display_name,

    jobTitle:
      row.job_title,

    businessEmail:
      row.business_email,

    primaryPhone:
      row.primary_phone,

    alternatePhone:
      row.alternate_phone,

    signalAccount:
      row.signal_account,

    telegramUsername:
      row.telegram_username,

    preferredLanguage:
      row.preferred_language,

    timeZone:
      row.time_zone,

    emailVerifiedAt:
      row.email_verified_at,

    lastLoginAt:
      row.last_login_at,

    accountCreatedAt:
      row.account_created_at,

    createdAt:
      row.profile_created_at,

    updatedAt:
      row.profile_updated_at,

    rowVersion:
      row.row_version,
  };
}

export async function ensureAdminProfile(
  userId: string,
  executor?: DatabaseQueryExecutor
): Promise<void> {
  await executeDatabaseQuery(
    `
      INSERT INTO app.admin_profiles (
        user_id,
        display_name
      )
      SELECT
        users.id,
        users.full_name
      FROM app.users AS users
      WHERE
        users.id = $1::uuid
        AND users.deleted_at IS NULL
      ON CONFLICT (
        user_id
      )
      DO NOTHING
    `,
    [
      userId,
    ],
    executor
  );
}

export async function findAdminProfile(
  userId: string,
  executor?: DatabaseQueryExecutor
): Promise<
  AdminProfileRecord |
  null
> {
  const result =
    await executeDatabaseQuery<
      AdminProfileDatabaseRow
    >(
      `
        ${PROFILE_SELECT}

        WHERE
          users.id = $1::uuid
          AND users.deleted_at IS NULL

        LIMIT 1
      `,
      [
        userId,
      ],
      executor
    );

  const row =
    result.rows[0];

  return row
    ? mapProfileRow(row)
    : null;
}

export async function updateAdminProfile(
  input:
    UpdateAdminProfileInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  AdminProfileRecord |
  null
> {
  await executeDatabaseQuery(
    `
      UPDATE app.users
      SET
        full_name = $2
      WHERE
        id = $1::uuid
        AND deleted_at IS NULL
    `,
    [
      input.userId,

      normalizeRequiredIdentityText(
        input.fullName
      ),
    ],
    executor
  );

  const result =
    await executeDatabaseQuery<
      AdminProfileDatabaseRow
    >(
      `
        UPDATE app.admin_profiles
        SET
          display_name = $3,
          job_title = $4,
          business_email = $5,
          primary_phone = $6,
          alternate_phone = $7,
          signal_account = $8,
          telegram_username = $9,
          preferred_language = $10,
          time_zone = $11
        WHERE
          user_id = $1::uuid
          AND row_version = $2::bigint
        RETURNING
          user_id
      `,
      [
        input.userId,
        input.expectedRowVersion,

        normalizeRequiredIdentityText(
          input.displayName
        ),

        normalizeOptionalIdentityText(
          input.jobTitle
        ),

        input.businessEmail
          ? normalizeIdentityEmail(
              input.businessEmail
            )
          : null,

        normalizeOptionalIdentityText(
          input.primaryPhone
        ),

        normalizeOptionalIdentityText(
          input.alternatePhone
        ),

        normalizeOptionalIdentityText(
          input.signalAccount
        ),

        normalizeOptionalIdentityText(
          input.telegramUsername
        ),

        input.preferredLanguage,

        normalizeRequiredIdentityText(
          input.timeZone
        ),
      ],
      executor
    );

  if (!result.rows[0]) {
    return null;
  }

  return await findAdminProfile(
    input.userId,
    executor
  );
}

export async function createAdminProfileAuditEntry(
  input: {
    actorUserId: string;
    profileUserId: string;
    previousRowVersion: string;
    nextRowVersion: string;
  },
  executor:
    DatabaseQueryExecutor
): Promise<void> {
  await executeDatabaseQuery(
    `
      INSERT INTO app.admin_audit_entries (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      VALUES (
        $1::uuid,
        'admin_profile.updated',
        'admin_profile',
        $2::uuid,
        jsonb_build_object(
          'previousRowVersion',
          $3::text,
          'nextRowVersion',
          $4::text
        )
      )
    `,
    [
      input.actorUserId,
      input.profileUserId,
      input.previousRowVersion,
      input.nextRowVersion,
    ],
    executor
  );
}
