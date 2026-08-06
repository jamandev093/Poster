/**
 * Poster workspace hook exports.
 *
 * This file is a React hook import boundary only.
 *
 * Workspace pages should import dashboard hooks from this
 * module instead of reaching into individual hook files.
 *
 * Do not add:
 *
 * - domain contracts;
 * - fixture records;
 * - API implementations;
 * - payment processing;
 * - analytics calculations;
 * - React components.
 */



export * from "./usePaymentDashboard";
export * from "./useClientWalletOverview";

export * from "./useClientWalletAllocationActions";
