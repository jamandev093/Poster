import type {
  AffiliateCampaign,
  AffiliateCampaignStatus,
} from "./affiliate.types";

export function filterAffiliateCampaigns(
  campaigns:
    readonly AffiliateCampaign[],
  input: {
    query:
      string;

    status:
      "all" |
      AffiliateCampaignStatus;
  }
): AffiliateCampaign[] {
  const query =
    input.query
      .trim()
      .toLowerCase();

  return campaigns.filter(
    campaign => {
      if (
        input.status !==
          "all" &&
        campaign.status !==
          input.status
      ) {
        return false;
      }

      if (
        query.length ===
        0
      ) {
        return true;
      }

      return [
        campaign.id,
        campaign.campaignReference,
        campaign.name,
        campaign.placements.join(
          " "
        ),
        campaign.readinessStatus,
        campaign.commercialStatus,
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

export function countAffiliateStatuses(
  campaigns:
    readonly AffiliateCampaign[]
) {
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