import type {
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  CampaignAnalyticsSnapshot,
  ConversionRateDenominator,
} from "../analytics/analytics.types";

import {
  createAnalyticsDashboardViewModel,
} from "../adapters/analytics-dashboard.adapter";

import type {
  AnalyticsDashboardViewModel,
} from "../adapters/analytics-dashboard.adapter";

import {
  campaignAnalyticsSnapshots,
  legacyCampaigns,
} from "../workspace.fixtures";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import type {
  ClientCampaign,
} from "../workspace.types";

/**
 * Analytics workspace service.
 *
 * Pages and React components should request analytics through
 * this service instead of importing mock records directly.
 *
 * The fixture data source will later be replaced by an HTTP
 * implementation without changing the page-facing service
 * contract.
 */

export interface AnalyticsWorkspaceQuery {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  campaignIds?:
    string[];

  conversionRateDenominator?:
    ConversionRateDenominator;
}

export interface AnalyticsWorkspaceDataSource {
  getCampaigns(
    organizationId:
      OrganizationId
  ): Promise<
    ClientCampaign[]
  >;

  getCampaignAnalyticsSnapshots(
    organizationId:
      OrganizationId
  ): Promise<
    CampaignAnalyticsSnapshot[]
  >;
}

export interface AnalyticsWorkspaceService {
  getDashboard(
    query:
      AnalyticsWorkspaceQuery
  ): Promise<
    AnalyticsDashboardViewModel
  >;
}

function filterCampaigns(
  campaigns:
    ClientCampaign[],
  campaignIds:
    string[] |
    undefined
): ClientCampaign[] {
  if (
    !campaignIds ||
    campaignIds.length ===
      0
  ) {
    return campaigns;
  }

  const requestedIds =
    new Set(
      campaignIds
    );

  return campaigns.filter(
    (
      campaign
    ) =>
      requestedIds.has(
        campaign.id
      )
  );
}

function filterSnapshots(
  snapshots:
    CampaignAnalyticsSnapshot[],
  campaignIds:
    string[] |
    undefined
): CampaignAnalyticsSnapshot[] {
  if (
    !campaignIds ||
    campaignIds.length ===
      0
  ) {
    return snapshots;
  }

  const requestedIds =
    new Set(
      campaignIds
    );

  return snapshots.filter(
    (
      snapshot
    ) =>
      requestedIds.has(
        snapshot.campaignId
      )
  );
}

export const fixtureAnalyticsWorkspaceDataSource:
  AnalyticsWorkspaceDataSource = {
  async getCampaigns(): Promise<
    ClientCampaign[]
  > {
    return [
      ...legacyCampaigns,
    ];
  },

  async getCampaignAnalyticsSnapshots(): Promise<
    CampaignAnalyticsSnapshot[]
  > {
    return [
      ...campaignAnalyticsSnapshots,
    ];
  },
};

export function createAnalyticsWorkspaceService(
  dataSource:
    AnalyticsWorkspaceDataSource =
      fixtureAnalyticsWorkspaceDataSource
): AnalyticsWorkspaceService {
  return {
    async getDashboard(
      query:
        AnalyticsWorkspaceQuery
    ): Promise<
      AnalyticsDashboardViewModel
    > {
      const [
        campaigns,
        snapshots,
      ] =
        await Promise.all([
          dataSource.getCampaigns(
            query.organizationId
          ),

          dataSource
            .getCampaignAnalyticsSnapshots(
              query.organizationId
            ),
        ]);

      const filteredCampaigns =
        filterCampaigns(
          campaigns,
          query.campaignIds
        );

      const filteredSnapshots =
        filterSnapshots(
          snapshots,
          query.campaignIds
        );

      return createAnalyticsDashboardViewModel({
        campaigns:
          filteredCampaigns,

        snapshots:
          filteredSnapshots,

        currency:
          query.currency,

        conversionRateDenominator:
          query
            .conversionRateDenominator,
      });
    },
  };
}

export const analyticsWorkspaceService =
  createAnalyticsWorkspaceService();


