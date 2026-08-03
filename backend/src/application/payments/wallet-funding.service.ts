import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  validateWalletFundingOrderInput,
  type AdvertiserWalletRecord,
  type AttachWalletFundingProviderOrderInput,
  type CreateAdvertiserWalletInput,
  type CreateWalletFundingOrderInput,
  type CreateWalletFundingOrderRepositoryInput,
  type PaymentCurrencyCode,
  type PaymentProvider,
  type WalletFundingOrderRecord,
} from "../../domains/payments/index.js";

import {
  WalletFundingConflictError,
  WalletFundingValidationError,
} from "./wallet-funding.errors.js";

export interface StartWalletFundingInput {
  organizationId:
    string;

  actorUserId:
    string;

  amountMinorUnits:
    bigint;

  currency:
    PaymentCurrencyCode;

  idempotencyKey:
    string;

  provider?:
    PaymentProvider;

  providerPayload?:
    Record<string, unknown>;

  expiresAt?:
    Date | null;
}

export interface WalletFundingProviderOrderInput {
  amountMinorUnits: bigint;
  currency: "INR";
  receipt: string;
  notes: Record<string, string>;
}

export interface WalletFundingProviderOrderResult {
  providerOrderId: string;
  receipt: string | null;
  rawPayload: Record<string, unknown>;
}

export interface WalletFundingServiceDependencies {
  findWalletByOrganizationId: (
    organizationId: string,
    executor?: DatabaseQueryExecutor
  ) => Promise<AdvertiserWalletRecord | null>;

  createWallet: (
    input: CreateAdvertiserWalletInput,
    executor: DatabaseQueryExecutor
  ) => Promise<AdvertiserWalletRecord>;

  createFundingOrder: (
    input: CreateWalletFundingOrderRepositoryInput,
    executor: DatabaseQueryExecutor
  ) => Promise<WalletFundingOrderRecord>;

  attachProviderOrder?: (
    input: AttachWalletFundingProviderOrderInput,
    executor: DatabaseQueryExecutor
  ) => Promise<WalletFundingOrderRecord | null>;

  createProviderOrder?: (
    input: WalletFundingProviderOrderInput
  ) => Promise<WalletFundingProviderOrderResult>;

  runTransaction: <Result>(
    operation: (
      executor: DatabaseQueryExecutor
    ) => Promise<Result>
  ) => Promise<Result>;

  now: () => Date;

  fundingOrderTtlMinutes?:
    number;
}

export interface WalletFundingService {
  startFunding: (
    input: StartWalletFundingInput
  ) => Promise<WalletFundingOrderRecord>;
}

const DEFAULT_FUNDING_ORDER_TTL_MINUTES =
  15;

const PREFLIGHT_WALLET_ID =
  "pending-wallet";

function resolveFundingOrderExpiry(
  input: StartWalletFundingInput,
  dependencies: WalletFundingServiceDependencies
): Date | null {
  if (input.expiresAt !== undefined) {
    return input.expiresAt;
  }

  const ttlMinutes =
    dependencies.fundingOrderTtlMinutes ??
    DEFAULT_FUNDING_ORDER_TTL_MINUTES;

  return new Date(
    dependencies.now().getTime() +
      ttlMinutes * 60 * 1000
  );
}

function validateFundingRequest(
  input: StartWalletFundingInput,
  walletId: string
): void {
  const provider =
    input.provider ??
    "razorpay";

  const validationInput:
    CreateWalletFundingOrderInput = {
      organizationId:
        input.organizationId,

      walletId,

      amountMinorUnits:
        input.amountMinorUnits,

      currency:
        input.currency,

      provider,

      actorUserId:
        input.actorUserId,

      idempotencyKey:
        input.idempotencyKey,
    };

  const errors =
    validateWalletFundingOrderInput(
      validationInput
    );

  if (errors.length > 0) {
    throw new WalletFundingValidationError(
      errors
    );
  }
}

function createProviderReceipt(
  order: WalletFundingOrderRecord
): string {
  return `wf_${order.id.replaceAll("-", "").slice(0, 32)}`;
}

async function attachProviderOrderWhenConfigured(
  order: WalletFundingOrderRecord,
  dependencies: WalletFundingServiceDependencies
): Promise<WalletFundingOrderRecord> {
  const createProviderOrder =
    dependencies.createProviderOrder;

  const attachProviderOrder =
    dependencies.attachProviderOrder;

  if (
    !createProviderOrder ||
    !attachProviderOrder
  ) {
    return order;
  }

  if (
    order.providerOrderId !== null ||
    order.status !== "created"
  ) {
    return order;
  }

  if (order.amount.currency !== "INR") {
    throw new WalletFundingConflictError(
      "Only INR Razorpay provider orders are supported for v1."
    );
  }

  const receipt =
    createProviderReceipt(
      order
    );

  const providerOrder =
    await createProviderOrder({
      amountMinorUnits:
        order.amount.minorUnits,

      currency:
        "INR",

      receipt,

      notes: {
        organizationId:
          order.organizationId,

        walletId:
          order.walletId,

        fundingOrderId:
          order.id,
      },
    });

  const attached =
    await dependencies.runTransaction(
      async executor =>
        await attachProviderOrder(
          {
            fundingOrderId:
              order.id,

            providerOrderId:
              providerOrder.providerOrderId,

            providerReceipt:
              providerOrder.receipt ?? receipt,

            providerPayload:
              providerOrder.rawPayload,

            expectedRowVersion:
              order.rowVersion,
          },
          executor
        )
    );

  if (!attached) {
    throw new WalletFundingConflictError(
      "Wallet funding provider order could not be attached because the funding order changed."
    );
  }

  return attached;
}

export function createWalletFundingService(
  dependencies: WalletFundingServiceDependencies
): WalletFundingService {
  return {
    async startFunding(
      input
    ) {
      validateFundingRequest(
        input,
        PREFLIGHT_WALLET_ID
      );

      const provider =
        input.provider ??
        "razorpay";

      const order =
        await dependencies.runTransaction(
          async executor => {
            let wallet =
              await dependencies.findWalletByOrganizationId(
                input.organizationId,
                executor
              );

            if (!wallet) {
              wallet =
                await dependencies.createWallet(
                  {
                    organizationId:
                      input.organizationId,

                    currency:
                      input.currency,
                  },
                  executor
                );
            }

            validateFundingRequest(
              input,
              wallet.id
            );

            return await dependencies.createFundingOrder(
              {
                organizationId:
                  input.organizationId,

                walletId:
                  wallet.id,

                requestedByUserId:
                  input.actorUserId,

                amountMinorUnits:
                  input.amountMinorUnits,

                currency:
                  input.currency,

                provider,

                idempotencyKey:
                  input.idempotencyKey,

                providerPayload:
                  input.providerPayload ?? {},

                expiresAt:
                  resolveFundingOrderExpiry(
                    input,
                    dependencies
                  ),
              },
              executor
            );
          }
        );

      return await attachProviderOrderWhenConfigured(
        order,
        dependencies
      );
    },
  };
}