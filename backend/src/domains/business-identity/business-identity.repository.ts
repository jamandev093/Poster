import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  BusinessIdentityKey,
  BusinessIdentityRecord,
  BusinessIdentityUpsertResult,
  JsonObject,
  UpsertBusinessIdentityInput,
} from "./business-identity.types.js";

interface BusinessIdentityDatabaseRow
  extends QueryResultRow {
  identity_key:
    BusinessIdentityKey;

  public_brand_name:
    string;

  legal_business_name:
    string | null;

  website_url:
    string;

  official_business_email:
    string;

  support_email:
    string | null;

  publisher_relations_email:
    string | null;

  advertising_email:
    string | null;

  copyright_email:
    string | null;

  signal_url:
    string | null;

  signal_label:
    string | null;

  copyright_portal_url:
    string | null;

  client_portal_url:
    string | null;

  social_links:
    JsonObject;

  updated_by_user_id:
    string | null;

  created_at:
    Date;

  updated_at:
    Date;

  row_version:
    string;
}

const BUSINESS_IDENTITY_COLUMNS = `
  identity_key,
  public_brand_name,
  legal_business_name,
  website_url,
  official_business_email,
  support_email,
  publisher_relations_email,
  advertising_email,
  copyright_email,
  signal_url,
  signal_label,
  copyright_portal_url,
  client_portal_url,
  social_links,
  updated_by_user_id,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapBusinessIdentityRow(
  row:
    BusinessIdentityDatabaseRow
): BusinessIdentityRecord {
  return {
    key:
      row.identity_key,

    publicBrandName:
      row.public_brand_name,

    legalBusinessName:
      row.legal_business_name,

    websiteUrl:
      row.website_url,

    officialBusinessEmail:
      row.official_business_email,

    supportEmail:
      row.support_email,

    publisherRelationsEmail:
      row.publisher_relations_email,

    advertisingEmail:
      row.advertising_email,

    copyrightEmail:
      row.copyright_email,

    signalUrl:
      row.signal_url,

    signalLabel:
      row.signal_label,

    copyrightPortalUrl:
      row.copyright_portal_url,

    clientPortalUrl:
      row.client_portal_url,

    socialLinks:
      row.social_links,

    updatedByUserId:
      row.updated_by_user_id,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

export async function findBusinessIdentityByKey(
  key:
    BusinessIdentityKey,
  executor?:
    DatabaseQueryExecutor
): Promise<
  BusinessIdentityRecord | null
> {
  const result =
    await executeDatabaseQuery<
      BusinessIdentityDatabaseRow
    >(
      `
        SELECT
          ${BUSINESS_IDENTITY_COLUMNS}
        FROM app.business_identities
        WHERE identity_key = $1
        LIMIT 1
      `,
      [
        key,
      ],
      executor
    );

  const row =
    result.rows[0];

  return row
    ? mapBusinessIdentityRow(
        row
      )
    : null;
}

export async function upsertBusinessIdentity(
  input:
    UpsertBusinessIdentityInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  BusinessIdentityUpsertResult
> {
  const result =
    await executeDatabaseQuery<
      BusinessIdentityDatabaseRow
    >(
      `
        INSERT INTO app.business_identities (
          identity_key,
          public_brand_name,
          legal_business_name,
          website_url,
          official_business_email,
          support_email,
          publisher_relations_email,
          advertising_email,
          copyright_email,
          signal_url,
          signal_label,
          copyright_portal_url,
          client_portal_url,
          social_links,
          updated_by_user_id,
          created_at,
          updated_at
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
          $10,
          $11,
          $12,
          $13,
          $14::jsonb,
          $15::uuid,
          $16,
          $16
        )
        ON CONFLICT (identity_key)
        DO UPDATE SET
          public_brand_name = EXCLUDED.public_brand_name,
          legal_business_name = EXCLUDED.legal_business_name,
          website_url = EXCLUDED.website_url,
          official_business_email = EXCLUDED.official_business_email,
          support_email = EXCLUDED.support_email,
          publisher_relations_email = EXCLUDED.publisher_relations_email,
          advertising_email = EXCLUDED.advertising_email,
          copyright_email = EXCLUDED.copyright_email,
          signal_url = EXCLUDED.signal_url,
          signal_label = EXCLUDED.signal_label,
          copyright_portal_url = EXCLUDED.copyright_portal_url,
          client_portal_url = EXCLUDED.client_portal_url,
          social_links = EXCLUDED.social_links,
          updated_by_user_id = EXCLUDED.updated_by_user_id,
          updated_at = EXCLUDED.updated_at,
          row_version = app.business_identities.row_version + 1
        WHERE
          $17::bigint IS NULL
          OR app.business_identities.row_version = $17::bigint
        RETURNING
          ${BUSINESS_IDENTITY_COLUMNS}
      `,
      [
        input.key,
        input.publicBrandName.trim(),
        input.legalBusinessName?.trim() ??
          null,
        input.websiteUrl.trim(),
        input.officialBusinessEmail.trim(),
        input.supportEmail?.trim() ??
          null,
        input.publisherRelationsEmail?.trim() ??
          null,
        input.advertisingEmail?.trim() ??
          null,
        input.copyrightEmail?.trim() ??
          null,
        input.signalUrl?.trim() ??
          null,
        input.signalLabel?.trim() ??
          null,
        input.copyrightPortalUrl?.trim() ??
          null,
        input.clientPortalUrl?.trim() ??
          null,
        input.socialLinks,
        input.updatedByUserId,
        input.now,
        input.expectedRowVersion ??
          null,
      ],
      executor
    );

  const row =
    result.rows[0];

  if (
    !row
  ) {
    return {
      status:
        "conflict",
    };
  }

  return {
    status:
      "updated",

    identity:
      mapBusinessIdentityRow(
        row
      ),
  };
}