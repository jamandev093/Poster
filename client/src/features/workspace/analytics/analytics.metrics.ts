import type {
  AnalyticsDeliveryMetrics,
  AnalyticsEventCountSet,
  AnalyticsFinancialMetrics,
  AnalyticsRateMetrics,
  ConversionAnalyticsMetrics,
  ConversionRateDenominator,
  ImpressionAnalyticsMetrics,
  VideoAnalyticsMetrics,
} from "./analytics.types";

/**
 * Analytics calculations only.
 *
 * This file must not decide whether an event is valid,
 * duplicate, suspicious, billable, or attributable.
 *
 * Those decisions belong to Backend validation,
 * invalid-traffic detection, attribution, and reconciliation.
 */

export function calculatePercentage(
  numerator:
    number,
  denominator:
    number
): number | null {
  if (
    !Number.isFinite(
      numerator
    ) ||
    !Number.isFinite(
      denominator
    ) ||
    denominator <= 0
  ) {
    return null;
  }

  return (
    numerator /
    denominator
  ) * 100;
}

export function calculateCtrPercentage(
  validClicks:
    number,
  qualifiedImpressions:
    number
): number | null {
  return calculatePercentage(
    validClicks,
    qualifiedImpressions
  );
}

export function calculateConversionRatePercentage(
  conversions:
    ConversionAnalyticsMetrics,
  validClicks:
    number,
  qualifiedImpressions:
    number,
  denominator:
    ConversionRateDenominator
): number | null {
  if (
    conversions.availability !==
      "available"
  ) {
    return null;
  }

  const denominatorValue =
    denominator ===
      "valid_clicks"
      ? validClicks
      : qualifiedImpressions;

  return calculatePercentage(
    conversions.finalized,
    denominatorValue
  );
}

export interface CalculateRateMetricsInput {
  impressions:
    ImpressionAnalyticsMetrics;

  clicks:
    AnalyticsEventCountSet;

  conversions:
    ConversionAnalyticsMetrics;

  conversionRateDenominator:
    ConversionRateDenominator;
}

export function calculateRateMetrics(
  input:
    CalculateRateMetricsInput
): AnalyticsRateMetrics {
  return {
    ctrPercentage:
      calculateCtrPercentage(
        input.clicks.valid,
        input.impressions
          .qualified
      ),

    conversionRatePercentage:
      calculateConversionRatePercentage(
        input.conversions,
        input.clicks.valid,
        input.impressions
          .qualified,
        input
          .conversionRateDenominator
      ),

    conversionRateDenominator:
      input
        .conversionRateDenominator,
  };
}

export function calculateAverageWatchMilliseconds(
  totalWatchMilliseconds:
    number,
  qualifiedViews:
    number
): number | null {
  if (
    !Number.isFinite(
      totalWatchMilliseconds
    ) ||
    !Number.isFinite(
      qualifiedViews
    ) ||
    totalWatchMilliseconds <
      0 ||
    qualifiedViews <= 0
  ) {
    return null;
  }

  return Math.round(
    totalWatchMilliseconds /
      qualifiedViews
  );
}

export function normalizeVideoMetrics(
  metrics:
    Omit<
      VideoAnalyticsMetrics,
      "averageWatchMilliseconds"
    >
): VideoAnalyticsMetrics {
  return {
    ...metrics,

    averageWatchMilliseconds:
      calculateAverageWatchMilliseconds(
        metrics
          .totalWatchMilliseconds,
        metrics.qualifiedViews
      ),
  };
}

export function calculateDeliveryPercentage(
  delivered:
    number,
  deliveryTarget:
    number |
    undefined
): number | null {
  if (
    deliveryTarget ===
      undefined ||
    !Number.isFinite(
      deliveryTarget
    ) ||
    deliveryTarget <= 0
  ) {
    return null;
  }

  return calculatePercentage(
    delivered,
    deliveryTarget
  );
}

export function calculateDeliveryRemaining(
  delivered:
    number,
  deliveryTarget:
    number |
    undefined
): number | undefined {
  if (
    deliveryTarget ===
      undefined ||
    !Number.isFinite(
      deliveryTarget
    ) ||
    deliveryTarget < 0
  ) {
    return undefined;
  }

  return Math.max(
    deliveryTarget -
      delivered,
    0
  );
}

export function calculatePacingPercentage(
  deliveryPercentage:
    number |
    null,
  scheduleProgressPercentage:
    number |
    null
): number | null {
  if (
    deliveryPercentage ===
      null ||
    scheduleProgressPercentage ===
      null ||
    scheduleProgressPercentage <=
      0
  ) {
    return null;
  }

  return (
    deliveryPercentage /
    scheduleProgressPercentage
  ) * 100;
}

export interface CalculateDeliveryMetricsInput {
  deliveryTarget?:
    number;

  delivered:
    number;

  scheduleProgressPercentage?:
    number;

  daysElapsed?:
    number;

  daysRemaining?:
    number;

  underDeliveryThresholdPercentage?:
    number;

  overDeliveryThresholdPercentage?:
    number;
}

export function calculateDeliveryMetrics(
  input:
    CalculateDeliveryMetricsInput
): AnalyticsDeliveryMetrics {
  const deliveryPercentage =
    calculateDeliveryPercentage(
      input.delivered,
      input.deliveryTarget
    );

  const scheduleProgressPercentage =
    input.scheduleProgressPercentage ??
    null;

  const pacingPercentage =
    calculatePacingPercentage(
      deliveryPercentage,
      scheduleProgressPercentage
    );

  const underDeliveryThreshold =
    input
      .underDeliveryThresholdPercentage ??
    90;

  const overDeliveryThreshold =
    input
      .overDeliveryThresholdPercentage ??
    110;

  return {
    deliveryTarget:
      input.deliveryTarget,

    delivered:
      Math.max(
        input.delivered,
        0
      ),

    remaining:
      calculateDeliveryRemaining(
        input.delivered,
        input.deliveryTarget
      ),

    deliveryPercentage,

    pacingPercentage,

    daysElapsed:
      input.daysElapsed,

    daysRemaining:
      input.daysRemaining,

    underDelivering:
      pacingPercentage !==
        null &&
      pacingPercentage <
        underDeliveryThreshold,

    overDelivering:
      pacingPercentage !==
        null &&
      pacingPercentage >
        overDeliveryThreshold,
  };
}

export function calculateScheduleProgressPercentage(
  startAt:
    string,
  endAt:
    string,
  currentAt:
    string
): number | null {
  const start =
    new Date(
      startAt
    ).getTime();

  const end =
    new Date(
      endAt
    ).getTime();

  const current =
    new Date(
      currentAt
    ).getTime();

  if (
    Number.isNaN(
      start
    ) ||
    Number.isNaN(
      end
    ) ||
    Number.isNaN(
      current
    ) ||
    end <= start
  ) {
    return null;
  }

  if (
    current <= start
  ) {
    return 0;
  }

  if (
    current >= end
  ) {
    return 100;
  }

  return (
    (
      current -
      start
    ) /
    (
      end -
      start
    )
  ) * 100;
}

export function calculateInclusiveDayDifference(
  startAt:
    string,
  endAt:
    string
): number | null {
  const start =
    new Date(
      startAt
    );

  const end =
    new Date(
      endAt
    );

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return null;
  }

  const differenceMilliseconds =
    end.getTime() -
    start.getTime();

  if (
    differenceMilliseconds <
    0
  ) {
    return null;
  }

  return (
    Math.floor(
      differenceMilliseconds /
        86_400_000
    ) +
    1
  );
}

export function calculateFinancialBalanceMinor(
  paidAmountMinor:
    number,
  finalizedSpendMinor:
    number,
  invalidTrafficCreditMinor:
    number,
  adjustmentMinor:
    number,
  refundedAmountMinor:
    number
): number {
  return (
    paidAmountMinor -
    finalizedSpendMinor +
    invalidTrafficCreditMinor +
    adjustmentMinor -
    refundedAmountMinor
  );
}

export function normalizeFinancialMetrics(
  metrics:
    AnalyticsFinancialMetrics
): AnalyticsFinancialMetrics {
  return {
    currency:
      metrics.currency,

    estimatedSpendMinor:
      Math.max(
        metrics
          .estimatedSpendMinor,
        0
      ),

    pendingValidationSpendMinor:
      Math.max(
        metrics
          .pendingValidationSpendMinor,
        0
      ),

    finalizedSpendMinor:
      Math.max(
        metrics
          .finalizedSpendMinor,
        0
      ),

    invalidTrafficCreditMinor:
      Math.max(
        metrics
          .invalidTrafficCreditMinor,
        0
      ),

    adjustmentMinor:
      metrics.adjustmentMinor,

    reconciledSpendMinor:
      Math.max(
        metrics
          .reconciledSpendMinor,
        0
      ),
  };
}

export function sumEventCountSets(
  values:
    AnalyticsEventCountSet[]
): AnalyticsEventCountSet {
  return values.reduce<AnalyticsEventCountSet>(
    (
      total,
      current
    ) => ({
      raw:
        total.raw +
        current.raw,

      pendingValidation:
        total
          .pendingValidation +
        current
          .pendingValidation,

      valid:
        total.valid +
        current.valid,

      invalid:
        total.invalid +
        current.invalid,

      duplicate:
        total.duplicate +
        current.duplicate,

      finalized:
        total.finalized +
        current.finalized,
    }),
    {
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
    }
  );
}

export function sumFinancialMetrics(
  values:
    AnalyticsFinancialMetrics[],
  currency:
    string
): AnalyticsFinancialMetrics {
  return values.reduce<AnalyticsFinancialMetrics>(
    (
      total,
      current
    ) => {
      if (
        current.currency !==
        currency
      ) {
        throw new Error(
          "Cannot combine analytics financial metrics with different currencies."
        );
      }

      return {
        currency,

        estimatedSpendMinor:
          total
            .estimatedSpendMinor +
          current
            .estimatedSpendMinor,

        pendingValidationSpendMinor:
          total
            .pendingValidationSpendMinor +
          current
            .pendingValidationSpendMinor,

        finalizedSpendMinor:
          total
            .finalizedSpendMinor +
          current
            .finalizedSpendMinor,

        invalidTrafficCreditMinor:
          total
            .invalidTrafficCreditMinor +
          current
            .invalidTrafficCreditMinor,

        adjustmentMinor:
          total
            .adjustmentMinor +
          current
            .adjustmentMinor,

        reconciledSpendMinor:
          total
            .reconciledSpendMinor +
          current
            .reconciledSpendMinor,
      };
    },
    {
      currency,

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
    }
  );
}
