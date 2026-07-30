import type {
  ExternalPromotionConversionGoal,
  ExternalPromotionMediaType,
  ExternalPromotionOfferType,
  ExternalPromotionPlacement,
  ExternalPromotionStatus,
} from "./external-promotion.types";

export const PROMOTION_STATUS_OPTIONS:
  ReadonlyArray<{
    value: ExternalPromotionStatus;
    label: string;
  }> = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "scheduled",
    label: "Scheduled",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "paused",
    label: "Paused",
  },
  {
    value: "ended",
    label: "Ended",
  },
];

export const OFFER_TYPE_OPTIONS:
  ReadonlyArray<{
    value: ExternalPromotionOfferType;
    label: string;
  }> = [
  {
    value: "physical_product",
    label: "Physical product",
  },
  {
    value: "digital_product",
    label: "Digital product",
  },
  {
    value: "subscription",
    label: "Subscription",
  },
  {
    value: "service",
    label: "Service",
  },
  {
    value: "lead",
    label: "Lead",
  },
  {
    value: "booking",
    label: "Booking",
  },
  {
    value: "installation",
    label: "Installation",
  },
  {
    value: "application",
    label: "Application",
  },
  {
    value: "app_install",
    label: "App install",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const CONVERSION_GOAL_OPTIONS:
  ReadonlyArray<{
    value: ExternalPromotionConversionGoal;
    label: string;
  }> = [
  {
    value: "sale",
    label: "Sale",
  },
  {
    value: "lead",
    label: "Lead",
  },
  {
    value: "qualified_lead",
    label: "Qualified lead",
  },
  {
    value: "signup",
    label: "Signup",
  },
  {
    value: "trial_started",
    label: "Trial started",
  },
  {
    value: "subscription",
    label: "Subscription",
  },
  {
    value: "service_purchase",
    label: "Service purchase",
  },
  {
    value: "booking",
    label: "Booking",
  },
  {
    value: "installation_completed",
    label: "Installation completed",
  },
  {
    value: "application_submitted",
    label: "Application submitted",
  },
  {
    value: "app_installed",
    label: "App installed",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const MEDIA_TYPE_OPTIONS:
  ReadonlyArray<{
    value: ExternalPromotionMediaType;
    label: string;
  }> = [
  {
    value: "image",
    label: "Image",
  },
  {
    value: "video",
    label: "Video",
  },
  {
    value: "none",
    label: "No media",
  },
];

export const PLACEMENT_OPTIONS:
  ReadonlyArray<{
    value: ExternalPromotionPlacement;
    label: string;
  }> = [
  {
    value: "home",
    label: "Home",
  },
  {
    value: "search",
    label: "Search",
  },
  {
    value: "trending",
    label: "Trending",
  },
];

export function promotionStatusLabel(
  status: ExternalPromotionStatus
) {
  return (
    PROMOTION_STATUS_OPTIONS.find(
      (option) =>
        option.value === status
    )?.label ?? status
  );
}

export function offerTypeLabel(
  type: ExternalPromotionOfferType
) {
  return (
    OFFER_TYPE_OPTIONS.find(
      (option) =>
        option.value === type
    )?.label ?? type
  );
}

export function conversionGoalLabel(
  goal: ExternalPromotionConversionGoal
) {
  return (
    CONVERSION_GOAL_OPTIONS.find(
      (option) =>
        option.value === goal
    )?.label ?? goal
  );
}

export function mediaTypeLabel(
  type: ExternalPromotionMediaType
) {
  return (
    MEDIA_TYPE_OPTIONS.find(
      (option) =>
        option.value === type
    )?.label ?? type
  );
}

export function placementLabel(
  placement: ExternalPromotionPlacement
) {
  return (
    PLACEMENT_OPTIONS.find(
      (option) =>
        option.value === placement
    )?.label ?? placement
  );
}
