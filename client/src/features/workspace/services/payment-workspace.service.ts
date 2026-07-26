import {
  createPaymentDashboardViewModel,
} from "../adapters/payment-dashboard.adapter";

import type {
  CreatePaymentDashboardViewModelInput,
  PaymentDashboardViewModel,
} from "../adapters/payment-dashboard.adapter";

import type {
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  CampaignBudget,
} from "../payments/budget.types";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import type {
  AdvertiserInvoice,
} from "../payments/invoice.types";

import type {
  LedgerEntry,
} from "../payments/ledger.types";

import type {
  AdvertiserPayment,
} from "../payments/payment.types";

import type {
  AdvertiserRefund,
} from "../payments/refund.types";

import type {
  AdvertiserPaymentSettlement,
} from "../payments/settlement.types";

import {
  mockCampaignBudgets,
  mockInvoices,
  mockLedgerEntries,
  mockPayments,
  mockRefunds,
  mockSettlements,
} from "../workspace.fixtures";

/**
 * Payment workspace service.
 *
 * Client pages and React components should request financial
 * information through this service instead of importing mock
 * payment records directly.
 *
 * The fixture-backed data source will later be replaced by an
 * authenticated Backend API implementation.
 *
 * This service must not:
 *
 * - create Razorpay orders;
 * - trust browser payment callbacks;
 * - verify webhook signatures;
 * - mutate ledger entries;
 * - approve or execute refunds;
 * - calculate Backend-authoritative balances;
 * - perform provider settlement operations.
 */

export interface PaymentWorkspaceQuery {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  campaignIds?:
    CampaignId[];
}

export interface PaymentWorkspaceDataSource {
  getCampaignBudgets(
    organizationId:
      OrganizationId
  ): Promise<
    CampaignBudget[]
  >;

  getInvoices(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserInvoice[]
  >;

  getPayments(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserPayment[]
  >;

  getSettlements(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserPaymentSettlement[]
  >;

  getRefunds(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserRefund[]
  >;

  getLedgerEntries(
    organizationId:
      OrganizationId
  ): Promise<
    LedgerEntry[]
  >;
}

export interface PaymentWorkspaceService {
  getDashboard(
    query:
      PaymentWorkspaceQuery
  ): Promise<
    PaymentDashboardViewModel
  >;
}

function createCampaignIdSet(
  campaignIds:
    CampaignId[] |
    undefined
): Set<
  CampaignId
> | undefined {
  if (
    !campaignIds ||
    campaignIds.length ===
      0
  ) {
    return undefined;
  }

  return new Set(
    campaignIds
  );
}

function campaignMatches(
  campaignId:
    CampaignId |
    undefined,
  requestedCampaignIds:
    Set<
      CampaignId
    > |
    undefined
): boolean {
  if (
    !requestedCampaignIds
  ) {
    return true;
  }

  return Boolean(
    campaignId &&
    requestedCampaignIds.has(
      campaignId
    )
  );
}

function filterBudgets(
  budgets:
    CampaignBudget[],
  requestedCampaignIds:
    Set<
      CampaignId
    > |
    undefined
): CampaignBudget[] {
  return budgets.filter(
    (
      budget
    ) =>
      campaignMatches(
        budget.campaignId,
        requestedCampaignIds
      )
  );
}

function filterInvoices(
  invoices:
    AdvertiserInvoice[],
  requestedCampaignIds:
    Set<
      CampaignId
    > |
    undefined
): AdvertiserInvoice[] {
  return invoices.filter(
    (
      invoice
    ) =>
      campaignMatches(
        invoice.campaignId,
        requestedCampaignIds
      )
  );
}

function filterPayments(
  payments:
    AdvertiserPayment[],
  requestedCampaignIds:
    Set<
      CampaignId
    > |
    undefined
): AdvertiserPayment[] {
  return payments.filter(
    (
      payment
    ) =>
      campaignMatches(
        payment.campaignId,
        requestedCampaignIds
      )
  );
}

function filterRefunds(
  refunds:
    AdvertiserRefund[],
  requestedCampaignIds:
    Set<
      CampaignId
    > |
    undefined
): AdvertiserRefund[] {
  return refunds.filter(
    (
      refund
    ) =>
      campaignMatches(
        refund.campaignId,
        requestedCampaignIds
      )
  );
}

function filterLedgerEntries(
  entries:
    LedgerEntry[],
  requestedCampaignIds:
    Set<
      CampaignId
    > |
    undefined
): LedgerEntry[] {
  return entries.filter(
    (
      entry
    ) =>
      campaignMatches(
        entry.campaignId,
        requestedCampaignIds
      )
  );
}

function filterSettlements(
  settlements:
    AdvertiserPaymentSettlement[],
  includedPaymentIds:
    Set<
      string
    >,
  campaignFilterActive:
    boolean
): AdvertiserPaymentSettlement[] {
  if (
    !campaignFilterActive
  ) {
    return settlements;
  }

  return settlements.filter(
    (
      settlement
    ) =>
      settlement
        .paymentAllocations
        .some(
          (
            allocation
          ) =>
            includedPaymentIds.has(
              allocation.paymentId
            )
        )
  );
}

export const fixturePaymentWorkspaceDataSource:
  PaymentWorkspaceDataSource = {
  async getCampaignBudgets(
    organizationId:
      OrganizationId
  ): Promise<
    CampaignBudget[]
  > {
    return mockCampaignBudgets.filter(
      (
        budget
      ) =>
        budget.organizationId ===
        organizationId
    );
  },

  async getInvoices(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserInvoice[]
  > {
    return mockInvoices.filter(
      (
        invoice
      ) =>
        invoice.organizationId ===
        organizationId
    );
  },

  async getPayments(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserPayment[]
  > {
    return mockPayments.filter(
      (
        payment
      ) =>
        payment.organizationId ===
        organizationId
    );
  },

  async getSettlements(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserPaymentSettlement[]
  > {
    return mockSettlements.filter(
      (
        settlement
      ) =>
        settlement.organizationId ===
        organizationId
    );
  },

  async getRefunds(
    organizationId:
      OrganizationId
  ): Promise<
    AdvertiserRefund[]
  > {
    return mockRefunds.filter(
      (
        refund
      ) =>
        refund.organizationId ===
        organizationId
    );
  },

  async getLedgerEntries(
    organizationId:
      OrganizationId
  ): Promise<
    LedgerEntry[]
  > {
    return mockLedgerEntries.filter(
      (
        entry
      ) =>
        entry.organizationId ===
        organizationId
    );
  },
};

export function createPaymentWorkspaceService(
  dataSource:
    PaymentWorkspaceDataSource =
      fixturePaymentWorkspaceDataSource
): PaymentWorkspaceService {
  return {
    async getDashboard(
      query:
        PaymentWorkspaceQuery
    ): Promise<
      PaymentDashboardViewModel
    > {
      const [
        budgets,
        invoices,
        payments,
        settlements,
        refunds,
        ledgerEntries,
      ] =
        await Promise.all([
          dataSource.getCampaignBudgets(
            query.organizationId
          ),

          dataSource.getInvoices(
            query.organizationId
          ),

          dataSource.getPayments(
            query.organizationId
          ),

          dataSource.getSettlements(
            query.organizationId
          ),

          dataSource.getRefunds(
            query.organizationId
          ),

          dataSource.getLedgerEntries(
            query.organizationId
          ),
        ]);

      const requestedCampaignIds =
        createCampaignIdSet(
          query.campaignIds
        );

      const filteredBudgets =
        filterBudgets(
          budgets,
          requestedCampaignIds
        );

      const filteredInvoices =
        filterInvoices(
          invoices,
          requestedCampaignIds
        );

      const filteredPayments =
        filterPayments(
          payments,
          requestedCampaignIds
        );

      const filteredRefunds =
        filterRefunds(
          refunds,
          requestedCampaignIds
        );

      const filteredLedgerEntries =
        filterLedgerEntries(
          ledgerEntries,
          requestedCampaignIds
        );

      const includedPaymentIds =
        new Set(
          filteredPayments.map(
            (
              payment
            ) =>
              payment.id
          )
        );

      const filteredSettlements =
        filterSettlements(
          settlements,
          includedPaymentIds,
          Boolean(
            requestedCampaignIds
          )
        );

      const adapterInput:
        CreatePaymentDashboardViewModelInput = {
        organizationId:
          query.organizationId,

        currency:
          query.currency,

        budgets:
          filteredBudgets,

        invoices:
          filteredInvoices,

        payments:
          filteredPayments,

        settlements:
          filteredSettlements,

        refunds:
          filteredRefunds,

        ledgerEntries:
          filteredLedgerEntries,
      };

      return createPaymentDashboardViewModel(
        adapterInput
      );
    },
  };
}

export const paymentWorkspaceService =
  createPaymentWorkspaceService();
