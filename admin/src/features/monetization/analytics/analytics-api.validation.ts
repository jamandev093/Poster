import type {
  AdminAnalyticsOverview,
  AnalyticsCampaignRecord,
  AnalyticsMetricTotals,
  AnalyticsPlacement,
  AnalyticsPlacementRecord,
} from "./analytics-api.types";

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

function isString(
  value: unknown
): value is string {
  return typeof value ===
    "string";
}

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  );
}

function isNonNegativeInteger(
  value: unknown
): value is number {
  return (
    isFiniteNumber(
      value
    ) &&
    Number.isInteger(
      value
    ) &&
    value >= 0
  );
}

function isNullableTimestamp(
  value: unknown
): value is
  | string
  | null {
  return (
    value === null ||
    (
      isString(
        value
      ) &&
      Number.isFinite(
        new Date(
          value
        ).getTime()
      )
    )
  );
}

function isIsoDate(
  value: unknown
): value is string {
  if (
    !isString(
      value
    ) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const parsed =
    new Date(
      `${value}T00:00:00.000Z`
    );

  return (
    Number.isFinite(
      parsed.getTime()
    ) &&
    parsed
      .toISOString()
      .slice(
        0,
        10
      ) ===
      value
  );
}

function isCountString(
  value: unknown
): value is string {
  return (
    isString(
      value
    ) &&
    /^\d+$/.test(
      value
    )
  );
}

function hasMetricTotals(
  value:
    Record<
      string,
      unknown
    >
): value is
  Record<
    string,
    unknown
  > &
  AnalyticsMetricTotals {
  return (
    isCountString(
      value.validImpressions
    ) &&
    isCountString(
      value.invalidImpressions
    ) &&
    isCountString(
      value.duplicateImpressions
    ) &&
    isCountString(
      value.validClicks
    ) &&
    isCountString(
      value.invalidClicks
    ) &&
    isCountString(
      value.duplicateClicks
    ) &&
    isCountString(
      value.validConversions
    ) &&
    isCountString(
      value.invalidConversions
    ) &&
    isCountString(
      value.duplicateConversions
    ) &&
    isCountString(
      value.unattributedConversions
    )
  );
}

function isPlacement(
  value: unknown
): value is AnalyticsPlacement {
  return (
    value ===
      "home" ||
    value ===
      "search" ||
    value ===
      "trending"
  );
}

function isPlacementRecord(
  value: unknown
): value is AnalyticsPlacementRecord {
  return (
    isRecord(
      value
    ) &&
    hasMetricTotals(
      value
    ) &&
    isPlacement(
      value.placement
    ) &&
    isFiniteNumber(
      value.ctr
    )
  );
}

function isCampaignRecord(
  value: unknown
): value is AnalyticsCampaignRecord {
  return (
    isRecord(
      value
    ) &&
    hasMetricTotals(
      value
    ) &&
    isString(
      value.campaignId
    ) &&
    isString(
      value.campaignReference
    ) &&
    isString(
      value.campaignName
    ) &&
    isString(
      value.campaignType
    ) &&
    isString(
      value.campaignStatus
    ) &&
    isFiniteNumber(
      value.ctr
    ) &&
    isNullableTimestamp(
      value.latestSourceEventWatermark
    ) &&
    isNonNegativeInteger(
      value.finalizedMetricRows
    ) &&
    isNonNegativeInteger(
      value.totalMetricRows
    )
  );
}

export function parseAdminAnalyticsOverview(
  value: unknown
): AdminAnalyticsOverview {
  if (
    !isRecord(
      value
    ) ||
    !hasMetricTotals(
      value
    ) ||
    !isIsoDate(
      value.startDate
    ) ||
    !isIsoDate(
      value.endDate
    ) ||
    !isFiniteNumber(
      value.ctr
    ) ||
    !isNullableTimestamp(
      value.latestSourceEventWatermark
    ) ||
    !isNonNegativeInteger(
      value.finalizedMetricRows
    ) ||
    !isNonNegativeInteger(
      value.totalMetricRows
    ) ||
    !Array.isArray(
      value.placements
    ) ||
    !value.placements.every(
      isPlacementRecord
    ) ||
    !Array.isArray(
      value.campaigns
    ) ||
    !value.campaigns.every(
      isCampaignRecord
    )
  ) {
    throw new TypeError(
      "The Monetization Analytics API returned an invalid response."
    );
  }

  return value as unknown as
    AdminAnalyticsOverview;
}