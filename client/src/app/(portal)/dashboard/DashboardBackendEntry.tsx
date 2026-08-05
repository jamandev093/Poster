"use client";

import {
  useMemo,
} from "react";

import Link from "next/link";

import {
  formatClientNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
  getRequestStatusLabel,
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

import {
  useClientCommercialRequests,
} from "@/features/requests/useClientCommercialRequests";

import type {
  ClientCommercialRequestApiRecord,
  ClientCommercialRequestStatus,
  ClientCommercialRequestType,
} from "@/features/requests/client-commercial-request.service";

import {
  useClientCampaigns,
} from "@/features/campaigns/useClientCampaigns";

import type {
  ClientCampaignListItem,
} from "@/features/campaigns/useClientCampaigns";

import {
  useClientWalletOverview,
} from "@/features/workspace/hooks/useClientWalletOverview";

import type {
  CampaignStatus,
} from "@/features/workspace/workspace.types";

import styles from "./page.module.css";

function getRequestStatusClass(
  status:
    ClientCommercialRequestStatus
): string {
  switch (status) {
    case "changes_requested":
      return styles.statusAttention;

    case "approved":
      return styles.statusPositive;

    case "pending_review":
    case "rejected":
    default:
      return styles.statusNeutral;
  }
}

function getCampaignStatusClass(
  status:
    CampaignStatus
): string {
  switch (status) {
    case "active":
      return styles.statusPositive;

    case "paused":
    case "disabled":
      return styles.statusAttention;

    case "draft":
    case "scheduled":
    case "ended":
    default:
      return styles.statusNeutral;
  }
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

function getRequestTitle(
  request:
    ClientCommercialRequestApiRecord
): string {
  return (
    request.campaignName ??
    request.title ??
    request.requestReference ??
    request.id
  );
}

function getRequestReference(
  request:
    ClientCommercialRequestApiRecord
): string {
  return (
    request.requestReference ??
    request.id
  );
}

function sortByUpdatedAtDescending<
  T extends {
    updatedAt:
      string;
  }
>(
  records:
    T[]
): T[] {
  return [
    ...records,
  ].sort(
    (
      first,
      second
    ) =>
      new Date(
        second.updatedAt
      ).getTime() -
      new Date(
        first.updatedAt
      ).getTime()
  );
}

function formatMoneyFromMinorUnits(
  minorUnits:
    string |
    undefined,

  currency:
    string =
      "INR"
): string {
  if (
    !minorUnits ||
    !/^-?[0-9]+$/.test(
      minorUnits
    )
  ) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      minorUnits
    ) / 100
  );
}

function calculateCtr(
  impressions:
    number,

  clicks:
    number
): string {
  if (impressions <= 0) {
    return "0%";
  }

  return `${(
    (
      clicks /
      impressions
    ) *
    100
  ).toFixed(2)}%`;
}

function getCampaignSpend(
  campaign:
    ClientCampaignListItem
): string {
  const allocation =
    campaign.walletAllocation;

  if (!allocation) {
    return "No allocation";
  }

  return formatMoneyFromMinorUnits(
    allocation.spent.minorUnits,
    allocation.spent.currency
  );
}

export default function DashboardBackendEntry() {
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
      100
    );

  const {
    campaigns,
    isLoading:
      areCampaignsLoading,
    isRefreshing:
      areCampaignsRefreshing,
    errorMessage:
      campaignsErrorMessage,
    walletErrorMessage:
      campaignWalletErrorMessage,
    refresh:
      refreshCampaigns,
  } =
    useClientCampaigns(
      100
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
      100
    );

  const isLoading =
    areRequestsLoading ||
    areCampaignsLoading ||
    isWalletLoading;

  const isRefreshing =
    areRequestsRefreshing ||
    areCampaignsRefreshing;

  const needsAction =
    requests.filter(
      request =>
        request.status ===
        "changes_requested"
    );

  const pendingRequests =
    requests.filter(
      request =>
        request.status ===
        "pending_review"
    );

  const activeCampaigns =
    campaigns.filter(
      campaign =>
        campaign.status ===
        "active"
    );

  const recentRequests =
    useMemo(
      () =>
        sortByUpdatedAtDescending(
          requests
        ).slice(
          0,
          4
        ),
      [
        requests,
      ]
    );

  const recentCampaigns =
    useMemo(
      () =>
        sortByUpdatedAtDescending(
          campaigns
        ).slice(
          0,
          5
        ),
      [
        campaigns,
      ]
    );

  const totalImpressions =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.impressions,
      0
    );

  const totalClicks =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.clicks,
      0
    );

  const totalConversions =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        (
          campaign.performance.conversions ??
          0
        ),
      0
    );

  const campaignsWithoutTracking =
    campaigns.filter(
      campaign =>
        campaign.performance.impressions === 0 &&
        campaign.performance.clicks === 0 &&
        (
          campaign.performance.conversions ??
          0
        ) === 0
    ).length;

  const wallet =
    walletOverview?.wallet ??
    null;

  return (
    <main>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Client dashboard
          </div>

          <h1 className="pageTitle">
            Advertising workspace
          </h1>

          <p className="pageDescription">
            Backend-derived dashboard for requests, campaigns, and Wallet
            visibility. Payments and detailed analytics remain on their
            dedicated pages.
          </p>
        </div>

        <div className="pageActions">
          <button
            type="button"
            className="secondaryButton"
            onClick={
              () => {
                void Promise.all([
                  refreshRequests(),
                  refreshCampaigns(),
                  refreshWallet(),
                ]);
              }
            }
            disabled={
              isRefreshing
            }
          >
            {isRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            href="/requests/new"
            className={
              styles.newRequestButton
            }
          >
            Submit advertising request
          </Link>
        </div>
      </header>

      <section
        className={
          styles.summary
        }
        aria-label="Advertising workspace summary"
        aria-busy={
          isLoading
        }
      >
        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Changes requested
          </span>

          <strong>
            {needsAction.length}
          </strong>

          <small>
            Need Client action
          </small>
        </article>

        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Pending review
          </span>

          <strong>
            {pendingRequests.length}
          </strong>

          <small>
            Awaiting Poster review
          </small>
        </article>

        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Active campaigns
          </span>

          <strong>
            {activeCampaigns.length}
          </strong>

          <small>
            Backend-derived campaign records
          </small>
        </article>

        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Wallet available
          </span>

          <strong>
            {wallet
              ? formatMoneyFromMinorUnits(
                  wallet.availableBalance.minorUnits,
                  wallet.availableBalance.currency
                )
              : "Loading"}
          </strong>

          <small>
            Authoritative Backend Wallet
          </small>
        </article>
      </section>

      {requestsErrorMessage ||
      campaignsErrorMessage ||
      walletErrorMessage ||
      campaignWalletErrorMessage ? (
        <section
          className="statePanel"
          role="status"
        >
          {requestsErrorMessage ? (
            <p>
              Requests: {requestsErrorMessage}
            </p>
          ) : null}

          {campaignsErrorMessage ? (
            <p>
              Campaigns: {campaignsErrorMessage}
            </p>
          ) : null}

          {walletErrorMessage ? (
            <p>
              Wallet: {walletErrorMessage}
            </p>
          ) : null}

          {campaignWalletErrorMessage ? (
            <p>
              Campaign Wallet: {campaignWalletErrorMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        className={
          styles.performanceSection
        }
        aria-labelledby="action-title"
      >
        <div>
          <div className="pageEyebrow">
            Action
          </div>

          <h2 id="action-title">
            Requests needing attention
          </h2>

          <p>
            Review requests where Poster has asked for Client corrections.
          </p>
        </div>

        {needsAction.length > 0 ? (
          <div
            className={
              styles.campaignTable
            }
          >
            {needsAction.slice(
              0,
              4
            ).map(
              request => (
                <Link
                  key={
                    request.id
                  }
                  href={`/requests/${request.id}`}
                  className={
                    styles.campaignRow
                  }
                >
                  <span>
                    {getRequestTitle(
                      request
                    )}
                  </span>

                  <span>
                    {getRequestReference(
                      request
                    )}
                  </span>

                  <span
                    className={
                      getRequestStatusClass(
                        request.status
                      )
                    }
                  >
                    {getRequestStatusLabel(
                      request.status
                    )}
                  </span>
                </Link>
              )
            )}
          </div>
        ) : (
          <p>
            No requests currently need Client action.
          </p>
        )}
      </section>

      <section
        className={
          styles.performanceSection
        }
        aria-labelledby="active-campaigns-title"
      >
        <div>
          <div className="pageEyebrow">
            Campaigns
          </div>

          <h2 id="active-campaigns-title">
            Backend-derived campaigns
          </h2>

          <p>
            Campaign visibility is derived from approved or campaign-linked
            Backend request records and Wallet allocations.
          </p>

          <Link href="/campaigns">
            View all campaigns
          </Link>
        </div>

        {recentCampaigns.length > 0 ? (
          <div
            className={
              styles.campaignTable
            }
          >
            {recentCampaigns.map(
              campaign => (
                <Link
                  key={
                    campaign.id
                  }
                  href={`/campaigns/${campaign.id}`}
                  className={
                    styles.campaignRow
                  }
                >
                  <span>
                    {campaign.name}
                  </span>

                  <span>
                    {getCampaignTypeLabel(
                      campaign.type
                    )}
                  </span>

                  <span>
                    {getCampaignSpend(
                      campaign
                    )}
                  </span>

                  <span
                    className={
                      getCampaignStatusClass(
                        campaign.status
                      )
                    }
                  >
                    {getCampaignStatusLabel(
                      campaign.status
                    )}
                  </span>
                </Link>
              )
            )}
          </div>
        ) : (
          <p>
            No Backend-linked campaigns are available yet.
          </p>
        )}
      </section>

      <section
        className={
          styles.performanceSection
        }
        aria-labelledby="performance-title"
      >
        <div>
          <div className="pageEyebrow">
            Performance
          </div>

          <h2 id="performance-title">
            Performance snapshot
          </h2>

          <p>
            Delivery remains conservative until the dedicated analytics Backend
            is connected.
          </p>

          <Link href="/performance">
            View performance
          </Link>
        </div>

        <div
          className={
            styles.performanceSummary
          }
        >
          <div>
            <span>
              Impressions
            </span>

            <strong>
              {formatClientNumber(
                totalImpressions
              )}
            </strong>

            <small>
              Across Backend-derived campaigns
            </small>
          </div>

          <div>
            <span>
              Clicks
            </span>

            <strong>
              {formatClientNumber(
                totalClicks
              )}
            </strong>

            <small>
              CTR {calculateCtr(
                totalImpressions,
                totalClicks
              )}
            </small>
          </div>

          <div>
            <span>
              Conversions
            </span>

            <strong>
              {formatClientNumber(
                totalConversions
              )}
            </strong>

            <small>
              Reported when analytics exists
            </small>
          </div>

          <div>
            <span>
              No tracking yet
            </span>

            <strong>
              {campaignsWithoutTracking}
            </strong>

            <small>
              Campaigns awaiting analytics
            </small>
          </div>
        </div>
      </section>

      <section
        className={
          styles.performanceSection
        }
        aria-labelledby="recent-requests-title"
      >
        <div>
          <div className="pageEyebrow">
            Requests
          </div>

          <h2 id="recent-requests-title">
            Recent requests
          </h2>

          <p>
            Latest advertising requests loaded from Poster Backend.
          </p>

          <Link href="/requests">
            View all requests
          </Link>
        </div>

        {recentRequests.length > 0 ? (
          <div
            className={
              styles.campaignTable
            }
          >
            {recentRequests.map(
              request => (
                <Link
                  key={
                    request.id
                  }
                  href={`/requests/${request.id}`}
                  className={
                    styles.campaignRow
                  }
                >
                  <span>
                    {getRequestTitle(
                      request
                    )}
                  </span>

                  <span>
                    {getRequestTypeLabel(
                      getRequestType(
                        request
                      )
                    )}
                  </span>

                  <span
                    className={
                      getRequestStatusClass(
                        request.status
                      )
                    }
                  >
                    {getRequestStatusLabel(
                      request.status
                    )}
                  </span>
                </Link>
              )
            )}
          </div>
        ) : (
          <p>
            No Backend request records are available yet.
          </p>
        )}
      </section>
    </main>
  );
}