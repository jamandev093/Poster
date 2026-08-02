import type {
  CampaignPlacement,
  CampaignStatus,
} from "../campaigns/campaign-api";

export function formatDirectSponsorshipStatus(
  status:
    CampaignStatus
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

export function formatDirectSponsorshipPlacement(
  placement:
    CampaignPlacement
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

export function formatDirectSponsorshipPlacements(
  placements:
    readonly CampaignPlacement[]
): string {
  if (
    placements.length ===
    0
  ) {
    return "No placement";
  }

  return placements
    .map(
      formatDirectSponsorshipPlacement
    )
    .join(
      ", "
    );
}

export function formatDirectSponsorshipDate(
  value:
    string
): string {
  const parsed =
    new Date(
      `${value}T00:00:00`
    );

  if (
    !Number.isFinite(
      parsed.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",
    }
  ).format(
    parsed
  );
}