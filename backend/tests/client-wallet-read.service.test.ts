import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ClientWalletReadValidationError,
  createClientWalletReadService,
  type ClientWalletReadServiceDependencies,
} from "../src/application/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const NOW =
  new Date("2026-08-03T14:15:00.000Z");

function createDependencies():
  ClientWalletReadServiceDependencies {
  return {
    findWallet:
      vi.fn<
        ClientWalletReadServiceDependencies[
          "findWallet"
        ]
      >()
        .mockResolvedValue(
          null
        ),

    listFundingOrders:
      vi.fn<
        ClientWalletReadServiceDependencies[
          "listFundingOrders"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listLedgerEntries:
      vi.fn<
        ClientWalletReadServiceDependencies[
          "listLedgerEntries"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listPayments:
      vi.fn<
        ClientWalletReadServiceDependencies[
          "listPayments"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listInvoices:
      vi.fn<
        ClientWalletReadServiceDependencies[
          "listInvoices"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listRefunds:
      vi.fn<
        ClientWalletReadServiceDependencies[
          "listRefunds"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    listCampaignAllocations:
      vi.fn<
        ClientWalletReadServiceDependencies[
          "listCampaignAllocations"
        ]
      >()
        .mockResolvedValue(
          []
        ),

    now:
      () => NOW,
  };
}

describe("Client Wallet read service", () => {
  it("creates a Client Wallet overview from all read dependencies", async () => {
    const dependencies =
      createDependencies();

    const service =
      createClientWalletReadService(
        dependencies
      );

    const overview =
      await service.getOverview({
        organizationId:
          `  ${ORGANIZATION_ID}  `,

        limit:
          7,
      });

    expect(overview).toEqual({
      wallet:
        null,

      fundingOrders:
        [],

      ledgerEntries:
        [],

      payments:
        [],

      invoices:
        [],

      refunds:
        [],

      campaignAllocations:
        [],

      generatedAt:
        NOW.toISOString(),
    });

    expect(
      dependencies.findWallet
    ).toHaveBeenCalledWith({
      organizationId:
        ORGANIZATION_ID,

      limit:
        7,
    });

    expect(
      dependencies.listRefunds
    ).toHaveBeenCalledWith({
      organizationId:
        ORGANIZATION_ID,

      limit:
        7,
    });
  });

  it("rejects invalid Client Wallet read requests", async () => {
    const service =
      createClientWalletReadService(
        createDependencies()
      );

    await expect(
      service.getOverview({
        organizationId:
          "   ",

        limit:
          10,
      })
    ).rejects.toThrow(
      ClientWalletReadValidationError
    );

    await expect(
      service.listPayments({
        organizationId:
          ORGANIZATION_ID,

        limit:
          101,
      })
    ).rejects.toThrow(
      ClientWalletReadValidationError
    );
  });
});