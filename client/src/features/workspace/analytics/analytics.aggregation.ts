import {
  calculateRateMetrics,
  normalizeVideoMetrics,
  sumEventCountSets,
  sumFinancialMetrics,
} from "./analytics.metrics";

import type {
  AnalyticsBreakdownKey,
  AnalyticsBreakdownRow,
  AnalyticsFinancialMetrics,
  AnalyticsQualitySummary,
  AnalyticsRateMetrics,
  CampaignAnalyticsSnapshot,
  ClickAnalyticsMetrics,
  ConversionAnalyticsMetrics,
  ConversionRateDenominator,
  ImpressionAnalyticsMetrics,
  VideoAnalyticsMetrics,
} from "./analytics.types";

/**
 * Aggregate-combination utilities only.
 *
 * Inputs must already be:
 *
 * - organization-scoped;
 * - schema-valid;
 * - deduplicated;
 * - invalid-traffic filtered;
 * - attributed where applicable;
 * - safe for advertiser reporting.
 *
 * Backend remains authoritative for production aggregation.
 */

export interface AggregateCampaignSnapshotsInput {
  snapshots:
    CampaignAnalyticsSnapshot[];

  conversionRateDenominator:
    ConversionRateDenominator;

  currency:
    string;

  quality:
    AnalyticsQualitySummary;
}

export interface AggregatedCampaignAnalytics {
  impressions:
    ImpressionAnalyticsMetrics;

  clicks:
    ClickAnalyticsMetrics;

  video:
    VideoAnalyticsMetrics;

  conversions:
    ConversionAnalyticsMetrics;

  rates:
    AnalyticsRateMetrics;

  financials:
    AnalyticsFinancialMetrics;

  quality:
    AnalyticsQualitySummary;
}

function sumNonNegativeIntegers(
  values:
    number[]
): number {
  return values.reduce(
    (
      total,
      value
    ) =>
      total +
      Math.max(
        Number.isSafeInteger(
          value
        )
          ? value
          : 0,
        0
      ),
    0
  );
}

export function aggregateImpressionMetrics(
  values:
    ImpressionAnalyticsMetrics[]
): ImpressionAnalyticsMetrics {
  const base =
    sumEventCountSets(
      values
    );

  return {
    ...base,

    qualified:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.qualified
        )
      ),

    viewabilityRejected:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value
              .viewabilityRejected
        )
      ),
  };
}

export function aggregateClickMetrics(
  values:
    ClickAnalyticsMetrics[]
): ClickAnalyticsMetrics {
  const base =
    sumEventCountSets(
      values
    );

  return {
    ...base,

    ctaClicks:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.ctaClicks
        )
      ),

    suspiciousRejected:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value
              .suspiciousRejected
        )
      ),
  };
}

export function aggregateVideoMetrics(
  values:
    VideoAnalyticsMetrics[]
): VideoAnalyticsMetrics {
  return normalizeVideoMetrics({
    starts:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.starts
        )
      ),

    qualifiedViews:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value
              .qualifiedViews
        )
      ),

    quartile25:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.quartile25
        )
      ),

    quartile50:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.quartile50
        )
      ),

    quartile75:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.quartile75
        )
      ),

    completed:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.completed
        )
      ),

    totalWatchMilliseconds:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value
              .totalWatchMilliseconds
        )
      ),
  });
}

function determineCombinedConversionAvailability(
  values:
    ConversionAnalyticsMetrics[]
): ConversionAnalyticsMetrics["availability"] {
  if (
    values.length ===
    0
  ) {
    return "unavailable";
  }

  if (
    values.some(
      (
        value
      ) =>
        value.availability ===
        "processing"
    )
  ) {
    return "processing";
  }

  if (
    values.some(
      (
        value
      ) =>
        value.availability ===
        "available"
    )
  ) {
    return "available";
  }

  if (
    values.every(
      (
        value
      ) =>
        value.availability ===
        "not_tracked"
    )
  ) {
    return "not_tracked";
  }

  return "unavailable";
}

export function aggregateConversionMetrics(
  values:
    ConversionAnalyticsMetrics[]
): ConversionAnalyticsMetrics {
  const availability =
    determineCombinedConversionAvailability(
      values
    );

  if (
    availability ===
      "not_tracked" ||
    availability ===
      "unavailable"
  ) {
    return {
      availability,

      raw:
        0,

      pendingValidation:
        0,

      attributed:
        0,

      duplicate:
        0,

      rejected:
        0,

      reversed:
        0,

      finalized:
        0,
    };
  }

  return {
    availability,

    raw:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.raw
        )
      ),

    pendingValidation:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value
              .pendingValidation
        )
      ),

    attributed:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.attributed
        )
      ),

    duplicate:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.duplicate
        )
      ),

    rejected:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.rejected
        )
      ),

    reversed:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.reversed
        )
      ),

    finalized:
      sumNonNegativeIntegers(
        values.map(
          (
            value
          ) =>
            value.finalized
        )
      ),
  };
}

export function aggregateCampaignSnapshots(
  input:
    AggregateCampaignSnapshotsInput
): AggregatedCampaignAnalytics {
  const impressions =
    aggregateImpressionMetrics(
      input.snapshots.map(
        (
          snapshot
        ) =>
          snapshot.impressions
      )
    );

  const clicks =
    aggregateClickMetrics(
      input.snapshots.map(
        (
          snapshot
        ) =>
          snapshot.clicks
      )
    );

  const video =
    aggregateVideoMetrics(
      input.snapshots.map(
        (
          snapshot
        ) =>
          snapshot.video
      )
    );

  const conversions =
    aggregateConversionMetrics(
      input.snapshots.map(
        (
          snapshot
        ) =>
          snapshot.conversions
      )
    );

  const financials =
    sumFinancialMetrics(
      input.snapshots.map(
        (
          snapshot
        ) =>
          snapshot.financials
      ),
      input.currency
    );

  const rates =
    calculateRateMetrics({
      impressions,

      clicks,

      conversions,

      conversionRateDenominator:
        input
          .conversionRateDenominator,
    });

  return {
    impressions,

    clicks,

    video,

    conversions,

    rates,

    financials,

    quality:
      input.quality,
  };
}

export function createBreakdownIdentity(
  key:
    AnalyticsBreakdownKey
): string {
  return [
    key.dimension,
    key.campaignId ?? "",
    key.placementId ?? "",
    key.creativeId ?? "",
    key.creativeVersionId ?? "",
    key.mediaAssetId ?? "",
    key.surface ?? "",
    key.format ?? "",
    key.cardPosition ?? "",
    key.platform ?? "",
    key.countryCode ?? "",
    key.date ?? "",
  ].join(
    "|"
  );
}

export interface AggregateBreakdownRowsInput {
  rows:
    AnalyticsBreakdownRow[];

  conversionRateDenominator:
    ConversionRateDenominator;

  currency:
    string;
}

export function aggregateBreakdownRows(
  input:
    AggregateBreakdownRowsInput
): AnalyticsBreakdownRow[] {
  const groups =
    new Map<
      string,
      {
        key:
          AnalyticsBreakdownKey;

        rows:
          AnalyticsBreakdownRow[];
      }
    >();

  input.rows.forEach(
    (
      row
    ) => {
      const identity =
        createBreakdownIdentity(
          row.key
        );

      const existing =
        groups.get(
          identity
        );

      if (existing) {
        existing.rows.push(
          row
        );

        return;
      }

      groups.set(
        identity,
        {
          key:
            row.key,

          rows: [
            row,
          ],
        }
      );
    }
  );

  return Array.from(
    groups.values()
  ).map(
    (
      group
    ) => {
      const impressions =
        aggregateImpressionMetrics(
          group.rows.map(
            (
              row
            ) =>
              row.impressions
          )
        );

      const clicks =
        aggregateClickMetrics(
          group.rows.map(
            (
              row
            ) =>
              row.clicks
          )
        );

      const video =
        aggregateVideoMetrics(
          group.rows.map(
            (
              row
            ) =>
              row.video
          )
        );

      const conversions =
        aggregateConversionMetrics(
          group.rows.map(
            (
              row
            ) =>
              row.conversions
          )
        );

      const financials =
        sumFinancialMetrics(
          group.rows.map(
            (
              row
            ) =>
              row.financials
          ),
          input.currency
        );

      const rates =
        calculateRateMetrics({
          impressions,

          clicks,

          conversions,

          conversionRateDenominator:
            input
              .conversionRateDenominator,
        });

      return {
        key:
          group.key,

        impressions,

        clicks,

        video,

        conversions,

        rates,

        financials,
      };
    }
  );
}

export function sortBreakdownRowsByFinalizedSpend(
  rows:
    AnalyticsBreakdownRow[]
): AnalyticsBreakdownRow[] {
  return [
    ...rows,
  ].sort(
    (
      first,
      second
    ) =>
      second.financials
        .finalizedSpendMinor -
      first.financials
        .finalizedSpendMinor
  );
}

export function sortBreakdownRowsByQualifiedImpressions(
  rows:
    AnalyticsBreakdownRow[]
): AnalyticsBreakdownRow[] {
  return [
    ...rows,
  ].sort(
    (
      first,
      second
    ) =>
      second.impressions
        .qualified -
      first.impressions
        .qualified
  );
}

export function sortBreakdownRowsByValidClicks(
  rows:
    AnalyticsBreakdownRow[]
): AnalyticsBreakdownRow[] {
  return [
    ...rows,
  ].sort(
    (
      first,
      second
    ) =>
      second.clicks.valid -
      first.clicks.valid
  );
}
