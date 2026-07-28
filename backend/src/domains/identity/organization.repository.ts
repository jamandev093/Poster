import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
} from "../../database/database.pool.js";

import {
  normalizeCountryCode,
  normalizeIdentityEmail,
  normalizeOptionalIdentityText,
  normalizeRequiredIdentityText,
  type CreateOrganizationInput,
  type OrganizationRecord,
  type OrganizationStatus,
  type UpdateOrganizationProfileInput,
  type UpdateOrganizationStatusInput,
} from "./identity.types.js";

interface OrganizationDatabaseRow
  extends QueryResultRow {
  id: string;

  legal_name: string;

  display_name: string;

  website_url:
    string |
    null;

  billing_email:
    string |
    null;

  country_code: string;

  status: OrganizationStatus;

  created_at: Date;

  updated_at: Date;

  suspended_at:
    Date |
    null;

  closed_at:
    Date |
    null;

  row_version: string;
}

const ORGANIZATION_RETURNING_COLUMNS = `
  id,
  legal_name,
  display_name,
  website_url,
  billing_email,
  country_code,
  status,
  created_at,
  updated_at,
  suspended_at,
  closed_at,
  row_version::text
    AS row_version
`;

function mapOrganizationDatabaseRow(
  row: OrganizationDatabaseRow
): OrganizationRecord {
  return {
    id:
      row.id,

    legalName:
      row.legal_name,

    displayName:
      row.display_name,

    websiteUrl:
      row.website_url,

    billingEmail:
      row.billing_email,

    countryCode:
      row.country_code,

    status:
      row.status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    suspendedAt:
      row.suspended_at,

    closedAt:
      row.closed_at,

    rowVersion:
      row.row_version,
  };
}

function mapOptionalOrganizationRow(
  row:
    OrganizationDatabaseRow |
    undefined
): OrganizationRecord | null {
  return row
    ? mapOrganizationDatabaseRow(
        row
      )
    : null;
}

/**
 * Creates an advertising-client or operational organization.
 *
 * PostgreSQL constraints remain authoritative for country-code
 * format and all required organization fields.
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<OrganizationRecord> {
  const normalizedBillingEmail =
    normalizeOptionalIdentityText(
      input.billingEmail
    );

  const result =
    await executeDatabaseQuery<
      OrganizationDatabaseRow
    >(
      `
        INSERT INTO app.organizations (
          legal_name,
          display_name,
          website_url,
          billing_email,
          country_code
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          ${ORGANIZATION_RETURNING_COLUMNS}
      `,
      [
        normalizeRequiredIdentityText(
          input.legalName
        ),

        normalizeRequiredIdentityText(
          input.displayName
        ),

        normalizeOptionalIdentityText(
          input.websiteUrl
        ),

        normalizedBillingEmail
          ? normalizeIdentityEmail(
              normalizedBillingEmail
            )
          : null,

        normalizeCountryCode(
          input.countryCode
        ),
      ]
    );

  const organization =
    mapOptionalOrganizationRow(
      result.rows[0]
    );

  if (!organization) {
    throw new Error(
      "PostgreSQL did not return the created organization."
    );
  }

  return organization;
}

/**
 * Retrieves one organization by immutable UUID.
 */
export async function findOrganizationById(
  organizationId: string
): Promise<OrganizationRecord | null> {
  const result =
    await executeDatabaseQuery<
      OrganizationDatabaseRow
    >(
      `
        SELECT
          ${ORGANIZATION_RETURNING_COLUMNS}
        FROM app.organizations
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        organizationId,
      ]
    );

  return mapOptionalOrganizationRow(
    result.rows[0]
  );
}

/**
 * Updates editable organization profile fields using
 * optimistic concurrency control.
 */
export async function updateOrganizationProfile(
  input: UpdateOrganizationProfileInput
): Promise<OrganizationRecord | null> {
  const normalizedBillingEmail =
    normalizeOptionalIdentityText(
      input.billingEmail
    );

  const result =
    await executeDatabaseQuery<
      OrganizationDatabaseRow
    >(
      `
        UPDATE app.organizations
        SET
          legal_name = $3,
          display_name = $4,
          website_url = $5,
          billing_email = $6,
          country_code = $7
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
        RETURNING
          ${ORGANIZATION_RETURNING_COLUMNS}
      `,
      [
        input.organizationId,
        input.expectedRowVersion,

        normalizeRequiredIdentityText(
          input.legalName
        ),

        normalizeRequiredIdentityText(
          input.displayName
        ),

        normalizeOptionalIdentityText(
          input.websiteUrl
        ),

        normalizedBillingEmail
          ? normalizeIdentityEmail(
              normalizedBillingEmail
            )
          : null,

        normalizeCountryCode(
          input.countryCode
        ),
      ]
    );

  return mapOptionalOrganizationRow(
    result.rows[0]
  );
}

/**
 * Updates an organization lifecycle status.
 *
 * Status-specific timestamps preserve when suspension or
 * closure occurred. The row-version condition prevents stale
 * concurrent writes.
 */
export async function updateOrganizationStatus(
  input: UpdateOrganizationStatusInput
): Promise<OrganizationRecord | null> {
  const result =
    await executeDatabaseQuery<
      OrganizationDatabaseRow
    >(
      `
        UPDATE app.organizations
        SET
          status = $3,

          suspended_at =
            CASE
              WHEN $3 = 'suspended'
                THEN $4
              ELSE suspended_at
            END,

          closed_at =
            CASE
              WHEN $3 = 'closed'
                THEN $4
              ELSE closed_at
            END
        WHERE
          id = $1::uuid
          AND row_version = $2::bigint
        RETURNING
          ${ORGANIZATION_RETURNING_COLUMNS}
      `,
      [
        input.organizationId,
        input.expectedRowVersion,
        input.status,
        input.changedAt,
      ]
    );

  return mapOptionalOrganizationRow(
    result.rows[0]
  );
}