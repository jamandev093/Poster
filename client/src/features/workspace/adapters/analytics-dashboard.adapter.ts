import {
  aggregateCampaignSnapshots,
} from "../analytics/analytics.aggregation";

import type {
  AnalyticsDataFreshnessStatus,
  AnalyticsProcessingStage,
  CampaignAnalyticsSnapshot,
  ConversionRateDenominator,
} from "../analytics/analytics.types";

import type {
  CampaignStatus,
  PlacementSurface,
} from "../advertising/advertising.types";

import {
  getCampaignStatusLabel,
} from "../advertising/advertising.status";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import type {
  ClientCampaign,
} from "../workspace.types";

/**
 * Analytics dashboard adapter.
 *
 * Converts canonical Backend-shaped analytics records into
 * presentation-ready values for the Client Performance UI.
 *
 * This file must not:
 *
 * - render React components;
 * - format currency or dates;
 * - validate raw events;
 * - determine invalid traffic;
 * - finalize spend;
 * - mutate campaign or analytics records.
 */

export interface AnalyticsDashboardCampaignRow {
  campaignId:
    string;

  campaignName:
    string;

  campaignStatus:
    CampaignStatus;

  campaignStatusLabel:
    string;

  placements:
    PlacementSurface[];

  impressions: {
    raw:
      number;

    qualified:
      number;

    invalid:
      number;

    duplicate:
      number;

    pendingValidation:
      number;

    finalized:
      number;
  };

  clicks: {
    raw:
      number;

    valid:
      number;

    invalid:
      number;

    duplicate:
      number;

    pendingValidation:
      number;

    finalized:
      number;

    suspiciousRejected:
      number;
  };

  conversions: {
    availability:
      CampaignAnalyticsSnapshot[
        "conversions"
      ][
        "availability"
      ];

    finalized:
      number;

    pendingValidation:
      number;

    rejected:
      number;

    reversed:
      number;
  };

  rates: {
    ctrPercentage:
      number |
      null;

    conversionRatePercentage:
      number |
      null;

    conversionRateDenominator:
      ConversionRateDenominator;
  };

  video: {
    starts:
      number;

    qualifiedViews:
      number;

    quartile25:
      number;

    quartile50:
      number;

    quartile75:
      number;

    completed:
      number;

    averageWatchMilliseconds:
      number |
      null;
  };

  delivery: {
    target?:
      number;

    delivered:
      number;

    remaining?:
      number;

    percentage:
      number |
      null;

    pacingPercentage:
      number |
      null;

    underDelivering:
      boolean;

    overDelivering:
      boolean;
  };

  financials: {
    currency:
      SupportedCurrency;

    estimatedSpendMinor:
      number;

    pendingValidationSpendMinor:
      number;

    finalizedSpendMinor:
      number;

    invalidTrafficCreditMinor:
      number;

    reconciledSpendMinor:
      number;
  };

  quality: {
    stage:
      AnalyticsProcessingStage;

    freshnessStatus:
      AnalyticsDataFreshnessStatus;

    dataThrough:
      string;

    finalizedThrough?:
      string;

    lastReconciledAt?:
      string;

    warningMessages:
      string[];
  };
}

export interface AnalyticsDashboardTotals {
  impressions: {
    raw:
      number;

    qualified:
      number;

    invalid:
      number;

    duplicate:
      number;

    pendingValidation:
      number;

    finalized:
      number;
  };

  clicks: {
    raw:
      number;

    valid:
      number;

    invalid:
      number;

    duplicate:
      number;

    pendingValidation:
      number;

    finalized:
      number;
  };

  conversions: {
    availability:
      CampaignAnalyticsSnapshot[
        "conversions"
      ][
        "availability"
      ];

    finalized:
      number;

    pendingValidation:
      number;
  };

  rates: {
    ctrPercentage:
      number |
      null;

    conversionRatePercentage:
      number |
      null;

    conversionRateDenominator:
      ConversionRateDenominator;
  };

  video: {
    starts:
      number;

    qualifiedViews:
      number;

    completed:
      number;

    averageWatchMilliseconds:
      number |
      null;
  };

  financials: {
    currency:
      SupportedCurrency;

    estimatedSpendMinor:
      number;

    pendingValidationSpendMinor:
      number;

    finalizedSpendMinor:
      number;

    invalidTrafficCreditMinor:
      number;

    reconciledSpendMinor:
      number;
  };

  quality: {
    stage:
      AnalyticsProcessingStage;

    freshnessStatus:
      AnalyticsDataFreshnessStatus;

    dataThrough:
      string;

    finalizedThrough?:
      string;

    lastReconciledAt?:
      string;

    warningMessages:
      string[];
  };
}

export interface AnalyticsDashboardViewModel {
  campaignRows:
    AnalyticsDashboardCampaignRow[];

  totals:
    AnalyticsDashboardTotals;

  campaignsWithoutAnalytics:
    string[];

  untrackedConversionCampaigns:
    number;
}

interface CreateAnalyticsDashboardViewModelInput {
  campaigns:
    ClientCampaign[];

  snapshots:
    CampaignAnalyticsSnapshot[];

  currency:
    SupportedCurrency;

  conversionRateDenominator?:
    ConversionRateDenominator;
}

function normalizeSupportedCurrency(
  currency:
    string
): SupportedCurrency {
  switch (
    currency
      .trim()
      .toUpperCase()
  ) {
    case "INR":
      return "INR";

    case "USD":
      return "USD";

    default:
      throw new Error(
        `Unsupported analytics currency: ${currency}`
      );
  }
}

function getSnapshotForCampaign(
  campaignId:
    string,
  snapshots:
    CampaignAnalyticsSnapshot[]
): CampaignAnalyticsSnapshot | undefined {
  return snapshots.find(
    (
      snapshot
    ) =>
      snapshot.campaignId ===
      campaignId
  );
}

function createCampaignRow(
  campaign:
    ClientCampaign,
  snapshot:
    CampaignAnalyticsSnapshot
): AnalyticsDashboardCampaignRow {
  return {
    campaignId:
      campaign.id,

    campaignName:
      campaign.name,

    campaignStatus:
      campaign.status,

    campaignStatusLabel:
      getCampaignStatusLabel(
        campaign.status
      ),

    placements:
      campaign.placements,

    impressions: {
      raw:
        snapshot.impressions.raw,

      qualified:
        snapshot.impressions
          .qualified,

      invalid:
        snapshot.impressions
          .invalid,

      duplicate:
        snapshot.impressions
          .duplicate,

      pendingValidation:
        snapshot.impressions
          .pendingValidation,

      finalized:
        snapshot.impressions
          .finalized,
    },

    clicks: {
      raw:
        snapshot.clicks.raw,

      valid:
        snapshot.clicks.valid,

      invalid:
        snapshot.clicks.invalid,

      duplicate:
        snapshot.clicks
          .duplicate,

      pendingValidation:
        snapshot.clicks
          .pendingValidation,

      finalized:
        snapshot.clicks
          .finalized,

      suspiciousRejected:
        snapshot.clicks
          .suspiciousRejected,
    },

    conversions: {
      availability:
        snapshot.conversions
          .availability,

      finalized:
        snapshot.conversions
          .finalized,

      pendingValidation:
        snapshot.conversions
          .pendingValidation,

      rejected:
        snapshot.conversions
          .rejected,

      reversed:
        snapshot.conversions
          .reversed,
    },

    rates: {
      ctrPercentage:
        snapshot.rates
          .ctrPercentage,

      conversionRatePercentage:
        snapshot.rates
          .conversionRatePercentage,

      conversionRateDenominator:
        snapshot.rates
          .conversionRateDenominator,
    },

    video: {
      starts:
        snapshot.video.starts,

      qualifiedViews:
        snapshot.video
          .qualifiedViews,

      quartile25:
        snapshot.video
          .quartile25,

      quartile50:
        snapshot.video
          .quartile50,

      quartile75:
        snapshot.video
          .quartile75,

      completed:
        snapshot.video
          .completed,

      averageWatchMilliseconds:
        snapshot.video
          .averageWatchMilliseconds,
    },

    delivery: {
      target:
        snapshot.delivery
          .deliveryTarget,

      delivered:
        snapshot.delivery
          .delivered,

      remaining:
        snapshot.delivery
          .remaining,

      percentage:
        snapshot.delivery
          .deliveryPercentage,

      pacingPercentage:
        snapshot.delivery
          .pacingPercentage,

      underDelivering:
        snapshot.delivery
          .underDelivering,

      overDelivering:
        snapshot.delivery
          .overDelivering,
    },

    financials: {
      currency:
        normalizeSupportedCurrency(
          snapshot.financials
            .currency
        ),

      estimatedSpendMinor:
        snapshot.financials
          .estimatedSpendMinor,

      pendingValidationSpendMinor:
        snapshot.financials
          .pendingValidationSpendMinor,

      finalizedSpendMinor:
        snapshot.financials
          .finalizedSpendMinor,

      invalidTrafficCreditMinor:
        snapshot.financials
          .invalidTrafficCreditMinor,

      reconciledSpendMinor:
        snapshot.financials
          .reconciledSpendMinor,
    },

    quality: {
      stage:
        snapshot.quality.stage,

      freshnessStatus:
        snapshot.quality
          .freshnessStatus,

      dataThrough:
        snapshot.quality
          .dataThrough,

      finalizedThrough:
        snapshot.quality
          .finalizedThrough,

      lastReconciledAt:
        snapshot.quality
          .lastReconciledAt,

      warningMessages: [
        ...snapshot.quality
          .warningMessages,
      ],
    },
  };
}

function determineCombinedStage(
  snapshots:
    CampaignAnalyticsSnapshot[]
): AnalyticsProcessingStage {
  if (
    snapshots.some(
      (
        snapshot
      ) =>
        snapshot.quality.stage ===
        "processing"
    )
  ) {
    return "processing";
  }

  if (
    snapshots.every(
      (
        snapshot
      ) =>
        snapshot.quality.stage ===
        "reconciled"
    )
  ) {
    return "reconciled";
  }

  if (
    snapshots.some(
      (
        snapshot
      ) =>
        snapshot.quality.stage ===
        "adjusted"
    )
  ) {
    return "adjusted";
  }

  if (
    snapshots.some(
      (
        snapshot
      ) =>
        snapshot.quality.stage ===
        "finalized"
    )
  ) {
    return "finalized";
  }

  return "live_estimate";
}

function determineCombinedFreshness(
  snapshots:
    CampaignAnalyticsSnapshot[]
): AnalyticsDataFreshnessStatus {
  const priority:
    AnalyticsDataFreshnessStatus[] = [
    "unavailable",
    "stale",
    "delayed",
    "recent",
    "live",
  ];

  return (
    priority.find(
      (
        status
      ) =>
        snapshots.some(
          (
            snapshot
          ) =>
            snapshot.quality
              .freshnessStatus ===
            status
        )
    ) ??
    "unavailable"
  );
}

function getLatestTimestamp(
  values:
    (
      string |
      undefined
    )[]
): string | undefined {
  const validValues =
    values.filter(
      (
        value
      ): value is string =>
        Boolean(
          value
        ) &&
        !Number.isNaN(
          new Date(
            value as string
          ).getTime()
        )
    );

  if (
    validValues.length ===
    0
  ) {
    return undefined;
  }

  return validValues.sort(
    (
      first,
      second
    ) =>
      new Date(
        second
      ).getTime() -
      new Date(
        first
      ).getTime()
  )[0];
}

export function createAnalyticsDashboardViewModel(
  input:
    CreateAnalyticsDashboardViewModelInput
): AnalyticsDashboardViewModel {
  const campaignRows:
    AnalyticsDashboardCampaignRow[] = [];

  const campaignsWithoutAnalytics:
    string[] = [];

  input.campaigns.forEach(
    (
      campaign
    ) => {
      const snapshot =
        getSnapshotForCampaign(
          campaign.id,
          input.snapshots
        );

      if (!snapshot) {
        campaignsWithoutAnalytics.push(
          campaign.id
        );

        return;
      }

      campaignRows.push(
        createCampaignRow(
          campaign,
          snapshot
        )
      );
    }
  );

  const includedSnapshots =
    campaignRows
      .map(
        (
          row
        ) =>
          getSnapshotForCampaign(
            row.campaignId,
            input.snapshots
          )
      )
      .filter(
        (
          snapshot
        ): snapshot is CampaignAnalyticsSnapshot =>
          Boolean(
            snapshot
          )
      );

  const combinedQuality = {
    stage:
      determineCombinedStage(
        includedSnapshots
      ),

    freshnessStatus:
      determineCombinedFreshness(
        includedSnapshots
      ),

    aggregationVersion:
      Math.max(
        ...includedSnapshots.map(
          (
            snapshot
          ) =>
            snapshot.quality
              .aggregationVersion
        ),
        1
      ),

    generatedAt:
      getLatestTimestamp(
        includedSnapshots.map(
          (
            snapshot
          ) =>
            snapshot.quality
              .generatedAt
        )
      ) ??
      new Date(
        0
      ).toISOString(),

    dataThrough:
      getLatestTimestamp(
        includedSnapshots.map(
          (
            snapshot
          ) =>
            snapshot.quality
              .dataThrough
        )
      ) ??
      new Date(
        0
      ).toISOString(),

    finalizedThrough:
      getLatestTimestamp(
        includedSnapshots.map(
          (
            snapshot
          ) =>
            snapshot.quality
              .finalizedThrough
        )
      ),

    lastReconciledAt:
      getLatestTimestamp(
        includedSnapshots.map(
          (
            snapshot
          ) =>
            snapshot.quality
              .lastReconciledAt
        )
      ),

    warningMessages:
      Array.from(
        new Set(
          includedSnapshots.flatMap(
            (
              snapshot
            ) =>
              snapshot.quality
                .warningMessages
          )
        )
      ),
  };

  const aggregated =
    aggregateCampaignSnapshots({
      snapshots:
        includedSnapshots,

      conversionRateDenominator:
        input
          .conversionRateDenominator ??
        "valid_clicks",

      currency:
        input.currency,

      quality:
        combinedQuality,
    });

  return {
    campaignRows,

    totals: {
      impressions: {
        raw:
          aggregated.impressions
            .raw,

        qualified:
          aggregated.impressions
            .qualified,

        invalid:
          aggregated.impressions
            .invalid,

        duplicate:
          aggregated.impressions
            .duplicate,

        pendingValidation:
          aggregated.impressions
            .pendingValidation,

        finalized:
          aggregated.impressions
            .finalized,
      },

      clicks: {
        raw:
          aggregated.clicks.raw,

        valid:
          aggregated.clicks.valid,

        invalid:
          aggregated.clicks
            .invalid,

        duplicate:
          aggregated.clicks
            .duplicate,

        pendingValidation:
          aggregated.clicks
            .pendingValidation,

        finalized:
          aggregated.clicks
            .finalized,
      },

      conversions: {
        availability:
          aggregated.conversions
            .availability,

        finalized:
          aggregated.conversions
            .finalized,

        pendingValidation:
          aggregated.conversions
            .pendingValidation,
      },

      rates: {
        ctrPercentage:
          aggregated.rates
            .ctrPercentage,

        conversionRatePercentage:
          aggregated.rates
            .conversionRatePercentage,

        conversionRateDenominator:
          aggregated.rates
            .conversionRateDenominator,
      },

      video: {
        starts:
          aggregated.video.starts,

        qualifiedViews:
          aggregated.video
            .qualifiedViews,

        completed:
          aggregated.video
            .completed,

        averageWatchMilliseconds:
          aggregated.video
            .averageWatchMilliseconds,
      },

      financials: {
        currency:
          normalizeSupportedCurrency(
            aggregated.financials
              .currency
          ),

        estimatedSpendMinor:
          aggregated.financials
            .estimatedSpendMinor,

        pendingValidationSpendMinor:
          aggregated.financials
            .pendingValidationSpendMinor,

        finalizedSpendMinor:
          aggregated.financials
            .finalizedSpendMinor,

        invalidTrafficCreditMinor:
          aggregated.financials
            .invalidTrafficCreditMinor,

        reconciledSpendMinor:
          aggregated.financials
            .reconciledSpendMinor,
      },

      quality: {
        stage:
          aggregated.quality.stage,

        freshnessStatus:
          aggregated.quality
            .freshnessStatus,

        dataThrough:
          aggregated.quality
            .dataThrough,

        finalizedThrough:
          aggregated.quality
            .finalizedThrough,

        lastReconciledAt:
          aggregated.quality
            .lastReconciledAt,

        warningMessages: [
          ...aggregated.quality
            .warningMessages,
        ],
      },
    },

    campaignsWithoutAnalytics,

    untrackedConversionCampaigns:
      campaignRows.filter(
        (
          row
        ) =>
          row.conversions
            .availability ===
          "not_tracked"
      ).length,
  };
}


