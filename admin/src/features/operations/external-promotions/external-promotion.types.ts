export type ExternalPromotionStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "ended";

export type ExternalPromotionPlacement =
  | "home"
  | "search"
  | "trending";

export type ExternalPromotionOfferType =
  | "physical_product"
  | "digital_product"
  | "subscription"
  | "service"
  | "lead"
  | "booking"
  | "installation"
  | "application"
  | "app_install"
  | "custom";

export type ExternalPromotionConversionGoal =
  | "sale"
  | "lead"
  | "qualified_lead"
  | "signup"
  | "trial_started"
  | "subscription"
  | "service_purchase"
  | "booking"
  | "installation_completed"
  | "application_submitted"
  | "app_installed"
  | "custom";

export type ExternalPromotionMediaType =
  | "image"
  | "video"
  | "none";

export interface ExternalPromotionAuditEntry {
  id: string;

  action:
    | "created"
    | "updated"
    | "scheduled"
    | "activated"
    | "paused"
    | "resumed"
    | "ended";

  message: string;
  actor: string;
  occurredAt: string;
}

export interface ExternalPromotionMetrics {
  impressions: number;
  validClicks: number;
  conversions: number;
}

export interface ExternalPromotionRecord {
  id: string;

  programId: string;

  name: string;
  externalOfferId: string;

  offerType: ExternalPromotionOfferType;
  conversionGoal:
    ExternalPromotionConversionGoal;

  category: string;

  headline: string;
  description: string;
  callToAction: string;

  mediaType: ExternalPromotionMediaType;
  mediaUrl: string;

  destinationUrl: string;
  trackingUrl: string;
  referralCode: string;

  disclosure: string;

  placements:
    ExternalPromotionPlacement[];

  startDate: string;
  endDate: string;

  status: ExternalPromotionStatus;

  metrics: ExternalPromotionMetrics;

  notes: string;

  createdAt: string;
  updatedAt: string;

  auditHistory:
    ExternalPromotionAuditEntry[];
}

export interface ExternalPromotionDraft {
  programId: string;

  name: string;
  externalOfferId: string;

  offerType: ExternalPromotionOfferType;
  conversionGoal:
    ExternalPromotionConversionGoal;

  category: string;

  headline: string;
  description: string;
  callToAction: string;

  mediaType: ExternalPromotionMediaType;
  mediaUrl: string;

  destinationUrl: string;
  trackingUrl: string;
  referralCode: string;

  disclosure: string;

  placements:
    ExternalPromotionPlacement[];

  startDate: string;
  endDate: string;

  status: ExternalPromotionStatus;

  notes: string;
}

export type ExternalPromotionErrors =
  Partial<
    Record<
      keyof ExternalPromotionDraft,
      string
    >
  >;
