/**
 * Development-only Poster workspace fixtures.
 *
 * This file is a fixture export boundary only.
 *
 * It must never contain:
 *
 * - production contracts;
 * - calculations;
 * - validation;
 * - API calls;
 * - payment processing;
 * - analytics authority;
 * - ledger mutations.
 *
 * Production components should eventually receive data through
 * organization-scoped API services.
 */

/* =========================================================
   LEGACY WORKSPACE FIXTURES
   ========================================================= */

/**
 * Existing request, campaign, and organization fixtures.
 *
 * These remain exported temporarily while the legacy workspace
 * records are migrated to the canonical advertising and media
 * contracts.
 */
export {
  campaigns as legacyCampaigns,
  commercialRequests as legacyCommercialRequests,
  currentOrganization as legacyCurrentOrganization,
} from "./workspace.mock";

/* =========================================================
   TRUSTED-SHAPE ANALYTICS FIXTURES
   ========================================================= */

export {
  analyticsBreakdownRows,
  campaignAnalyticsSnapshots,
  getMockCampaignAnalyticsSnapshot,
  getMockCampaignBreakdowns,
  organizationAnalyticsReport,
} from "./analytics/analytics.mock";

/* =========================================================
   PAYMENT AND FINANCIAL FIXTURES
   ========================================================= */

export {
  getMockCampaignBudget,
  getMockCampaignLedgerEntries,
  getMockInvoiceById,
  getMockPaymentById,
  mockAdvertiserInvoice,
  mockAdvertiserPayment,
  mockAdvertiserRefund,
  mockCampaignBudget,
  mockCampaignBudgets,
  mockInvoices,
  mockLedgerAccount,
  mockLedgerEntries,
  mockPaymentAttempt,
  mockPaymentOrder,
  mockPaymentSettlement,
  mockPayments,
  mockRefundRequest,
  mockRefundRequests,
  mockRefundReview,
  mockRefunds,
  mockSettlements,
} from "./payments/payment.mock";
