import type {
  AnalyticsDataFreshnessStatus,
  AnalyticsEventCountSet,
  AnalyticsFinancialMetrics,
  AnalyticsMetricAvailability,
  AnalyticsProcessingStage,
  AnalyticsQualitySummary,
  CampaignAnalyticsSnapshot,
  ClickAnalyticsMetrics,
  ConversionAnalyticsMetrics,
  ImpressionAnalyticsMetrics,
  VideoAnalyticsMetrics,
} from "./analytics.types";

export interface AnalyticsQualityIssue {
  code: string;

  severity:
    | "warning"
    | "error";

  message: string;
}

export interface AnalyticsQualityEvaluation {
  valid: boolean;

  issues: AnalyticsQualityIssue[];
}

export interface AnalyticsFreshnessThresholds {
  liveMaximumAgeMilliseconds: number;

  recentMaximumAgeMilliseconds: number;

  delayedMaximumAgeMilliseconds: number;
}

export const DEFAULT_ANALYTICS_FRESHNESS_THRESHOLDS:
  AnalyticsFreshnessThresholds = {
  liveMaximumAgeMilliseconds:
    5 * 60 * 1000,

  recentMaximumAgeMilliseconds:
    30 * 60 * 1000,

  delayedMaximumAgeMilliseconds:
    6 * 60 * 60 * 1000,
};

function isNonNegativeInteger(
  value: number
): boolean {
  return (
    Number.isSafeInteger(
      value
    ) &&
    value >= 0
  );
}

function isValidTimestamp(
  value:
    string |
    undefined
): boolean {
  if (!value) {
    return false;
  }

  return !Number.isNaN(
    new Date(value).getTime()
  );
}

function addIssue(
  issues:
    AnalyticsQualityIssue[],
  code:
    string,
  severity:
    AnalyticsQualityIssue["severity"],
  message:
    string
): void {
  issues.push({
    code,
    severity,
    message,
  });
}

function validateEventCountSet(
  label:
    string,
  metrics:
    AnalyticsEventCountSet,
  issues:
    AnalyticsQualityIssue[]
): void {
  const entries = [
    [
      "raw",
      metrics.raw,
    ],
    [
      "pendingValidation",
      metrics.pendingValidation,
    ],
    [
      "valid",
      metrics.valid,
    ],
    [
      "invalid",
      metrics.invalid,
    ],
    [
      "duplicate",
      metrics.duplicate,
    ],
    [
      "finalized",
      metrics.finalized,
    ],
  ] as const;

  entries.forEach(
    (
      [
        field,
        value,
      ]
    ) => {
      if (
        !isNonNegativeInteger(
          value
        )
      ) {
        addIssue(
          issues,
          `${label}.${field}.invalid`,
          "error",
          `${label} ${field} must be a non-negative integer.`
        );
      }
    }
  );

  if (
    metrics.finalized >
    metrics.valid
  ) {
    addIssue(
      issues,
      `${label}.finalized_exceeds_valid`,
      "error",
      `${label} finalized count must not exceed valid count.`
    );
  }

  if (
    metrics.valid +
      metrics.invalid +
      metrics.duplicate +
      metrics.pendingValidation >
    metrics.raw
  ) {
    addIssue(
      issues,
      `${label}.classified_exceeds_raw`,
      "error",
      `${label} classified counts must not exceed the raw count.`
    );
  }

  if (
    metrics.raw >
      0 &&
    metrics.valid ===
      0 &&
    metrics.invalid ===
      0 &&
    metrics.duplicate ===
      0 &&
    metrics.pendingValidation ===
      0
  ) {
    addIssue(
      issues,
      `${label}.unclassified_activity`,
      "warning",
      `${label} contains raw activity that has not been classified.`
    );
  }
}

function validateImpressions(
  metrics:
    ImpressionAnalyticsMetrics,
  issues:
    AnalyticsQualityIssue[]
): void {
  validateEventCountSet(
    "Impressions",
    metrics,
    issues
  );

  if (
    !isNonNegativeInteger(
      metrics.qualified
    )
  ) {
    addIssue(
      issues,
      "impressions.qualified.invalid",
      "error",
      "Qualified impressions must be a non-negative integer."
    );
  }

  if (
    !isNonNegativeInteger(
      metrics.viewabilityRejected
    )
  ) {
    addIssue(
      issues,
      "impressions.viewability_rejected.invalid",
      "error",
      "Viewability-rejected impressions must be a non-negative integer."
    );
  }

  if (
    metrics.qualified >
    metrics.valid
  ) {
    addIssue(
      issues,
      "impressions.qualified_exceeds_valid",
      "error",
      "Qualified impressions must not exceed valid impressions."
    );
  }

  if (
    metrics.viewabilityRejected >
    metrics.invalid
  ) {
    addIssue(
      issues,
      "impressions.viewability_rejected_exceeds_invalid",
      "warning",
      "Viewability-rejected impressions exceed the invalid-impression count."
    );
  }
}

function validateClicks(
  metrics:
    ClickAnalyticsMetrics,
  issues:
    AnalyticsQualityIssue[]
): void {
  validateEventCountSet(
    "Clicks",
    metrics,
    issues
  );

  if (
    !isNonNegativeInteger(
      metrics.ctaClicks
    )
  ) {
    addIssue(
      issues,
      "clicks.cta_clicks.invalid",
      "error",
      "CTA clicks must be a non-negative integer."
    );
  }

  if (
    !isNonNegativeInteger(
      metrics.suspiciousRejected
    )
  ) {
    addIssue(
      issues,
      "clicks.suspicious_rejected.invalid",
      "error",
      "Suspicious rejected clicks must be a non-negative integer."
    );
  }

  if (
    metrics.ctaClicks >
    metrics.valid
  ) {
    addIssue(
      issues,
      "clicks.cta_exceeds_valid",
      "error",
      "CTA clicks must not exceed valid clicks."
    );
  }

  if (
    metrics.suspiciousRejected >
    metrics.invalid
  ) {
    addIssue(
      issues,
      "clicks.suspicious_rejected_exceeds_invalid",
      "warning",
      "Suspicious rejected clicks exceed the invalid-click count."
    );
  }
}

function validateConversions(
  metrics:
    ConversionAnalyticsMetrics,
  issues:
    AnalyticsQualityIssue[]
): void {
  const entries = [
    [
      "raw",
      metrics.raw,
    ],
    [
      "pendingValidation",
      metrics.pendingValidation,
    ],
    [
      "attributed",
      metrics.attributed,
    ],
    [
      "duplicate",
      metrics.duplicate,
    ],
    [
      "rejected",
      metrics.rejected,
    ],
    [
      "reversed",
      metrics.reversed,
    ],
    [
      "finalized",
      metrics.finalized,
    ],
  ] as const;

  entries.forEach(
    (
      [
        field,
        value,
      ]
    ) => {
      if (
        !isNonNegativeInteger(
          value
        )
      ) {
        addIssue(
          issues,
          `conversions.${field}.invalid`,
          "error",
          `Conversions ${field} must be a non-negative integer.`
        );
      }
    }
  );

  if (
    metrics.availability !==
      "available" &&
    (
      metrics.raw >
        0 ||
      metrics.finalized >
        0
    )
  ) {
    addIssue(
      issues,
      "conversions.unavailable_with_values",
      "error",
      "Unavailable conversion metrics must not contain recorded conversion values."
    );
  }

  if (
    metrics.finalized >
    metrics.attributed
  ) {
    addIssue(
      issues,
      "conversions.finalized_exceeds_attributed",
      "error",
      "Finalized conversions must not exceed attributed conversions."
    );
  }

  if (
    metrics.attributed >
    metrics.raw
  ) {
    addIssue(
      issues,
      "conversions.attributed_exceeds_raw",
      "error",
      "Attributed conversions must not exceed raw conversions."
    );
  }

  if (
    metrics.reversed >
    metrics.finalized
  ) {
    addIssue(
      issues,
      "conversions.reversed_exceeds_finalized",
      "warning",
      "Reversed conversions exceed finalized conversions."
    );
  }
}

function validateVideo(
  metrics:
    VideoAnalyticsMetrics,
  issues:
    AnalyticsQualityIssue[]
): void {
  const entries = [
    [
      "starts",
      metrics.starts,
    ],
    [
      "qualifiedViews",
      metrics.qualifiedViews,
    ],
    [
      "quartile25",
      metrics.quartile25,
    ],
    [
      "quartile50",
      metrics.quartile50,
    ],
    [
      "quartile75",
      metrics.quartile75,
    ],
    [
      "completed",
      metrics.completed,
    ],
    [
      "totalWatchMilliseconds",
      metrics.totalWatchMilliseconds,
    ],
  ] as const;

  entries.forEach(
    (
      [
        field,
        value,
      ]
    ) => {
      if (
        !isNonNegativeInteger(
          value
        )
      ) {
        addIssue(
          issues,
          `video.${field}.invalid`,
          "error",
          `Video ${field} must be a non-negative integer.`
        );
      }
    }
  );

  if (
    metrics.qualifiedViews >
    metrics.starts
  ) {
    addIssue(
      issues,
      "video.qualified_exceeds_starts",
      "error",
      "Qualified video views must not exceed video starts."
    );
  }

  if (
    metrics.quartile25 >
      metrics.qualifiedViews ||
    metrics.quartile50 >
      metrics.quartile25 ||
    metrics.quartile75 >
      metrics.quartile50 ||
    metrics.completed >
      metrics.quartile75
  ) {
    addIssue(
      issues,
      "video.funnel_inconsistent",
      "error",
      "Video quartile metrics must follow the expected descending funnel."
    );
  }

  if (
    metrics.averageWatchMilliseconds !==
      null &&
    (
      !Number.isSafeInteger(
        metrics.averageWatchMilliseconds
      ) ||
      metrics.averageWatchMilliseconds <
        0
    )
  ) {
    addIssue(
      issues,
      "video.average_watch.invalid",
      "error",
      "Average video watch time must be null or a non-negative integer."
    );
  }

  if (
    metrics.qualifiedViews ===
      0 &&
    metrics.averageWatchMilliseconds !==
      null
  ) {
    addIssue(
      issues,
      "video.average_without_views",
      "warning",
      "Average watch time should be unavailable when there are no qualified views."
    );
  }
}

function validateFinancialMetrics(
  metrics:
    AnalyticsFinancialMetrics,
  issues:
    AnalyticsQualityIssue[]
): void {
  if (
    !metrics.currency.trim()
  ) {
    addIssue(
      issues,
      "financials.currency.missing",
      "error",
      "Analytics financial metrics require a currency."
    );
  }

  const nonNegativeFields = [
    [
      "estimatedSpendMinor",
      metrics.estimatedSpendMinor,
    ],
    [
      "pendingValidationSpendMinor",
      metrics.pendingValidationSpendMinor,
    ],
    [
      "finalizedSpendMinor",
      metrics.finalizedSpendMinor,
    ],
    [
      "invalidTrafficCreditMinor",
      metrics.invalidTrafficCreditMinor,
    ],
    [
      "reconciledSpendMinor",
      metrics.reconciledSpendMinor,
    ],
  ] as const;

  nonNegativeFields.forEach(
    (
      [
        field,
        value,
      ]
    ) => {
      if (
        !isNonNegativeInteger(
          value
        )
      ) {
        addIssue(
          issues,
          `financials.${field}.invalid`,
          "error",
          `Financial ${field} must be a non-negative integer in minor units.`
        );
      }
    }
  );

  if (
    !Number.isSafeInteger(
      metrics.adjustmentMinor
    )
  ) {
    addIssue(
      issues,
      "financials.adjustment.invalid",
      "error",
      "Financial adjustment must be an integer in minor units."
    );
  }

  if (
    metrics.finalizedSpendMinor >
      metrics.estimatedSpendMinor &&
    metrics.reconciledSpendMinor ===
      0
  ) {
    addIssue(
      issues,
      "financials.finalized_exceeds_estimated",
      "warning",
      "Finalized spend exceeds estimated spend."
    );
  }

  if (
    metrics.reconciledSpendMinor >
      metrics.finalizedSpendMinor +
        Math.max(
          metrics.adjustmentMinor,
          0
        )
  ) {
    addIssue(
      issues,
      "financials.reconciled_exceeds_finalized",
      "warning",
      "Reconciled spend exceeds finalized spend after positive adjustments."
    );
  }
}

export function determineMetricAvailability(
  tracked:
    boolean,
  processing:
    boolean,
  available:
    boolean
): AnalyticsMetricAvailability {
  if (!tracked) {
    return "not_tracked";
  }

  if (processing) {
    return "processing";
  }

  if (!available) {
    return "unavailable";
  }

  return "available";
}

export function determineAnalyticsFreshnessStatus(
  dataThrough:
    string,
  currentAt:
    string,
  thresholds:
    AnalyticsFreshnessThresholds =
      DEFAULT_ANALYTICS_FRESHNESS_THRESHOLDS
): AnalyticsDataFreshnessStatus {
  const dataTime =
    new Date(
      dataThrough
    ).getTime();

  const currentTime =
    new Date(
      currentAt
    ).getTime();

  if (
    Number.isNaN(
      dataTime
    ) ||
    Number.isNaN(
      currentTime
    )
  ) {
    return "unavailable";
  }

  const age =
    Math.max(
      currentTime -
        dataTime,
      0
    );

  if (
    age <=
    thresholds
      .liveMaximumAgeMilliseconds
  ) {
    return "live";
  }

  if (
    age <=
    thresholds
      .recentMaximumAgeMilliseconds
  ) {
    return "recent";
  }

  if (
    age <=
    thresholds
      .delayedMaximumAgeMilliseconds
  ) {
    return "delayed";
  }

  return "stale";
}

export function determineProcessingStage(
  input: {
    reconciledAt?: string;

    adjustedAt?: string;

    finalizedThrough?: string;

    processing:
      boolean;
  }
): AnalyticsProcessingStage {
  if (
    input.reconciledAt
  ) {
    return "reconciled";
  }

  if (
    input.adjustedAt
  ) {
    return "adjusted";
  }

  if (
    input.finalizedThrough
  ) {
    return "finalized";
  }

  if (
    input.processing
  ) {
    return "processing";
  }

  return "live_estimate";
}

export function createAnalyticsQualitySummary(
  input: {
    aggregationVersion:
      number;

    generatedAt:
      string;

    dataThrough:
      string;

    currentAt:
      string;

    finalizedThrough?:
      string;

    lastAdjustedAt?:
      string;

    lastReconciledAt?:
      string;

    processing:
      boolean;

    warningMessages?:
      string[];
  }
): AnalyticsQualitySummary {
  return {
    stage:
      determineProcessingStage({
        reconciledAt:
          input.lastReconciledAt,

        adjustedAt:
          input.lastAdjustedAt,

        finalizedThrough:
          input.finalizedThrough,

        processing:
          input.processing,
      }),

    freshnessStatus:
      determineAnalyticsFreshnessStatus(
        input.dataThrough,
        input.currentAt
      ),

    aggregationVersion:
      input.aggregationVersion,

    generatedAt:
      input.generatedAt,

    dataThrough:
      input.dataThrough,

    finalizedThrough:
      input.finalizedThrough,

    lastAdjustedAt:
      input.lastAdjustedAt,

    lastReconciledAt:
      input.lastReconciledAt,

    warningMessages:
      input.warningMessages ??
      [],
  };
}

export function evaluateCampaignAnalyticsQuality(
  snapshot:
    CampaignAnalyticsSnapshot
): AnalyticsQualityEvaluation {
  const issues:
    AnalyticsQualityIssue[] = [];

  if (
    !snapshot.aggregationId.startsWith(
      "AGG-"
    )
  ) {
    addIssue(
      issues,
      "aggregation.id.invalid",
      "error",
      "Analytics aggregation ID must start with AGG-."
    );
  }

  if (
    snapshot.windowEnd <
    snapshot.windowStart
  ) {
    addIssue(
      issues,
      "aggregation.window.invalid",
      "error",
      "Analytics window end must not be earlier than its start."
    );
  }

  if (
    !Number.isSafeInteger(
      snapshot.quality
        .aggregationVersion
    ) ||
    snapshot.quality
      .aggregationVersion <=
      0
  ) {
    addIssue(
      issues,
      "aggregation.version.invalid",
      "error",
      "Analytics aggregation version must be a positive integer."
    );
  }

  const timestamps = [
    [
      "generatedAt",
      snapshot.quality
        .generatedAt,
    ],
    [
      "dataThrough",
      snapshot.quality
        .dataThrough,
    ],
  ] as const;

  timestamps.forEach(
    (
      [
        field,
        value,
      ]
    ) => {
      if (
        !isValidTimestamp(
          value
        )
      ) {
        addIssue(
          issues,
          `quality.${field}.invalid`,
          "error",
          `Analytics ${field} timestamp is invalid.`
        );
      }
    }
  );

  validateImpressions(
    snapshot.impressions,
    issues
  );

  validateClicks(
    snapshot.clicks,
    issues
  );

  validateConversions(
    snapshot.conversions,
    issues
  );

  validateVideo(
    snapshot.video,
    issues
  );

  validateFinancialMetrics(
    snapshot.financials,
    issues
  );

  if (
    snapshot.rates
      .ctrPercentage !==
      null &&
    (
      !Number.isFinite(
        snapshot.rates
          .ctrPercentage
      ) ||
      snapshot.rates
        .ctrPercentage <
        0
    )
  ) {
    addIssue(
      issues,
      "rates.ctr.invalid",
      "error",
      "CTR must be null or a non-negative percentage."
    );
  }

  if (
    snapshot.rates
      .conversionRatePercentage !==
      null &&
    (
      !Number.isFinite(
        snapshot.rates
          .conversionRatePercentage
      ) ||
      snapshot.rates
        .conversionRatePercentage <
        0
    )
  ) {
    addIssue(
      issues,
      "rates.conversion.invalid",
      "error",
      "Conversion rate must be null or a non-negative percentage."
    );
  }

  if (
    snapshot.quality.stage ===
      "reconciled" &&
    !snapshot.quality
      .lastReconciledAt
  ) {
    addIssue(
      issues,
      "quality.reconciled_without_timestamp",
      "error",
      "Reconciled analytics require a reconciliation timestamp."
    );
  }

  if (
    snapshot.quality.stage ===
      "finalized" &&
    !snapshot.quality
      .finalizedThrough
  ) {
    addIssue(
      issues,
      "quality.finalized_without_timestamp",
      "error",
      "Finalized analytics require a finalized-through timestamp."
    );
  }

  if (
    snapshot.quality
      .freshnessStatus ===
      "stale"
  ) {
    addIssue(
      issues,
      "quality.data_stale",
      "warning",
      "Advertiser analytics data is stale."
    );
  }

  if (
    snapshot.quality
      .freshnessStatus ===
      "unavailable"
  ) {
    addIssue(
      issues,
      "quality.data_unavailable",
      "warning",
      "Advertiser analytics freshness is unavailable."
    );
  }

  return {
    valid:
      !issues.some(
        (
          issue
        ) =>
          issue.severity ===
          "error"
      ),

    issues,
  };
}
