import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  AFFILIATE_DISCLOSURE,
  createAdminAuditEntry,
  createAffiliateMetadata,
  findAffiliateMetadataByCampaignId,
  findMonetizationCampaignById,
  updateAffiliateMetadata,
  validateAffiliateExpectedRowVersion,
  validateAffiliateMetadataDraft,
  type AffiliateMetadataDraftInput,
  type AffiliateMetadataMutationOutcome,
  type AffiliateMetadataRecord,
  type JsonObject,
  type MonetizationCampaignRecord,
} from "../../domains/monetization/index.js";

import {
  AffiliateError,
} from "./affiliate.errors.js";

export interface AdminAffiliateDetailRecord {
  campaign:
    MonetizationCampaignRecord;

  metadata:
    AffiliateMetadataRecord | null;
}

export interface CreateAdminAffiliateMetadataInput
  extends AffiliateMetadataDraftInput {
  campaignId:
    string;

  actorUserId:
    string;
}

export interface UpdateAdminAffiliateMetadataInput
  extends AffiliateMetadataDraftInput {
  campaignId:
    string;

  actorUserId:
    string;

  expectedRowVersion:
    string;
}

export interface AdminAffiliateService {
  get:
    (
      campaignId:
        string
    ) => Promise<
      AdminAffiliateDetailRecord |
      null
    >;

  createMetadata:
    (
      input:
        CreateAdminAffiliateMetadataInput
    ) => Promise<
      AdminAffiliateDetailRecord
    >;

  updateMetadata:
    (
      input:
        UpdateAdminAffiliateMetadataInput
    ) => Promise<
      AdminAffiliateDetailRecord
    >;
}

export interface AdminAffiliateServiceDependencies {
  findCampaign:
    typeof findMonetizationCampaignById;

  findMetadata:
    typeof findAffiliateMetadataByCampaignId;

  createMetadata:
    typeof createAffiliateMetadata;

  updateMetadata:
    typeof updateAffiliateMetadata;

  createAuditEntry:
    typeof createAdminAuditEntry;

  runTransaction:
    typeof runDatabaseTransaction;

  now:
    () => Date;
}

export interface CreateAdminAffiliateServiceOptions {
  dependencies?:
    Partial<
      AdminAffiliateServiceDependencies
    >;
}

function normalizeDraft(
  input:
    AffiliateMetadataDraftInput
): AffiliateMetadataDraftInput {
  return {
    partnerName:
      input.partnerName.trim(),

    offerName:
      input.offerName.trim(),

    destinationUrl:
      input.destinationUrl.trim(),

    disclosure:
      AFFILIATE_DISCLOSURE,

    commissionModel:
      input.commissionModel,

    commissionTerms:
      input.commissionTerms,

    trackingStatus:
      input.trackingStatus,

    trackingUrl:
      input.trackingUrl?.trim() ??
      null,

    payoutReadinessStatus:
      input.payoutReadinessStatus,
  };
}

function validateDraftOrThrow(
  input:
    AffiliateMetadataDraftInput
): AffiliateMetadataDraftInput {
  const normalized =
    normalizeDraft(
      input
    );

  const issues =
    validateAffiliateMetadataDraft(
      normalized
    );

  if (
    issues.length >
    0
  ) {
    throw new AffiliateError(
      "AFFILIATE_METADATA_INVALID",
      "The affiliate metadata is invalid.",
      issues
    );
  }

  return normalized;
}

function validateExpectedRowVersionOrThrow(
  expectedRowVersion:
    string
): void {
  const issues =
    validateAffiliateExpectedRowVersion(
      expectedRowVersion
    );

  if (
    issues.length >
    0
  ) {
    throw new AffiliateError(
      "AFFILIATE_METADATA_INVALID",
      "The affiliate metadata row version is invalid.",
      issues
    );
  }
}

function ensureAffiliateCampaign(
  campaign:
    MonetizationCampaignRecord | null
): MonetizationCampaignRecord {
  if (
    !campaign
  ) {
    throw new AffiliateError(
      "AFFILIATE_CAMPAIGN_NOT_FOUND",
      "The affiliate campaign was not found."
    );
  }

  if (
    campaign.campaignType !==
    "affiliate"
  ) {
    throw new AffiliateError(
      "AFFILIATE_CAMPAIGN_TYPE_MISMATCH",
      "The campaign is not an affiliate campaign."
    );
  }

  return campaign;
}

function throwForMetadataMutationOutcome(
  outcome:
    Exclude<
      AffiliateMetadataMutationOutcome,
      {
        status:
          "updated";
      }
    >
): never {
  if (
    outcome.status ===
    "not_found"
  ) {
    throw new AffiliateError(
      "AFFILIATE_METADATA_NOT_FOUND",
      "The affiliate metadata was not found."
    );
  }

  throw new AffiliateError(
    "AFFILIATE_METADATA_VERSION_CONFLICT",
    "The affiliate metadata was updated by another operation. Refresh and try again."
  );
}

export function createAdminAffiliateService(
  options:
    CreateAdminAffiliateServiceOptions =
    {}
): AdminAffiliateService {
  const dependencies:
    AdminAffiliateServiceDependencies = {
    findCampaign:
      findMonetizationCampaignById,

    findMetadata:
      findAffiliateMetadataByCampaignId,

    createMetadata:
      createAffiliateMetadata,

    updateMetadata:
      updateAffiliateMetadata,

    createAuditEntry:
      createAdminAuditEntry,

    runTransaction:
      runDatabaseTransaction,

    now:
      () =>
        new Date(),

    ...options.dependencies,
  };

  return {
    async get(
      campaignId
    ) {
      const campaign =
        await dependencies
          .findCampaign(
            campaignId
          );

      if (
        !campaign ||
        campaign.campaignType !==
          "affiliate"
      ) {
        return null;
      }

      const metadata =
        await dependencies
          .findMetadata(
            campaignId
          );

      return {
        campaign,
        metadata,
      };
    },

    async createMetadata(
      input
    ) {
      const normalized =
        validateDraftOrThrow(
          input
        );

      return await dependencies
        .runTransaction(
          async executor => {
            const campaign =
              ensureAffiliateCampaign(
                await dependencies
                  .findCampaign(
                    input.campaignId,
                    executor
                  )
              );

            const existing =
              await dependencies
                .findMetadata(
                  input.campaignId,
                  executor
                );

            if (
              existing
            ) {
              throw new AffiliateError(
                "AFFILIATE_METADATA_EXISTS",
                "Affiliate metadata already exists for this campaign."
              );
            }

            const metadata =
              await dependencies
                .createMetadata(
                  {
                    ...normalized,

                    campaignId:
                      campaign.id,

                    createdAt:
                      dependencies.now(),
                  },
                  executor
                );

            await dependencies
              .createAuditEntry(
                {
                  actorUserId:
                    input.actorUserId,

                  action:
                    "monetization.affiliate.metadata_created",

                  entityType:
                    "affiliate_campaign_metadata",

                  entityId:
                    campaign.id,

                  metadata: {
                    partnerName:
                      metadata.partnerName,

                    offerName:
                      metadata.offerName,

                    commissionModel:
                      metadata.commissionModel,

                    trackingStatus:
                      metadata.trackingStatus,

                    payoutReadinessStatus:
                      metadata.payoutReadinessStatus,
                  } satisfies JsonObject,

                  occurredAt:
                    dependencies.now(),
                },
                executor
              );

            return {
              campaign,
              metadata,
            };
          }
        );
    },

    async updateMetadata(
      input
    ) {
      validateExpectedRowVersionOrThrow(
        input.expectedRowVersion
      );

      const normalized =
        validateDraftOrThrow(
          input
        );

      return await dependencies
        .runTransaction(
          async executor => {
            const campaign =
              ensureAffiliateCampaign(
                await dependencies
                  .findCampaign(
                    input.campaignId,
                    executor
                  )
              );

            const outcome =
              await dependencies
                .updateMetadata(
                  {
                    ...normalized,

                    campaignId:
                      input.campaignId,

                    expectedRowVersion:
                      input.expectedRowVersion,

                    updatedAt:
                      dependencies.now(),
                  },
                  executor
                );

            if (
              outcome.status !==
              "updated"
            ) {
              throwForMetadataMutationOutcome(
                outcome
              );
            }

            const metadata =
              outcome.metadata;

            await dependencies
              .createAuditEntry(
                {
                  actorUserId:
                    input.actorUserId,

                  action:
                    "monetization.affiliate.metadata_updated",

                  entityType:
                    "affiliate_campaign_metadata",

                  entityId:
                    campaign.id,

                  metadata: {
                    previousRowVersion:
                      input.expectedRowVersion,

                    nextRowVersion:
                      metadata.rowVersion,

                    partnerName:
                      metadata.partnerName,

                    offerName:
                      metadata.offerName,

                    commissionModel:
                      metadata.commissionModel,

                    trackingStatus:
                      metadata.trackingStatus,

                    payoutReadinessStatus:
                      metadata.payoutReadinessStatus,
                  } satisfies JsonObject,

                  occurredAt:
                    dependencies.now(),
                },
                executor
              );

            return {
              campaign,
              metadata,
            };
          }
        );
    },
  };
}