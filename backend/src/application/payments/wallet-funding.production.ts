import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  attachWalletFundingProviderOrder,
  createAdvertiserWallet,
  createWalletFundingOrder,
  findAdvertiserWalletByOrganizationId,
} from "../../domains/payments/index.js";

import {
  createRazorpayOrderAdapter,
  type RazorpayOrderAdapterConfig,
} from "../../integrations/payments/index.js";

import {
  createWalletFundingService,
  type WalletFundingProviderOrderInput,
  type WalletFundingProviderOrderResult,
  type WalletFundingService,
  type WalletFundingServiceDependencies,
} from "./wallet-funding.service.js";

export interface CreateProductionWalletFundingServiceOptions {
  fundingOrderTtlMinutes?: number;
}

function createOptionalRazorpayProviderOrderCreator():
  | ((
      input: WalletFundingProviderOrderInput
    ) => Promise<WalletFundingProviderOrderResult>)
  | null {
  const keyId =
    process.env.RAZORPAY_KEY_ID?.trim();

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET?.trim();

  if (
    !keyId ||
    !keySecret
  ) {
    return null;
  }

  const config:
    RazorpayOrderAdapterConfig = {
      keyId,
      keySecret,
  };

  const apiBaseUrl =
    process.env.RAZORPAY_API_BASE_URL?.trim();

  if (apiBaseUrl) {
    config.apiBaseUrl =
      apiBaseUrl;
  }

  const adapter =
    createRazorpayOrderAdapter(
      config
    );

  return async input =>
    await adapter.createOrder({
      amountMinorUnits:
        input.amountMinorUnits,

      currency:
        input.currency,

      receipt:
        input.receipt,

      notes:
        input.notes,
    });
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

  const createProviderOrder =
    createOptionalRazorpayProviderOrderCreator();

  if (createProviderOrder) {
    dependencies.createProviderOrder =
      createProviderOrder;

    dependencies.attachProviderOrder =
      attachWalletFundingProviderOrder;
  }

  if (options.fundingOrderTtlMinutes !== undefined) {
    dependencies.fundingOrderTtlMinutes =
      options.fundingOrderTtlMinutes;
  }

  return createWalletFundingService(
    dependencies
  );
}