export type AdminWalletOperationsCurrency =
  "INR";

export interface AdminWalletOperationsMoney {
  minorUnits:
    string;

  currency:
    AdminWalletOperationsCurrency;
}

export interface AdminWalletOperationsSummary {
  organizationCount:
    number;

  walletCount:
    number;

  activeWalletCount:
    number;

  totalAvailable:
    AdminWalletOperationsMoney;

  totalReserved:
    AdminWalletOperationsMoney;

  totalCredited:
    AdminWalletOperationsMoney;

  totalSpent:
    AdminWalletOperationsMoney;

  totalRefunded:
    AdminWalletOperationsMoney;

  pendingFundingOrderCount:
    number;

  failedPaymentCount:
    number;

  openRefundCount:
    number;

  unreconciledWebhookCount:
    number;
}

export interface AdminWalletOrganizationRow {
  organizationId:
    string;

  organizationName:
    string;

  walletId:
    string | null;

  walletStatus:
    string;

  available:
    AdminWalletOperationsMoney;

  reserved:
    AdminWalletOperationsMoney;

  credited:
    AdminWalletOperationsMoney;

  spent:
    AdminWalletOperationsMoney;

  refunded:
    AdminWalletOperationsMoney;

  fundingOrderCount:
    number;

  paymentCount:
    number;

  invoiceCount:
    number;

  refundCount:
    number;

  allocationCount:
    number;

  lastPaymentAt:
    string | null;

  updatedAt:
    string | null;
}

export interface AdminWalletFundingOrderRow {
  id:
    string;

  organizationId:
    string;

  organizationName:
    string;

  provider:
    string;

  providerOrderId:
    string | null;

  amount:
    AdminWalletOperationsMoney;

  status:
    string;

  expiresAt:
    string | null;

  creditedAt:
    string | null;

  createdAt:
    string;
}

export interface AdminWalletPaymentRow {
  id:
    string;

  organizationId:
    string;

  organizationName:
    string;

  provider:
    string;

  providerPaymentId:
    string | null;

  captured:
    AdminWalletOperationsMoney;

  refunded:
    AdminWalletOperationsMoney;

  status:
    string;

  paidAt:
    string | null;

  webhookVerifiedAt:
    string | null;

  createdAt:
    string;
}

export interface AdminWalletLedgerRow {
  id:
    string;

  organizationId:
    string;

  organizationName:
    string;

  entryType:
    string;

  direction:
    string;

  status:
    string;

  amount:
    AdminWalletOperationsMoney;

  balanceAfter:
    AdminWalletOperationsMoney;

  providerReference:
    string | null;

  createdAt:
    string;
}

export interface AdminWalletOperationsRepositorySnapshot {
  summary:
    AdminWalletOperationsSummary;

  organizations:
    AdminWalletOrganizationRow[];

  fundingOrders:
    AdminWalletFundingOrderRow[];

  payments:
    AdminWalletPaymentRow[];

  ledgerEntries:
    AdminWalletLedgerRow[];
}

export interface AdminWalletOperationsResponse
  extends AdminWalletOperationsRepositorySnapshot {
  generatedAt:
    string;
}