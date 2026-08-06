/**
 * Poster workspace component exports.
 *
 * This file is a shared workspace component import boundary.
 *
 * Do not add:
 *
 * - domain contracts;
 * - fixture data;
 * - API calls;
 * - analytics calculations;
 * - payment logic;
 * - ledger mutations.
 */

export * from "./DashboardState";



export * from "./FinancialSummaryCard";

export * from "./FinancialSummaryGrid";

export * from "./DashboardSectionHeader";




export * from "./PaymentsNavigation";


export { default as AddFundsPanel } from "./AddFundsPanel";
export { default as ClientWalletDashboard } from "./ClientWalletDashboard";
export { default as ClientWalletRecordsPage } from "./ClientWalletRecordsPage";
export { default as ClientCampaignWalletAllocationPanel } from "./ClientCampaignWalletAllocationPanel";
export { default as ClientCampaignWalletAllocationCampaignSection } from "./ClientCampaignWalletAllocationCampaignSection";
