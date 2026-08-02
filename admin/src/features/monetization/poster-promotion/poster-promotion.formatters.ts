import type {
  PosterPromotionApiStatus,
} from "./poster-promotion.api-types";

export function formatPosterPromotionStatus(
  status:
    PosterPromotionApiStatus
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

export function formatPosterPromotionDate(
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

export function formatPosterPromotionTimestamp(
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