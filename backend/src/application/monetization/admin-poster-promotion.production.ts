import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createAdminAuditEntry,
  createInternalPosterPromotionCampaign,
  findMonetizationCampaignById,
  posterPromotionRepository,
  updateInternalPosterPromotionCampaign,
} from "../../domains/monetization/index.js";

import type {
  JsonObject,
} from "../../domains/monetization/index.js";

import {
  createAdminPosterPromotionService,
} from "./admin-poster-promotion.service.js";

export function createProductionAdminPosterPromotionService() {
  return createAdminPosterPromotionService({
    runTransaction:
      async operation =>
        await runDatabaseTransaction(
          operation
        ),

    findCampaign:
      findMonetizationCampaignById,

    createCampaign:
      createInternalPosterPromotionCampaign,

    updateCampaign:
      updateInternalPosterPromotionCampaign,

    promotionRepository:
      posterPromotionRepository,

    createAuditEntry:
      async (
        input,
        executor
      ) =>
        await createAdminAuditEntry(
          {
            actorUserId:
              input.actorUserId,

            action:
              input.action,

            entityType:
              input.entityType,

            entityId:
              input.entityId,

            metadata:
              input.metadata as
                JsonObject,

            occurredAt:
              input.occurredAt,
          },
          executor
        ),

    now:
      () =>
        new Date(),
  });
}

export const adminPosterPromotionService =
  createProductionAdminPosterPromotionService();