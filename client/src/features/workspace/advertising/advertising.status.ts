import type {
  AdvertisingRequestStatus,
  CampaignEligibilityStatus,
  CampaignStatus,
} from "./advertising.types";

export function getAdvertisingRequestStatusLabel(
  status: AdvertisingRequestStatus
): string {
  switch (status) {
    case "draft":
      return "Draft";

    case "pending_review":
      return "Pending review";

    case "changes_requested":
      return "Changes requested";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "withdrawn":
      return "Withdrawn";

    case "expired":
      return "Expired";
  }
}

export function getCampaignStatusLabel(
  status: CampaignStatus
): string {
  switch (status) {
    case "draft":
      return "Draft";

    case "payment_pending":
      return "Payment pending";

    case "scheduled":
      return "Scheduled";

    case "active":
      return "Active";

    case "paused":
      return "Paused";

    case "ended":
      return "Ended";

    case "disabled":
      return "Disabled";

    case "cancelled":
      return "Cancelled";
  }
}

export function getCampaignEligibilityStatusLabel(
  status: CampaignEligibilityStatus
): string {
  switch (status) {
    case "not_ready":
      return "Not ready";

    case "awaiting_review":
      return "Awaiting review";

    case "awaiting_payment":
      return "Awaiting payment";

    case "eligible":
      return "Eligible to run";

    case "blocked":
      return "Blocked";
  }
}

const REQUEST_TRANSITIONS: Record<
  AdvertisingRequestStatus,
  readonly AdvertisingRequestStatus[]
> = {
  draft: [
    "pending_review",
    "withdrawn",
  ],

  pending_review: [
    "changes_requested",
    "approved",
    "rejected",
    "withdrawn",
    "expired",
  ],

  changes_requested: [
    "pending_review",
    "withdrawn",
    "expired",
  ],

  approved: [
    "expired",
  ],

  rejected: [],

  withdrawn: [],

  expired: [],
};

const CAMPAIGN_TRANSITIONS: Record<
  CampaignStatus,
  readonly CampaignStatus[]
> = {
  draft: [
    "payment_pending",
    "scheduled",
    "cancelled",
    "disabled",
  ],

  payment_pending: [
    "scheduled",
    "cancelled",
    "disabled",
  ],

  scheduled: [
    "active",
    "paused",
    "cancelled",
    "disabled",
  ],

  active: [
    "paused",
    "ended",
    "disabled",
  ],

  paused: [
    "active",
    "ended",
    "disabled",
    "cancelled",
  ],

  ended: [],

  disabled: [],

  cancelled: [],
};

export function canTransitionAdvertisingRequest(
  currentStatus: AdvertisingRequestStatus,
  nextStatus: AdvertisingRequestStatus
): boolean {
  return REQUEST_TRANSITIONS[
    currentStatus
  ].includes(
    nextStatus
  );
}

export function canTransitionCampaign(
  currentStatus: CampaignStatus,
  nextStatus: CampaignStatus
): boolean {
  return CAMPAIGN_TRANSITIONS[
    currentStatus
  ].includes(
    nextStatus
  );
}

export interface CampaignEligibilityInput {
  requestApproved: boolean;

  creativeApproved: boolean;

  paymentRequired: boolean;

  paymentVerified: boolean;

  trackingRequired: boolean;

  trackingReady: boolean;

  blocked: boolean;
}

export function determineCampaignEligibility(
  input: CampaignEligibilityInput
): CampaignEligibilityStatus {
  if (
    input.blocked
  ) {
    return "blocked";
  }

  if (
    !input.requestApproved ||
    !input.creativeApproved
  ) {
    return "awaiting_review";
  }

  if (
    input.paymentRequired &&
    !input.paymentVerified
  ) {
    return "awaiting_payment";
  }

  if (
    input.trackingRequired &&
    !input.trackingReady
  ) {
    return "not_ready";
  }

  return "eligible";
}

export function isCampaignOperational(
  status: CampaignStatus
): boolean {
  return (
    status === "scheduled" ||
    status === "active" ||
    status === "paused"
  );
}

export function isCampaignTerminal(
  status: CampaignStatus
): boolean {
  return (
    status === "ended" ||
    status === "disabled" ||
    status === "cancelled"
  );
}
