import {
  requestPosterApiJson,
} from "./client-api.service";

export interface ClientWalletApiMoney {
  minorUnits: string;
  currency: "INR";
}

export interface ClientWalletApiWallet {
  id: string;
  organizationId: string;
  currency: "INR";
  status: string;
  availableBalance: ClientWalletApiMoney;
  reservedBalance: ClientWalletApiMoney;
  totalCredited: ClientWalletApiMoney;
  totalSpent: ClientWalletApiMoney;
  totalRefunded: ClientWalletApiMoney;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletApiFundingOrder {
  id: string;
  organizationId: string;
  walletId: string;
  requestedByUserId: string;
  provider: string;
  providerOrderId: string | null;
  providerReceipt: string | null;
  amount: ClientWalletApiMoney;
  status: string;
  idempotencyKey: string;
  expiresAt: string | null;
  creditedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletApiLedgerEntry {
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
  amount: ClientWalletApiMoney;
  balanceBefore: ClientWalletApiMoney;
  balanceAfter: ClientWalletApiMoney;
  idempotencyKey: string;
  providerReference: string | null;
  metadata: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
  rowVersion: string;
}

export interface ClientWalletApiPayment {
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
  amount: ClientWalletApiMoney;
  captured: ClientWalletApiMoney;
  refunded: ClientWalletApiMoney;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletApiInvoice {
  id: string;
  organizationId: string;
  campaignId: string | null;
  invoiceNumber: string;
  status: string;
  subtotal: ClientWalletApiMoney;
  tax: ClientWalletApiMoney;
  total: ClientWalletApiMoney;
  paid: ClientWalletApiMoney;
  refunded: ClientWalletApiMoney;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletApiRefund {
  id: string;
  organizationId: string;
  paymentId: string;
  invoiceId: string | null;
  campaignId: string | null;
  provider: string;
  providerRefundId: string | null;
  reason: string;
  status: string;
  requestedAmount: ClientWalletApiMoney;
  approvedAmount: ClientWalletApiMoney | null;
  refundedAmount: ClientWalletApiMoney;
  requestedAt: string;
  approvedAt: string | null;
  refundedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletApiCampaignAllocation {
  id: string;
  organizationId: string;
  walletId: string;
  campaignId: string;
  currency: "INR";
  status: string;
  allocated: ClientWalletApiMoney;
  reserved: ClientWalletApiMoney;
  spent: ClientWalletApiMoney;
  released: ClientWalletApiMoney;
  refunded: ClientWalletApiMoney;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export interface ClientWalletApiOverview {
  wallet: ClientWalletApiWallet | null;
  fundingOrders: ClientWalletApiFundingOrder[];
  ledgerEntries: ClientWalletApiLedgerEntry[];
  payments: ClientWalletApiPayment[];
  invoices: ClientWalletApiInvoice[];
  refunds: ClientWalletApiRefund[];
  campaignAllocations: ClientWalletApiCampaignAllocation[];
  generatedAt: string;
}

const DEFAULT_LIMIT =
  25;

export async function getClientWalletOverview(
  limit:
    number =
      DEFAULT_LIMIT
): Promise<ClientWalletApiOverview> {
  return await requestPosterApiJson<ClientWalletApiOverview>(
    "/api/v1/client/wallet",
    {
      method:
        "GET",
    },
    {
      limit,
    }
  );
}

export async function listClientWalletFundingOrders(
  limit:
    number =
      DEFAULT_LIMIT
): Promise<ClientWalletApiFundingOrder[]> {
  const response =
    await requestPosterApiJson<{
      fundingOrders: ClientWalletApiFundingOrder[];
    }>(
      "/api/v1/client/wallet/funding-orders",
      {
        method:
          "GET",
      },
      {
        limit,
      }
    );

  return response.fundingOrders;
}

export async function listClientWalletLedgerEntries(
  limit:
    number =
      DEFAULT_LIMIT
): Promise<ClientWalletApiLedgerEntry[]> {
  const response =
    await requestPosterApiJson<{
      ledgerEntries: ClientWalletApiLedgerEntry[];
    }>(
      "/api/v1/client/wallet/ledger",
      {
        method:
          "GET",
      },
      {
        limit,
      }
    );

  return response.ledgerEntries;
}

export async function listClientWalletPayments(
  limit:
    number =
      DEFAULT_LIMIT
): Promise<ClientWalletApiPayment[]> {
  const response =
    await requestPosterApiJson<{
      payments: ClientWalletApiPayment[];
    }>(
      "/api/v1/client/wallet/payments",
      {
        method:
          "GET",
      },
      {
        limit,
      }
    );

  return response.payments;
}

export async function listClientWalletInvoices(
  limit:
    number =
      DEFAULT_LIMIT
): Promise<ClientWalletApiInvoice[]> {
  const response =
    await requestPosterApiJson<{
      invoices: ClientWalletApiInvoice[];
    }>(
      "/api/v1/client/wallet/invoices",
      {
        method:
          "GET",
      },
      {
        limit,
      }
    );

  return response.invoices;
}

export async function listClientWalletRefunds(
  limit:
    number =
      DEFAULT_LIMIT
): Promise<ClientWalletApiRefund[]> {
  const response =
    await requestPosterApiJson<{
      refunds: ClientWalletApiRefund[];
    }>(
      "/api/v1/client/wallet/refunds",
      {
        method:
          "GET",
      },
      {
        limit,
      }
    );

  return response.refunds;
}

export async function listClientWalletCampaignAllocations(
  limit:
    number =
      DEFAULT_LIMIT
): Promise<ClientWalletApiCampaignAllocation[]> {
  const response =
    await requestPosterApiJson<{
      campaignAllocations: ClientWalletApiCampaignAllocation[];
    }>(
      "/api/v1/client/wallet/campaign-allocations",
      {
        method:
          "GET",
      },
      {
        limit,
      }
    );

  return response.campaignAllocations;
}