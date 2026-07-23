import type {
  Placement,
} from "./workspace.types";

export type PerformanceWindow =
  | "7d"
  | "30d"
  | "all";

export interface PerformanceWindowMetrics {
  impressions: number;
  clicks: number;

  /**
   * null means conversions are not available or
   * tracking is not configured.
   *
   * 0 means tracking exists and recorded zero.
   */
  conversions: number | null;

  commission?: number;
  revenue?: number;
}

export interface CampaignPerformanceSnapshot {
  campaignId: string;

  windows: Record<
    PerformanceWindow,
    PerformanceWindowMetrics
  >;
}

export interface PlacementPerformanceSnapshot {
  placement: Placement;

  windows: Record<
    PerformanceWindow,
    {
      impressions: number;
      clicks: number;
    }
  >;
}

/**
 * Time-window snapshots are kept separate from campaign
 * identity/configuration.
 *
 * Campaign names, status, placements, tracking state,
 * financials and all-time totals continue to come from
 * the canonical workspace campaign records.
 */
export const campaignPerformanceSnapshots:
  CampaignPerformanceSnapshot[] = [
    {
      campaignId: "CMP-3001",

      windows: {
        "7d": {
          impressions: 210000,
          clicks: 5600,
          conversions: 190,
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
          impressions: 18000,
          clicks: 690,
          conversions: 34,

          commission: 13600,
          revenue: 13600,
        },

        "30d": {
          impressions: 64000,
          clicks: 2240,
          conversions: 104,

          commission: 41600,
          revenue: 41600,
        },

        all: {
          impressions: 64000,
          clicks: 2240,
          conversions: 104,

          commission: 41600,
          revenue: 41600,
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
          impressions: 120000,
          clicks: 3100,
        },

        "30d": {
          impressions: 420000,
          clicks: 10500,
        },

        all: {
          impressions: 420000,
          clicks: 10500,
        },
      },
    },

    {
      placement: "search",

      windows: {
        "7d": {
          impressions: 70000,
          clicks: 2000,
        },

        "30d": {
          impressions: 240000,
          clicks: 6500,
        },

        all: {
          impressions: 240000,
          clicks: 6500,
        },
      },
    },

    {
      placement: "trending",

      windows: {
        "7d": {
          impressions: 38000,
          clicks: 1190,
        },

        "30d": {
          impressions: 132000,
          clicks: 3480,
        },

        all: {
          impressions: 132000,
          clicks: 3480,
        },
      },
    },
  ];

export function getCampaignPerformanceSnapshot(
  campaignId: string
): CampaignPerformanceSnapshot | undefined {
  return campaignPerformanceSnapshots.find(
    (snapshot) =>
      snapshot.campaignId ===
      campaignId
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
      return "All recorded activity";
  }
}