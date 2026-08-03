export interface ClientWalletReadRequest {
  organizationId: string;
  limit: number;
}

export interface ClientWalletReadMoney {
  minorUnits: string;
  currency: "INR";
}

export interface ClientWalletReadWallet {
  id: string;
  organizationId: string;
  currency: "INR";
  status: string;
  availableBalance: ClientWalletReadMoney;
  reservedBalance: ClientWalletReadMoney;
  totalCredited: ClientWalletReadMoney;
  totalSpent: ClientWalletReadMoney;
  totalRefunded: ClientWalletReadMoney;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletReadFundingOrder {
  id: string;
  organizationId: string;
  walletId: string;
  requestedByUserId: string;
  provider: string;
  providerOrderId: string | null;
  providerReceipt: string | null;
  amount: ClientWalletReadMoney;
  status: string;
  idempotencyKey: string;
  expiresAt: string | null;
  creditedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletReadLedgerEntry {
  id: string;
  organizationId: string;
  walletId: string;
  fundingOrderId: string | null;
  campaignId: string | null;
  allocationId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  refundId: string | null;
  entryType: string;
  direction: string;
  status: string;
  amount: ClientWalletReadMoney;
  balanceBefore: ClientWalletReadMoney;
  balanceAfter: ClientWalletReadMoney;
  idempotencyKey: string;
  providerReference: string | null;
  metadata: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
  rowVersion: string;
}

export interface ClientWalletReadPayment {
  id: string;
  organizationId: string;
  walletId: string | null;
  fundingOrderId: string | null;
  invoiceId: string | null;
  campaignId: string | null;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  status: string;
  amount: ClientWalletReadMoney;
  captured: ClientWalletReadMoney;
  refunded: ClientWalletReadMoney;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletReadInvoice {
  id: string;
  organizationId: string;
  campaignId: string | null;
  invoiceNumber: string;
  status: string;
  subtotal: ClientWalletReadMoney;
  tax: ClientWalletReadMoney;
  total: ClientWalletReadMoney;
  paid: ClientWalletReadMoney;
  refunded: ClientWalletReadMoney;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletReadRefund {
  id: string;
  organizationId: string;
  paymentId: string;
  invoiceId: string | null;
  campaignId: string | null;
  provider: string;
  providerRefundId: string | null;
  reason: string;
  status: string;
  requestedAmount: ClientWalletReadMoney;
  approvedAmount: ClientWalletReadMoney | null;
  refundedAmount: ClientWalletReadMoney;
  requestedAt: string;
  approvedAt: string | null;
  refundedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletReadCampaignAllocation {
  id: string;
  organizationId: string;
  walletId: string;
  campaignId: string;
  currency: "INR";
  status: string;
  allocated: ClientWalletReadMoney;
  reserved: ClientWalletReadMoney;
  spent: ClientWalletReadMoney;
  released: ClientWalletReadMoney;
  refunded: ClientWalletReadMoney;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletReadOverview {
  wallet: ClientWalletReadWallet | null;
  fundingOrders: ClientWalletReadFundingOrder[];
  ledgerEntries: ClientWalletReadLedgerEntry[];
  payments: ClientWalletReadPayment[];
  invoices: ClientWalletReadInvoice[];
  refunds: ClientWalletReadRefund[];
  campaignAllocations: ClientWalletReadCampaignAllocation[];
  generatedAt: string;
}

export interface ClientWalletReadService {
  getOverview: (
    input: ClientWalletReadRequest
  ) => Promise<ClientWalletReadOverview>;

  listFundingOrders: (
    input: ClientWalletReadRequest
  ) => Promise<ClientWalletReadFundingOrder[]>;

  listLedgerEntries: (
    input: ClientWalletReadRequest
  ) => Promise<ClientWalletReadLedgerEntry[]>;

  listPayments: (
    input: ClientWalletReadRequest
  ) => Promise<ClientWalletReadPayment[]>;

  listInvoices: (
    input: ClientWalletReadRequest
  ) => Promise<ClientWalletReadInvoice[]>;

  listRefunds: (
    input: ClientWalletReadRequest
  ) => Promise<ClientWalletReadRefund[]>;

  listCampaignAllocations: (
    input: ClientWalletReadRequest
  ) => Promise<ClientWalletReadCampaignAllocation[]>;
}

export class ClientWalletReadValidationError extends Error {
  readonly code =
    "client_wallet_read_validation_failed";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "ClientWalletReadValidationError";
  }
}