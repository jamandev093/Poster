import {
  findMonetizationCampaignById,
  listMonetizationCampaigns,
  type CampaignStatus,
  type CampaignType,
  type MonetizationCampaignListResult,
  type MonetizationCampaignRecord,
} from "../../domains/monetization/index.js";

export interface ListAdminCampaignsInput {
  organizationId?:
    string |
    null;

  status?:
    CampaignStatus |
    null;

  campaignType?:
    CampaignType |
    null;

  limit: number;

  offset: number;
}

export interface AdminCampaignService {
  list:
    (
      input:
        ListAdminCampaignsInput
    ) => Promise<
      MonetizationCampaignListResult
    >;

  get:
    (
      campaignId: string
    ) => Promise<
      MonetizationCampaignRecord |
      null
    >;
}

export interface AdminCampaignServiceDependencies {
  listCampaigns:
    typeof listMonetizationCampaigns;

  findCampaign:
    typeof findMonetizationCampaignById;
}

export interface CreateAdminCampaignServiceOptions {
  dependencies?:
    Partial<
      AdminCampaignServiceDependencies
    >;
}

export function createAdminCampaignService(
  options:
    CreateAdminCampaignServiceOptions =
    {}
): AdminCampaignService {
  const dependencies:
    AdminCampaignServiceDependencies = {
    listCampaigns:
      listMonetizationCampaigns,

    findCampaign:
      findMonetizationCampaignById,

    ...options.dependencies,
  };

  return {
    list:
      async input =>
        await dependencies
          .listCampaigns(
            input
          ),

    get:
      async campaignId =>
        await dependencies
          .findCampaign(
            campaignId
          ),
  };
}