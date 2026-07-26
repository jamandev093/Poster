import type {
  AdvertisingActorReference,
  AdvertisingRequestId,
  CampaignId,
  CampaignStatus,
  OrganizationId,
  PlacementSurface,
} from "../advertising/advertising.types";

import {
  getCampaignStatusLabel,
} from "../advertising/advertising.status";

import type {
  AdvertisingCreative,
  CreativeMediaAsset,
  CreativeVersion,
} from "../media/media.types";

import type {
  ClientCampaign,
  CommercialCreative,
} from "../workspace.types";

import {
  createDefaultLegacyMigrationActor,
  createLegacyCreativeId,
  createLegacyCreativeVersionId,
  migrateLegacyCreative,
} from "./legacy-media.adapter";

/**
 * Legacy advertising migration adapter.
 *
 * This module creates stable compatibility records from the
 * existing Client workspace request and campaign fixtures.
 *
 * Creative and media conversion remains delegated to
 * legacy-media.adapter.ts.
 *
 * This module must not:
 *
 * - render React components;
 * - mutate legacy fixtures;
 * - approve requests or campaigns;
 * - calculate analytics;
 * - process payments;
 * - upload media;
 * - become a Backend source of truth.
 */

export type MigratedRequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "cancelled";

export interface LegacyCommercialRequestRecord {
  id?:
    string;

  organizationId?:
    string;

  campaignId?:
    string;

  title?:
    string;

  name?:
    string;

  objective?:
    string;

  description?:
    string;

  status?:
    string;

  placements?:
    readonly string[];

  creative?:
    CommercialCreative;

  version?:
    number;

  createdAt?:
    string;

  submittedAt?:
    string;

  reviewedAt?:
    string;

  updatedAt?:
    string;

  [key:
    string]:
    unknown;
}

export interface MigratedAdvertisingRequest {
  id:
    AdvertisingRequestId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  name:
    string;

  objective?:
    string;

  description?:
    string;

  status:
    MigratedRequestStatus;

  placements:
    PlacementSurface[];

  currentVersion:
    number;

  createdBy:
    AdvertisingActorReference;

  submittedBy:
    AdvertisingActorReference;

  reviewedBy?:
    AdvertisingActorReference;

  createdAt:
    string;

  submittedAt:
    string;

  reviewedAt?:
    string;

  updatedAt:
    string;
}

export interface MigratedAdvertisingCampaign {
  id:
    CampaignId;

  organizationId:
    OrganizationId;

  requestId:
    AdvertisingRequestId;

  name:
    string;

  status:
    CampaignStatus;

  statusLabel:
    string;

  placements:
    PlacementSurface[];

  creativeId?:
    AdvertisingCreative["id"];

  creativeVersionId?:
    CreativeVersion["id"];

  createdAt:
    string;

  updatedAt:
    string;
}

export interface LegacyAdvertisingMigrationResult {
  request:
    MigratedAdvertisingRequest;

  campaign?:
    MigratedAdvertisingCampaign;

  creative?:
    AdvertisingCreative;

  creativeVersion?:
    CreativeVersion;

  mediaAssets:
    CreativeMediaAsset[];

  warnings:
    string[];
}

export interface MigrateLegacyAdvertisingInput {
  request:
    LegacyCommercialRequestRecord;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaign?:
    ClientCampaign;

  campaignId?:
    CampaignId;

  placements?:
    PlacementSurface[];

  createdBy?:
    AdvertisingActorReference;

  submittedBy?:
    AdvertisingActorReference;

  reviewedBy?:
    AdvertisingActorReference;

  fallbackTimestamp?:
    string;
}

function sanitizeIdentifierPart(
  value:
    string
): string {
  const normalized =
    value
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return normalized ||
    "UNKNOWN";
}

function createRequestId(
  request:
    LegacyCommercialRequestRecord
): AdvertisingRequestId {
  const source =
    request.id ??
    request.name ??
    request.title ??
    "LEGACY";

  if (
    source.startsWith(
      "ADV-"
    )
  ) {
    return source as
      AdvertisingRequestId;
  }

  return `ADV-${sanitizeIdentifierPart(
    source
  )}`;
}

function createCampaignId(
  requestId:
    AdvertisingRequestId,
  campaign?:
    ClientCampaign,
  suppliedCampaignId?:
    CampaignId
): CampaignId | undefined {
  if (
    suppliedCampaignId
  ) {
    return suppliedCampaignId;
  }

  const legacyCampaignId =
    campaign?.id
      ?.trim();

  if (
    !legacyCampaignId
  ) {
    return undefined;
  }

  if (
    legacyCampaignId.startsWith(
      "CMP-"
    )
  ) {
    return legacyCampaignId as
      CampaignId;
  }

  return `CMP-${sanitizeIdentifierPart(
    legacyCampaignId
  )}`;
}

function normalizeRequestStatus(
  status:
    string |
    undefined
): MigratedRequestStatus {
  switch (
    status
      ?.trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      )
  ) {
    case "draft":
      return "draft";

    case "submitted":
    case "pending":
    case "pending_review":
      return "submitted";

    case "review":
    case "in_review":
    case "under_review":
      return "under_review";

    case "changes_requested":
    case "revision_requested":
    case "needs_changes":
      return "changes_requested";

    case "approved":
    case "accepted":
      return "approved";

    case "rejected":
    case "declined":
      return "rejected";

    case "cancelled":
    case "canceled":
      return "cancelled";

    default:
      return "draft";
  }
}

function isPlacementSurface(
  value:
    string
): value is PlacementSurface {
  return (
    value ===
      "home" ||
    value ===
      "search" ||
    value ===
      "trending"
  );
}

function normalizePlacements(
  values:
    readonly string[] |
    undefined
): PlacementSurface[] {
  if (!values) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map(
          (
            value
          ) =>
            value
              .trim()
              .toLowerCase()
        )
        .filter(
          isPlacementSurface
        )
    )
  );
}

function getRequestPlacements(
  input:
    MigrateLegacyAdvertisingInput
): PlacementSurface[] {
  if (
    input.placements
      ?.length
  ) {
    return [
      ...input.placements,
    ];
  }

  if (
    input.campaign
      ?.placements
      ?.length
  ) {
    return [
      ...input.campaign
        .placements,
    ];
  }

  return normalizePlacements(
    input.request
      .placements
  );
}

function normalizeTimestamp(
  value:
    string |
    undefined,
  fallback:
    string
): string {
  if (!value) {
    return fallback;
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return fallback;
  }

  return parsed.toISOString();
}

function getFallbackTimestamp(
  supplied:
    string |
    undefined
): string {
  if (
    supplied &&
    !Number.isNaN(
      new Date(
        supplied
      ).getTime()
    )
  ) {
    return new Date(
      supplied
    ).toISOString();
  }

  return new Date(
    0
  ).toISOString();
}

function getRequestName(
  request:
    LegacyCommercialRequestRecord
): string {
  return (
    request.name?.trim() ||
    request.title?.trim() ||
    "Untitled advertising request"
  );
}

function getRequestVersion(
  request:
    LegacyCommercialRequestRecord
): number {
  const version =
    request.version;

  if (
    Number.isSafeInteger(
      version
    ) &&
    (
      version as number
    ) > 0
  ) {
    return version as number;
  }

  return 1;
}

function buildMigratedRequest(
  input:
    MigrateLegacyAdvertisingInput,
  requestId:
    AdvertisingRequestId,
  campaignId:
    CampaignId |
    undefined,
  placements:
    PlacementSurface[],
  actor:
    AdvertisingActorReference,
  fallbackTimestamp:
    string
): MigratedAdvertisingRequest {
  const createdAt =
    normalizeTimestamp(
      input.request
        .createdAt,
      fallbackTimestamp
    );

  const submittedAt =
    normalizeTimestamp(
      input.request
        .submittedAt ??
      input.request
        .createdAt,
      createdAt
    );

  const reviewedAt =
    input.request
      .reviewedAt
      ? normalizeTimestamp(
          input.request
            .reviewedAt,
          submittedAt
        )
      : undefined;

  const updatedAt =
    normalizeTimestamp(
      input.request
        .updatedAt ??
      input.request
        .reviewedAt ??
      input.request
        .submittedAt ??
      input.request
        .createdAt,
      reviewedAt ??
      submittedAt
    );

  return {
    id:
      requestId,

    organizationId:
      input.organizationId,

    campaignId,

    name:
      getRequestName(
        input.request
      ),

    objective:
      input.request
        .objective
        ?.trim() ||
      undefined,

    description:
      input.request
        .description
        ?.trim() ||
      undefined,

    status:
      normalizeRequestStatus(
        input.request
          .status
      ),

    placements,

    currentVersion:
      getRequestVersion(
        input.request
      ),

    createdBy:
      input.createdBy ??
      actor,

    submittedBy:
      input.submittedBy ??
      input.createdBy ??
      actor,

    reviewedBy:
      input.reviewedBy,

    createdAt,

    submittedAt,

    reviewedAt,

    updatedAt,
  };
}

function buildMigratedCampaign(
  input:
    MigrateLegacyAdvertisingInput,
  request:
    MigratedAdvertisingRequest,
  campaignId:
    CampaignId,
  creative?:
    AdvertisingCreative,
  creativeVersion?:
    CreativeVersion
): MigratedAdvertisingCampaign {
  const campaign =
    input.campaign;

  const createdAt =
    request.createdAt;

  const updatedAt =
    request.updatedAt;

  const status =
    campaign?.status ??
    (
      request.status ===
        "approved"
        ? "scheduled"
        : "draft"
    );

  return {
    id:
      campaignId,

    organizationId:
      input.organizationId,

    requestId:
      request.id,

    name:
      campaign?.name ??
      request.name,

    status,

    statusLabel:
      getCampaignStatusLabel(
        status
      ),

    placements:
      campaign
        ?.placements
        ?.length
        ? [
            ...campaign
              .placements,
          ]
        : [
            ...request
              .placements,
          ],

    creativeId:
      creative?.id,

    creativeVersionId:
      creativeVersion?.id,

    createdAt,

    updatedAt,
  };
}

export function migrateLegacyAdvertising(
  input:
    MigrateLegacyAdvertisingInput
): LegacyAdvertisingMigrationResult {
  const actor =
    createDefaultLegacyMigrationActor();

  const fallbackTimestamp =
    getFallbackTimestamp(
      input.fallbackTimestamp
    );

  const requestId =
    input.requestId ??
    createRequestId(
      input.request
    );

  const campaignId =
    createCampaignId(
      requestId,
      input.campaign,
      input.campaignId
    );

  const placements =
    getRequestPlacements(
      input
    );

  const request =
    buildMigratedRequest(
      input,
      requestId,
      campaignId,
      placements,
      actor,
      fallbackTimestamp
    );

  const warnings:
    string[] = [];

  if (
    placements.length ===
    0
  ) {
    warnings.push(
      "Legacy request has no recognized Home, Search, or Trending placement."
    );
  }

  if (
    !input.request
      .status
  ) {
    warnings.push(
      "Legacy request status was unavailable and defaulted to Draft."
    );
  }

  let creative:
    AdvertisingCreative |
    undefined;

  let creativeVersion:
    CreativeVersion |
    undefined;

  let mediaAssets:
    CreativeMediaAsset[] = [];

  if (
    input.request
      .creative
  ) {
    const creativeId =
      createLegacyCreativeId(
        requestId
      );

    const creativeVersionId =
      createLegacyCreativeVersionId(
        creativeId,
        request.currentVersion
      );

    const creativeMigration =
      migrateLegacyCreative({
        creative:
          input.request
            .creative,

        identity: {
          organizationId:
            input.organizationId,

          requestId,

          campaignId,

          creativeId,

          creativeVersionId,

          version:
            request.currentVersion,

          submittedAt:
            request.submittedAt,

          submittedBy:
            request.submittedBy,

          reviewedAt:
            request.reviewedAt,

          reviewedBy:
            request.reviewedBy,

          approved:
            request.status ===
            "approved",
        },

        requestedPlacements:
          placements,
      });

    creative =
      creativeMigration
        .creative;

    creativeVersion =
      creativeMigration
        .version;

    mediaAssets = [
      ...creativeMigration
        .assets,
    ];

    if (
      mediaAssets.length ===
      0
    ) {
      warnings.push(
        "Legacy creative was present but contained no migratable media assets."
      );
    }
  }

  const campaign =
    campaignId
      ? buildMigratedCampaign(
          input,
          request,
          campaignId,
          creative,
          creativeVersion
        )
      : undefined;

  if (
    !campaign
  ) {
    warnings.push(
      "No campaign was associated with this legacy advertising request."
    );
  }

  return {
    request,

    campaign,

    creative,

    creativeVersion,

    mediaAssets,

    warnings,
  };
}

export function migrateLegacyAdvertisingCollection(
  inputs:
    MigrateLegacyAdvertisingInput[]
): LegacyAdvertisingMigrationResult[] {
  return inputs.map(
    migrateLegacyAdvertising
  );
}

