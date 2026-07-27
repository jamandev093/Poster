/**
 * Canonical Poster advertising workspace exports.
 *
 * This file is an import boundary only.
 *
 * Responsibilities remain separated inside:
 *
 * - advertising/
 * - media/
 * - analytics/
 * - payments/
 *
 * Do not add business logic, calculations, validation,
 * mock records, UI code, or API calls to this file.
 *
 * Client components may gradually migrate to:
 *
 * import type { ... } from
 *   "@/features/workspace/workspace.contracts";
 *
 * Admin, Mobile, Backend, and future shared packages must
 * preserve the same canonical meanings.
 */

/* =========================================================
   ADVERTISING WORKFLOW
   ========================================================= */

export * from "./advertising/advertising.types";

export * from "./advertising/advertising.status";

export * from "./advertising/advertising.validation";

/* =========================================================
   CREATIVE MEDIA
   ========================================================= */

export * from "./media/media.types";

export * from "./media/media.rules";

export * from "./media/media.validation";

export * from "./media/media.metadata";

/* =========================================================
   ADVERTISING ANALYTICS
   ========================================================= */

export * from "./analytics/analytics.types";

export * from "./analytics/analytics.metrics";

export * from "./analytics/analytics.quality";

export * from "./analytics/analytics.freshness";

export * from "./analytics/analytics.aggregation";

/* =========================================================
   ADVERTISER PAYMENTS
   ========================================================= */

export * from "./payments/currency.types";

export * from "./payments/payment.types";

export * from "./payments/invoice.types";

export * from "./payments/settlement.types";

export * from "./payments/refund.types";

export * from "./payments/ledger.types";

export * from "./payments/budget.types";

export * from "./payments/payment.status";

export * from "./payments/payment.formatters";

/* =========================================================
   ADVERTISER WALLET
   ========================================================= */

export * from "./wallet/wallet.types";

export * from "./wallet/wallet.funding.types";
