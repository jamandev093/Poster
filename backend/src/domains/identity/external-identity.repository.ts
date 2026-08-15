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
} from "./identity.types.js";

export type ExternalIdentityProvider =
  "google";

export interface UserExternalIdentityRecord {
  id: string;

  userId: string;

  provider:
    ExternalIdentityProvider;

  providerSubject: string;

  providerEmail:
    | string
    | null;

  createdAt: Date;

  lastAuthenticatedAt: Date;
}

export interface FindUserExternalIdentityInput {
  provider:
    ExternalIdentityProvider;

  providerSubject: string;
}

export interface CreateUserExternalIdentityInput {
  userId: string;

  provider:
    ExternalIdentityProvider;

  providerSubject: string;

  providerEmail?:
    | string
    | null;

  authenticatedAt: Date;
}

export interface TouchUserExternalIdentityInput {
  identityId: string;

  providerEmail?:
    | string
    | null;

  authenticatedAt: Date;
}

interface UserExternalIdentityDatabaseRow
  extends QueryResultRow {
  id: string;

  user_id: string;

  provider:
    ExternalIdentityProvider;

  provider_subject: string;

  provider_email:
    | string
    | null;

  created_at: Date;

  last_authenticated_at: Date;
}

const EXTERNAL_IDENTITY_RETURNING_COLUMNS = `
  id,
  user_id,
  provider,
  provider_subject,
  provider_email,
  created_at,
  last_authenticated_at
`;

function mapExternalIdentityRow(
  row:
    UserExternalIdentityDatabaseRow
): UserExternalIdentityRecord {
  return {
    id:
      row.id,

    userId:
      row.user_id,

    provider:
      row.provider,

    providerSubject:
      row.provider_subject,

    providerEmail:
      row.provider_email,

    createdAt:
      row.created_at,

    lastAuthenticatedAt:
      row.last_authenticated_at,
  };
}

function mapOptionalExternalIdentityRow(
  row:
    | UserExternalIdentityDatabaseRow
    | undefined
): UserExternalIdentityRecord | null {
  return row
    ? mapExternalIdentityRow(
        row
      )
    : null;
}

function normalizeProviderEmail(
  value:
    | string
    | null
    | undefined
): string | null {
  const normalized =
    normalizeOptionalIdentityText(
      value
    );

  return normalized
    ? normalizeIdentityEmail(
        normalized
      )
    : null;
}

export async function findUserExternalIdentityByProviderSubject(
  input:
    FindUserExternalIdentityInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  UserExternalIdentityRecord |
  null
> {
  const result =
    await executeDatabaseQuery<
      UserExternalIdentityDatabaseRow
    >(
      `
        SELECT
          ${EXTERNAL_IDENTITY_RETURNING_COLUMNS}
        FROM app.user_external_identities
        WHERE
          provider = $1
          AND provider_subject = $2
        LIMIT 1
      `,
      [
        input.provider,

        normalizeRequiredIdentityText(
          input.providerSubject
        ),
      ],
      executor
    );

  return mapOptionalExternalIdentityRow(
    result.rows[0]
  );
}

export async function createUserExternalIdentity(
  input:
    CreateUserExternalIdentityInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  UserExternalIdentityRecord
> {
  const result =
    await executeDatabaseQuery<
      UserExternalIdentityDatabaseRow
    >(
      `
        INSERT INTO app.user_external_identities (
          user_id,
          provider,
          provider_subject,
          provider_email,
          last_authenticated_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          ${EXTERNAL_IDENTITY_RETURNING_COLUMNS}
      `,
      [
        input.userId,

        input.provider,

        normalizeRequiredIdentityText(
          input.providerSubject
        ),

        normalizeProviderEmail(
          input.providerEmail
        ),

        input.authenticatedAt,
      ],
      executor
    );

  const identity =
    mapOptionalExternalIdentityRow(
      result.rows[0]
    );

  if (!identity) {
    throw new Error(
      "PostgreSQL did not return the created external identity."
    );
  }

  return identity;
}

export async function touchUserExternalIdentity(
  input:
    TouchUserExternalIdentityInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  UserExternalIdentityRecord |
  null
> {
  const result =
    await executeDatabaseQuery<
      UserExternalIdentityDatabaseRow
    >(
      `
        UPDATE app.user_external_identities
        SET
          provider_email = $2,
          last_authenticated_at = $3
        WHERE id = $1::uuid
        RETURNING
          ${EXTERNAL_IDENTITY_RETURNING_COLUMNS}
      `,
      [
        input.identityId,

        normalizeProviderEmail(
          input.providerEmail
        ),

        input.authenticatedAt,
      ],
      executor
    );

  return mapOptionalExternalIdentityRow(
    result.rows[0]
  );
}