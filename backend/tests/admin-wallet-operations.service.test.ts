import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminWalletOperationsService,
  type AdminWalletOperationsRepositorySnapshot,
} from "../src/application/payments/index.js";

const GENERATED_AT =
  new Date(
    "2026-08-03T18:45:00.000Z"
  );

const SNAPSHOT:
  AdminWalletOperationsRepositorySnapshot = {
  summary: {
    organizationCount:
      1,

    walletCount:
      1,

    activeWalletCount:
      1,

    totalAvailable: {
      minorUnits:
        "500000",

      currency:
        "INR",
    },

    totalReserved: {
      minorUnits:
        "100000",

      currency:
        "INR",
    },

    totalCredited: {
      minorUnits:
        "700000",

      currency:
        "INR",
    },

    totalSpent: {
      minorUnits:
        "200000",

      currency:
        "INR",
    },

    totalRefunded: {
      minorUnits:
        "0",

      currency:
        "INR",
    },

    pendingFundingOrderCount:
      2,

    failedPaymentCount:
      1,

    openRefundCount:
      0,

    unreconciledWebhookCount:
      0,
  },

  organizations: [],

  campaignAllocations: [],

  fundingOrders: [],

  payments: [],

  ledgerEntries: [],
};

describe("Admin Wallet Operations service", () => {
  it("returns a generated Wallet Operations snapshot", async () => {
    const readSnapshot =
      vi.fn()
        .mockResolvedValue(
          SNAPSHOT
        );

    const service =
      createAdminWalletOperationsService({
        readSnapshot,
        now:
          () => GENERATED_AT,
      });

    const result =
      await service.getSnapshot();

    expect(result.generatedAt).toBe(
      GENERATED_AT.toISOString()
    );

    expect(result.summary.totalAvailable).toEqual({
      minorUnits:
        "500000",

      currency:
        "INR",
    });

    expect(readSnapshot).toHaveBeenCalledTimes(
      1
    );
  });

  it("rejects an invalid generation timestamp", async () => {
    const service =
      createAdminWalletOperationsService({
        readSnapshot:
          vi.fn()
            .mockResolvedValue(
              SNAPSHOT
            ),

        now:
          () => new Date(
            "invalid"
          ),
      });

    await expect(
      service.getSnapshot()
    ).rejects.toThrow(
      "Admin Wallet Operations generation time is invalid."
    );
  });
});