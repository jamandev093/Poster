// @vitest-environment jsdom

import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClientCampaignListItem,
  UseClientCampaignsResult,
} from "../campaigns/useClientCampaigns";

import type {
  ClientAnalyticsOverview,
} from "./client-analytics.service";

const mocks = vi.hoisted(() => ({
  campaigns: vi.fn(),
  analytics: vi.fn(),
}));

vi.mock("../campaigns/useClientCampaigns", () => ({
  useClientCampaigns: mocks.campaigns,
}));

vi.mock("./client-analytics.service", async importOriginal => {
  const actual =
    await importOriginal<
      typeof import("./client-analytics.service")
    >();

  return {
    ...actual,
    getClientAnalyticsOverview: mocks.analytics,
  };
});

import {
  applyClientAnalyticsToCampaigns,
  getClientAnalyticsDateRange,
  useClientPerformanceCampaigns,
} from "./useClientPerformanceCampaigns";

function campaign(): ClientCampaignListItem {
  return {
    id: "CMP-1",
    requestId: "ADV-1",
    requestReference: "ADV-REF-1",
    name: "Campaign One",
    type: "direct_sponsorship",
    status: "active",
    requestStatus: "approved",
    startDate: "2026-08-01",
    endDate: "2026-09-01",
    linkedCampaignId: "CMP-1",
    objective: "Awareness",
    destinationUrl: "https://publisher.example",

    performance: {
      impressions: 0,
      clicks: 0,
      conversions: null,
    },

    financials: {
      currency: "INR",
      budget: 1000,
      utilized: 0,
    },

    walletAllocation: null,
    submittedAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
  } as unknown as ClientCampaignListItem;
}

function overview(
  values: {
    impressions?: string;
    clicks?: string;
    conversions?: string;
  } = {}
): ClientAnalyticsOverview {
  return {
    startDate: "2026-07-16",
    endDate: "2026-08-14",
    validImpressions: "100",
    invalidImpressions: "0",
    duplicateImpressions: "0",
    validClicks: "10",
    invalidClicks: "0",
    duplicateClicks: "0",
    validConversions: "2",
    invalidConversions: "0",
    duplicateConversions: "0",
    unattributedConversions: "0",
    ctr: 10,
    latestSourceEventWatermark: null,
    finalizedMetricRows: 1,
    totalMetricRows: 1,
    placements: [],

    campaigns: [
      {
        campaignId: "CMP-1",
        campaignReference: "CMP-REF-1",
        campaignName: "Campaign One",
        campaignType: "direct_sponsorship",
        campaignStatus: "active",
        validImpressions: values.impressions ?? "100",
        invalidImpressions: "0",
        duplicateImpressions: "0",
        validClicks: values.clicks ?? "10",
        invalidClicks: "0",
        duplicateClicks: "0",
        validConversions: values.conversions ?? "2",
        invalidConversions: "0",
        duplicateConversions: "0",
        unattributedConversions: "0",
        ctr: 10,
        latestSourceEventWatermark: null,
        finalizedMetricRows: 1,
        totalMetricRows: 1,
      },
    ],
  };
}

function state(
  refresh: () => Promise<void>,
  errorMessage: string | null = null
): UseClientCampaignsResult {
  return {
    campaigns: [campaign()],
    isLoading: false,
    isRefreshing: false,
    errorMessage,
    walletErrorMessage: null,
    refresh,
  };
}

beforeEach(() => {
  mocks.campaigns.mockReset();
  mocks.analytics.mockReset();
});

describe("useClientPerformanceCampaigns behavior", () => {
  it("calculates inclusive UTC analytics ranges", () => {
    const now = new Date(
      "2026-08-14T12:00:00.000Z"
    );

    expect(
      getClientAnalyticsDateRange("7d", now)
    ).toEqual({
      startDate: "2026-08-08",
      endDate: "2026-08-14",
    });

    expect(
      getClientAnalyticsDateRange("30d", now)
    ).toEqual({
      startDate: "2026-07-16",
      endDate: "2026-08-14",
    });

    expect(
      getClientAnalyticsDateRange("90d", now)
    ).toEqual({
      startDate: "2026-05-17",
      endDate: "2026-08-14",
    });
  });

  it("maps Backend analytics and fails invalid metric strings closed", () => {
    const source = [campaign()];

    expect(
      applyClientAnalyticsToCampaigns(source, null)
    ).toBe(source);

    expect(
      applyClientAnalyticsToCampaigns(
        source,
        overview()
      )[0].performance
    ).toEqual({
      impressions: 100,
      clicks: 10,
      conversions: 2,
    });

    expect(
      applyClientAnalyticsToCampaigns(
        source,
        overview({
          impressions: "bad",
          clicks: "-1",
          conversions: "1.5",
        })
      )[0].performance
    ).toEqual({
      impressions: 0,
      clicks: 0,
      conversions: 0,
    });
  });

  it("loads analytics and refreshes both Backend authorities", async () => {
    const baseRefresh = vi.fn(async () => {});

    mocks.campaigns.mockReturnValue(
      state(baseRefresh)
    );
    mocks.analytics.mockResolvedValue(
      overview()
    );

    const { result } = renderHook(() =>
      useClientPerformanceCampaigns("30d", 50)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mocks.campaigns).toHaveBeenCalledWith(50);
    expect(result.current.campaigns[0].performance.impressions)
      .toBe(100);

    await act(async () => {
      await result.current.refresh();
    });

    expect(baseRefresh).toHaveBeenCalledTimes(1);
    expect(mocks.analytics).toHaveBeenCalledTimes(2);
  });

  it("surfaces analytics errors with campaign error precedence", async () => {
    const baseRefresh = vi.fn(async () => {});

    mocks.campaigns.mockReturnValue(
      state(baseRefresh)
    );
    mocks.analytics.mockRejectedValue(
      new Error("Analytics unavailable.")
    );

    const first = renderHook(() =>
      useClientPerformanceCampaigns("7d")
    );

    await waitFor(() => {
      expect(first.result.current.errorMessage).toBe(
        "Analytics unavailable."
      );
    });

    first.unmount();

    mocks.campaigns.mockReturnValue(
      state(
        baseRefresh,
        "Campaign Backend failed."
      )
    );
    mocks.analytics.mockRejectedValue(
      new Error("Analytics unavailable.")
    );

    const second = renderHook(() =>
      useClientPerformanceCampaigns("7d")
    );

    await waitFor(() => {
      expect(second.result.current.isLoading).toBe(false);
    });

    expect(second.result.current.errorMessage).toBe(
      "Campaign Backend failed."
    );
  });
});