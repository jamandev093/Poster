/**
 * Poster workspace public feature boundary.
 *
 * Production workspace pages and components should import
 * contracts, adapters, services, and React hooks through this
 * module.
 *
 * Development fixtures are intentionally excluded.
 *
 * Do not add:
 *
 * - fixture exports;
 * - mock records;
 * - React components;
 * - payment-provider processing;
 * - webhook verification;
 * - analytics event processing;
 * - mutable ledger operations.
 */

/* =========================================================
   CANONICAL DOMAIN CONTRACTS
   ========================================================= */

export * from "./workspace.contracts";

/* =========================================================
   VIEW-MODEL AND LEGACY ADAPTERS
   ========================================================= */

export * from "./adapters";

/* =========================================================
   ASYNCHRONOUS WORKSPACE SERVICES
   ========================================================= */

export * from "./services";

/* =========================================================
   CLIENT-SIDE REACT HOOKS
   ========================================================= */

export * from "./hooks";

/* =========================================================
   SHARED WORKSPACE COMPONENTS
   ========================================================= */

export * from "./components";
