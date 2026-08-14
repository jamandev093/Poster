// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import type {
  ClientCampaignListItem,
  UseClientCampaignsResult,
} from "./useClientCampaigns";

const mocks =
  vi.hoisted(
    () => ({
      state:
        null as unknown,

      walletSection:
        vi.fn(
          (
            _props: {
              campaignId:
                string;
            }
          ) =>
            {
              void _props;
              return null;
            }
        ),
    })
  );

vi.mock(
  "./useClientCampaigns",
  () => ({
    useClientCampaigns:
      () =>
        mocks.state,
  })
);

vi.mock(
  "@/features/workspace/components/ClientCampaignWalletAllocationCampaignSection",
  () => ({
    default:
      mocks.walletSection,
  })
);

import CampaignDetailsBackendEntry from "./CampaignDetailsBackendEntry";

function createCampaign(
  overrides:
    Partial<ClientCampaignListItem> = {}
):
  ClientCampaignListItem {
  return {
    id:
      "CMP-DETAIL",

    requestId:
      "ADV-DETAIL",

    requestReference:
      "ADV-REF-DETAIL",

    name:
      "Poster Knowledge Campaign",

    type:
      "direct_sponsorship" as
        ClientCampaignListItem["type"],

    status:
      "active",

    requestStatus:
      "approved" as
        ClientCampaignListItem["requestStatus"],

    startDate:
      "2026-08-15",

    endDate:
      "2026-09-15",

    linkedCampaignId:
      "CMP-DETAIL",

    objective:
      "Knowledge discovery awareness",

    destinationUrl:
      "https://publisher.example/knowledge",

    performance: {
      impressions:
        1234,

      clicks:
        56,

      conversions:
        7,
    },

    financials: {
      currency:
        "INR",

      budget:
        5000,

      utilized:
        123.45,
    },

    walletAllocation: {
      campaignId:
        "CMP-DETAIL",

      allocated: {
        currency:
          "INR",

        minorUnits:
          "500000",
      },

      reserved: {
        currency:
          "INR",

        minorUnits:
          "125000",
      },

      spent: {
        currency:
          "INR",

        minorUnits:
          "12345",
      },

      released: {
        currency:
          "INR",

        minorUnits:
          "25000",
      },
    } as unknown as
      NonNullable<
        ClientCampaignListItem[
          "walletAllocation"
        ]
      >,

    submittedAt:
      "2026-08-01T10:00:00.000Z",

    updatedAt:
      "2026-08-14T10:00:00.000Z",

    ...overrides,
  };
}

function setHookState(
  overrides:
    Partial<UseClientCampaignsResult> = {}
):
  UseClientCampaignsResult {
  const state:
    UseClientCampaignsResult = {
    campaigns:
      [],

    isLoading:
      false,

    isRefreshing:
      false,

    errorMessage:
      null,

    walletErrorMessage:
      null,

    refresh:
      vi.fn(
        async () => {}
      ),

    ...overrides,
  };

  mocks.state =
    state;

  return state;
}

function section(
  name:
    string
) {
  const heading =
    screen.getByRole(
      "heading",
      {
        name,
      }
    );

  const target =
    heading.closest(
      "section"
    );

  if (!target) {
    throw new Error(
      "Expected section: " +
      name
    );
  }

  return within(
    target
  );
}

beforeEach(
  () => {
    mocks.walletSection
      .mockClear();

    setHookState();
  }
);

afterEach(
  () => {
    cleanup();
  }
);

describe(
  "CampaignDetailsBackendEntry behavior",
  () => {
    it(
      "covers loading, failure and retry boundaries",
      () => {
        setHookState({
          isLoading:
            true,
        });

        const loading =
          render(
            <CampaignDetailsBackendEntry
              campaignId="CMP-DETAIL"
            />
          );

        expect(
          screen
            .getByRole(
              "status"
            )
            .textContent
        ).toContain(
          "Loading campaign"
        );

        loading.unmount();

        const refresh =
          vi.fn(
            async () => {}
          );

        setHookState({
          errorMessage:
            "Backend unavailable.",

          refresh,
        });

        render(
          <CampaignDetailsBackendEntry
            campaignId="CMP-DETAIL"
          />
        );

        expect(
          screen
            .getByRole(
              "alert"
            )
            .textContent
        ).toContain(
          "Backend unavailable."
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "Retry",
            }
          )
        );

        expect(
          refresh
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "covers not-found boundary",
      () => {
        render(
          <CampaignDetailsBackendEntry
            campaignId="CMP-MISSING"
          />
        );

        expect(
          screen.getByText(
            "Campaign not found"
          )
        ).toBeTruthy();

        expect(
          screen
            .getByRole(
              "link",
              {
                name:
                  "Back to campaigns",
              }
            )
            .getAttribute(
              "href"
            )
        ).toBe(
          "/campaigns"
        );
      }
    );

    it(
      "covers Backend identity Wallet performance and commercial projection",
      () => {
        setHookState({
          campaigns: [
            createCampaign(),
          ],
        });

        render(
          <CampaignDetailsBackendEntry
            campaignId="ADV-DETAIL"
          />
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Poster Knowledge Campaign",
            }
          )
        ).toBeTruthy();

        expect(
          screen.getAllByText(
            "ADV-REF-DETAIL"
          )
        ).toHaveLength(
          2
        );

        expect(
          screen
            .getByRole(
              "link",
              {
                name:
                  "View request",
              }
            )
            .getAttribute(
              "href"
            )
        ).toBe(
          "/requests/ADV-DETAIL"
        );

        const wallet =
          section(
            "Wallet allocation summary"
          );

        expect(
          wallet.getByText(
            "₹5,000.00"
          )
        ).toBeTruthy();

        expect(
          wallet.getByText(
            "₹1,250.00"
          )
        ).toBeTruthy();

        expect(
          wallet.getByText(
            "₹123.45"
          )
        ).toBeTruthy();

        expect(
          wallet.getByText(
            "₹250.00"
          )
        ).toBeTruthy();

        expect(
          mocks.walletSection
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.walletSection
            .mock
            .calls[0][0]
            .campaignId
        ).toBe(
          "CMP-DETAIL"
        );

        const performance =
          section(
            "Delivery snapshot"
          );

        expect(
          performance.getByText(
            "1,234"
          )
        ).toBeTruthy();

        expect(
          performance.getByText(
            "56"
          )
        ).toBeTruthy();

        expect(
          performance.getByText(
            "7"
          )
        ).toBeTruthy();

        const commercial =
          section(
            "Campaign terms"
          );

        expect(
          commercial.getByText(
            "Knowledge discovery awareness"
          )
        ).toBeTruthy();

        const destination =
          commercial.getByRole(
            "link",
            {
              name:
                "Open destination URL",
            }
          );

        expect(
          destination.getAttribute(
            "href"
          )
        ).toBe(
          "https://publisher.example/knowledge"
        );

        expect(
          destination.getAttribute(
            "target"
          )
        ).toBe(
          "_blank"
        );

        expect(
          destination.getAttribute(
            "rel"
          )
        ).toBe(
          "noreferrer"
        );
      }
    );

    it(
      "covers linked campaign Wallet-pending and null conversion behavior",
      () => {
        setHookState({
          walletErrorMessage:
            "Wallet refresh failed.",

          campaigns: [
            createCampaign({
              walletAllocation:
                null,

              performance: {
                impressions:
                  12,

                clicks:
                  2,

                conversions:
                  null,
              },
            }),
          ],
        });

        render(
          <CampaignDetailsBackendEntry
            campaignId="CMP-DETAIL"
          />
        );

        expect(
          section(
            "Wallet allocation pending"
          ).getByText(
            "No Backend Wallet allocation has been created for this campaign yet."
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            /Wallet allocation data could not be refreshed/
          )
        ).toBeTruthy();

        expect(
          section(
            "Delivery snapshot"
          ).getByText(
            "—"
          )
        ).toBeTruthy();

        expect(
          mocks.walletSection
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "covers approved request not yet linked by Admin",
      () => {
        setHookState({
          campaigns: [
            createCampaign({
              linkedCampaignId:
                null,

              walletAllocation:
                null,
            }),
          ],
        });

        render(
          <CampaignDetailsBackendEntry
            campaignId="CMP-DETAIL"
          />
        );

        expect(
          section(
            "Wallet allocation pending"
          ).getByText(
            "Poster Admin has not linked this approved request to a campaign yet."
          )
        ).toBeTruthy();

        expect(
          mocks.walletSection
        ).not.toHaveBeenCalled();
      }
    );
  }
);