import type {
  DirectSponsorshipCampaign,
  DirectSponsorshipCounts,
  DirectSponsorshipFilters,
} from "./direct-sponsorship.types";

export function getDirectSponsorshipCounts(
  campaigns:
    readonly DirectSponsorshipCampaign[]
): DirectSponsorshipCounts {
  return {
    all:
      campaigns.length,

    draft:
      campaigns.filter(
        campaign =>
          campaign.status ===
          "draft"
      ).length,

    scheduled:
      campaigns.filter(
        campaign =>
          campaign.status ===
          "scheduled"
      ).length,

    active:
      campaigns.filter(
        campaign =>
          campaign.status ===
          "active"
      ).length,

    paused:
      campaigns.filter(
        campaign =>
          campaign.status ===
          "paused"
      ).length,

    ended:
      campaigns.filter(
        campaign =>
          campaign.status ===
          "ended"
      ).length,

    disabled:
      campaigns.filter(
        campaign =>
          campaign.status ===
          "disabled"
      ).length,
  };
}

export function filterDirectSponsorships(
  campaigns:
    readonly DirectSponsorshipCampaign[],
  filters:
    DirectSponsorshipFilters
): DirectSponsorshipCampaign[] {
  const query =
    filters.query
      .trim()
      .toLowerCase();

  return campaigns.filter(
    campaign => {
      if (
        filters.status !==
          "all" &&
        campaign.status !==
          filters.status
      ) {
        return false;
      }

      if (
        !query
      ) {
        return true;
      }

      return [
        campaign.campaignReference,
        campaign.name,
        campaign.organizationId,
        campaign.sourceRequestId ??
          "",
        ...campaign.placements,
      ].some(
        value =>
          value
            .toLowerCase()
            .includes(
              query
            )
      );
    }
  );
}

export function findDirectSponsorship(
  campaigns:
    readonly DirectSponsorshipCampaign[],
  campaignId:
    string |
    null
): DirectSponsorshipCampaign | null {
  if (
    !campaignId
  ) {
    return null;
  }

  return (
    campaigns.find(
      campaign =>
        campaign.id ===
          campaignId ||
        campaign.campaignReference ===
          campaignId
    ) ??
    null
  );
}