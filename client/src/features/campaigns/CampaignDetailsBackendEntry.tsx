"use client";

import Link from "next/link";

import {
  formatClientDate,
  formatClientNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
} from "@/features/workspace/workspace.formatters";

import ClientCampaignWalletAllocationCampaignSection from "@/features/workspace/components/ClientCampaignWalletAllocationCampaignSection";

import type {
  CampaignStatus,
} from "@/features/workspace/workspace.types";

import {
  useClientCampaigns,
} from "./useClientCampaigns";

import type {
  ClientCampaignListItem,
} from "./useClientCampaigns";

import styles from "./CampaignDetailsBackendEntry.module.css";

interface CampaignDetailsBackendEntryProps {
  campaignId:
    string;
}

function getStatusClassName(
  status:
    CampaignStatus
): string {
  switch (status) {
    case "active":
      return `statusBadge ${styles.statusActive}`;

    case "scheduled":
      return `statusBadge ${styles.statusScheduled}`;

    case "paused":
      return `statusBadge ${styles.statusAttention}`;

    case "draft":
      return `statusBadge ${styles.statusDraft}`;

    case "ended":
      return `statusBadge ${styles.statusEnded}`;

    case "disabled":
    default:
      return `statusBadge ${styles.statusAttention}`;
  }
}

function formatMoney(
  value:
    number |
    undefined
): string {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        2,
    }
  ).format(
    value
  );
}

function minorToMajor(
  minorUnits:
    string
): number {
  if (!/^-?[0-9]+$/.test(minorUnits)) {
    return 0;
  }

  return Number(minorUnits) / 100;
}

function formatWalletMoney(
  minorUnits:
    string
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        2,
    }
  ).format(
    minorToMajor(
      minorUnits
    )
  );
}

function getCampaignValue(
  campaign:
    ClientCampaignListItem
): string {
  return formatMoney(
    campaign.financials.budget ??
    campaign.financials.contractValue
  );
}

function getCampaignDateRange(
  campaign:
    ClientCampaignListItem
): string {
  if (
    campaign.startDate &&
    campaign.endDate
  ) {
    return `${formatClientDate(
      campaign.startDate
    )} — ${formatClientDate(
      campaign.endDate
    )}`;
  }

  if (campaign.startDate) {
    return `Starts ${formatClientDate(
      campaign.startDate
    )}`;
  }

  if (campaign.endDate) {
    return `Ends ${formatClientDate(
      campaign.endDate
    )}`;
  }

  return "Schedule pending";
}

function findCampaign(
  campaigns:
    ClientCampaignListItem[],

  campaignId:
    string
): ClientCampaignListItem | null {
  return campaigns.find(
    campaign =>
      campaign.id === campaignId ||
      campaign.linkedCampaignId === campaignId ||
      campaign.requestId === campaignId
  ) ??
    null;
}

function WalletSummary({
  campaign,
}: {
  campaign:
    ClientCampaignListItem;
}) {
  const allocation =
    campaign.walletAllocation;

  if (!allocation) {
    return (
      <section
        className={
          styles.panel
        }
        aria-labelledby="wallet-summary-title"
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <p
            className={
              styles.eyebrow
            }
          >
            Wallet
          </p>

          <h2
            id="wallet-summary-title"
          >
            Wallet allocation pending
          </h2>
        </div>

        <p
          className={
            styles.note
          }
        >
          {campaign.linkedCampaignId
            ? "No Backend Wallet allocation has been created for this campaign yet."
            : "Poster Admin has not linked this approved request to a campaign yet."}
        </p>
      </section>
    );
  }

  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="wallet-summary-title"
    >
      <div
        className={
          styles.panelHeader
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          Wallet
        </p>

        <h2
          id="wallet-summary-title"
        >
          Wallet allocation summary
        </h2>
      </div>

      <div
        className={
          styles.metricGrid
        }
      >
        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Allocated
          </span>

          <strong>
            {formatWalletMoney(
              allocation.allocated.minorUnits
            )}
          </strong>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Reserved
          </span>

          <strong>
            {formatWalletMoney(
              allocation.reserved.minorUnits
            )}
          </strong>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Spent
          </span>

          <strong>
            {formatWalletMoney(
              allocation.spent.minorUnits
            )}
          </strong>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Released
          </span>

          <strong>
            {formatWalletMoney(
              allocation.released.minorUnits
            )}
          </strong>
        </article>
      </div>
    </section>
  );
}

function PerformancePanel({
  campaign,
}: {
  campaign:
    ClientCampaignListItem;
}) {
  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="performance-title"
    >
      <div
        className={
          styles.panelHeader
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          Performance
        </p>

        <h2
          id="performance-title"
        >
          Delivery snapshot
        </h2>
      </div>

      <div
        className={
          styles.metricGrid
        }
      >
        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Impressions
          </span>

          <strong>
            {formatClientNumber(
              campaign.performance.impressions
            )}
          </strong>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Clicks
          </span>

          <strong>
            {formatClientNumber(
              campaign.performance.clicks
            )}
          </strong>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Conversions
          </span>

          <strong>
            {campaign.performance.conversions === null
              ? "—"
              : formatClientNumber(
                  campaign.performance.conversions
                )}
          </strong>
        </article>

        <article
          className={
            styles.metricCard
          }
        >
          <span>
            Wallet spent
          </span>

          <strong>
            {formatMoney(
              campaign.financials.utilized
            )}
          </strong>
        </article>
      </div>

      <p
        className={
          styles.note
        }
      >
        Campaign performance remains conservative until the dedicated analytics
        Backend is connected.
      </p>
    </section>
  );
}

function CommercialPanel({
  campaign,
}: {
  campaign:
    ClientCampaignListItem;
}) {
  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="commercial-title"
    >
      <div
        className={
          styles.panelHeader
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          Commercial
        </p>

        <h2
          id="commercial-title"
        >
          Campaign terms
        </h2>
      </div>

      <div
        className={
          styles.detailGrid
        }
      >
        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Campaign ID
          </span>

          <strong>
            {campaign.id}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Request ID
          </span>

          <strong>
            {campaign.requestId}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Request reference
          </span>

          <strong>
            {campaign.requestReference}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Campaign value
          </span>

          <strong>
            {getCampaignValue(
              campaign
            )}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Schedule
          </span>

          <strong>
            {getCampaignDateRange(
              campaign
            )}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Linked campaign
          </span>

          <strong>
            {campaign.linkedCampaignId ??
              "Pending setup"}
          </strong>
        </div>
      </div>

      {campaign.objective ? (
        <p
          className={
            styles.note
          }
        >
          {campaign.objective}
        </p>
      ) : null}

      {campaign.destinationUrl ? (
        <a
          href={
            campaign.destinationUrl
          }
          target="_blank"
          rel="noreferrer"
          className={
            styles.destination
          }
        >
          Open destination URL
        </a>
      ) : null}
    </section>
  );
}

export default function CampaignDetailsBackendEntry({
  campaignId,
}: CampaignDetailsBackendEntryProps) {
  const {
    campaigns,
    isLoading,
    isRefreshing,
    errorMessage,
    walletErrorMessage,
    refresh,
  } =
    useClientCampaigns(
      100
    );

  const campaign =
    findCampaign(
      campaigns,
      campaignId
    );

  if (isLoading) {
    return (
      <div
        className="statePanel"
        role="status"
      >
        Loading campaign from Poster Backend-derived records.
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        className="statePanel"
        role="alert"
      >
        <strong>
          Campaign could not be loaded
        </strong>

        <p>
          {errorMessage}
        </p>

        <button
          type="button"
          className="secondaryButton"
          onClick={
            () => {
              void refresh();
            }
          }
          disabled={
            isRefreshing
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Retry"}
        </button>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div
        className="statePanel"
        role="status"
      >
        <strong>
          Campaign not found
        </strong>

        <p>
          Poster Backend did not return a campaign-linked request for this ID.
        </p>

        <Link
          href="/campaigns"
          className="secondaryButton"
        >
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <>
      <header
        className={
          styles.header
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            {campaign.requestReference}
          </p>

          <h1
            className={
              styles.title
            }
          >
            {campaign.name}
          </h1>

          <p
            className={
              styles.description
            }
          >
            Backend-derived campaign detail from commercial request and Wallet
            allocation records. Poster Admin controls campaign setup,
            activation, pausing, and completion.
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <span
            className={
              getStatusClassName(
                campaign.status
              )
            }
          >
            {getCampaignStatusLabel(
              campaign.status
            )}
          </span>

          <Link
            href={`/requests/${campaign.requestId}`}
            className="secondaryButton"
          >
            View request
          </Link>

          <Link
            href="/campaigns"
            className="secondaryButton"
          >
            Back to campaigns
          </Link>
        </div>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Campaign summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Type
          </span>

          <strong>
            {getCampaignTypeLabel(
              campaign.type
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Status
          </span>

          <strong>
            {getCampaignStatusLabel(
              campaign.status
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Schedule
          </span>

          <strong>
            {getCampaignDateRange(
              campaign
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Updated
          </span>

          <strong>
            {formatClientDate(
              campaign.updatedAt
            )}
          </strong>
        </article>
      </section>

      {walletErrorMessage ? (
        <div
          className={
            styles.warning
          }
          role="status"
        >
          Wallet allocation data could not be refreshed: {walletErrorMessage}
        </div>
      ) : null}

      <WalletSummary
        campaign={
          campaign
        }
      />

      {campaign.linkedCampaignId ? (
        <ClientCampaignWalletAllocationCampaignSection
          campaignId={
            campaign.linkedCampaignId
          }
        />
      ) : null}

      <CommercialPanel
        campaign={
          campaign
        }
      />

      <PerformancePanel
        campaign={
          campaign
        }
      />
    </>
  );
}