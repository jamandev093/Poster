import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  CampaignCommercialStatus,
  CampaignOrigin,
  CampaignReadinessStatus,
  CampaignStatus,
  CampaignType,
  CommercialRequestRecord,
  MonetizationCampaignRecord,
  MonetizationPlacement,
} from "./commercial.types.js";

interface MonetizationCampaignDatabaseRow
  extends QueryResultRow {
  id: string;
  campaign_reference: string;
  source_request_id: string | null;
  organization_id: string;
  name: string;
  campaign_type: CampaignType;
  origin: CampaignOrigin;
  status: CampaignStatus;
  placements: MonetizationPlacement[];
  scheduled_start_date: string;
  scheduled_end_date: string;
  readiness_status: CampaignReadinessStatus;
  commercial_status: CampaignCommercialStatus;
  delivery_eligible: boolean;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

const CAMPAIGN_COLUMNS = `
  id,
  campaign_reference,
  source_request_id,
  organization_id,
  name,
  campaign_type,
  origin,
  status,
  placements,
  scheduled_start_date::text
    AS scheduled_start_date,
  scheduled_end_date::text
    AS scheduled_end_date,
  readiness_status,
  commercial_status,
  delivery_eligible,
  created_by_user_id,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapCampaignDatabaseRow(
  row: MonetizationCampaignDatabaseRow
): MonetizationCampaignRecord {
  return {
    id: row.id,
    campaignReference: row.campaign_reference,
    sourceRequestId: row.source_request_id,
    organizationId: row.organization_id,
    name: row.name,
    campaignType: row.campaign_type,
    origin: row.origin,
    status: row.status,
    placements: row.placements,
    scheduledStartDate: row.scheduled_start_date,
    scheduledEndDate: row.scheduled_end_date,
    readinessStatus: row.readiness_status,
    commercialStatus: row.commercial_status,
    deliveryEligible: row.delivery_eligible,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalCampaignRow(
  row: MonetizationCampaignDatabaseRow | undefined
): MonetizationCampaignRecord | null {
  return row
    ? mapCampaignDatabaseRow(row)
    : null;
}

export async function findCampaignBySourceRequestId(
  requestId: string,
  executor?: DatabaseQueryExecutor
): Promise<MonetizationCampaignRecord | null> {
  const result =
    await executeDatabaseQuery<MonetizationCampaignDatabaseRow>(
      `
        SELECT
          ${CAMPAIGN_COLUMNS}
        FROM app.monetization_campaigns
        WHERE source_request_id = $1::uuid
        LIMIT 1
      `,
      [
        requestId,
      ],
      executor
    );

  return mapOptionalCampaignRow(result.rows[0]);
}

export async function createDraftCampaignFromCommercialRequest(
  input: {
    request: CommercialRequestRecord;
    campaignReference: string;
    campaignName: string;
    createdByUserId: string;
    createdAt: Date;
  },
  executor: DatabaseQueryExecutor
): Promise<MonetizationCampaignRecord> {
  const result =
    await executeDatabaseQuery<MonetizationCampaignDatabaseRow>(
      `
        INSERT INTO app.monetization_campaigns (
          campaign_reference,
          source_request_id,
          organization_id,
          name,
          campaign_type,
          origin,
          status,
          placements,
          scheduled_start_date,
          scheduled_end_date,
          readiness_status,
          commercial_status,
          delivery_eligible,
          created_by_user_id,
          created_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4,
          $5,
          'client_request',
          'draft',
          $6::text[],
          $7::date,
          $8::date,
          'pending_setup',
          'pending_funding',
          false,
          $9::uuid,
          $10
        )
        ON CONFLICT (
          source_request_id
        )
        WHERE source_request_id IS NOT NULL
        DO NOTHING
        RETURNING
          ${CAMPAIGN_COLUMNS}
      `,
      [
        input.campaignReference,
        input.request.id,
        input.request.organizationId,
        input.campaignName.trim(),
        input.request.requestType,
        [...input.request.requestedPlacements],
        input.request.requestedStartDate,
        input.request.requestedEndDate,
        input.createdByUserId,
        input.createdAt,
      ],
      executor
    );

  const created =
    mapOptionalCampaignRow(result.rows[0]);

  if (created) {
    return created;
  }

  const existing =
    await findCampaignBySourceRequestId(
      input.request.id,
      executor
    );

  if (!existing) {
    throw new Error(
      "The linked campaign could not be created or retrieved."
    );
  }

  return existing;
}
export interface ListMonetizationCampaignsInput {
  organizationId?:
    string |
    null;

  status?:
    CampaignStatus |
    null;

  campaignType?:
    CampaignType |
    null;

  limit: number;

  offset: number;
}

export interface MonetizationCampaignListResult {
  items:
    MonetizationCampaignRecord[];

  total: number;

  limit: number;

  offset: number;
}

export async function findMonetizationCampaignById(
  campaignId: string,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationCampaignRecord | null> {
  const result =
    await executeDatabaseQuery<
      MonetizationCampaignDatabaseRow
    >(
      `
        SELECT
          ${CAMPAIGN_COLUMNS}
        FROM app.monetization_campaigns
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [
        campaignId,
      ],
      executor
    );

  return mapOptionalCampaignRow(
    result.rows[0]
  );
}

export async function listMonetizationCampaigns(
  input:
    ListMonetizationCampaignsInput,
  executor?:
    DatabaseQueryExecutor
): Promise<MonetizationCampaignListResult> {
  const result =
    await executeDatabaseQuery<
      MonetizationCampaignDatabaseRow & {
        total_count: string;
      }
    >(
      `
        SELECT
          ${CAMPAIGN_COLUMNS},
          COUNT(*) OVER()::text
            AS total_count
        FROM app.monetization_campaigns
        WHERE
          (
            $1::uuid IS NULL
            OR organization_id =
              $1::uuid
          )
          AND (
            $2::text IS NULL
            OR status = $2
          )
          AND (
            $3::text IS NULL
            OR campaign_type = $3
          )
        ORDER BY
          CASE status
            WHEN 'active'
              THEN 0
            WHEN 'scheduled'
              THEN 1
            WHEN 'draft'
              THEN 2
            WHEN 'paused'
              THEN 3
            WHEN 'ended'
              THEN 4
            ELSE 5
          END,
          created_at DESC,
          id DESC
        LIMIT $4
        OFFSET $5
      `,
      [
        input.organizationId ??
        null,

        input.status ??
        null,

        input.campaignType ??
        null,

        input.limit,
        input.offset,
      ],
      executor
    );

  return {
    items:
      result.rows.map(
        mapCampaignDatabaseRow
      ),

    total:
      Number(
        result.rows[0]
          ?.total_count ??
        0
      ),

    limit:
      input.limit,

    offset:
      input.offset,
  };
}
