import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  canEditCampaignOperations,
  createAdminAuditEntry,
  findMonetizationCampaignById,
  isCampaignTerminalStatus,
  listMonetizationCampaigns,
  resolveCampaignTargetStatus,
  transitionMonetizationCampaignStatus,
  updateMonetizationCampaignOperations,
  validateCampaignOperationsUpdate,
  validateCampaignReason,
  validateExpectedRowVersion,
  type CampaignMutationOutcome,
  type CampaignStatus,
  type CampaignType,
  type MonetizationCampaignListResult,
  type MonetizationCampaignRecord,
  type TransitionCampaignInput,
  type UpdateCampaignOperationsInput,
} from "../../domains/monetization/index.js";

import {
  CampaignOperationsError,
} from "./campaign-operations.errors.js";

export interface ListAdminCampaignsInput {
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

export interface AdminCampaignService {
  list:
    (
      input:
        ListAdminCampaignsInput
    ) => Promise<
      MonetizationCampaignListResult
    >;

  get:
    (
      campaignId: string
    ) => Promise<
      MonetizationCampaignRecord |
      null
    >;

  updateOperations:
    (
      input:
        UpdateCampaignOperationsInput
    ) => Promise<
      MonetizationCampaignRecord
    >;

  transition:
    (
      input:
        TransitionCampaignInput
    ) => Promise<
      MonetizationCampaignRecord
    >;
}

export interface AdminCampaignServiceDependencies {
  listCampaigns:
    typeof listMonetizationCampaigns;

  findCampaign:
    typeof findMonetizationCampaignById;

  updateCampaign:
    typeof updateMonetizationCampaignOperations;

  transitionCampaign:
    typeof transitionMonetizationCampaignStatus;

  createAuditEntry:
    typeof createAdminAuditEntry;

  runTransaction:
    typeof runDatabaseTransaction;

  now:
    () => Date;
}

export interface CreateAdminCampaignServiceOptions {
  dependencies?:
    Partial<
      AdminCampaignServiceDependencies
    >;
}

function throwForMutationOutcome(
  outcome:
    Exclude<
      CampaignMutationOutcome,
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
    throw new CampaignOperationsError(
      "CAMPAIGN_NOT_FOUND",
      "The campaign was not found."
    );
  }

  throw new CampaignOperationsError(
    "CAMPAIGN_VERSION_CONFLICT",
    "The campaign was updated by another operation. Refresh and try again."
  );
}

function ensureCampaignEditable(
  campaign:
    MonetizationCampaignRecord
): void {
  if (
    isCampaignTerminalStatus(
      campaign.status
    ) ||
    !canEditCampaignOperations(
      campaign.status
    )
  ) {
    throw new CampaignOperationsError(
      "CAMPAIGN_TERMINAL",
      "Ended or disabled campaigns cannot be edited."
    );
  }
}

function normalizeReason(
  reason:
    string |
    null
): string | null {
  if (
    reason === null
  ) {
    return null;
  }

  return reason.trim();
}

export function createAdminCampaignService(
  options:
    CreateAdminCampaignServiceOptions =
    {}
): AdminCampaignService {
  const dependencies:
    AdminCampaignServiceDependencies = {
    listCampaigns:
      listMonetizationCampaigns,

    findCampaign:
      findMonetizationCampaignById,

    updateCampaign:
      updateMonetizationCampaignOperations,

    transitionCampaign:
      transitionMonetizationCampaignStatus,

    createAuditEntry:
      createAdminAuditEntry,

    runTransaction:
      runDatabaseTransaction,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  return {
    list:
      async input =>
        await dependencies
          .listCampaigns(
            input
          ),

    get:
      async campaignId =>
        await dependencies
          .findCampaign(
            campaignId
          ),

    async updateOperations(
      input
    ) {
      const issues =
        validateCampaignOperationsUpdate(
          input
        );

      if (
        issues.length >
        0
      ) {
        throw new CampaignOperationsError(
          "CAMPAIGN_OPERATION_INVALID",
          "The campaign operational update is invalid.",
          issues
        );
      }

      return await dependencies
        .runTransaction(
          async executor => {
            const current =
              await dependencies
                .findCampaign(
                  input.campaignId,
                  executor
                );

            if (
              !current
            ) {
              throw new CampaignOperationsError(
                "CAMPAIGN_NOT_FOUND",
                "The campaign was not found."
              );
            }

            ensureCampaignEditable(
              current
            );

            const outcome =
              await dependencies
                .updateCampaign(
                  {
                    campaignId:
                      input.campaignId,

                    expectedRowVersion:
                      input.expectedRowVersion,

                    name:
                      input.name.trim(),

                    placements:
                      input.placements,

                    scheduledStartDate:
                      input.scheduledStartDate,

                    scheduledEndDate:
                      input.scheduledEndDate,

                    readinessStatus:
                      input.readinessStatus,
                  },
                  executor
                );

            if (
              outcome.status !==
                "updated"
            ) {
              throwForMutationOutcome(
                outcome
              );
            }

            const updated =
              outcome.campaign;

            await dependencies
              .createAuditEntry(
                {
                  actorUserId:
                    input.actorUserId,

                  action:
                    "monetization.campaign.operations_updated",

                  entityType:
                    "monetization_campaign",

                  entityId:
                    updated.id,

                  metadata: {
                    reason:
                      normalizeReason(
                        input.reason
                      ),

                    previousRowVersion:
                      current.rowVersion,

                    nextRowVersion:
                      updated.rowVersion,

                    previousName:
                      current.name,

                    nextName:
                      updated.name,

                    previousPlacements:
                      [...current.placements],

                    nextPlacements:
                      [...updated.placements],

                    previousScheduledStartDate:
                      current.scheduledStartDate,

                    nextScheduledStartDate:
                      updated.scheduledStartDate,

                    previousScheduledEndDate:
                      current.scheduledEndDate,

                    nextScheduledEndDate:
                      updated.scheduledEndDate,

                    previousReadinessStatus:
                      current.readinessStatus,

                    nextReadinessStatus:
                      updated.readinessStatus,

                    previousDeliveryEligible:
                      current.deliveryEligible,

                    nextDeliveryEligible:
                      updated.deliveryEligible,
                  },

                  occurredAt:
                    dependencies.now(),
                },
                executor
              );

            return updated;
          }
        );
    },

    async transition(
      input
    ) {
      const issues = [
        ...validateExpectedRowVersion(
          input.expectedRowVersion
        ),
        ...validateCampaignReason(
          input.reason
        ),
      ];

      if (
        issues.length >
        0
      ) {
        throw new CampaignOperationsError(
          "CAMPAIGN_OPERATION_INVALID",
          "The campaign lifecycle operation is invalid.",
          issues
        );
      }

      return await dependencies
        .runTransaction(
          async executor => {
            const current =
              await dependencies
                .findCampaign(
                  input.campaignId,
                  executor
                );

            if (
              !current
            ) {
              throw new CampaignOperationsError(
                "CAMPAIGN_NOT_FOUND",
                "The campaign was not found."
              );
            }

            ensureCampaignEditable(
              current
            );

            const targetStatus =
              resolveCampaignTargetStatus(
                current.status,
                input.action
              );

            if (
              targetStatus ===
              null
            ) {
              throw new CampaignOperationsError(
                "CAMPAIGN_TRANSITION_NOT_ALLOWED",
                `The campaign cannot transition from "${current.status}" using "${input.action}".`
              );
            }

            if (
              (
                input.action ===
                  "activate" ||
                input.action ===
                  "resume"
              ) &&
              current.readinessStatus !==
                "ready"
            ) {
              throw new CampaignOperationsError(
                "CAMPAIGN_NOT_READY",
                "The campaign must be ready before it can become active."
              );
            }

            const outcome =
              await dependencies
                .transitionCampaign(
                  {
                    campaignId:
                      input.campaignId,

                    expectedRowVersion:
                      input.expectedRowVersion,

                    targetStatus,
                  },
                  executor
                );

            if (
              outcome.status !==
                "updated"
            ) {
              throwForMutationOutcome(
                outcome
              );
            }

            const updated =
              outcome.campaign;

            await dependencies
              .createAuditEntry(
                {
                  actorUserId:
                    input.actorUserId,

                  action:
                    `monetization.campaign.${input.action}`,

                  entityType:
                    "monetization_campaign",

                  entityId:
                    updated.id,

                  metadata: {
                    reason:
                      normalizeReason(
                        input.reason
                      ),

                    lifecycleAction:
                      input.action,

                    previousStatus:
                      current.status,

                    nextStatus:
                      updated.status,

                    previousRowVersion:
                      current.rowVersion,

                    nextRowVersion:
                      updated.rowVersion,

                    readinessStatus:
                      updated.readinessStatus,

                    commercialStatus:
                      updated.commercialStatus,

                    previousDeliveryEligible:
                      current.deliveryEligible,

                    nextDeliveryEligible:
                      updated.deliveryEligible,
                  },

                  occurredAt:
                    dependencies.now(),
                },
                executor
              );

            return updated;
          }
        );
    },
  };
}