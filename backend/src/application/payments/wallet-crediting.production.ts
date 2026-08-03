import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createAdvertiserPayment,
  createAdvertiserWalletLedgerEntry,
  findAdvertiserPaymentByProviderPaymentId,
  findAdvertiserWalletByOrganizationId,
  findWalletFundingOrderById,
  markWalletFundingOrderCredited,
  updateAdvertiserWalletBalances,
} from "../../domains/payments/index.js";

import {
  createWalletCreditingService,
  type WalletCreditingService,
  type WalletCreditingServiceDependencies,
} from "./wallet-crediting.service.js";

export function createProductionWalletCreditingService():
  WalletCreditingService {
  const dependencies:
    WalletCreditingServiceDependencies = {
      findFundingOrderById:
        findWalletFundingOrderById,

      markFundingOrderCredited:
        markWalletFundingOrderCredited,

      findWalletByOrganizationId:
        findAdvertiserWalletByOrganizationId,

      updateWalletBalances:
        updateAdvertiserWalletBalances,

      findPaymentByProviderPaymentId:
        findAdvertiserPaymentByProviderPaymentId,

      createPayment:
        createAdvertiserPayment,

      createLedgerEntry:
        createAdvertiserWalletLedgerEntry,

      runTransaction:
        async operation =>
          await runDatabaseTransaction(
            operation
          ),

      now:
        () => new Date(),
    };

  return createWalletCreditingService(
    dependencies
  );
}