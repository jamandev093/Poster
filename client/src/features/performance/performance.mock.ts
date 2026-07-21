import type {
  ClientCampaignPlacement,
} from "@/features/campaigns/campaign.types";

export type PerformanceWindow =
  | "7d"
  | "30d"
  | "all";

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;

  /**
   * null means conversion tracking is not available.
   * 0 means tracking is connected and recorded zero.
   */
  conversions: number | null;

  commission?: number;
}

export interface CampaignPerformanceSnapshot {
  campaignId: string;

  windows: Record<
    PerformanceWindow,
    PerformanceMetrics
  >;
}

export interface PlacementPerformanceSnapshot {
  placement: ClientCampaignPlacement;

  windows: Record<
    PerformanceWindow,
    PerformanceMetrics
  >;
}

export const campaignPerformanceSnapshots:
  CampaignPerformanceSnapshot[] = [
  {
    campaignId: "CMP-3001",

    windows: {
      "7d": {
        impressions: 182000,
        clicks: 4560,
        conversions: 155,
      },

      "30d": {
        impressions: 728000,
        clicks: 18240,
        conversions: 620,
      },

      all: {
        impressions: 728000,
        clicks: 18240,
        conversions: 620,
      },
    },
  },

  {
    campaignId: "CMP-3010",

    windows: {
      "7d": {
        impressions: 0,
        clicks: 0,
        conversions: null,
      },

      "30d": {
        impressions: 0,
        clicks: 0,
        conversions: null,
      },

      all: {
        impressions: 0,
        clicks: 0,
        conversions: null,
      },
    },
  },

  {
    campaignId: "CMP-3020",

    windows: {
      "7d": {
        impressions: 32000,
        clicks: 1120,
        conversions: 52,
        commission: 20800,
      },

      "30d": {
        impressions: 64000,
        clicks: 2240,
        conversions: 104,
        commission: 41600,
      },

      all: {
        impressions: 64000,
        clicks: 2240,
        conversions: 104,
        commission: 41600,
      },
    },
  },

  {
    campaignId: "CMP-3021",

    windows: {
      "7d": {
        impressions: 0,
        clicks: 0,
        conversions: null,
        commission: 0,
      },

      "30d": {
        impressions: 0,
        clicks: 0,
        conversions: null,
        commission: 0,
      },

      all: {
        impressions: 0,
        clicks: 0,
        conversions: null,
        commission: 0,
      },
    },
  },

  {
    campaignId: "CMP-2990",

    windows: {
      "7d": {
        impressions: 0,
        clicks: 0,
        conversions: 0,
      },

      "30d": {
        impressions: 0,
        clicks: 0,
        conversions: 0,
      },

      all: {
        impressions: 450000,
        clicks: 11250,
        conversions: 386,
      },
    },
  },
];

export const placementPerformanceSnapshots:
  PlacementPerformanceSnapshot[] = [
  {
    placement: "home",

    windows: {
      "7d": {
        impressions: 130000,
        clicks: 3200,
        conversions: 110,
      },

      "30d": {
        impressions: 510000,
        clicks: 12500,
        conversions: 420,
      },

      all: {
        impressions: 960000,
        clicks: 23750,
        conversions: 806,
      },
    },
  },

  {
    placement: "search",

    windows: {
      "7d": {
        impressions: 54000,
        clicks: 1500,
        conversions: 61,
      },

      "30d": {
        impressions: 190000,
        clicks: 5150,
        conversions: 245,
      },

      all: {
        impressions: 190000,
        clicks: 5150,
        conversions: 245,
      },
    },
  },

  {
    placement: "trending",

    windows: {
      "7d": {
        impressions: 30000,
        clicks: 980,
        conversions: 36,
      },

      "30d": {
        impressions: 92000,
        clicks: 2830,
        conversions: 59,
      },

      all: {
        impressions: 92000,
        clicks: 2830,
        conversions: 59,
      },
    },
  },
];

export function getCampaignPerformanceSnapshot(
  campaignId: string
): CampaignPerformanceSnapshot | undefined {
  return campaignPerformanceSnapshots.find(
    (snapshot) =>
      snapshot.campaignId.toLowerCase() ===
      campaignId.toLowerCase()
  );
}

export function getPerformanceWindowLabel(
  window: PerformanceWindow
): string {
  switch (window) {
    case "7d":
      return "Last 7 days";

    case "30d":
      return "Last 30 days";

    case "all":
      return "All time";
  }
}