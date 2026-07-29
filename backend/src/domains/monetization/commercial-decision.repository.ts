import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createAdminAuditEntry,
} from "./admin-audit.repository.js";

import {
  createDraftCampaignFromCommercialRequest,
  findCampaignBySourceRequestId,
} from "./campaign.repository.js";

import {
  findCommercialRequestByIdForUpdate,
  markCommercialRequestApproved,
  markCommercialRequestChangesRequested,
  markCommercialRequestRejected,
} from "./commercial-request.repository.js";

import type {
  ApproveCommercialRequestInput,
  CommercialDecisionInput,
  CommercialRequestApprovalOutcome,
  CommercialRequestMutationOutcome,
} from "./commercial.types.js";

async function decideCommercialRequest(
  input: CommercialDecisionInput,
  decision:
    | "changes_requested"
    | "rejected"
): Promise<CommercialRequestMutationOutcome> {
  return await runDatabaseTransaction(
    async (
      executor
    ) => {
      const current =
        await findCommercialRequestByIdForUpdate(
          input.requestId,
          executor
        );

      if (!current) {
        return {
          status: "not_found",
        };
      }

      if (
        current.status !== "pending_review" ||
        current.rowVersion !== input.expectedRowVersion
      ) {
        return {
          status: "conflict",
          request: current,
        };
      }

      const updated =
        decision === "changes_requested"
          ? await markCommercialRequestChangesRequested(
              input,
              executor
            )
          : await markCommercialRequestRejected(
              input,
              executor
            );

      if (!updated) {
        return {
          status: "conflict",
          request: current,
        };
      }

      await createAdminAuditEntry(
        {
          actorUserId:
            input.actorUserId,

          action:
            decision === "changes_requested"
              ? "commercial_request.changes_requested"
              : "commercial_request.rejected",

          entityType:
            "commercial_request",

          entityId:
            updated.id,

          metadata: {
            requestReference:
              updated.requestReference,

            organizationId:
              updated.organizationId,

            decisionNote:
              updated.decisionNote,
          },

          occurredAt:
            input.decidedAt,
        },
        executor
      );

      return {
        status: "updated",
        request: updated,
      };
    }
  );
}

export async function requestCommercialRequestChanges(
  input: CommercialDecisionInput
): Promise<CommercialRequestMutationOutcome> {
  return await decideCommercialRequest(
    input,
    "changes_requested"
  );
}

export async function rejectCommercialRequest(
  input: CommercialDecisionInput
): Promise<CommercialRequestMutationOutcome> {
  return await decideCommercialRequest(
    input,
    "rejected"
  );
}

export async function approveCommercialRequestAndCreateDraftCampaign(
  input: ApproveCommercialRequestInput
): Promise<CommercialRequestApprovalOutcome> {
  return await runDatabaseTransaction(
    async (
      executor
    ) => {
      const current =
        await findCommercialRequestByIdForUpdate(
          input.requestId,
          executor
        );

      if (!current) {
        return {
          status: "not_found",
        };
      }

      if (current.status === "approved") {
        const existingCampaign =
          await findCampaignBySourceRequestId(
            current.id,
            executor
          );

        if (!existingCampaign) {
          throw new Error(
            "An approved commercial request has no linked campaign."
          );
        }

        return {
          status: "approved",
          request: current,
          campaign: existingCampaign,
          idempotent: true,
        };
      }

      if (
        current.status !== "pending_review" ||
        current.rowVersion !== input.expectedRowVersion
      ) {
        return {
          status: "conflict",
          request: current,
        };
      }

      const approved =
        await markCommercialRequestApproved(
          input,
          executor
        );

      if (!approved) {
        return {
          status: "conflict",
          request: current,
        };
      }

      const campaign =
        await createDraftCampaignFromCommercialRequest(
          {
            request:
              approved,

            campaignReference:
              input.campaignReference,

            campaignName:
              input.campaignName ?? approved.title,

            createdByUserId:
              input.actorUserId,

            createdAt:
              input.decidedAt,
          },
          executor
        );

      await createAdminAuditEntry(
        {
          actorUserId:
            input.actorUserId,

          action:
            "commercial_request.approved",

          entityType:
            "commercial_request",

          entityId:
            approved.id,

          metadata: {
            requestReference:
              approved.requestReference,

            organizationId:
              approved.organizationId,

            campaignId:
              campaign.id,

            campaignReference:
              campaign.campaignReference,

            campaignStatus:
              campaign.status,

            deliveryEligible:
              campaign.deliveryEligible,
          },

          occurredAt:
            input.decidedAt,
        },
        executor
      );

      await createAdminAuditEntry(
        {
          actorUserId:
            input.actorUserId,

          action:
            "campaign.draft_created",

          entityType:
            "monetization_campaign",

          entityId:
            campaign.id,

          metadata: {
            campaignReference:
              campaign.campaignReference,

            sourceRequestId:
              approved.id,

            sourceRequestReference:
              approved.requestReference,

            readinessStatus:
              campaign.readinessStatus,

            commercialStatus:
              campaign.commercialStatus,

            deliveryEligible:
              campaign.deliveryEligible,
          },

          occurredAt:
            input.decidedAt,
        },
        executor
      );

      return {
        status: "approved",
        request: approved,
        campaign,
        idempotent: false,
      };
    }
  );
}
