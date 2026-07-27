/**
 * Poster workspace service exports.
 *
 * This file is a service import boundary only.
 *
 * Workspace pages should import service contracts and default
 * service instances from this module instead of importing
 * fixture-backed implementations directly.
 *
 * Do not add:
 *
 * - React components;
 * - mock records;
 * - domain calculations;
 * - payment-provider logic;
 * - webhook verification;
 * - ledger mutations;
 * - analytics processing.
 */

export * from "./analytics-workspace.service";

export * from "./payment-workspace.service";

export * from "./wallet-funding.service";
