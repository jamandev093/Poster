"use client";

import Link from "next/link";

import {
  useClientWalletOverview,
} from "@/features/workspace/hooks/useClientWalletOverview";

import type {
  ClientWalletApiCampaignAllocation,
  ClientWalletApiMoney,
} from "@/features/workspace/services/client-wallet-read.service";

import styles from "./RequestWalletFundingSummary.module.css";

interface RequestWalletFundingSummaryProps {
  linkedCampaignId:
    string |
    null;

  campaignName:
    string;

  requestStatus:
    string;

  commercialValue:
    string;
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
  money:
    ClientWalletApiMoney
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        money.currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    minorToMajor(
      money.minorUnits
    )
  );
}

function getAllocationForCampaign(
  allocations:
    ClientWalletApiCampaignAllocation[] |
    undefined,

  linkedCampaignId:
    string |
    null
): ClientWalletApiCampaignAllocation | null {
  if (!linkedCampaignId) {
    return null;
  }

  return (
    allocations?.find(
      allocation =>
        allocation.campaignId ===
        linkedCampaignId
    ) ??
    null
  );
}

export default function RequestWalletFundingSummary({
  linkedCampaignId,
  campaignName,
  requestStatus,
  commercialValue,
}: RequestWalletFundingSummaryProps) {
  const {
    overview,
    isLoading,
    errorMessage,
    refresh,
  } =
    useClientWalletOverview(
      100
    );

  const allocation =
    getAllocationForCampaign(
      overview?.campaignAllocations,
      linkedCampaignId
    );

  const hasLinkedCampaign =
    Boolean(
      linkedCampaignId
    );

  return (
    <section
      className={
        styles.section
      }
      aria-labelledby="request-wallet-funding-title"
    >
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
            Wallet funding
          </p>

          <h2
            id="request-wallet-funding-title"
            className={
              styles.title
            }
          >
            Request funding status
          </h2>

          <p
            className={
              styles.description
            }
          >
            Review the Backend Wallet allocation connected to this request.
          </p>
        </div>

        <div
          className={
            styles.actions
          }
        >
          <Link
            href="/wallet"
            className={
              styles.link
            }
          >
            Open Wallet
          </Link>

          <button
            type="button"
            className={
              styles.refreshButton
            }
            onClick={
              refresh
            }
            disabled={
              isLoading
            }
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </header>

      <div
        className={
          styles.grid
        }
      >
        <article
          className={
            styles.card
          }
        >
          <span>
            Request
          </span>

          <strong>
            {campaignName}
          </strong>

          <small>
            Status: {requestStatus}
          </small>
        </article>

        <article
          className={
            styles.card
          }
        >
          <span>
            Commercial value
          </span>

          <strong>
            {commercialValue}
          </strong>

          <small>
            Requested allowance or agreed commercial terms.
          </small>
        </article>

        <article
          className={
            styles.card
          }
        >
          <span>
            Linked campaign
          </span>

          <strong>
            {linkedCampaignId ??
              "Pending setup"}
          </strong>

          <small>
            {hasLinkedCampaign
              ? "Campaign is available for Wallet allocation lookup."
              : "Poster Admin has not linked this request to a campaign yet."}
          </small>
        </article>

        <article
          className={
            styles.card
          }
        >
          <span>
            Wallet allocation
          </span>

          <strong>
            {allocation
              ? `${formatWalletMoney(
                  allocation.allocated
                )} allocated`
              : hasLinkedCampaign
                ? isLoading
                  ? "Loading..."
                  : errorMessage
                    ? "Unavailable"
                    : "Not allocated yet"
                : "Pending campaign"}
          </strong>

          <small>
            {allocation
              ? `${formatWalletMoney(
                  allocation.spent
                )} spent · ${formatWalletMoney(
                  allocation.reserved
                )} reserved`
              : hasLinkedCampaign
                ? errorMessage
                  ? "Backend Wallet funding could not be verified."
                  : "No Wallet allocation has been created for this campaign yet."
                : "Funds can be allocated after campaign setup."}
          </small>
        </article>
      </div>

      {errorMessage ? (
        <p
          className={
            styles.error
          }
          role="status"
        >
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}