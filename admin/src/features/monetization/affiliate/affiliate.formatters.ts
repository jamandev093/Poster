import type {
  AffiliateCampaignStatus,
  AffiliatePlacement,
} from "./affiliate.types";

export function formatAffiliateStatus(
  status:
    AffiliateCampaignStatus
): string {
  switch (
    status
  ) {
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

export function formatAffiliatePlacement(
  placement:
    AffiliatePlacement
): string {
  switch (
    placement
  ) {
    case "home":
      return "Home";

    case "search":
      return "Search";

    case "trending":
      return "Trending";
  }
}

export function formatAffiliateDate(
  value:
    string
): string {
  const parsed =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle:
        "medium",
    }
  ).format(
    parsed
  );
}

export function formatAffiliateTimestamp(
  value:
    string
): string {
  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    parsed
  );
}