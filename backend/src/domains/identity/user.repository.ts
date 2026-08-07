import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizeIdentityEmail,
  normalizeRequiredIdentityText,
  type CreateUserInput,
  type MarkUserEmailVerifiedInput,
  type RecordSuccessfulUserLoginInput,
  type SoftDeleteUserInput,
  type UpdateUserProfileInput,
  type UserProfileInterests,
  type UserProfilePreferences,
  type UpdateUserPasswordInput,
  type UpdateUserStatusInput,
  type UserIdentityRecord,
  type UserStatus,
} from "./identity.types.js";

interface UserDatabaseRow
  extends QueryResultRow {
  id: string;

  email: string;

  password_hash: string;

  full_name: string;
  username:
    | string
    | null;

  profile_image_url:
    | string
    | null;

  profile_interests:
    unknown;

  profile_preferences:
    unknown;

  status: UserStatus;

  email_verified_at:
    Date |
    null;

  last_login_at:
    Date |
    null;

  failed_login_attempts: number;

  locked_until:
    Date |
    null;

  created_at: Date;

  updated_at: Date;

  deleted_at:
    Date |
    null;

  row_version: string;
}

const USER_RETURNING_COLUMNS = `
  id,
  email,
  password_hash,
  full_name,
  username,
  profile_image_url,
  profile_interests,
  profile_preferences,
  status,
  email_verified_at,
  last_login_at,
  failed_login_attempts,
  locked_until,
  created_at,
  updated_at,
  deleted_at,
  row_version::text
    AS row_version
`;

const DEFAULT_PROFILE_INTERESTS:
  UserProfileInterests = {
  topicIds: [],

  topicNames: [],

  unresolvedValues: [],

  displayValues: [],
};

const DEFAULT_PROFILE_PREFERENCES:
  UserProfilePreferences = {
  darkMode:
    false,

  notifications:
    true,

  personalizedAds:
    true,
};

function asRecord(
  value: unknown
): Record<string, unknown> | null {
  return typeof value === "object" &&
    value !== null
    ? value as Record<string, unknown>
    : null;
}

function parseStringList(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}

function parseProfileInterests(
  value: unknown
): UserProfileInterests {
  const record =
    asRecord(value);

  if (!record) {
    return DEFAULT_PROFILE_INTERESTS;
  }

  return {
    topicIds:
      parseStringList(
        record.topicIds
      ),

    topicNames:
      parseStringList(
        record.topicNames
      ),

    unresolvedValues:
      parseStringList(
        record.unresolvedValues
      ),

    displayValues:
      parseStringList(
        record.displayValues
      ),
  };
}

function parseProfilePreferences(
  value: unknown
): UserProfilePreferences {
  const record =
    asRecord(value);

  if (!record) {
    return DEFAULT_PROFILE_PREFERENCES;
  }

  return {
    darkMode:
      typeof record.darkMode === "boolean"
        ? record.darkMode
        : DEFAULT_PROFILE_PREFERENCES.darkMode,

    notifications:
      typeof record.notifications === "boolean"
        ? record.notifications
        : DEFAULT_PROFILE_PREFERENCES.notifications,

    personalizedAds:
      typeof record.personalizedAds === "boolean"
        ? record.personalizedAds
        : DEFAULT_PROFILE_PREFERENCES.personalizedAds,
  };
}
function mapUserDatabaseRow(
  row: UserDatabaseRow
): UserIdentityRecord {
  return {
    id:
      row.id,

    email:
      row.email,

    passwordHash:
      row.password_hash,

    fullName:
      row.full_name,
    username:
      row.username,

    profileImageUrl:
      row.profile_image_url,

    profileInterests:
      parseProfileInterests(
        row.profile_interests
      ),

    profilePreferences:
      parseProfilePreferences(
        row.profile_preferences
      ),

    status:
      row.status,

    emailVerifiedAt:
      row.email_verified_at,

    lastLoginAt:
      row.last_login_at,

    failedLoginAttempts:
      row.failed_login_attempts,

    lockedUntil:
      row.locked_until,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    deletedAt:
      row.deleted_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalUserRow(
  row:
    UserDatabaseRow |
    undefined
): UserIdentityRecord | null {
  return row
    ? mapUserDatabaseRow(
        row
      )
    : null;
}

/**
 * Creates a new Poster user identity.
 *
 * Email normalization is performed before the value reaches
 * PostgreSQL. The database unique index remains authoritative.
 */
export async function createUser(
  input: CreateUserInput,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        INSERT INTO app.users (
          email,
          password_hash,
          full_name
        )
        VALUES (
          $1,
          $2,
          $3
        )
        RETURNING
          ${USER_RETURNING_COLUMNS}
      `,
      [
        normalizeIdentityEmail(
          input.email
        ),

        normalizeRequiredIdentityText(
          input.passwordHash
        ),

        normalizeRequiredIdentityText(
          input.fullName
        ),
      ],
      executor
    );

  const user =
    mapOptionalUserRow(
      result.rows[0]
    );

  if (!user) {
    throw new Error(
      "PostgreSQL did not return the created user."
    );
  }

  return user;
}

/**
 * Finds an active database record by its immutable UUID.
 *
 * Soft-deleted users are intentionally excluded.
 */
export async function findUserById(
  userId: string,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        SELECT
          ${USER_RETURNING_COLUMNS}
        FROM app.users
        WHERE
          id = $1::uuid
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [
        userId,
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}

/**
 * Finds a user by their normalized email address.
 *
 * The returned record contains the password hash for internal
 * authentication use. It must never be exposed in an API DTO.
 */
export async function findUserByEmail(
  email: string,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        SELECT
          ${USER_RETURNING_COLUMNS}
        FROM app.users
        WHERE
          email = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [
        normalizeIdentityEmail(
          email
        ),
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}

/**
 * Records successful email verification.
 *
 * The row-version condition prevents stale concurrent writes.
 * A null result means the user was not found or the supplied
 * row version was no longer current.
 */
export async function markUserEmailVerified(
  input: MarkUserEmailVerifiedInput,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        UPDATE app.users
        SET
          email_verified_at = $3,
          status =
            CASE
              WHEN status = 'pending_verification'
                THEN 'active'
              ELSE status
            END
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND deleted_at IS NULL
        RETURNING
          ${USER_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.expectedRowVersion,
        input.verifiedAt,
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}

/**
 * Records a successful authentication event and clears any
 * previous failed-login lock state.
 */
export async function recordSuccessfulUserLogin(
  input: RecordSuccessfulUserLoginInput,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        UPDATE app.users
        SET
          last_login_at = $3,
          failed_login_attempts = 0,
          locked_until = NULL
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND deleted_at IS NULL
        RETURNING
          ${USER_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.expectedRowVersion,
        input.loggedInAt,
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}

/**
 * Replaces one user's password hash using optimistic
 * concurrency control and clears any failed-login lock state.
 *
 * Only a PHC-formatted password hash may reach this repository.
 * Raw passwords must never be persisted.
 */
export async function updateUserPassword(
  input:
    UpdateUserPasswordInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  UserIdentityRecord |
  null
> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        UPDATE app.users
        SET
          password_hash = $3,
          failed_login_attempts = 0,
          locked_until = NULL
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND deleted_at IS NULL
        RETURNING
          ${USER_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.expectedRowVersion,

        normalizeRequiredIdentityText(
          input.passwordHash
        ),
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}

/**
 * Updates a non-deleted user status using optimistic
 * concurrency control.
 *
 * Permanent soft deletion will be implemented through a
 * separate explicit repository operation.
 */
export async function updateUserStatus(
  input: UpdateUserStatusInput,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        UPDATE app.users
        SET
          status = $3
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND deleted_at IS NULL
        RETURNING
          ${USER_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.expectedRowVersion,
        input.status,
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}

/**
 * Permanently marks a user identity as soft-deleted.
 *
 * This operation is intentionally separate from mutable status
 * changes because deleted accounts must not be restored through
 * normal account-status flows.
 */
export async function softDeleteUser(
  input: SoftDeleteUserInput,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        UPDATE app.users
        SET
          status = 'deleted',
          deleted_at = $3
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND deleted_at IS NULL
        RETURNING
          ${USER_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.expectedRowVersion,
        input.deletedAt,
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}

/**
 * Updates safe mutable profile fields for an authenticated user.
 *
 * Full profile data is intentionally limited to app.users profile
 * columns. Binary image uploads must use a separate storage pipeline.
 */
export async function updateUserProfile(
  input: UpdateUserProfileInput,
  executor?: DatabaseQueryExecutor
): Promise<UserIdentityRecord | null> {
  const result =
    await executeDatabaseQuery<
      UserDatabaseRow
    >(
      `
        UPDATE app.users
        SET
          full_name = CASE WHEN $3::boolean THEN $4 ELSE full_name END,
          username = CASE WHEN $5::boolean THEN $6 ELSE username END,
          profile_image_url = CASE WHEN $7::boolean THEN $8 ELSE profile_image_url END,
          profile_interests = CASE WHEN $9::boolean THEN $10::jsonb ELSE profile_interests END,
          profile_preferences = CASE WHEN $11::boolean THEN $12::jsonb ELSE profile_preferences END
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
          AND deleted_at IS NULL
        RETURNING
          ${USER_RETURNING_COLUMNS}
      `,
      [
        input.userId,
        input.expectedRowVersion,
        input.fullName !== undefined,
        input.fullName ?? null,
        input.username !== undefined,
        input.username ?? null,
        input.profileImageUrl !== undefined,
        input.profileImageUrl ?? null,
        input.profileInterests !== undefined,
        input.profileInterests
          ? JSON.stringify(
              input.profileInterests
            )
          : null,
        input.profilePreferences !== undefined,
        input.profilePreferences
          ? JSON.stringify(
              input.profilePreferences
            )
          : null,
      ],
      executor
    );

  return mapOptionalUserRow(
    result.rows[0]
  );
}
