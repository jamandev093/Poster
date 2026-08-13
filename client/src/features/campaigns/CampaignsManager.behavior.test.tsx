// @vitest-environment jsdom

import type {
  ReactNode,
} from "react";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const managerMocks =
  vi.hoisted(
    () => ({
      refresh:
        vi.fn(),

      result: {
        campaigns:
          [] as unknown[],

        isLoading:
          false,

        isRefreshing:
          false,

        errorMessage:
          null as string | null,

        walletErrorMessage:
          null as string | null,

        refresh:
          vi.fn(),
      },
    })
  );

vi.mock(
  "./useClientCampaigns",
  () => ({
    useClientCampaigns:
      vi.fn(
        () =>
          managerMocks.result
      ),
  })
);

vi.mock(
  "next/link",
  () => ({
    default:
      ({
        href,
        className,
        children,
      }: {
        href:
          string;

        className?:
          string;

        children:
          ReactNode;
      }) => (
        <a
          href={
            href
          }
          className={
            className
          }
        >
          {children}
        </a>
      ),
  })
);

import CampaignsManager
  from "./CampaignsManager";

function money(
  minorUnits:
    string
) {
  return {
    currency:
      "INR",

    minorUnits,
  };
}

function createCampaigns() {
  return [
    {
      id:
        "CMP-ALPHA",

      requestId:
        "ADV-ALPHA",

      requestReference:
        "ADV-REF-ALPHA",

      name:
        "Alpha Research",

      type:
        "direct_sponsorship",

      status:
        "active",

      requestStatus:
        "approved",

      startDate:
        "2026-08-15",

      endDate:
        "2026-09-15",

      linkedCampaignId:
        "CMP-ALPHA",

      objective:
        "Space research awareness",

      destinationUrl:
        "https://alpha.example",

      performance: {
        impressions:
          1000,

        clicks:
          25,

        conversions:
          2,
      },

      financials: {
        currency:
          "INR",

        budget:
          5000,

        utilized:
          125,
      },

      walletAllocation: {
        campaignId:
          "CMP-ALPHA",

        allocated:
          money(
            "500000"
          ),

        reserved:
          money(
            "125000"
          ),

        spent:
          money(
            "12500"
          ),

        released:
          money(
            "0"
          ),
      },

      submittedAt:
        "2026-08-01T00:00:00.000Z",

      updatedAt:
        "2026-08-10T00:00:00.000Z",
    },

    {
      id:
        "CMP-BETA",

      requestId:
        "ADV-BETA",

      requestReference:
        "ADV-REF-BETA",

      name:
        "Beta Learning",

      type:
        "affiliate",

      status:
        "scheduled",

      requestStatus:
        "approved",

      startDate:
        "2026-09-01",

      endDate:
        "2026-09-30",

      linkedCampaignId:
        "CMP-BETA",

      objective:
        "Education growth",

      destinationUrl:
        "https://beta.example",

      performance: {
        impressions:
          500,

        clicks:
          10,

        conversions:
          null,
      },

      financials: {
        currency:
          "INR",

        contractValue:
          2000,

        utilized:
          0,
      },

      walletAllocation:
        null,

      submittedAt:
        "2026-08-02T00:00:00.000Z",

      updatedAt:
        "2026-08-11T00:00:00.000Z",
    },

    {
      id:
        "ADV-PENDING",

      requestId:
        "ADV-PENDING",

      requestReference:
        "ADV-REF-PENDING",

      name:
        "Pending Setup",

      type:
        "direct_sponsorship",

      status:
        "draft",

      requestStatus:
        "approved",

      startDate:
        null,

      endDate:
        null,

      linkedCampaignId:
        null,

      objective:
        "Pending launch",

      destinationUrl:
        null,

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
      },

      walletAllocation:
        null,

      submittedAt:
        "2026-08-03T00:00:00.000Z",

      updatedAt:
        "2026-08-12T00:00:00.000Z",
    },
  ];
}

beforeEach(
  () => {
    managerMocks
      .refresh
      .mockReset();

    managerMocks
      .refresh
      .mockResolvedValue(
        undefined
      );

    managerMocks.result = {
      campaigns:
        createCampaigns(),

      isLoading:
        false,

      isRefreshing:
        false,

      errorMessage:
        null,

      walletErrorMessage:
        null,

      refresh:
        managerMocks.refresh,
    };
  }
);

afterEach(
  () => {
    cleanup();
  }
);

describe(
  "CampaignsManager behavior",
  () => {
    it(
      "renders Backend-derived campaign summary and delivery totals",
      () => {
        render(
          <CampaignsManager />
        );

        const summary =
          screen.getByLabelText(
            "Campaign summary"
          );

        const text =
          summary.textContent ??
          "";

        expect(
          text
        ).toContain(
          "Total campaigns"
        );

        expect(
          text
        ).toContain(
          "3"
        );

        expect(
          text
        ).toContain(
          "Active"
        );

        expect(
          text
        ).toContain(
          "Scheduled"
        );

        expect(
          text
        ).toContain(
          "1,500"
        );

        expect(
          text
        ).toContain(
          "35 clicks"
        );
      }
    );

    it(
      "searches campaign identity, request identity, objective, and destination",
      async () => {
        const user =
          userEvent.setup();

        render(
          <CampaignsManager />
        );

        const search =
          screen.getByRole(
            "searchbox",
            {
              name:
                "Search campaigns",
            }
          );

        await user.type(
          search,
          "beta.example"
        );

        expect(
          screen.getByText(
            "Beta Learning"
          )
        ).toBeTruthy();

        expect(
          screen.queryByText(
            "Alpha Research"
          )
        ).toBeNull();

        await user.clear(
          search
        );

        await user.type(
          search,
          "space research"
        );

        expect(
          screen.getByText(
            "Alpha Research"
          )
        ).toBeTruthy();

        expect(
          screen.queryByText(
            "Beta Learning"
          )
        ).toBeNull();
      }
    );

    it(
      "filters campaigns by status",
      async () => {
        const user =
          userEvent.setup();

        render(
          <CampaignsManager />
        );

        const filters =
          screen.getByLabelText(
            "Campaign status filters"
          );

        await user.click(
          within(
            filters
          ).getByRole(
            "button",
            {
              name:
                "Active",
            }
          )
        );

        expect(
          screen.getByText(
            "Alpha Research"
          )
        ).toBeTruthy();

        expect(
          screen.queryByText(
            "Beta Learning"
          )
        ).toBeNull();

        expect(
          screen.queryByText(
            "Pending Setup"
          )
        ).toBeNull();
      }
    );

    it(
      "renders Wallet allocation, no-allocation, and pending-setup states",
      () => {
        render(
          <CampaignsManager />
        );

        expect(
          screen.getByText(
            (
              content
            ) =>
              content.includes(
                "allocated"
              ) &&
              content.includes(
                "reserved"
              ) &&
              content.includes(
                "spent"
              )
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "No Wallet allocation"
          )
        ).toBeTruthy();

        expect(
          screen.getByText(
            "Wallet allocation pending campaign setup"
          )
        ).toBeTruthy();
      }
    );

    it(
      "fails Wallet display safely when allocation Backend refresh failed",
      () => {
        managerMocks.result = {
          ...managerMocks.result,

          campaigns: [
            createCampaigns()[1],
          ],

          walletErrorMessage:
            "Wallet Backend unavailable.",
        };

        render(
          <CampaignsManager />
        );

        expect(
          screen.getByText(
            "Wallet allocation unavailable"
          )
        ).toBeTruthy();
      }
    );

    it(
      "renders Backend campaign error and loading states",
      () => {
        managerMocks.result = {
          ...managerMocks.result,

          campaigns:
            [],

          isLoading:
            true,

          errorMessage:
            "Campaign Backend unavailable.",
        };

        render(
          <CampaignsManager />
        );

        expect(
          screen.getByRole(
            "alert"
          ).textContent
        ).toContain(
          "Campaign Backend unavailable."
        );

        expect(
          screen.getByRole(
            "status"
          ).textContent
        ).toContain(
          "Loading campaigns from Poster Backend."
        );
      }
    );

    it(
      "refreshes Backend campaign sources and locks duplicate refresh interaction",
      async () => {
        const user =
          userEvent.setup();

        const {
          rerender,
        } =
          render(
            <CampaignsManager />
          );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Refresh",
            }
          )
        );

        expect(
          managerMocks.refresh
        ).toHaveBeenCalledTimes(
          1
        );

        managerMocks.result = {
          ...managerMocks.result,

          isRefreshing:
            true,
        };

        rerender(
          <CampaignsManager />
        );

        const button =
          screen.getByRole(
            "button",
            {
              name:
                "Refreshing...",
            }
          ) as HTMLButtonElement;

        expect(
          button.disabled
        ).toBe(
          true
        );

        fireEvent.click(
          button
        );

        expect(
          managerMocks.refresh
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "renders exact campaign detail links and empty search state",
      async () => {
        const user =
          userEvent.setup();

        render(
          <CampaignsManager />
        );

        const links =
          screen.getAllByRole(
            "link",
            {
              name:
                "View campaign",
            }
          );

        expect(
          links[0].getAttribute(
            "href"
          )
        ).toBe(
          "/campaigns/CMP-ALPHA"
        );

        await user.type(
          screen.getByRole(
            "searchbox",
            {
              name:
                "Search campaigns",
            }
          ),
          "does-not-exist"
        );

        expect(
          screen.getByText(
            "No Backend-linked campaigns match your search or filter."
          )
        ).toBeTruthy();
      }
    );
  }
);