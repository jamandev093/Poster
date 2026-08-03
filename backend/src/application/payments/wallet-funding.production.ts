import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createAdvertiserWallet,
  createWalletFundingOrder,
  findAdvertiserWalletByOrganizationId,
} from "../../domains/payments/index.js";

import {
  createWalletFundingService,
  type WalletFundingService,
  type WalletFundingServiceDependencies,
} from "./wallet-funding.service.js";

export interface CreateProductionWalletFundingServiceOptions {
  fundingOrderTtlMinutes?: number;
}

export function createProductionWalletFundingService(
  options: CreateProductionWalletFundingServiceOptions = {}
): WalletFundingService {
  const dependencies:
    WalletFundingServiceDependencies = {
      findWalletByOrganizationId:
        findAdvertiserWalletByOrganizationId,

      createWallet:
        createAdvertiserWallet,

      createFundingOrder:
        createWalletFundingOrder,

      runTransaction:
        async operation =>
          await runDatabaseTransaction(
            operation
          ),

      now:
        () => new Date(),
    };

  if (options.fundingOrderTtlMinutes !== undefined) {
    dependencies.fundingOrderTtlMinutes =
      options.fundingOrderTtlMinutes;
  }

  return createWalletFundingService(
    dependencies
  );
}