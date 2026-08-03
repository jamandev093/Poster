import {
  createClientWalletReadService,
  type ClientWalletReadService,
} from "./client-wallet-read.service.js";

import {
  findClientWalletByOrganizationId,
  listClientWalletCampaignAllocations,
  listClientWalletFundingOrders,
  listClientWalletInvoices,
  listClientWalletLedgerEntries,
  listClientWalletPayments,
  listClientWalletRefunds,
} from "./client-wallet-read.repository.js";

export function createProductionClientWalletReadService():
  ClientWalletReadService {
  return createClientWalletReadService({
    findWallet:
      findClientWalletByOrganizationId,

    listFundingOrders:
      listClientWalletFundingOrders,

    listLedgerEntries:
      listClientWalletLedgerEntries,

    listPayments:
      listClientWalletPayments,

    listInvoices:
      listClientWalletInvoices,

    listRefunds:
      listClientWalletRefunds,

    listCampaignAllocations:
      listClientWalletCampaignAllocations,

    now:
      () => new Date(),
  });
}