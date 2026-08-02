import type {
  AdminCampaign,
  CampaignStatus,
} from "../campaigns/campaign-api";

export type DirectSponsorshipStatus =
  CampaignStatus;

export type DirectSponsorshipCampaign =
  AdminCampaign & {
    campaignType:
      "direct_sponsorship";
  };

export interface DirectSponsorshipListResult {
  items:
    DirectSponsorshipCampaign[];

  total: number;

  limit: number;

  offset: number;
}

export interface DirectSponsorshipCounts {
  all: number;

  draft: number;

  scheduled: number;

  active: number;

  paused: number;

  ended: number;

  disabled: number;
}

export interface DirectSponsorshipFilters {
  query: string;

  status:
    | "all"
    | DirectSponsorshipStatus;
}