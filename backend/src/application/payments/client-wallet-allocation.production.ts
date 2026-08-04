import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createCampaignWalletAllocation,
  createAdvertiserWalletLedgerEntry,
  findAdvertiserWalletByOrganizationId,
  findCampaignWalletAllocationByCampaignId,
  updateAdvertiserWalletBalances,
  updateCampaignWalletAllocationAmounts,
} from "../../domains/payments/index.js";

import {
  findMonetizationCampaignById,
} from "../../domains/monetization/index.js";

import {
  createClientWalletAllocationService,
  type ClientWalletAllocationService,
  type ClientWalletAllocationServiceDependencies,
} from "./client-wallet-allocation.service.js";

export function createProductionClientWalletAllocationService():
  ClientWalletAllocationService {
  const dependencies:
    ClientWalletAllocationServiceDependencies = {
      findWalletByOrganizationId:
        findAdvertiserWalletByOrganizationId,

      findCampaignById:
        async (
          campaignId,
          executor
        ) => {
          const campaign =
            await findMonetizationCampaignById(
              campaignId,
              executor
            );

          if (
            !campaign
          ) {
            return null;
          }

          return {
            id:
              campaign.id,

            organizationId:
              campaign.organizationId,

            status:
              campaign.status,
          };
        },

      findAllocationByCampaignId:
        findCampaignWalletAllocationByCampaignId,

      createAllocation:
        createCampaignWalletAllocation,

      updateAllocationAmounts:
        updateCampaignWalletAllocationAmounts,

      updateWalletBalances:
        updateAdvertiserWalletBalances,

      createLedgerEntry:
        async (
          input,
          executor
        ) =>
          await createAdvertiserWalletLedgerEntry(
            {
              organizationId:
                input.organizationId,

              walletId:
                input.walletId,

              entryType:
                input.entryType,

              direction:
                input.direction,

              amountMinorUnits:
                input.amountMinorUnits,

              currency:
                input.currency,

              balanceBeforeMinorUnits:
                input.balanceBeforeMinorUnits,

              balanceAfterMinorUnits:
                input.balanceAfterMinorUnits,

              idempotencyKey:
                input.idempotencyKey,

              actorUserId:
                input.createdByUserId,

              campaignId:
                input.campaignId,

              allocationId:
                input.allocationId,

              metadata: {
                source:
                  "client_campaign_wallet_allocation",
              },
            },
            executor
          ),

      runTransaction:
        async operation =>
          await runDatabaseTransaction(
            operation
          ),
    };

  return createClientWalletAllocationService(
    dependencies
  );
}