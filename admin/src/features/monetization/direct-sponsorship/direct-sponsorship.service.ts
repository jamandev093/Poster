import {
  listAdminCampaigns,
} from "../campaigns/campaign-api";

import {
  DirectSponsorshipApiError,
} from "./direct-sponsorship.errors";

import type {
  DirectSponsorshipCampaign,
  DirectSponsorshipListResult,
} from "./direct-sponsorship.types";

function isDirectSponsorshipCampaign(
  campaign:
    Awaited<
      ReturnType<
        typeof listAdminCampaigns
      >
    >["items"][number]
): campaign is
  DirectSponsorshipCampaign {
  return (
    campaign.campaignType ===
    "direct_sponsorship"
  );
}

export async function listDirectSponsorships(): Promise<
  DirectSponsorshipListResult
> {
  try {
    const response =
      await listAdminCampaigns({
        campaignType:
          "direct_sponsorship",

        limit:
          100,

        offset:
          0,
      });

    const items =
      response.items.filter(
        isDirectSponsorshipCampaign
      );

    return {
      items,

      total:
        response.total,

      limit:
        response.limit,

      offset:
        response.offset,
    };
  } catch (
    error
  ) {
    throw new DirectSponsorshipApiError(
      error instanceof Error &&
      error.message.trim()
        ? error.message
        : "Direct sponsorship campaigns could not be loaded.",

      error
    );
  }
}