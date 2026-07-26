/**
 * Poster workspace adapter exports.
 *
 * This file is an adapter import boundary only.
 *
 * Adapters translate canonical domain records into:
 *
 * - UI-ready view models;
 * - temporary legacy compatibility records.
 *
 * Do not add React components, mock data, API calls,
 * payment processing, analytics validation, or business
 * mutations to this file.
 */

/* =========================================================
   DASHBOARD VIEW-MODEL ADAPTERS
   ========================================================= */

export * from "./analytics-dashboard.adapter";

export * from "./payment-dashboard.adapter";

/* =========================================================
   TEMPORARY LEGACY MIGRATION ADAPTERS
   ========================================================= */

export * from "./legacy-media.adapter";

export * from "./legacy-advertising.adapter";
