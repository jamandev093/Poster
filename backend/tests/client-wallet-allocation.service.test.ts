import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  ClientWalletAllocationConflictError,
  ClientWalletAllocationInsufficientBalanceError,
  ClientWalletAllocationValidationError,
  createClientWalletAllocationService,
  type ClientWalletAllocationCampaign,
  type ClientWalletAllocationRecord,
  type ClientWalletAllocationServiceDependencies,
  type ClientWalletAllocationWallet,
} from "../src/application/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001401";

const ALLOCATION_ID =
  "00000000-0000-4000-8000-000000001501";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const EXECUTOR =
  {} as DatabaseQueryExecutor;

const NOW =
  new Date("2026-08-04T08:00:00.000Z");

function buildWallet(
  overrides:
    Partial<ClientWalletAllocationWallet> =
      {}
): ClientWalletAllocationWallet {
  return {
    id:
      WALLET_ID,

    organizationId:
      ORGANIZATION_ID,

    currency:
      "INR",

    status:
      "active",

    availableBalance: {
      minorUnits:
        1000000n,

      currency:
        "INR",
    },

    reservedBalance: {
      minorUnits:
        200000n,

      currency:
        "INR",
    },

    totalCredited: {
      minorUnits:
        1200000n,

      currency:
        "INR",
    },

    totalSpent: {
      minorUnits:
        0n,

      currency:
        "INR",
    },

    totalRefunded: {
      minorUnits:
        0n,

      currency:
        "INR",
    },

    rowVersion:
      "7",

    ...overrides,
  };
}

function buildCampaign(
  overrides:
    Partial<ClientWalletAllocationCampaign> =
      {}
): ClientWalletAllocationCampaign {
  return {
    id:
      CAMPAIGN_ID,

    organizationId:
      ORGANIZATION_ID,

    status:
      "scheduled",

    ...overrides,
  };
}

function buildAllocation(
  overrides:
    Partial<ClientWalletAllocationRecord> =
      {}
): ClientWalletAllocationRecord {
  return {
    id:
      ALLOCATION_ID,

    organizationId:
      ORGANIZATION_ID,

    walletId:
      WALLET_ID,

    campaignId:
      CAMPAIGN_ID,

    currency:
      "INR",

    status:
      "active",

    allocated: {
      minorUnits:
        300000n,

      currency:
        "INR",
    },

    reserved: {
      minorUnits:
        300000n,

      currency:
        "INR",
    },

    spent: {
      minorUnits:
        0n,

      currency:
        "INR",
    },

    released: {
      minorUnits:
        0n,

      currency:
        "INR",
    },

    refunded: {
      minorUnits:
        0n,

      currency:
        "INR",
    },

    createdByUserId:
      USER_ID,

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "3",

    ...overrides,
  };
}

interface DependencyTestHarness {
  dependencies:
    ClientWalletAllocationServiceDependencies;

  findWalletByOrganizationId:
    ReturnType<typeof vi.fn>;

  findCampaignById:
    ReturnType<typeof vi.fn>;

  findAllocationByCampaignId:
    ReturnType<typeof vi.fn>;

  createAllocationMock:
    ReturnType<typeof vi.fn>;

  updateAllocationAmounts:
    ReturnType<typeof vi.fn>;

  updateWalletBalances:
    ReturnType<typeof vi.fn>;

  createLedgerEntry:
    ReturnType<typeof vi.fn>;
}

function createDependencies(
  overrides:
    Partial<ClientWalletAllocationServiceDependencies> =
      {}
): DependencyTestHarness {
  const findWalletByOrganizationId =
    vi.fn()
      .mockResolvedValue(
        buildWallet()
      );

  const findCampaignById =
    vi.fn()
      .mockResolvedValue(
        buildCampaign()
      );

  const findAllocationByCampaignId =
    vi.fn()
      .mockResolvedValue(
        null
      );

  const createAllocationMock =
    vi.fn()
      .mockResolvedValue(
        buildAllocation()
      );

  const updateAllocationAmounts =
    vi.fn()
      .mockResolvedValue(
        buildAllocation()
      );

  const updateWalletBalances =
    vi.fn()
      .mockResolvedValue(
        buildWallet({
          availableBalance: {
            minorUnits:
              750000n,

            currency:
              "INR",
          },

          reservedBalance: {
            minorUnits:
              450000n,

            currency:
              "INR",
          },

          rowVersion:
            "8",
        })
      );

  const createLedgerEntry =
    vi.fn()
      .mockResolvedValue({});

  const dependencies: ClientWalletAllocationServiceDependencies = {
    findWalletByOrganizationId,
    findCampaignById,
    findAllocationByCampaignId,
    createAllocation:
      createAllocationMock,

    updateAllocationAmounts,
    updateWalletBalances,
    createLedgerEntry,

    runTransaction:
      async <Result>(
        operation:
          (
            executor:
              DatabaseQueryExecutor
          ) => Promise<Result>
      ): Promise<Result> =>
        await operation(
          EXECUTOR
        ),

    ...overrides,
  };

  return {
    dependencies,
    findWalletByOrganizationId,
    findCampaignById,
    findAllocationByCampaignId,
    createAllocationMock,
    updateAllocationAmounts,
    updateWalletBalances,
    createLedgerEntry,
  };
}

describe(
  "Client Wallet allocation service",
  () => {
    it(
      "allocates available Wallet funds to a campaign",
      async () => {
        const {
          dependencies,
          updateWalletBalances,
          createAllocationMock,
          createLedgerEntry,
        } =
          createDependencies();

        const service =
          createClientWalletAllocationService(
            dependencies
          );

        const result =
          await service.allocateCampaignWalletFunds({
            organizationId:
              ORGANIZATION_ID,

            actorUserId:
              USER_ID,

            campaignId:
              CAMPAIGN_ID,

            amountMinorUnits:
              250000n,

            currency:
              "INR",

            idempotencyKey:
              "alloc-0001",
          });

        expect(
          result.wallet.availableBalance.minorUnits
        ).toBe(
          750000n
        );

        expect(
          updateWalletBalances
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            walletId:
              WALLET_ID,

            availableBalanceMinorUnits:
              750000n,

            reservedBalanceMinorUnits:
              450000n,

            expectedRowVersion:
              "7",
          }),
          EXECUTOR
        );

        expect(
          createAllocationMock
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId:
              ORGANIZATION_ID,

            walletId:
              WALLET_ID,

            campaignId:
              CAMPAIGN_ID,

            allocatedMinorUnits:
              250000n,
          }),
          EXECUTOR
        );

        expect(
          createLedgerEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            entryType:
              "campaign_reservation",

            direction:
              "debit",

            amountMinorUnits:
              250000n,

            idempotencyKey:
              "alloc-0001",
          }),
          EXECUTOR
        );
      }
    );

    it(
      "adds funds to an existing allocation instead of creating a duplicate",
      async () => {
        const existingAllocation =
          buildAllocation();

        const {
          dependencies,
          createAllocationMock,
          updateAllocationAmounts,
        } =
          createDependencies({
            findAllocationByCampaignId:
              vi.fn().mockResolvedValue(
                existingAllocation
              ),
          });

        const service =
          createClientWalletAllocationService(
            dependencies
          );

        await service.allocateCampaignWalletFunds({
          organizationId:
            ORGANIZATION_ID,

          actorUserId:
            USER_ID,

          campaignId:
            CAMPAIGN_ID,

          amountMinorUnits:
            250000n,

          currency:
            "INR",

          idempotencyKey:
            "alloc-0002",
        });

        expect(
          createAllocationMock
        ).not.toHaveBeenCalled();

        expect(
          updateAllocationAmounts
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            allocationId:
              ALLOCATION_ID,

            reservedMinorUnits:
              550000n,

            expectedRowVersion:
              "3",
          }),
          EXECUTOR
        );
      }
    );

    it(
      "rejects allocation when available balance is insufficient",
      async () => {
        const {
          dependencies,
          updateWalletBalances,
        } =
          createDependencies({
            findWalletByOrganizationId:
              vi.fn().mockResolvedValue(
                buildWallet({
                  availableBalance: {
                    minorUnits:
                      10000n,

                    currency:
                      "INR",
                  },
                })
              ),
          });

        const service =
          createClientWalletAllocationService(
            dependencies
          );

        await expect(
          service.allocateCampaignWalletFunds({
            organizationId:
              ORGANIZATION_ID,

            actorUserId:
              USER_ID,

            campaignId:
              CAMPAIGN_ID,

            amountMinorUnits:
              250000n,

            currency:
              "INR",

            idempotencyKey:
              "alloc-0003",
          })
        ).rejects.toBeInstanceOf(
          ClientWalletAllocationInsufficientBalanceError
        );

        expect(
          updateWalletBalances
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "releases reserved campaign funds back to available balance",
      async () => {
        const releaseWalletUpdateMock =
          vi.fn().mockResolvedValue(
            buildWallet({
              availableBalance: {
                minorUnits:
                  1150000n,

                currency:
                  "INR",
              },

              reservedBalance: {
                minorUnits:
                  50000n,

                currency:
                  "INR",
              },

              rowVersion:
                "8",
            })
          );

        const releaseAllocationUpdateMock =
          vi.fn().mockResolvedValue(
            buildAllocation({
              reserved: {
                minorUnits:
                  150000n,

                currency:
                  "INR",
              },

              released: {
                minorUnits:
                  150000n,

                currency:
                  "INR",
              },

              rowVersion:
                "4",
            })
          );

        const {
          dependencies,
          createLedgerEntry,
        } =
          createDependencies({
            findAllocationByCampaignId:
              vi.fn().mockResolvedValue(
                buildAllocation()
              ),

            updateWalletBalances:
              releaseWalletUpdateMock,

            updateAllocationAmounts:
              releaseAllocationUpdateMock,
          });

        const service =
          createClientWalletAllocationService(
            dependencies
          );

        const result =
          await service.releaseCampaignWalletFunds({
            organizationId:
              ORGANIZATION_ID,

            actorUserId:
              USER_ID,

            campaignId:
              CAMPAIGN_ID,

            amountMinorUnits:
              150000n,

            expectedRowVersion:
              "3",

            idempotencyKey:
              "release-0001",
          });

        expect(
          result.wallet.availableBalance.minorUnits
        ).toBe(
          1150000n
        );

        expect(
          releaseWalletUpdateMock
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            walletId:
              WALLET_ID,

            availableBalanceMinorUnits:
              1150000n,

            reservedBalanceMinorUnits:
              50000n,
          }),
          EXECUTOR
        );

        expect(
          releaseAllocationUpdateMock
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            allocationId:
              ALLOCATION_ID,

            reservedMinorUnits:
              150000n,

            releasedMinorUnits:
              150000n,
          }),
          EXECUTOR
        );

        expect(
          createLedgerEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            entryType:
              "campaign_release",

            direction:
              "credit",

            amountMinorUnits:
              150000n,

            idempotencyKey:
              "release-0001",
          }),
          EXECUTOR
        );
      }
    );

    it(
      "rejects stale allocation row versions",
      async () => {
        const {
          dependencies,
        } =
          createDependencies({
            findAllocationByCampaignId:
              vi.fn().mockResolvedValue(
                buildAllocation({
                  rowVersion:
                    "5",
                })
              ),
          });

        const service =
          createClientWalletAllocationService(
            dependencies
          );

        await expect(
          service.releaseCampaignWalletFunds({
            organizationId:
              ORGANIZATION_ID,

            actorUserId:
              USER_ID,

            campaignId:
              CAMPAIGN_ID,

            amountMinorUnits:
              150000n,

            expectedRowVersion:
              "3",

            idempotencyKey:
              "release-0002",
          })
        ).rejects.toBeInstanceOf(
          ClientWalletAllocationConflictError
        );
      }
    );

    it(
      "rejects invalid allocation input",
      async () => {
        const {
          dependencies,
        } =
          createDependencies();

        const service =
          createClientWalletAllocationService(
            dependencies
          );

        await expect(
          service.allocateCampaignWalletFunds({
            organizationId:
              "",

            actorUserId:
              USER_ID,

            campaignId:
              CAMPAIGN_ID,

            amountMinorUnits:
              0n,

            currency:
              "INR",

            idempotencyKey:
              "",
          })
        ).rejects.toBeInstanceOf(
          ClientWalletAllocationValidationError
        );
      }
    );
  }
);