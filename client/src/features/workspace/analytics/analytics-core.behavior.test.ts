import { describe, expect, it } from "vitest";

import {
  aggregateBreakdownRows,
  aggregateConversionMetrics,
} from "./analytics.aggregation";

import {
  calculateAverageWatchMilliseconds,
  calculateCtrPercentage,
  calculateDeliveryMetrics,
  calculateFinancialBalanceMinor,
  calculateInclusiveDayDifference,
  calculatePercentage,
  calculateScheduleProgressPercentage,
  normalizeFinancialMetrics,
  sumEventCountSets,
  sumFinancialMetrics,
} from "./analytics.metrics";

import {
  createAnalyticsQualitySummary,
  determineAnalyticsFreshnessStatus,
  determineMetricAvailability,
  determineProcessingStage,
  evaluateCampaignAnalyticsQuality,
} from "./analytics.quality";

import type {
  AnalyticsBreakdownRow,
  AnalyticsEventCountSet,
  AnalyticsFinancialMetrics,
  CampaignAnalyticsSnapshot,
  ConversionAnalyticsMetrics,
} from "./analytics.types";

function conversion(
  overrides: Partial<ConversionAnalyticsMetrics> = {}
): ConversionAnalyticsMetrics {
  return {
    availability: "available",
    raw: 3,
    pendingValidation: 0,
    attributed: 2,
    duplicate: 0,
    rejected: 1,
    reversed: 0,
    finalized: 2,
    ...overrides,
  };
}

function financial(
  overrides: Partial<AnalyticsFinancialMetrics> = {}
): AnalyticsFinancialMetrics {
  return {
    currency: "INR",
    estimatedSpendMinor: 10000,
    pendingValidationSpendMinor: 1000,
    finalizedSpendMinor: 8000,
    invalidTrafficCreditMinor: 500,
    adjustmentMinor: 0,
    reconciledSpendMinor: 8000,
    ...overrides,
  };
}

function breakdownRow(
  spend: number
): AnalyticsBreakdownRow {
  return {
    key: {
      dimension: "campaign",
      campaignId: "CMP-1",
    },

    impressions: {
      raw: 100,
      pendingValidation: 0,
      valid: 90,
      invalid: 5,
      duplicate: 5,
      finalized: 90,
      qualified: 80,
      viewabilityRejected: 5,
    },

    clicks: {
      raw: 10,
      pendingValidation: 0,
      valid: 8,
      invalid: 1,
      duplicate: 1,
      finalized: 8,
      ctaClicks: 5,
      suspiciousRejected: 1,
    },

    video: {
      starts: 5,
      qualifiedViews: 4,
      quartile25: 4,
      quartile50: 3,
      quartile75: 2,
      completed: 1,
      totalWatchMilliseconds: 4000,
      averageWatchMilliseconds: 1000,
    },

    conversions: conversion(),

    rates: {
      ctrPercentage: 10,
      conversionRatePercentage: 25,
      conversionRateDenominator: "valid_clicks",
    },

    financials: financial({
      finalizedSpendMinor: spend,
    }),
  } as unknown as AnalyticsBreakdownRow;
}

function snapshot(): CampaignAnalyticsSnapshot {
  return {
    aggregationId: "AGG-1",
    organizationId: "ORG-1",
    campaignId: "CMP-1",
    window: "30d",
    windowStart: "2026-07-16T00:00:00.000Z",
    windowEnd: "2026-08-14T00:00:00.000Z",

    impressions: {
      raw: 100,
      pendingValidation: 0,
      valid: 90,
      invalid: 5,
      duplicate: 5,
      finalized: 90,
      qualified: 80,
      viewabilityRejected: 5,
    },

    clicks: {
      raw: 10,
      pendingValidation: 0,
      valid: 8,
      invalid: 1,
      duplicate: 1,
      finalized: 8,
      ctaClicks: 5,
      suspiciousRejected: 1,
    },

    video: {
      starts: 5,
      qualifiedViews: 4,
      quartile25: 4,
      quartile50: 3,
      quartile75: 2,
      completed: 1,
      totalWatchMilliseconds: 4000,
      averageWatchMilliseconds: 1000,
    },

    conversions: conversion(),

    rates: {
      ctrPercentage: 10,
      conversionRatePercentage: 25,
      conversionRateDenominator: "valid_clicks",
    },

    delivery: {
      deliveryTarget: 1000,
      delivered: 100,
      remaining: 900,
      deliveryPercentage: 10,
      pacingPercentage: 100,
      underDelivering: false,
      overDelivering: false,
    },

    financials: financial(),

    attribution: {
      model: "last_valid_click",
      clickWindowHours: 24,
      timezone: "UTC",
    },

    quality: {
      stage: "reconciled",
      freshnessStatus: "live",
      aggregationVersion: 1,
      generatedAt: "2026-08-14T00:00:00.000Z",
      dataThrough: "2026-08-14T00:00:00.000Z",
      lastReconciledAt: "2026-08-14T00:00:00.000Z",
      warningMessages: [],
    },
  } as unknown as CampaignAnalyticsSnapshot;
}

describe("analytics calculations and aggregation", () => {
  it("calculates rate delivery date and financial boundaries", () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(25, 0)).toBeNull();
    expect(calculateCtrPercentage(8, 80)).toBe(10);
    expect(calculateAverageWatchMilliseconds(4000, 4)).toBe(
      1000
    );
    expect(calculateAverageWatchMilliseconds(4000, 0)).toBeNull();

    expect(
      calculateScheduleProgressPercentage(
        "2026-08-01T00:00:00.000Z",
        "2026-08-11T00:00:00.000Z",
        "2026-08-06T00:00:00.000Z"
      )
    ).toBe(50);

    expect(
      calculateInclusiveDayDifference(
        "2026-08-14T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z"
      )
    ).toBe(1);

    expect(
      calculateFinancialBalanceMinor(
        10000,
        3000,
        200,
        100,
        500
      )
    ).toBe(6800);

    const delivery = calculateDeliveryMetrics({
      deliveryTarget: 1000,
      delivered: 400,
      scheduleProgressPercentage: 50,
    });

    expect(delivery.deliveryPercentage).toBe(40);
    expect(delivery.pacingPercentage).toBe(80);
    expect(delivery.underDelivering).toBe(true);
  });

  it("combines event financial and conversion metrics safely", () => {
    const event: AnalyticsEventCountSet = {
      raw: 10,
      pendingValidation: 1,
      valid: 7,
      invalid: 1,
      duplicate: 1,
      finalized: 7,
    };

    const combined = sumEventCountSets([event, event]);

    expect(combined.raw).toBe(20);
    expect(combined.finalized).toBe(14);

    expect(
      normalizeFinancialMetrics(
        financial({
          estimatedSpendMinor: -10,
          finalizedSpendMinor: -20,
        })
      ).finalizedSpendMinor
    ).toBe(0);

    expect(
      sumFinancialMetrics(
        [
          financial({ finalizedSpendMinor: 100 }),
          financial({ finalizedSpendMinor: 200 }),
        ],
        "INR"
      ).finalizedSpendMinor
    ).toBe(300);

    expect(() =>
      sumFinancialMetrics(
        [
          financial(),
          financial({
            currency: "USD",
          }),
        ],
        "INR"
      )
    ).toThrow(
      "Cannot combine analytics financial metrics with different currencies."
    );

    expect(
      aggregateConversionMetrics([
        conversion({
          finalized: 2,
        }),
        conversion({
          raw: 4,
          attributed: 3,
          finalized: 3,
        }),
      ]).finalized
    ).toBe(5);

    expect(
      aggregateConversionMetrics([
        conversion({
          availability: "processing",
        }),
        conversion(),
      ]).availability
    ).toBe("processing");
  });

  it("groups matching breakdown rows", () => {
    const result = aggregateBreakdownRows({
      rows: [
        breakdownRow(100),
        breakdownRow(200),
      ],
      conversionRateDenominator: "valid_clicks",
      currency: "INR",
    });

    expect(result).toHaveLength(1);
    expect(result[0].impressions.raw).toBe(200);
    expect(result[0].clicks.valid).toBe(16);
    expect(
      result[0].financials.finalizedSpendMinor
    ).toBe(300);
  });
});

describe("analytics quality behavior", () => {
  it("derives availability freshness processing and summary state", () => {
    expect(
      determineMetricAvailability(false, false, false)
    ).toBe("not_tracked");

    expect(
      determineMetricAvailability(true, true, true)
    ).toBe("processing");

    expect(
      determineAnalyticsFreshnessStatus(
        "2026-08-14T00:00:00.000Z",
        "2026-08-14T00:04:00.000Z"
      )
    ).toBe("live");

    expect(
      determineProcessingStage({
        reconciledAt: "2026-08-14T00:00:00.000Z",
        processing: false,
      })
    ).toBe("reconciled");

    expect(
      createAnalyticsQualitySummary({
        aggregationVersion: 1,
        generatedAt: "2026-08-14T00:00:00.000Z",
        dataThrough: "2026-08-14T00:00:00.000Z",
        currentAt: "2026-08-14T00:04:00.000Z",
        processing: false,
      }).freshnessStatus
    ).toBe("live");
  });

  it("accepts a consistent analytics snapshot", () => {
    const result = evaluateCampaignAnalyticsQuality(
      snapshot()
    );

    expect(result.valid).toBe(true);
    expect(
      result.issues.filter(
        issue => issue.severity === "error"
      )
    ).toEqual([]);
  });

  it("detects count conversion video and financial conflicts", () => {
    const broken = {
      ...snapshot(),
      aggregationId: "BAD",
      windowStart: "2026-08-15T00:00:00.000Z",
      windowEnd: "2026-08-14T00:00:00.000Z",

      impressions: {
        ...snapshot().impressions,
        valid: 2,
        qualified: 3,
      },

      conversions: {
        ...conversion(),
        availability: "unavailable",
        raw: 2,
        finalized: 1,
      },

      video: {
        ...snapshot().video,
        qualifiedViews: 2,
        quartile25: 3,
      },

      financials: {
        ...financial(),
        currency: "",
      },
    } as unknown as CampaignAnalyticsSnapshot;

    const result = evaluateCampaignAnalyticsQuality(broken);
    const codes = result.issues.map(issue => issue.code);

    expect(result.valid).toBe(false);
    expect(codes).toContain("aggregation.id.invalid");
    expect(codes).toContain("aggregation.window.invalid");
    expect(codes).toContain(
      "impressions.qualified_exceeds_valid"
    );
    expect(codes).toContain(
      "conversions.unavailable_with_values"
    );
    expect(codes).toContain("video.funnel_inconsistent");
    expect(codes).toContain("financials.currency.missing");
  });
});