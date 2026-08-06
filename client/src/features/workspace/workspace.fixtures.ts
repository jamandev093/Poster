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
   TRUSTED-SHAPE ANALYTICS FIXTURES
   ========================================================= */

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
