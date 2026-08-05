"use client";

import {
  useCallback,
  useMemo,
} from "react";

import {
  useClientCommercialRequests,
} from "@/features/requests/useClientCommercialRequests";

import type {
  ClientCommercialRequestApiRecord,
  ClientCommercialRequestJsonObject,
  ClientCommercialRequestType,
} from "@/features/requests/client-commercial-request.service";

import {
  useClientWalletOverview,
} from "@/features/workspace/hooks/useClientWalletOverview";

import type {
  ClientWalletApiCampaignAllocation,
} from "@/features/workspace/services/client-wallet-read.service";

import type {
  CampaignStatus,
} from "@/features/workspace/workspace.types";

export interface ClientCampaignListItem {
  id:
    string;

  requestId:
    string;

  requestReference:
    string;

  name:
    string;

  type:
    ClientCommercialRequestType;

  status:
    CampaignStatus;

  requestStatus:
    ClientCommercialRequestApiRecord["status"];

  startDate:
    string |
    null;

  endDate:
    string |
    null;

  linkedCampaignId:
    string |
    null;

  objective:
    string;

  destinationUrl:
    string |
    null;

  performance: {
    impressions:
      number;

    clicks:
      number;

    conversions:
      number |
      null;
  };

  financials: {
    currency:
      "INR";

    budget?:
      number;

    contractValue?:
      number;

    utilized?:
      number;
  };

  walletAllocation:
    ClientWalletApiCampaignAllocation |
    null;

  submittedAt:
    string;

  updatedAt:
    string;
}

export interface UseClientCampaignsResult {
  campaigns:
    ClientCampaignListItem[];

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  errorMessage:
    string |
    null;

  walletErrorMessage:
    string |
    null;

  refresh:
    () => Promise<void>;
}

const CAMPAIGN_STATUSES =
  new Set<string>([
    "draft",
    "scheduled",
    "active",
    "paused",
    "ended",
    "disabled",
  ]);

function isRecord(
  value:
    unknown
): value is ClientCommercialRequestJsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

function getString(
  source:
    ClientCommercialRequestJsonObject |
    undefined,

  key:
    string
): string | undefined {
  const value =
    source?.[key];

  return typeof value === "string"
    ? value
    : undefined;
}

function getNumber(
  source:
    ClientCommercialRequestJsonObject |
    undefined,

  key:
    string
): number | undefined {
  const value =
    source?.[key];

  return typeof value === "number" &&
    Number.isFinite(
      value
    )
    ? value
    : undefined;
}

function minorNumberToMajor(
  value:
    number |
    null |
    undefined
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return undefined;
  }

  return Math.round(
    value
  ) / 100;
}

function minorStringToMajor(
  value:
    string |
    undefined
): number | undefined {
  if (
    !value ||
    !/^-?[0-9]+$/.test(
      value
    )
  ) {
    return undefined;
  }

  return Number(
    value
  ) / 100;
}

function getCommercialTerms(
  request:
    ClientCommercialRequestApiRecord
): ClientCommercialRequestJsonObject | undefined {
  return isRecord(
    request.commercialTerms
  )
    ? request.commercialTerms
    : undefined;
}

function getCreativeSpec(
  request:
    ClientCommercialRequestApiRecord
): ClientCommercialRequestJsonObject | undefined {
  return isRecord(
    request.creativeSpec
  )
    ? request.creativeSpec
    : undefined;
}

function getCampaignStatus(
  request:
    ClientCommercialRequestApiRecord
): CampaignStatus {
  const explicitStatus =
    request.commercialStatus ??
    request.readinessStatus;

  if (
    explicitStatus &&
    CAMPAIGN_STATUSES.has(
      explicitStatus
    )
  ) {
    return explicitStatus as CampaignStatus;
  }

  if (
    request.status === "approved" &&
    request.linkedCampaignId
  ) {
    return "scheduled";
  }

  if (
    request.status === "rejected"
  ) {
    return "disabled";
  }

  return "draft";
}

function getCampaignId(
  request:
    ClientCommercialRequestApiRecord
): string {
  return (
    request.linkedCampaignId ??
    request.id
  );
}

function getRequestType(
  request:
    ClientCommercialRequestApiRecord
): ClientCommercialRequestType {
  return (
    request.requestType ??
    request.type ??
    "direct_sponsorship"
  );
}

function mapCampaign(
  request:
    ClientCommercialRequestApiRecord,

  allocation:
    ClientWalletApiCampaignAllocation |
    null
): ClientCampaignListItem {
  const commercialTerms =
    getCommercialTerms(
      request
    );

  const creativeSpec =
    getCreativeSpec(
      request
    );

  const budget =
    minorNumberToMajor(
      request.budgetMinorUnits ??
      getNumber(
        commercialTerms,
        "proposedBudgetMinor"
      )
    );

  const contractValue =
    minorNumberToMajor(
      getNumber(
        commercialTerms,
        "proposedContractValueMinor"
      )
    );

  const utilized =
    minorStringToMajor(
      allocation?.spent.minorUnits
    );

  return {
    id:
      getCampaignId(
        request
      ),

    requestId:
      request.id,

    requestReference:
      request.requestReference ??
      request.id,

    name:
      request.campaignName ??
      request.title ??
      "Untitled campaign",

    type:
      getRequestType(
        request
      ),

    status:
      getCampaignStatus(
        request
      ),

    requestStatus:
      request.status,

    startDate:
      request.requestedStartDate ??
      null,

    endDate:
      request.requestedEndDate ??
      null,

    linkedCampaignId:
      request.linkedCampaignId ??
      null,

    objective:
      request.objective ??
      getString(
        commercialTerms,
        "objective"
      ) ??
      "",

    destinationUrl:
      request.destinationUrl ??
      getString(
        creativeSpec,
        "destinationUrl"
      ) ??
      null,

    performance:
      {
        impressions:
          0,

        clicks:
          0,

        conversions:
          null,
      },

    financials:
      {
        currency:
          "INR",

        budget,

        contractValue,

        utilized,
      },

    walletAllocation:
      allocation,

    submittedAt:
      request.submittedAt,

    updatedAt:
      request.updatedAt,
  };
}

function shouldShowAsCampaign(
  request:
    ClientCommercialRequestApiRecord
): boolean {
  return Boolean(
    request.linkedCampaignId ||
    request.status === "approved"
  );
}

export function useClientCampaigns(
  limit:
    number =
      100
): UseClientCampaignsResult {
  const {
    requests,
    isLoading:
      areRequestsLoading,
    isRefreshing:
      areRequestsRefreshing,
    errorMessage:
      requestsErrorMessage,
    refresh:
      refreshRequests,
  } =
    useClientCommercialRequests(
      limit
    );

  const {
    overview:
      walletOverview,
    isLoading:
      isWalletLoading,
    errorMessage:
      walletErrorMessage,
    refresh:
      refreshWallet,
  } =
    useClientWalletOverview(
      limit
    );

  const allocationByCampaignId =
    useMemo(
      () => {
        const allocations =
          new Map<
            string,
            ClientWalletApiCampaignAllocation
          >();

        walletOverview?.campaignAllocations.forEach(
          allocation => {
            allocations.set(
              allocation.campaignId,
              allocation
            );
          }
        );

        return allocations;
      },
      [
        walletOverview?.campaignAllocations,
      ]
    );

  const campaigns =
    useMemo(
      () =>
        requests
          .filter(
            shouldShowAsCampaign
          )
          .map(
            request =>
              mapCampaign(
                request,
                allocationByCampaignId.get(
                  getCampaignId(
                    request
                  )
                ) ??
                  null
              )
          ),
      [
        requests,
        allocationByCampaignId,
      ]
    );

  const refresh =
    useCallback(
      async () => {
        await Promise.all([
          refreshRequests(),
          refreshWallet(),
        ]);
      },
      [
        refreshRequests,
        refreshWallet,
      ]
    );

  return {
    campaigns,
    isLoading:
      areRequestsLoading ||
      isWalletLoading,
    isRefreshing:
      areRequestsRefreshing,
    errorMessage:
      requestsErrorMessage,
    walletErrorMessage,
    refresh,
  };
}