// @vitest-environment jsdom

import {
  act,
  cleanup,
  renderHook,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const campaignMocks =
  vi.hoisted(
    () => ({
      refreshRequests:
        vi.fn(),

      refreshWallet:
        vi.fn(),

      requestResult: {
        requests:
          [] as unknown[],

        isLoading:
          false,

        isRefreshing:
          false,

        errorMessage:
          null as string | null,

        refresh:
          vi.fn(),
      },

      walletResult: {
        overview:
          null as unknown,

        isLoading:
          false,

        errorMessage:
          null as string | null,

        refresh:
          vi.fn(),
      },
    })
  );

vi.mock(
  "@/features/requests/useClientCommercialRequests",
  () => ({
    useClientCommercialRequests:
      vi.fn(
        () =>
          campaignMocks.requestResult
      ),
  })
);

vi.mock(
  "@/features/workspace/hooks/useClientWalletOverview",
  () => ({
    useClientWalletOverview:
      vi.fn(
        () =>
          campaignMocks.walletResult
      ),
  })
);

import {
  useClientCampaigns,
} from "./useClientCampaigns";

function createMoney(
  minorUnits:
    string
) {
  return {
    currency:
      "INR",

    minorUnits,
  };
}

function createAllocation(
  campaignId:
    string
) {
  return {
    campaignId,

    allocated:
      createMoney(
        "500000"
      ),

    reserved:
      createMoney(
        "125000"
      ),

    spent:
      createMoney(
        "12345"
      ),

    released:
      createMoney(
        "25000"
      ),
  };
}

beforeEach(
  () => {
    campaignMocks
      .refreshRequests
      .mockReset();

    campaignMocks
      .refreshWallet
      .mockReset();

    campaignMocks
      .refreshRequests
      .mockResolvedValue(
        undefined
      );

    campaignMocks
      .refreshWallet
      .mockResolvedValue(
        undefined
      );

    campaignMocks.requestResult = {
      requests:
        [],

      isLoading:
        false,

      isRefreshing:
        false,

      errorMessage:
        null,

      refresh:
        campaignMocks
          .refreshRequests,
    };

    campaignMocks.walletResult = {
      overview:
        null,

      isLoading:
        false,

      errorMessage:
        null,

      refresh:
        campaignMocks
          .refreshWallet,
    };
  }
);

afterEach(
  () => {
    cleanup();
  }
);

describe(
  "useClientCampaigns behavior",
  () => {
    it(
      "shows only approved or Backend-linked requests",
      () => {
        campaignMocks.requestResult.requests = [
          {
            id:
              "ADV-A",

            status:
              "approved",

            requestReference:
              "ADV-REF-A",

            campaignName:
              "Approved campaign",

            requestType:
              "direct_sponsorship",

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-02T00:00:00.000Z",
          },

          {
            id:
              "ADV-B",

            status:
              "pending_review",

            linkedCampaignId:
              "CMP-B",

            campaignName:
              "Linked campaign",

            requestType:
              "affiliate",

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-03T00:00:00.000Z",
          },

          {
            id:
              "ADV-HIDDEN",

            status:
              "pending_review",

            campaignName:
              "Not yet a campaign",

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-01T00:00:00.000Z",
          },
        ];

        const {
          result,
        } =
          renderHook(
            () =>
              useClientCampaigns(
                100
              )
          );

        expect(
          result.current
            .campaigns
            .map(
              campaign =>
                campaign.requestId
            )
        ).toEqual([
          "ADV-A",
          "ADV-B",
        ]);
      }
    );

    it(
      "maps Backend commercial request fields, fallback terms, Wallet allocation, and minor currency units",
      () => {
        const allocation =
          createAllocation(
            "CMP-A"
          );

        campaignMocks.requestResult.requests = [
          {
            id:
              "ADV-A",

            requestReference:
              "ADV-REF-A",

            status:
              "approved",

            linkedCampaignId:
              "CMP-A",

            campaignName:
              "Research launch",

            requestType:
              "affiliate",

            readinessStatus:
              "active",

            requestedStartDate:
              "2026-08-15",

            requestedEndDate:
              "2026-09-15",

            commercialTerms: {
              proposedBudgetMinor:
                250000,

              proposedContractValueMinor:
                300000,

              objective:
                "Research awareness",
            },

            creativeSpec: {
              destinationUrl:
                "https://research.example/campaign",
            },

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-10T00:00:00.000Z",
          },
        ];

        campaignMocks.walletResult.overview = {
          campaignAllocations: [
            allocation,
          ],
        };

        const {
          result,
        } =
          renderHook(
            () =>
              useClientCampaigns()
          );

        expect(
          result.current.campaigns
        ).toHaveLength(
          1
        );

        expect(
          result.current.campaigns[0]
        ).toMatchObject({
          id:
            "CMP-A",

          requestId:
            "ADV-A",

          requestReference:
            "ADV-REF-A",

          name:
            "Research launch",

          type:
            "affiliate",

          status:
            "active",

          requestStatus:
            "approved",

          linkedCampaignId:
            "CMP-A",

          objective:
            "Research awareness",

          destinationUrl:
            "https://research.example/campaign",

          startDate:
            "2026-08-15",

          endDate:
            "2026-09-15",

          performance: {
            impressions:
              0,

            clicks:
              0,

            conversions:
              null,
          },

          financials: {
            currency:
              "INR",

            budget:
              2500,

            contractValue:
              3000,

            utilized:
              123.45,
          },

          walletAllocation:
            allocation,
        });
      }
    );

    it(
      "uses request budget before commercial-term budget",
      () => {
        campaignMocks.requestResult.requests = [
          {
            id:
              "ADV-BUDGET",

            status:
              "approved",

            linkedCampaignId:
              "CMP-BUDGET",

            campaignName:
              "Budget priority",

            budgetMinorUnits:
              90000,

            commercialTerms: {
              proposedBudgetMinor:
                10000,
            },

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-02T00:00:00.000Z",
          },
        ];

        const {
          result,
        } =
          renderHook(
            () =>
              useClientCampaigns()
          );

        expect(
          result.current
            .campaigns[0]
            .financials
            .budget
        ).toBe(
          900
        );
      }
    );

    it(
      "derives scheduled, disabled, and draft campaign status safely",
      () => {
        campaignMocks.requestResult.requests = [
          {
            id:
              "ADV-SCHEDULED",

            status:
              "approved",

            linkedCampaignId:
              "CMP-SCHEDULED",

            campaignName:
              "Scheduled",

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-02T00:00:00.000Z",
          },

          {
            id:
              "ADV-DISABLED",

            status:
              "rejected",

            linkedCampaignId:
              "CMP-DISABLED",

            campaignName:
              "Rejected",

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-02T00:00:00.000Z",
          },

          {
            id:
              "ADV-DRAFT",

            status:
              "approved",

            campaignName:
              "Approved but setup pending",

            submittedAt:
              "2026-08-01T00:00:00.000Z",

            updatedAt:
              "2026-08-02T00:00:00.000Z",
          },
        ];

        const {
          result,
        } =
          renderHook(
            () =>
              useClientCampaigns()
          );

        expect(
          result.current
            .campaigns
            .map(
              campaign =>
                campaign.status
            )
        ).toEqual([
          "scheduled",
          "disabled",
          "draft",
        ]);
      }
    );

    it(
      "preserves request and Wallet loading/error states separately",
      () => {
        campaignMocks.requestResult.isLoading =
          false;

        campaignMocks.requestResult.isRefreshing =
          true;

        campaignMocks.requestResult.errorMessage =
          "Campaign request Backend unavailable.";

        campaignMocks.walletResult.isLoading =
          true;

        campaignMocks.walletResult.errorMessage =
          "Wallet allocation unavailable.";

        const {
          result,
        } =
          renderHook(
            () =>
              useClientCampaigns()
          );

        expect(
          result.current.isLoading
        ).toBe(
          true
        );

        expect(
          result.current.isRefreshing
        ).toBe(
          true
        );

        expect(
          result.current.errorMessage
        ).toBe(
          "Campaign request Backend unavailable."
        );

        expect(
          result.current.walletErrorMessage
        ).toBe(
          "Wallet allocation unavailable."
        );
      }
    );

    it(
      "refreshes request and Wallet Backend sources together",
      async () => {
        const {
          result,
        } =
          renderHook(
            () =>
              useClientCampaigns(
                25
              )
          );

        await act(
          async () => {
            await result.current
              .refresh();
          }
        );

        expect(
          campaignMocks.refreshRequests
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          campaignMocks.refreshWallet
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );
  }
);