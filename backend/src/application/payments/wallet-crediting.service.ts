import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  AdvertiserPaymentRecord,
  AdvertiserWalletLedgerEntryRecord,
  AdvertiserWalletRecord,
  CreateAdvertiserPaymentInput,
  CreateAdvertiserWalletLedgerEntryInput,
  PaymentCurrencyCode,
  PaymentProvider,
  UpdateAdvertiserWalletBalancesInput,
  WalletFundingOrderRecord,
} from "../../domains/payments/index.js";

import {
  WalletCreditingConflictError,
  WalletCreditingValidationError,
} from "./wallet-crediting.errors.js";

export interface CreditVerifiedWalletPaymentInput {
  organizationId: string;
  actorUserId: string;
  fundingOrderId: string;
  provider: PaymentProvider;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignatureDigest: string;
  amountMinorUnits: bigint;
  currency: PaymentCurrencyCode;
  methodDetails?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
  paidAt?: Date | null;
  webhookVerifiedAt?: Date | null;
}

export interface CreditVerifiedWalletPaymentResult {
  payment: AdvertiserPaymentRecord;
  ledgerEntry: AdvertiserWalletLedgerEntryRecord;
  wallet: AdvertiserWalletRecord;
  fundingOrder: WalletFundingOrderRecord;
}

export interface WalletCreditingServiceDependencies {
  findFundingOrderById: (
    fundingOrderId: string,
    executor?: DatabaseQueryExecutor
  ) => Promise<WalletFundingOrderRecord | null>;

  markFundingOrderCredited: (
    input: {
      fundingOrderId: string;
      creditedAt: Date;
      expectedRowVersion: string;
    },
    executor: DatabaseQueryExecutor
  ) => Promise<WalletFundingOrderRecord | null>;

  findWalletByOrganizationId: (
    organizationId: string,
    executor?: DatabaseQueryExecutor
  ) => Promise<AdvertiserWalletRecord | null>;

  updateWalletBalances: (
    input: UpdateAdvertiserWalletBalancesInput,
    executor: DatabaseQueryExecutor
  ) => Promise<AdvertiserWalletRecord | null>;

  findPaymentByProviderPaymentId: (
    providerPaymentId: string,
    executor?: DatabaseQueryExecutor
  ) => Promise<AdvertiserPaymentRecord | null>;

  createPayment: (
    input: CreateAdvertiserPaymentInput,
    executor: DatabaseQueryExecutor
  ) => Promise<AdvertiserPaymentRecord>;

  createLedgerEntry: (
    input: CreateAdvertiserWalletLedgerEntryInput,
    executor: DatabaseQueryExecutor
  ) => Promise<AdvertiserWalletLedgerEntryRecord>;

  runTransaction: <Result>(
    operation: (
      executor: DatabaseQueryExecutor
    ) => Promise<Result>
  ) => Promise<Result>;

  now: () => Date;
}

export interface WalletCreditingService {
  creditVerifiedPayment: (
    input: CreditVerifiedWalletPaymentInput
  ) => Promise<CreditVerifiedWalletPaymentResult | AdvertiserPaymentRecord>;
}

function requireNonEmpty(
  value: string,
  message: string
): void {
  if (value.trim().length === 0) {
    throw new WalletCreditingValidationError(message);
  }
}

function validateInput(
  input: CreditVerifiedWalletPaymentInput
): void {
  requireNonEmpty(input.organizationId, "Organization is required.");
  requireNonEmpty(input.actorUserId, "Actor user is required.");
  requireNonEmpty(input.fundingOrderId, "Funding order is required.");
  requireNonEmpty(input.providerOrderId, "Provider order id is required.");
  requireNonEmpty(input.providerPaymentId, "Provider payment id is required.");
  requireNonEmpty(input.providerSignatureDigest, "Provider signature digest is required.");

  if (input.provider !== "razorpay") {
    throw new WalletCreditingValidationError(
      "Only Razorpay verified payments are supported for v1."
    );
  }

  if (input.currency !== "INR") {
    throw new WalletCreditingValidationError(
      "Only INR Wallet crediting is supported for v1."
    );
  }

  if (input.amountMinorUnits <= 0n) {
    throw new WalletCreditingValidationError(
      "Payment amount must be greater than zero."
    );
  }
}

function assertFundingOrderMatchesPayment(
  fundingOrder: WalletFundingOrderRecord,
  input: CreditVerifiedWalletPaymentInput
): void {
  if (fundingOrder.organizationId !== input.organizationId) {
    throw new WalletCreditingConflictError(
      "Funding order does not belong to the organization."
    );
  }

  if (fundingOrder.provider !== input.provider) {
    throw new WalletCreditingConflictError(
      "Funding order provider does not match the payment provider."
    );
  }

  if (fundingOrder.providerOrderId !== input.providerOrderId) {
    throw new WalletCreditingConflictError(
      "Funding order provider order id does not match."
    );
  }

  if (fundingOrder.amount.minorUnits !== input.amountMinorUnits) {
    throw new WalletCreditingConflictError(
      "Funding order amount does not match the verified payment."
    );
  }

  if (fundingOrder.amount.currency !== input.currency) {
    throw new WalletCreditingConflictError(
      "Funding order currency does not match the verified payment."
    );
  }

  if (fundingOrder.status === "credited") {
    throw new WalletCreditingConflictError(
      "Funding order is already credited."
    );
  }
}

function assertWalletMatchesFundingOrder(
  wallet: AdvertiserWalletRecord,
  fundingOrder: WalletFundingOrderRecord
): void {
  if (wallet.organizationId !== fundingOrder.organizationId) {
    throw new WalletCreditingConflictError(
      "Wallet does not belong to the funding organization."
    );
  }

  if (wallet.id !== fundingOrder.walletId) {
    throw new WalletCreditingConflictError(
      "Wallet does not match the funding order."
    );
  }

  if (wallet.status !== "active") {
    throw new WalletCreditingConflictError(
      "Wallet is not active."
    );
  }
}

export function createWalletCreditingService(
  dependencies: WalletCreditingServiceDependencies
): WalletCreditingService {
  return {
    async creditVerifiedPayment(input) {
      validateInput(input);

      return await dependencies.runTransaction(
        async executor => {
          const existingPayment =
            await dependencies.findPaymentByProviderPaymentId(
              input.providerPaymentId,
              executor
            );

          if (existingPayment) {
            return existingPayment;
          }

          const fundingOrder =
            await dependencies.findFundingOrderById(
              input.fundingOrderId,
              executor
            );

          if (!fundingOrder) {
            throw new WalletCreditingConflictError(
              "Funding order was not found."
            );
          }

          assertFundingOrderMatchesPayment(
            fundingOrder,
            input
          );

          const wallet =
            await dependencies.findWalletByOrganizationId(
              input.organizationId,
              executor
            );

          if (!wallet) {
            throw new WalletCreditingConflictError(
              "Advertiser Wallet was not found."
            );
          }

          assertWalletMatchesFundingOrder(
            wallet,
            fundingOrder
          );

          const paidAt =
            input.paidAt ??
            dependencies.now();

          const webhookVerifiedAt =
            input.webhookVerifiedAt ??
            dependencies.now();

          const payment =
            await dependencies.createPayment(
              {
                organizationId: input.organizationId,
                walletId: wallet.id,
                fundingOrderId: fundingOrder.id,
                provider: input.provider,
                providerOrderId: input.providerOrderId,
                providerPaymentId: input.providerPaymentId,
                providerSignatureDigest: input.providerSignatureDigest,
                status: "captured",
                amountMinorUnits: input.amountMinorUnits,
                capturedMinorUnits: input.amountMinorUnits,
                currency: input.currency,
                methodDetails: input.methodDetails ?? {},
                providerPayload: input.providerPayload ?? {},
                webhookVerifiedAt,
                paidAt,
              },
              executor
            );

          const balanceBefore =
            wallet.availableBalance.minorUnits;

          const balanceAfter =
            balanceBefore +
            input.amountMinorUnits;

          const ledgerEntry =
            await dependencies.createLedgerEntry(
              {
                organizationId: input.organizationId,
                walletId: wallet.id,
                fundingOrderId: fundingOrder.id,
                paymentId: payment.id,
                entryType: "payment_credit",
                direction: "credit",
                amountMinorUnits: input.amountMinorUnits,
                currency: input.currency,
                balanceBeforeMinorUnits: balanceBefore,
                balanceAfterMinorUnits: balanceAfter,
                idempotencyKey: `wallet-credit:${input.providerPaymentId}`,
                actorUserId: input.actorUserId,
                providerReference: input.providerPaymentId,
                metadata: {
                  providerOrderId: input.providerOrderId,
                },
              },
              executor
            );

          const updatedWallet =
            await dependencies.updateWalletBalances(
              {
                walletId: wallet.id,
                availableBalanceMinorUnits: balanceAfter,
                reservedBalanceMinorUnits: wallet.reservedBalance.minorUnits,
                totalCreditedMinorUnits:
                  wallet.totalCredited.minorUnits +
                  input.amountMinorUnits,
                totalSpentMinorUnits: wallet.totalSpent.minorUnits,
                totalRefundedMinorUnits: wallet.totalRefunded.minorUnits,
                expectedRowVersion: wallet.rowVersion,
              },
              executor
            );

          if (!updatedWallet) {
            throw new WalletCreditingConflictError(
              "Wallet balance update failed because the Wallet changed."
            );
          }

          const creditedFundingOrder =
            await dependencies.markFundingOrderCredited(
              {
                fundingOrderId: fundingOrder.id,
                creditedAt: paidAt,
                expectedRowVersion: fundingOrder.rowVersion,
              },
              executor
            );

          if (!creditedFundingOrder) {
            throw new WalletCreditingConflictError(
              "Funding order credit status update failed because the order changed."
            );
          }

          return {
            payment,
            ledgerEntry,
            wallet: updatedWallet,
            fundingOrder: creditedFundingOrder,
          };
        }
      );
    },
  };
}