import type {
  AnalyticsBreakdownRow,
  AnalyticsReport,
  CampaignAnalyticsSnapshot,
} from "./analytics.types";

/**
 * Development-only advertiser analytics fixtures.
 *
 * These records imitate the shape expected from future
 * organization-scoped Backend analytics APIs.
 *
 * They intentionally distinguish:
 *
 * - raw activity;
 * - pending validation;
 * - valid activity;
 * - invalid activity;
 * - duplicate activity;
 * - finalized activity;
 * - estimated spend;
 * - finalized spend;
 * - invalid-traffic credits;
 * - reconciled spend.
 *
 * This file must never become the production source of truth.
 */

const cloudSkills30DaySnapshot:
  CampaignAnalyticsSnapshot = {
  aggregationId:
    "AGG-CMP-3001-30D-V1",

  organizationId:
    "ORG-1001",

  campaignId:
    "CMP-3001",

  window:
    "30d",

  windowStart:
    "2026-06-27T00:00:00Z",

  windowEnd:
    "2026-07-26T23:59:59Z",

  impressions: {
    raw:
      742_800,

    pendingValidation:
      2_400,

    valid:
      731_500,

    invalid:
      6_700,

    duplicate:
      2_200,

    finalized:
      729_100,

    qualified:
      728_000,

    viewabilityRejected:
      4_900,
  },

  clicks: {
    raw:
      18_760,

    pendingValidation:
      95,

    valid:
      18_390,

    invalid:
      210,

    duplicate:
      65,

    finalized:
      18_295,

    ctaClicks:
      18_240,

    suspiciousRejected:
      143,
  },

  video: {
    starts:
      0,

    qualifiedViews:
      0,

    quartile25:
      0,

    quartile50:
      0,

    quartile75:
      0,

    completed:
      0,

    totalWatchMilliseconds:
      0,

    averageWatchMilliseconds:
      null,
  },

  conversions: {
    availability:
      "available",

    raw:
      646,

    pendingValidation:
      4,

    attributed:
      632,

    duplicate:
      6,

    rejected:
      8,

    reversed:
      8,

    finalized:
      620,
  },

  rates: {
    ctrPercentage:
      2.53,

    conversionRatePercentage:
      3.37,

    conversionRateDenominator:
      "valid_clicks",
  },

  delivery: {
    deliveryTarget:
      1_000_000,

    delivered:
      728_000,

    remaining:
      272_000,

    deliveryPercentage:
      72.8,

    pacingPercentage:
      97.4,

    daysElapsed:
      26,

    daysRemaining:
      5,

    underDelivering:
      false,

    overDelivering:
      false,
  },

  financials: {
    currency:
      "INR",

    estimatedSpendMinor:
      8_390_000,

    pendingValidationSpendMinor:
      145_000,

    finalizedSpendMinor:
      8_245_000,

    invalidTrafficCreditMinor:
      120_000,

    adjustmentMinor:
      0,

    reconciledSpendMinor:
      8_125_000,
  },

  attribution: {
    model:
      "last_valid_click",

    clickWindowHours:
      168,

    impressionWindowHours:
      24,

    timezone:
      "Asia/Kolkata",

    conversionDefinition:
      "Completed course registration",
  },

  quality: {
    stage:
      "reconciled",

    freshnessStatus:
      "recent",

    aggregationVersion:
      1,

    generatedAt:
      "2026-07-26T18:20:00Z",

    dataThrough:
      "2026-07-26T18:15:00Z",

    finalizedThrough:
      "2026-07-26T17:00:00Z",

    lastAdjustedAt:
      "2026-07-26T17:30:00Z",

    lastReconciledAt:
      "2026-07-26T18:00:00Z",

    warningMessages: [],
  },
};

const futureSkills30DaySnapshot:
  CampaignAnalyticsSnapshot = {
  aggregationId:
    "AGG-CMP-3010-30D-V1",

  organizationId:
    "ORG-1001",

  campaignId:
    "CMP-3010",

  window:
    "30d",

  windowStart:
    "2026-06-27T00:00:00Z",

  windowEnd:
    "2026-07-26T23:59:59Z",

  impressions: {
    raw:
      0,

    pendingValidation:
      0,

    valid:
      0,

    invalid:
      0,

    duplicate:
      0,

    finalized:
      0,

    qualified:
      0,

    viewabilityRejected:
      0,
  },

  clicks: {
    raw:
      0,

    pendingValidation:
      0,

    valid:
      0,

    invalid:
      0,

    duplicate:
      0,

    finalized:
      0,

    ctaClicks:
      0,

    suspiciousRejected:
      0,
  },

  video: {
    starts:
      0,

    qualifiedViews:
      0,

    quartile25:
      0,

    quartile50:
      0,

    quartile75:
      0,

    completed:
      0,

    totalWatchMilliseconds:
      0,

    averageWatchMilliseconds:
      null,
  },

  conversions: {
    availability:
      "not_tracked",

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
  },

  rates: {
    ctrPercentage:
      null,

    conversionRatePercentage:
      null,

    conversionRateDenominator:
      "valid_clicks",
  },

  delivery: {
    deliveryTarget:
      600_000,

    delivered:
      0,

    remaining:
      600_000,

    deliveryPercentage:
      0,

    pacingPercentage:
      null,

    daysElapsed:
      0,

    daysRemaining:
      32,

    underDelivering:
      false,

    overDelivering:
      false,
  },

  financials: {
    currency:
      "INR",

    estimatedSpendMinor:
      0,

    pendingValidationSpendMinor:
      0,

    finalizedSpendMinor:
      0,

    invalidTrafficCreditMinor:
      0,

    adjustmentMinor:
      0,

    reconciledSpendMinor:
      0,
  },

  attribution: {
    model:
      "last_valid_click",

    clickWindowHours:
      168,

    impressionWindowHours:
      24,

    timezone:
      "Asia/Kolkata",

    conversionDefinition:
      "Completed program enquiry",
  },

  quality: {
    stage:
      "live_estimate",

    freshnessStatus:
      "unavailable",

    aggregationVersion:
      1,

    generatedAt:
      "2026-07-26T18:20:00Z",

    dataThrough:
      "2026-07-26T18:20:00Z",

    warningMessages: [
      "Campaign has not started.",
      "Conversion tracking is not configured.",
    ],
  },
};

const professionalLearning30DaySnapshot:
  CampaignAnalyticsSnapshot = {
  aggregationId:
    "AGG-CMP-3020-30D-V1",

  organizationId:
    "ORG-1001",

  campaignId:
    "CMP-3020",

  window:
    "30d",

  windowStart:
    "2026-06-27T00:00:00Z",

  windowEnd:
    "2026-07-26T23:59:59Z",

  impressions: {
    raw:
      66_250,

    pendingValidation:
      420,

    valid:
      64_930,

    invalid:
      640,

    duplicate:
      260,

    finalized:
      64_510,

    qualified:
      64_000,

    viewabilityRejected:
      410,
  },

  clicks: {
    raw:
      2_315,

    pendingValidation:
      18,

    valid:
      2_267,

    invalid:
      21,

    duplicate:
      9,

    finalized:
      2_249,

    ctaClicks:
      2_240,

    suspiciousRejected:
      12,
  },

  video: {
    starts:
      21_400,

    qualifiedViews:
      18_950,

    quartile25:
      17_820,

    quartile50:
      15_390,

    quartile75:
      12_140,

    completed:
      9_840,

    totalWatchMilliseconds:
      132_650_000,

    averageWatchMilliseconds:
      7_000,
  },

  conversions: {
    availability:
      "available",

    raw:
      112,

    pendingValidation:
      2,

    attributed:
      108,

    duplicate:
      2,

    rejected:
      2,

    reversed:
      2,

    finalized:
      104,
  },

  rates: {
    ctrPercentage:
      3.54,

    conversionRatePercentage:
      4.59,

    conversionRateDenominator:
      "valid_clicks",
  },

  delivery: {
    delivered:
      64_000,

    deliveryPercentage:
      null,

    pacingPercentage:
      null,

    underDelivering:
      false,

    overDelivering:
      false,
  },

  financials: {
    currency:
      "INR",

    estimatedSpendMinor:
      4_320_000,

    pendingValidationSpendMinor:
      160_000,

    finalizedSpendMinor:
      4_160_000,

    invalidTrafficCreditMinor:
      0,

    adjustmentMinor:
      0,

    reconciledSpendMinor:
      4_160_000,
  },

  attribution: {
    model:
      "partner_reported",

    clickWindowHours:
      720,

    timezone:
      "Asia/Kolkata",

    conversionDefinition:
      "Completed paid enrollment",
  },

  quality: {
    stage:
      "finalized",

    freshnessStatus:
      "recent",

    aggregationVersion:
      1,

    generatedAt:
      "2026-07-26T18:20:00Z",

    dataThrough:
      "2026-07-26T18:10:00Z",

    finalizedThrough:
      "2026-07-26T17:00:00Z",

    warningMessages: [
      "Affiliate commission remains subject to partner reconciliation.",
    ],
  },
};

export const campaignAnalyticsSnapshots:
  CampaignAnalyticsSnapshot[] = [
  cloudSkills30DaySnapshot,
  futureSkills30DaySnapshot,
  professionalLearning30DaySnapshot,
];

export const analyticsBreakdownRows:
  AnalyticsBreakdownRow[] = [
  {
    key: {
      dimension:
        "placement",

      campaignId:
        "CMP-3001",

      placementId:
        "PLC-CMP-3001-HOME",

      surface:
        "home",

      format:
        "standard",
    },

    impressions: {
      raw:
        432_000,

      pendingValidation:
        1_300,

      valid:
        425_900,

      invalid:
        3_600,

      duplicate:
        1_200,

      finalized:
        424_600,

      qualified:
        423_900,

      viewabilityRejected:
        2_700,
    },

    clicks: {
      raw:
        10_980,

      pendingValidation:
        52,

      valid:
        10_770,

      invalid:
        120,

      duplicate:
        38,

      finalized:
        10_718,

      ctaClicks:
        10_690,

      suspiciousRejected:
        81,
    },

    video: {
      starts:
        0,

      qualifiedViews:
        0,

      quartile25:
        0,

      quartile50:
        0,

      quartile75:
        0,

      completed:
        0,

      totalWatchMilliseconds:
        0,

      averageWatchMilliseconds:
        null,
    },

    conversions: {
      availability:
        "available",

      raw:
        381,

      pendingValidation:
        2,

      attributed:
        374,

      duplicate:
        3,

      rejected:
        4,

      reversed:
        5,

      finalized:
        364,
    },

    rates: {
      ctrPercentage:
        2.54,

      conversionRatePercentage:
        3.38,

      conversionRateDenominator:
        "valid_clicks",
    },

    financials: {
      currency:
        "INR",

      estimatedSpendMinor:
        4_910_000,

      pendingValidationSpendMinor:
        82_000,

      finalizedSpendMinor:
        4_828_000,

      invalidTrafficCreditMinor:
        72_000,

      adjustmentMinor:
        0,

      reconciledSpendMinor:
        4_756_000,
    },
  },

  {
    key: {
      dimension:
        "placement",

      campaignId:
        "CMP-3001",

      placementId:
        "PLC-CMP-3001-SEARCH",

      surface:
        "search",

      format:
        "standard",
    },

    impressions: {
      raw:
        310_800,

      pendingValidation:
        1_100,

      valid:
        305_600,

      invalid:
        3_100,

      duplicate:
        1_000,

      finalized:
        304_500,

      qualified:
        304_100,

      viewabilityRejected:
        2_200,
    },

    clicks: {
      raw:
        7_780,

      pendingValidation:
        43,

      valid:
        7_620,

      invalid:
        90,

      duplicate:
        27,

      finalized:
        7_577,

      ctaClicks:
        7_550,

      suspiciousRejected:
        62,
    },

    video: {
      starts:
        0,

      qualifiedViews:
        0,

      quartile25:
        0,

      quartile50:
        0,

      quartile75:
        0,

      completed:
        0,

      totalWatchMilliseconds:
        0,

      averageWatchMilliseconds:
        null,
    },

    conversions: {
      availability:
        "available",

      raw:
        265,

      pendingValidation:
        2,

      attributed:
        258,

      duplicate:
        3,

      rejected:
        4,

      reversed:
        3,

      finalized:
        256,
    },

    rates: {
      ctrPercentage:
        2.51,

      conversionRatePercentage:
        3.36,

      conversionRateDenominator:
        "valid_clicks",
    },

    financials: {
      currency:
        "INR",

      estimatedSpendMinor:
        3_480_000,

      pendingValidationSpendMinor:
        63_000,

      finalizedSpendMinor:
        3_417_000,

      invalidTrafficCreditMinor:
        48_000,

      adjustmentMinor:
        0,

      reconciledSpendMinor:
        3_369_000,
    },
  },

  {
    key: {
      dimension:
        "placement",

      campaignId:
        "CMP-3020",

      placementId:
        "PLC-CMP-3020-SEARCH",

      surface:
        "search",

      format:
        "sliding",
    },

    impressions: {
      raw:
        39_400,

      pendingValidation:
        240,

      valid:
        38_650,

      invalid:
        370,

      duplicate:
        140,

      finalized:
        38_410,

      qualified:
        38_100,

      viewabilityRejected:
        230,
    },

    clicks: {
      raw:
        1_415,

      pendingValidation:
        11,

      valid:
        1_387,

      invalid:
        12,

      duplicate:
        5,

      finalized:
        1_376,

      ctaClicks:
        1_370,

      suspiciousRejected:
        7,
    },

    video: {
      starts:
        12_900,

      qualifiedViews:
        11_420,

      quartile25:
        10_730,

      quartile50:
        9_260,

      quartile75:
        7_320,

      completed:
        5_930,

      totalWatchMilliseconds:
        79_940_000,

      averageWatchMilliseconds:
        7_000,
    },

    conversions: {
      availability:
        "available",

      raw:
        67,

      pendingValidation:
        1,

      attributed:
        65,

      duplicate:
        1,

      rejected:
        1,

      reversed:
        1,

      finalized:
        63,
    },

    rates: {
      ctrPercentage:
        3.64,

      conversionRatePercentage:
        4.54,

      conversionRateDenominator:
        "valid_clicks",
    },

    financials: {
      currency:
        "INR",

      estimatedSpendMinor:
        2_580_000,

      pendingValidationSpendMinor:
        95_000,

      finalizedSpendMinor:
        2_485_000,

      invalidTrafficCreditMinor:
        0,

      adjustmentMinor:
        0,

      reconciledSpendMinor:
        2_485_000,
    },
  },

  {
    key: {
      dimension:
        "placement",

      campaignId:
        "CMP-3020",

      placementId:
        "PLC-CMP-3020-TRENDING",

      surface:
        "trending",

      format:
        "sliding",
    },

    impressions: {
      raw:
        26_850,

      pendingValidation:
        180,

      valid:
        26_280,

      invalid:
        270,

      duplicate:
        120,

      finalized:
        26_100,

      qualified:
        25_900,

      viewabilityRejected:
        180,
    },

    clicks: {
      raw:
        900,

      pendingValidation:
        7,

      valid:
        880,

      invalid:
        9,

      duplicate:
        4,

      finalized:
        873,

      ctaClicks:
        870,

      suspiciousRejected:
        5,
    },

    video: {
      starts:
        8_500,

      qualifiedViews:
        7_530,

      quartile25:
        7_090,

      quartile50:
        6_130,

      quartile75:
        4_820,

      completed:
        3_910,

      totalWatchMilliseconds:
        52_710_000,

      averageWatchMilliseconds:
        7_000,
    },

    conversions: {
      availability:
        "available",

      raw:
        45,

      pendingValidation:
        1,

      attributed:
        43,

      duplicate:
        1,

      rejected:
        1,

      reversed:
        1,

      finalized:
        41,
    },

    rates: {
      ctrPercentage:
        3.39,

      conversionRatePercentage:
        4.66,

      conversionRateDenominator:
        "valid_clicks",
    },

    financials: {
      currency:
        "INR",

      estimatedSpendMinor:
        1_740_000,

      pendingValidationSpendMinor:
        65_000,

      finalizedSpendMinor:
        1_675_000,

      invalidTrafficCreditMinor:
        0,

      adjustmentMinor:
        0,

      reconciledSpendMinor:
        1_675_000,
    },
  },
];

export const organizationAnalyticsReport:
  AnalyticsReport = {
  organizationId:
    "ORG-1001",

  window:
    "30d",

  windowStart:
    "2026-06-27T00:00:00Z",

  windowEnd:
    "2026-07-26T23:59:59Z",

  campaignSnapshots:
    campaignAnalyticsSnapshots,

  breakdowns:
    analyticsBreakdownRows,

  quality: {
    stage:
      "processing",

    freshnessStatus:
      "recent",

    aggregationVersion:
      1,

    generatedAt:
      "2026-07-26T18:20:00Z",

    dataThrough:
      "2026-07-26T18:15:00Z",

    finalizedThrough:
      "2026-07-26T17:00:00Z",

    lastReconciledAt:
      "2026-07-26T18:00:00Z",

    warningMessages: [
      "Recent activity may change while validation is in progress.",
    ],
  },
};

export function getMockCampaignAnalyticsSnapshot(
  campaignId:
    string
): CampaignAnalyticsSnapshot | undefined {
  return campaignAnalyticsSnapshots.find(
    (
      snapshot
    ) =>
      snapshot.campaignId ===
      campaignId
  );
}

export function getMockCampaignBreakdowns(
  campaignId:
    string
): AnalyticsBreakdownRow[] {
  return analyticsBreakdownRows.filter(
    (
      row
    ) =>
      row.key.campaignId ===
      campaignId
  );
}
