import type {
  CampaignStatus,
  CommercialRequestStatus,
  CommercialRequestType,
  Placement,
  TrackingStatus,
} from "./workspace.types";

export function formatClientDate(
  value: string
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export function formatClientCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

export function formatClientNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}

export function getRequestTypeLabel(
  type: CommercialRequestType
): string {
  switch (type) {
    case "direct_sponsorship":
      return "Direct Sponsorship";

    case "affiliate":
      return "Affiliate";
  }
}

export function getCampaignTypeLabel(
  type: CommercialRequestType
): string {
  return getRequestTypeLabel(type);
}

export function getRequestStatusLabel(
  status: CommercialRequestStatus
): string {
  switch (status) {
    case "pending_review":
      return "Pending review";

    case "changes_requested":
      return "Changes requested";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";
  }
}

export function getCampaignStatusLabel(
  status: CampaignStatus
): string {
  switch (status) {
    case "draft":
      return "Draft";

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
  }
}

export function getTrackingStatusLabel(
  status: TrackingStatus
): string {
  switch (status) {
    case "connected":
      return "Connected";

    case "not_configured":
      return "Not configured";

    case "unavailable":
      return "Unavailable";
  }
}

export function getPlacementLabel(
  placement: Placement
): string {
  switch (placement) {
    case "home":
      return "Home";

    case "search":
      return "Search";

    case "trending":
      return "Trending";
  }
}