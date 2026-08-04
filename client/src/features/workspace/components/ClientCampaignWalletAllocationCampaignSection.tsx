"use client";

import {
  useMemo,
} from "react";

import {
  useClientWalletOverview,
} from "../hooks/useClientWalletOverview";

import ClientCampaignWalletAllocationPanel from "./ClientCampaignWalletAllocationPanel";

import styles from "./ClientCampaignWalletAllocationCampaignSection.module.css";

interface ClientCampaignWalletAllocationCampaignSectionProps {
  campaignId:
    string;
}

export default function ClientCampaignWalletAllocationCampaignSection({
  campaignId,
}: ClientCampaignWalletAllocationCampaignSectionProps) {
  const {
    overview,
    isLoading,
    errorMessage,
    refresh,
  } =
    useClientWalletOverview(
      10
    );

  const wallet =
    overview?.wallet ??
    null;

  const campaignAllocations =
    useMemo(
      () =>
        overview?.campaignAllocations.filter(
          allocation =>
            allocation.campaignId ===
            campaignId
        ) ??
        [],
      [
        campaignId,
        overview?.campaignAllocations,
      ]
    );

  return (
    <section
      className={
        styles.section
      }
      aria-labelledby="campaign-wallet-allocation-title"
      aria-busy={
        isLoading
      }
    >
      <div
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
            Wallet allocation
          </p>

          <h2
            id="campaign-wallet-allocation-title"
            className={
              styles.title
            }
          >
            Campaign funding
          </h2>

          <p
            className={
              styles.description
            }
          >
            Allocate or release Wallet funds for this campaign only.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          onClick={
            () => {
              void refresh();
            }
          }
          disabled={
            isLoading
          }
        >
          {isLoading
            ? "Refreshing..."
            : "Refresh funds"}
        </button>
      </div>

      {errorMessage ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {isLoading && !overview ? (
        <div
          className={
            styles.status
          }
          role="status"
        >
          Loading campaign Wallet allocation...
        </div>
      ) : null}

      <ClientCampaignWalletAllocationPanel
        wallet={
          wallet
        }
        allocations={
          campaignAllocations
        }
        lockedCampaignId={
          campaignId
        }
        onAllocationChange={
          refresh
        }
      />
    </section>
  );
}