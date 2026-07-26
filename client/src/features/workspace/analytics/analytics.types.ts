import type {
  AdvertisingRequestId,
  CampaignId,
  CreativeLayout,
  OrganizationId,
  PlacementSurface,
} from "../advertising/advertising.types";

import type {
  CreativeAssetId,
  CreativeId,
  CreativeMediaType,
  CreativeVersionId,
  SlidingCardSlot,
} from "../media/media.types";

/**
 * Canonical advertising analytics contracts.
 *
 * These contracts are shared conceptually across:
 *
 * - Mobile App event production
 * - Backend ingestion and validation
 * - Analytics aggregation
 * - Admin reconciliation
 * - Client advertiser reporting
 *
 * Client Web App must display Backend-authoritative aggregates.
 * It must never independently determine chargeable activity.
 */

export type AnalyticsEventId =
  `EVT-${string}`;

export type AnalyticsAggregationId =
  `AGG-${string}`;

export type AnalyticsAdjustmentId =
  `ADJ-${string}`;

export type PlacementId =
  `PLC-${string}`;

export type PseudonymousSessionId =
  `SES-${string}`;

export type PseudonymousUserId =
  `USR-${string}`;

export type ConversionId =
  `CNV-${string}`;

export type AnalyticsEventType =
  | "impression_candidate"
  | "qualified_impression"
  | "click"
  | "cta_click"
  | "video_start"
  | "video_25"
  | "video_50"
  | "video_75"
  | "video_complete"
  | "conversion"
  | "conversion_reversal";

export type AnalyticsEventSource =
  | "mobile_app"
  | "client_web"
  | "admin_web"
  | "backend"
  | "partner_api";

export type AnalyticsPlatform =
  | "android"
  | "ios"
  | "web"
  | "unknown";

export type AnalyticsEnvironment =
  | "production"
  | "staging"
  | "development"
  | "test";

export type AnalyticsValidationStatus =
  | "received"
  | "schema_rejected"
  | "pending_validation"
  | "duplicate"
  | "invalid"
  | "valid"
  | "finalized";

export type InvalidTrafficReason =
  | "duplicate_event"
  | "bot_or_automation"
  | "internal_traffic"
  | "test_traffic"
  | "invalid_campaign"
  | "inactive_campaign"
  | "invalid_creative"
  | "invalid_placement"
  | "invalid_session"
  | "excessive_frequency"
  | "suspicious_click_pattern"
  | "viewability_not_met"
  | "timestamp_out_of_range"
  | "conversion_duplicate"
  | "conversion_outside_window"
  | "conversion_reversed"
  | "other";

export type AnalyticsProcessingStage =
  | "live_estimate"
  | "processing"
  | "finalized"
  | "adjusted"
  | "reconciled";

export type AnalyticsDataFreshnessStatus =
  | "live"
  | "recent"
  | "delayed"
  | "stale"
  | "unavailable";

export type AnalyticsMetricAvailability =
  | "available"
  | "not_tracked"
  | "processing"
  | "unavailable";

export type ConversionAttributionModel =
  | "last_valid_click"
  | "last_valid_impression"
  | "partner_reported";

export type ConversionRateDenominator =
  | "valid_clicks"
  | "valid_impressions";

export type ImpressionQualificationStandard =
  | "display_50_percent_1_second"
  | "video_50_percent_2_seconds"
  | "backend_confirmed";

export type AnalyticsAggregationWindow =
  | "hour"
  | "day"
  | "7d"
  | "30d"
  | "all";

export type AnalyticsBreakdownDimension =
  | "campaign"
  | "placement"
  | "creative"
  | "creative_version"
  | "media_asset"
  | "surface"
  | "format"
  | "card_position"
  | "platform"
  | "region"
  | "date";

export interface AnalyticsDeviceContext {
  platform:
    AnalyticsPlatform;

  appVersion?: string;

  operatingSystemVersion?: string;

  deviceCategory?:
    | "phone"
    | "tablet"
    | "desktop"
    | "unknown";
}

export interface AnalyticsLocationContext {
  /**
   * Privacy-safe regional value only.
   *
   * Do not store precise user location in advertising analytics.
   */
  countryCode?: string;

  regionCode?: string;

  timezone?: string;
}

export interface AnalyticsViewability {
  visiblePercentage?: number;

  continuousVisibleMilliseconds?: number;

  qualificationStandard?:
    ImpressionQualificationStandard;

  qualified?: boolean;
}

export interface AnalyticsVideoProgress {
  durationMilliseconds?: number;

  watchedMilliseconds?: number;

  progressPercentage?: number;

  muted?: boolean;

  autoplay?: boolean;
}

export interface AnalyticsDestinationReference {
  destinationUrlHash?: string;

  destinationDomain?: string;

  callToAction?: string;
}

export interface AdvertisingAnalyticsEvent {
  eventId:
    AnalyticsEventId;

  eventType:
    AnalyticsEventType;

  source:
    AnalyticsEventSource;

  environment:
    AnalyticsEnvironment;

  occurredAt:
    string;

  receivedAt:
    string;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaignId:
    CampaignId;

  placementId:
    PlacementId;

  creativeId:
    CreativeId;

  creativeVersionId:
    CreativeVersionId;

  mediaAssetId?:
    CreativeAssetId;

  surface:
    PlacementSurface;

  format:
    CreativeLayout;

  mediaType?:
    CreativeMediaType;

  cardPosition?:
    SlidingCardSlot;

  pseudonymousSessionId:
    PseudonymousSessionId;

  pseudonymousUserId?:
    PseudonymousUserId;

  conversionId?:
    ConversionId;

  device:
    AnalyticsDeviceContext;

  location?:
    AnalyticsLocationContext;

  viewability?:
    AnalyticsViewability;

  video?:
    AnalyticsVideoProgress;

  destination?:
    AnalyticsDestinationReference;

  isTest:
    boolean;

  isInternal:
    boolean;

  validationStatus:
    AnalyticsValidationStatus;

  invalidTrafficReason?:
    InvalidTrafficReason;

  idempotencyKey:
    string;
}

export interface AnalyticsEventCountSet {
  raw: number;

  pendingValidation: number;

  valid: number;

  invalid: number;

  duplicate: number;

  finalized: number;
}

export interface ImpressionAnalyticsMetrics
  extends AnalyticsEventCountSet {
  qualified: number;

  viewabilityRejected: number;
}

export interface ClickAnalyticsMetrics
  extends AnalyticsEventCountSet {
  ctaClicks: number;

  suspiciousRejected: number;
}

export interface VideoAnalyticsMetrics {
  starts: number;

  qualifiedViews: number;

  quartile25: number;

  quartile50: number;

  quartile75: number;

  completed: number;

  totalWatchMilliseconds: number;

  averageWatchMilliseconds: number | null;
}

export interface ConversionAnalyticsMetrics {
  availability:
    AnalyticsMetricAvailability;

  raw: number;

  pendingValidation: number;

  attributed: number;

  duplicate: number;

  rejected: number;

  reversed: number;

  finalized: number;
}

export interface AnalyticsRateMetrics {
  /**
   * CTR uses valid clicks divided by valid qualified impressions.
   */
  ctrPercentage: number | null;

  conversionRatePercentage:
    number | null;

  conversionRateDenominator:
    ConversionRateDenominator;
}

export interface AnalyticsFinancialMetrics {
  currency:
    string;

  estimatedSpendMinor:
    number;

  pendingValidationSpendMinor:
    number;

  finalizedSpendMinor:
    number;

  invalidTrafficCreditMinor:
    number;

  adjustmentMinor:
    number;

  reconciledSpendMinor:
    number;
}

export interface AnalyticsDeliveryMetrics {
  deliveryTarget?:
    number;

  delivered:
    number;

  remaining?:
    number;

  deliveryPercentage:
    number | null;

  pacingPercentage:
    number | null;

  daysElapsed?:
    number;

  daysRemaining?:
    number;

  underDelivering:
    boolean;

  overDelivering:
    boolean;
}

export interface AnalyticsQualitySummary {
  stage:
    AnalyticsProcessingStage;

  freshnessStatus:
    AnalyticsDataFreshnessStatus;

  aggregationVersion:
    number;

  generatedAt:
    string;

  dataThrough:
    string;

  finalizedThrough?:
    string;

  lastAdjustedAt?:
    string;

  lastReconciledAt?:
    string;

  warningMessages:
    string[];
}

export interface AnalyticsAttributionConfiguration {
  model:
    ConversionAttributionModel;

  clickWindowHours?:
    number;

  impressionWindowHours?:
    number;

  timezone:
    string;

  conversionDefinition?:
    string;
}

export interface CampaignAnalyticsSnapshot {
  aggregationId:
    AnalyticsAggregationId;

  organizationId:
    OrganizationId;

  campaignId:
    CampaignId;

  window:
    AnalyticsAggregationWindow;

  windowStart:
    string;

  windowEnd:
    string;

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

  delivery:
    AnalyticsDeliveryMetrics;

  financials:
    AnalyticsFinancialMetrics;

  attribution:
    AnalyticsAttributionConfiguration;

  quality:
    AnalyticsQualitySummary;
}

export interface AnalyticsBreakdownKey {
  dimension:
    AnalyticsBreakdownDimension;

  campaignId?:
    CampaignId;

  placementId?:
    PlacementId;

  creativeId?:
    CreativeId;

  creativeVersionId?:
    CreativeVersionId;

  mediaAssetId?:
    CreativeAssetId;

  surface?:
    PlacementSurface;

  format?:
    CreativeLayout;

  cardPosition?:
    SlidingCardSlot;

  platform?:
    AnalyticsPlatform;

  countryCode?:
    string;

  date?:
    string;
}

export interface AnalyticsBreakdownRow {
  key:
    AnalyticsBreakdownKey;

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
}

export interface AnalyticsReport {
  organizationId:
    OrganizationId;

  window:
    AnalyticsAggregationWindow;

  windowStart:
    string;

  windowEnd:
    string;

  campaignSnapshots:
    CampaignAnalyticsSnapshot[];

  breakdowns:
    AnalyticsBreakdownRow[];

  quality:
    AnalyticsQualitySummary;
}

export type AnalyticsAdjustmentType =
  | "invalid_traffic_credit"
  | "manual_metric_correction"
  | "conversion_reversal"
  | "billing_reconciliation"
  | "contract_adjustment";

export interface AnalyticsAdjustment {
  adjustmentId:
    AnalyticsAdjustmentId;

  organizationId:
    OrganizationId;

  campaignId:
    CampaignId;

  type:
    AnalyticsAdjustmentType;

  metricName:
    string;

  countDelta?:
    number;

  amountDeltaMinor?:
    number;

  currency?:
    string;

  reason:
    string;

  sourceReference?:
    string;

  createdByActorId:
    string;

  occurredAt:
    string;

  appliedAt:
    string;
}
