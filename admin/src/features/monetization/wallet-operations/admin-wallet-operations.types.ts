export type AdminWalletCurrency =
  "INR";

export interface AdminWalletMoney {
  minorUnits:
    string;

  currency:
    AdminWalletCurrency;
}

export interface AdminWalletOperationsSummary {
  organizationCount:
    number;

  walletCount:
    number;

  activeWalletCount:
    number;

  totalAvailable:
    AdminWalletMoney;

  totalReserved:
    AdminWalletMoney;

  totalCredited:
    AdminWalletMoney;

  totalSpent:
    AdminWalletMoney;

  totalRefunded:
    AdminWalletMoney;

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
    AdminWalletMoney;

  reserved:
    AdminWalletMoney;

  credited:
    AdminWalletMoney;

  spent:
    AdminWalletMoney;

  refunded:
    AdminWalletMoney;

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
    AdminWalletMoney;

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
    AdminWalletMoney;

  refunded:
    AdminWalletMoney;

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
    AdminWalletMoney;

  balanceAfter:
    AdminWalletMoney;

  providerReference:
    string | null;

  createdAt:
    string;
}

export interface AdminWalletOperationsResponse {
  generatedAt:
    string;

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