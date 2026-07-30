import type {
  ExternalPromotionDraft,
  ExternalPromotionErrors,
} from "./external-promotion.types";

export const EMPTY_EXTERNAL_PROMOTION_DRAFT:
  ExternalPromotionDraft = {
  programId: "",

  name: "",
  externalOfferId: "",

  offerType: "physical_product",
  conversionGoal: "sale",

  category: "",

  headline: "",
  description: "",
  callToAction: "Learn more",

  mediaType: "image",
  mediaUrl: "",

  destinationUrl: "",
  trackingUrl: "",
  referralCode: "",

  disclosure:
    "Affiliate · Poster may earn a commission when users complete an eligible action through this link.",

  placements: ["home"],

  startDate: "",
  endDate: "",

  status: "draft",

  notes: "",
};

function isValidRequiredUrl(
  value: string
) {
  if (!value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function isValidOptionalUrl(
  value: string
) {
  if (!value.trim()) {
    return true;
  }

  return isValidRequiredUrl(value);
}

export function validateExternalPromotion(
  draft: ExternalPromotionDraft
) {
  const errors:
    ExternalPromotionErrors = {};

  if (!draft.programId) {
    errors.programId =
      "Select an approved external program.";
  }

  if (!draft.name.trim()) {
    errors.name =
      "Promotion name is required.";
  }

  if (!draft.category.trim()) {
    errors.category =
      "Category is required.";
  }

  if (!draft.headline.trim()) {
    errors.headline =
      "Headline is required.";
  }

  if (!draft.description.trim()) {
    errors.description =
      "Description is required.";
  }

  if (!draft.callToAction.trim()) {
    errors.callToAction =
      "Call to action is required.";
  }

  if (
    draft.mediaType !== "none" &&
    !isValidRequiredUrl(
      draft.mediaUrl
    )
  ) {
    errors.mediaUrl =
      "Enter a valid media URL.";
  }

  if (
    !isValidRequiredUrl(
      draft.destinationUrl
    )
  ) {
    errors.destinationUrl =
      "Enter a valid destination URL.";
  }

  if (
    draft.trackingUrl &&
    !isValidOptionalUrl(
      draft.trackingUrl
    )
  ) {
    errors.trackingUrl =
      "Enter a valid tracking URL.";
  }

  if (!draft.disclosure.trim()) {
    errors.disclosure =
      "Affiliate disclosure is required.";
  }

  if (draft.placements.length === 0) {
    errors.placements =
      "Select at least one placement.";
  }

  if (
    draft.endDate &&
    draft.startDate &&
    draft.endDate < draft.startDate
  ) {
    errors.endDate =
      "End date cannot be before the start date.";
  }

  if (
    draft.status !== "draft" &&
    !draft.startDate
  ) {
    errors.startDate =
      "Scheduled or active promotions require a start date.";
  }

  return errors;
}

export function hasExternalPromotionErrors(
  errors: ExternalPromotionErrors
) {
  return Object.keys(errors).length > 0;
}
