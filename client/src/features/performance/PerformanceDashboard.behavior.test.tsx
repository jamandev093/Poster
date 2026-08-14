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
} from "@/features/campaigns/useClientCampaigns";

const mocks = vi.hoisted(() => ({
  hook: vi.fn(),
}));

vi.mock("./useClientPerformanceCampaigns", () => ({
  useClientPerformanceCampaigns: mocks.hook,
}));

import PerformanceDashboard from "./PerformanceDashboard";

function campaign(input: {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  conversions: number | null;
  updatedAt: string;
  walletSpentMinor?: string;
  linked?: boolean;
}): ClientCampaignListItem {
  const linked = input.linked ?? true;

  return {
    id: input.id,
    requestId: `ADV-${input.id}`,
    requestReference: `REF-${input.id}`,
    name: input.name,
    type: "direct_sponsorship",
    status: "active",
    requestStatus: "approved",
    startDate: "2026-08-01",
    endDate: "2026-09-01",
    linkedCampaignId: linked ? input.id : null,
    objective: "Awareness",
    destinationUrl: "https://publisher.example",

    performance: {
      impressions: input.impressions,
      clicks: input.clicks,
      conversions: input.conversions,
    },

    financials: {
      currency: "INR",
      budget: 1000,
      utilized: 77,
    },

    walletAllocation: input.walletSpentMinor
      ? {
          campaignId: input.id,

          allocated: {
            currency: "INR",
            minorUnits: "500000",
          },

          reserved: {
            currency: "INR",
            minorUnits: "100000",
          },

          spent: {
            currency: "INR",
            minorUnits: input.walletSpentMinor,
          },

          released: {
            currency: "INR",
            minorUnits: "0",
          },
        }
      : null,

    submittedAt: "2026-08-01T00:00:00.000Z",
    updatedAt: input.updatedAt,
  } as unknown as ClientCampaignListItem;
}

function state(
  overrides: Partial<UseClientCampaignsResult> = {}
): UseClientCampaignsResult {
  return {
    campaigns: [
      campaign({
        id: "CMP-1",
        name: "Campaign One",
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        updatedAt: "2026-08-14T00:00:00.000Z",
        walletSpentMinor: "12345",
      }),

      campaign({
        id: "CMP-2",
        name: "Campaign Two",
        impressions: 500,
        clicks: 25,
        conversions: null,
        updatedAt: "2026-08-13T00:00:00.000Z",
        linked: false,
      }),
    ],

    isLoading: false,
    isRefreshing: false,
    errorMessage: null,
    walletErrorMessage: null,
    refresh: vi.fn(async () => {}),
    ...overrides,
  };
}

function summaryValue(label: string): string {
  const summary = screen.getByLabelText(
    "Performance summary"
  );

  const marker = within(summary).getByText(label);
  const article = marker.closest("article");
  const strong = article?.querySelector("strong");

  if (!strong) {
    throw new Error(
      "Expected summary value for " + label
    );
  }

  return strong.textContent ?? "";
}

beforeEach(() => {
  mocks.hook.mockReset();
  mocks.hook.mockReturnValue(state());
});

afterEach(() => {
  cleanup();
});

describe("PerformanceDashboard behavior", () => {
  it("renders Backend totals CTR CVR Wallet spend and rows", () => {
    render(<PerformanceDashboard />);

    expect(
      screen.getByRole("heading", {
        name: "Campaign delivery snapshot",
      })
    ).toBeTruthy();

    expect(summaryValue("Campaigns in scope")).toBe("2");
    expect(summaryValue("Impressions")).toBe("1,500");
    expect(summaryValue("Clicks")).toBe("75");
    expect(summaryValue("Conversions")).toBe("5");

    const summary = screen.getByLabelText(
      "Performance summary"
    );

    expect(summary.textContent).toContain("CTR 5.00%");
    expect(summary.textContent).toContain("CVR 6.67%");
    expect(summary.textContent).toContain("123.45");

    expect(
      screen.getAllByText("Campaign One").length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Campaign Two").length
    ).toBeGreaterThan(0);

    expect(mocks.hook).toHaveBeenCalledWith(
      "30d",
      100
    );
  });

  it("changes range filters scope and refreshes", () => {
    const refresh = vi.fn(async () => {});

    mocks.hook.mockReturnValue(
      state({
        refresh,
      })
    );

    render(<PerformanceDashboard />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "7 days",
      })
    );

    expect(mocks.hook).toHaveBeenLastCalledWith(
      "7d",
      100
    );

    fireEvent.change(
      screen.getByLabelText("Campaign"),
      {
        target: {
          value: "CMP-2",
        },
      }
    );

    expect(summaryValue("Campaigns in scope")).toBe("1");
    expect(summaryValue("Impressions")).toBe("500");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Refresh",
      })
    );

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("surfaces analytics Wallet and loading states", () => {
    mocks.hook.mockReturnValue(
      state({
        isLoading: true,
        errorMessage: "Analytics failed.",
        walletErrorMessage: "Wallet failed.",
      })
    );

    render(<PerformanceDashboard />);

    expect(
      screen.getByText(/Campaigns: Analytics failed/)
    ).toBeTruthy();

    expect(
      screen.getByText(/Wallet allocation: Wallet failed/)
    ).toBeTruthy();

    expect(
      screen.getByText(
        "Loading Backend-derived performance."
      )
    ).toBeTruthy();
  });

  it("blocks duplicate refresh while refreshing", () => {
    const refresh = vi.fn(async () => {});

    mocks.hook.mockReturnValue(
      state({
        isRefreshing: true,
        refresh,
      })
    );

    render(<PerformanceDashboard />);

    const button = screen.getByRole("button", {
      name: "Refreshing...",
    });

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("Expected refresh button.");
    }

    expect(button.disabled).toBe(true);

    fireEvent.click(button);

    expect(refresh).not.toHaveBeenCalled();
  });
});