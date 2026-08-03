import type {
  MoneyAmount,
  PaymentProvider,
  PaymentCurrencyCode,
  WalletFundingOrderStatus,
} from "./payment.types.js";

export interface WalletFundingOrderRecord {
  id: string;
  organizationId: string;
  walletId: string;
  requestedByUserId: string;
  provider: PaymentProvider;
  providerOrderId: string | null;
  providerReceipt: string | null;
  amount: MoneyAmount;
  status: WalletFundingOrderStatus;
  idempotencyKey: string;
  providerPayload: Record<string, unknown>;
  expiresAt: Date | null;
  creditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CreateWalletFundingOrderRepositoryInput {
  organizationId: string;
  walletId: string;
  requestedByUserId: string;
  amountMinorUnits: bigint;
  currency: PaymentCurrencyCode;
  provider: PaymentProvider;
  idempotencyKey: string;
  providerPayload?: Record<string, unknown>;
  expiresAt?: Date | null;
}

export interface AttachWalletFundingProviderOrderInput {
  fundingOrderId: string;
  providerOrderId: string;
  providerReceipt: string | null;
  providerPayload: Record<string, unknown>;
  expectedRowVersion: string;
}
export interface MarkWalletFundingOrderCreditedInput {
  fundingOrderId: string;
  creditedAt: Date;
  expectedRowVersion: string;
}