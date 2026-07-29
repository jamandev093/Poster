"use client";

import {
  Suspense,
  useMemo,
  useState,
} from "react";

import CampaignsPanel from "./CampaignsPanel";

import {
  createMockCommercialRequestGateway,
} from "./requests/commercial-request.mock-service";

import CommercialRequestsPanel from "./requests/CommercialRequestsPanel";

import styles from "./MonetizationManagerShell.module.css";

type MonetizationWorkspace =
  | "requests"
  | "campaigns";

export default function MonetizationManager() {
  const [
    workspace,
    setWorkspace,
  ] =
    useState<
      MonetizationWorkspace
    >(
      "requests"
    );

  const requestGateway =
    useMemo(
      () =>
        createMockCommercialRequestGateway(),
      []
    );

  return (
    <div
      className={
        styles.workspace
      }
    >
      <nav
        className={
          styles.navigation
        }
        aria-label="Monetization workspace"
      >
        <button
          type="button"
          className={
            workspace ===
            "requests"
              ? styles.navigationActive
              : styles.navigationButton
          }
          aria-current={
            workspace ===
            "requests"
              ? "page"
              : undefined
          }
          onClick={() =>
            setWorkspace(
              "requests"
            )
          }
        >
          Requests
        </button>

        <button
          type="button"
          className={
            workspace ===
            "campaigns"
              ? styles.navigationActive
              : styles.navigationButton
          }
          aria-current={
            workspace ===
            "campaigns"
              ? "page"
              : undefined
          }
          onClick={() =>
            setWorkspace(
              "campaigns"
            )
          }
        >
          Campaigns
        </button>
      </nav>

      <Suspense
        fallback={
          <div
            className={
              styles.loading
            }
          >
            Loading monetization workspace…
          </div>
        }
      >
        {workspace ===
        "requests" ? (
          <CommercialRequestsPanel
            gateway={
              requestGateway
            }
          />
        ) : (
          <CampaignsPanel />
        )}
      </Suspense>
    </div>
  );
}
