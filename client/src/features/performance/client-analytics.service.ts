import {
  requestPosterApiJson,
} from "../workspace/services/client-api.service";

export interface ClientAnalyticsMetricTotals {
  validImpressions:
    string;

  invalidImpressions:
    string;

  duplicateImpressions:
    string;

  validClicks:
    string;

  invalidClicks:
    string;

  duplicateClicks:
    string;

  validConversions:
    string;

  invalidConversions:
    string;

  duplicateConversions:
    string;

  unattributedConversions:
    string;
}

export interface ClientAnalyticsCampaign
  extends ClientAnalyticsMetricTotals {
  campaignId:
    string;

  campaignReference:
    string;

  campaignName:
    string;

  campaignType:
    string;

  campaignStatus:
    string;

  ctr:
    number;

  latestSourceEventWatermark:
    string |
    null;

  finalizedMetricRows:
    number;

  totalMetricRows:
    number;
}

export interface ClientAnalyticsPlacement
  extends ClientAnalyticsMetricTotals {
  placement:
    string;

  ctr:
    number;
}

export interface ClientAnalyticsOverview
  extends ClientAnalyticsMetricTotals {
  startDate:
    string;

  endDate:
    string;

  ctr:
    number;

  latestSourceEventWatermark:
    string |
    null;

  finalizedMetricRows:
    number;

  totalMetricRows:
    number;

  placements:
    ClientAnalyticsPlacement[];

  campaigns:
    ClientAnalyticsCampaign[];
}

export interface ClientAnalyticsQuery {
  startDate:
    string;

  endDate:
    string;
}

export function buildClientAnalyticsPath(
  query:
    ClientAnalyticsQuery
): string {
  const parameters =
    new URLSearchParams({
      startDate:
        query.startDate,

      endDate:
        query.endDate,
    });

  return (
    "/api/v1/client/analytics?" +
    parameters.toString()
  );
}

export async function getClientAnalyticsOverview(
  query:
    ClientAnalyticsQuery
): Promise<
  ClientAnalyticsOverview
> {
  return await requestPosterApiJson<
    ClientAnalyticsOverview
  >(
    buildClientAnalyticsPath(
      query
    ),
    {
      method:
        "GET",
    }
  );
}