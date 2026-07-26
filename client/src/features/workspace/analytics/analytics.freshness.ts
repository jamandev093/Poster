import type {
  AnalyticsDataFreshnessStatus,
  AnalyticsProcessingStage,
  AnalyticsQualitySummary,
} from "./analytics.types";

export interface AnalyticsFreshnessPolicy {
  liveMaximumAgeMilliseconds:
    number;

  recentMaximumAgeMilliseconds:
    number;

  delayedMaximumAgeMilliseconds:
    number;

  staleMaximumAgeMilliseconds?:
    number;
}

/**
 * Default advertiser-reporting freshness policy.
 *
 * Backend configuration may eventually override these values,
 * but Client, Admin, and API responses must use the same
 * freshness meanings.
 */
export const DEFAULT_ANALYTICS_FRESHNESS_POLICY:
  AnalyticsFreshnessPolicy = {
  liveMaximumAgeMilliseconds:
    5 * 60 * 1000,

  recentMaximumAgeMilliseconds:
    30 * 60 * 1000,

  delayedMaximumAgeMilliseconds:
    6 * 60 * 60 * 1000,

  staleMaximumAgeMilliseconds:
    24 * 60 * 60 * 1000,
};

export interface AnalyticsFreshnessEvaluation {
  status:
    AnalyticsDataFreshnessStatus;

  ageMilliseconds:
    number | null;

  ageMinutes:
    number | null;

  dataThrough:
    string;

  evaluatedAt:
    string;

  message:
    string;
}

function parseTimestamp(
  value:
    string
): number | null {
  const timestamp =
    new Date(
      value
    ).getTime();

  return Number.isNaN(
    timestamp
  )
    ? null
    : timestamp;
}

export function calculateAnalyticsDataAgeMilliseconds(
  dataThrough:
    string,
  evaluatedAt:
    string
): number | null {
  const dataTimestamp =
    parseTimestamp(
      dataThrough
    );

  const evaluationTimestamp =
    parseTimestamp(
      evaluatedAt
    );

  if (
    dataTimestamp ===
      null ||
    evaluationTimestamp ===
      null
  ) {
    return null;
  }

  return Math.max(
    evaluationTimestamp -
      dataTimestamp,
    0
  );
}

export function determineAnalyticsFreshness(
  ageMilliseconds:
    number |
    null,
  policy:
    AnalyticsFreshnessPolicy =
      DEFAULT_ANALYTICS_FRESHNESS_POLICY
): AnalyticsDataFreshnessStatus {
  if (
    ageMilliseconds ===
      null
  ) {
    return "unavailable";
  }

  if (
    ageMilliseconds <=
    policy
      .liveMaximumAgeMilliseconds
  ) {
    return "live";
  }

  if (
    ageMilliseconds <=
    policy
      .recentMaximumAgeMilliseconds
  ) {
    return "recent";
  }

  if (
    ageMilliseconds <=
    policy
      .delayedMaximumAgeMilliseconds
  ) {
    return "delayed";
  }

  return "stale";
}

export function getAnalyticsFreshnessLabel(
  status:
    AnalyticsDataFreshnessStatus
): string {
  switch (status) {
    case "live":
      return "Live";

    case "recent":
      return "Recently updated";

    case "delayed":
      return "Delayed";

    case "stale":
      return "Stale";

    case "unavailable":
      return "Unavailable";
  }
}

export function getAnalyticsFreshnessMessage(
  status:
    AnalyticsDataFreshnessStatus,
  ageMinutes:
    number |
    null
): string {
  switch (status) {
    case "live":
      return "Analytics are updating in near real time.";

    case "recent":
      return ageMinutes ===
        null
        ? "Analytics were updated recently."
        : `Analytics were updated about ${Math.max(
            Math.round(
              ageMinutes
            ),
            1
          )} minutes ago.`;

    case "delayed":
      return "Analytics processing is delayed. Final values may change.";

    case "stale":
      return "Analytics have not updated recently. Use finalized values cautiously.";

    case "unavailable":
      return "Analytics update time is currently unavailable.";
  }
}

export function evaluateAnalyticsFreshness(
  dataThrough:
    string,
  evaluatedAt:
    string,
  policy:
    AnalyticsFreshnessPolicy =
      DEFAULT_ANALYTICS_FRESHNESS_POLICY
): AnalyticsFreshnessEvaluation {
  const ageMilliseconds =
    calculateAnalyticsDataAgeMilliseconds(
      dataThrough,
      evaluatedAt
    );

  const status =
    determineAnalyticsFreshness(
      ageMilliseconds,
      policy
    );

  const ageMinutes =
    ageMilliseconds ===
      null
      ? null
      : ageMilliseconds /
        60_000;

  return {
    status,

    ageMilliseconds,

    ageMinutes,

    dataThrough,

    evaluatedAt,

    message:
      getAnalyticsFreshnessMessage(
        status,
        ageMinutes
      ),
  };
}

export function getAnalyticsProcessingStageLabel(
  stage:
    AnalyticsProcessingStage
): string {
  switch (stage) {
    case "live_estimate":
      return "Live estimate";

    case "processing":
      return "Processing";

    case "finalized":
      return "Finalized";

    case "adjusted":
      return "Adjusted";

    case "reconciled":
      return "Reconciled";
  }
}

export function getAnalyticsProcessingStageMessage(
  stage:
    AnalyticsProcessingStage
): string {
  switch (stage) {
    case "live_estimate":
      return "These values are preliminary and may change after validation.";

    case "processing":
      return "Poster is validating and processing recent activity.";

    case "finalized":
      return "Activity through the finalized time has completed validation.";

    case "adjusted":
      return "One or more approved corrections have been applied.";

    case "reconciled":
      return "Analytics and financial deductions have been reconciled.";
  }
}

export interface AnalyticsAdvertiserStatus {
  freshnessLabel:
    string;

  freshnessMessage:
    string;

  processingLabel:
    string;

  processingMessage:
    string;

  dataThrough:
    string;

  finalizedThrough?:
    string;

  lastReconciledAt?:
    string;

  warningMessages:
    string[];
}

export function createAnalyticsAdvertiserStatus(
  quality:
    AnalyticsQualitySummary
): AnalyticsAdvertiserStatus {
  return {
    freshnessLabel:
      getAnalyticsFreshnessLabel(
        quality
          .freshnessStatus
      ),

    freshnessMessage:
      getAnalyticsFreshnessMessage(
        quality
          .freshnessStatus,
        null
      ),

    processingLabel:
      getAnalyticsProcessingStageLabel(
        quality.stage
      ),

    processingMessage:
      getAnalyticsProcessingStageMessage(
        quality.stage
      ),

    dataThrough:
      quality.dataThrough,

    finalizedThrough:
      quality.finalizedThrough,

    lastReconciledAt:
      quality.lastReconciledAt,

    warningMessages:
      quality.warningMessages,
  };
}

export function isAnalyticsFinalized(
  quality:
    AnalyticsQualitySummary
): boolean {
  return (
    quality.stage ===
      "finalized" ||
    quality.stage ===
      "adjusted" ||
    quality.stage ===
      "reconciled"
  );
}

export function isAnalyticsFinanciallyReconciled(
  quality:
    AnalyticsQualitySummary
): boolean {
  return (
    quality.stage ===
      "reconciled" &&
    Boolean(
      quality.lastReconciledAt
    )
  );
}

export function shouldShowAnalyticsDelayWarning(
  quality:
    AnalyticsQualitySummary
): boolean {
  return (
    quality.freshnessStatus ===
      "delayed" ||
    quality.freshnessStatus ===
      "stale" ||
    quality.freshnessStatus ===
      "unavailable"
  );
}
