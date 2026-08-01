"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminApiError,
} from "@/features/auth/services/auth-api.service";

import useAdminAuth from "@/features/auth/hooks/useAdminAuth";

import DashboardMetrics from "./components/DashboardMetrics";
import DashboardOperationalNotice from "./components/DashboardOperationalNotice";
import DashboardState from "./components/DashboardState";

import type {
  DashboardLoadState,
  DashboardSummary,
} from "./contracts/dashboard-summary.types";

import {
  loadDashboardSummary,
} from "./services/dashboard-summary.service";

import styles from "./DashboardManager.module.css";

const STALE_AFTER_MINUTES = 10;

export default function DashboardManager() {
  const {
    identity,
    restore,
  } = useAdminAuth();

  const [
    summary,
    setSummary,
  ] =
    useState<DashboardSummary | null>(
      null
    );

  const [
    state,
    setState,
  ] =
    useState<DashboardLoadState>(
      "loading"
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    observedAt,
    setObservedAt,
  ] =
    useState<number | null>(
      null
    );

  const load =
    useCallback(async () => {
      if (!identity) {
        return;
      }

      setState("loading");
      setErrorMessage(null);

      try {
        const nextSummary =
          await loadDashboardSummary(
            identity.accessToken
          );

        setSummary(nextSummary);
        setObservedAt(
          Date.now()
        );
        setState("ready");
      } catch (error) {
        if (
          error instanceof AdminApiError &&
          error.status === 401
        ) {
          await restore();

          setErrorMessage(
            "The Admin session was refreshed. Retry loading the Dashboard."
          );
        } else if (
          error instanceof AdminApiError &&
          error.status === 403
        ) {
          setErrorMessage(
            "This account does not have Dashboard permission."
          );
        } else if (
          error instanceof AdminApiError
        ) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(
            "The Dashboard summary could not be loaded."
          );
        }

        setState("error");
      }
    }, [
      identity,
      restore,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void load();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [load]);

  const freshness =
    useMemo(() => {
      if (!summary) {
        return null;
      }

      const generatedAt =
        new Date(summary.generatedAt);

      const ageMilliseconds =
        observedAt === null
          ? Number.POSITIVE_INFINITY
          : observedAt -
            generatedAt.getTime();

      return {
        generatedAt,
        stale:
          !Number.isFinite(
            generatedAt.getTime()
          ) ||
          ageMilliseconds >
            STALE_AFTER_MINUTES *
              60 *
              1000,
      };
    }, [
      observedAt,
      summary,
    ]);

  if (
    state === "loading" ||
    !identity
  ) {
    return (
      <DashboardState type="loading" />
    );
  }

  if (
    state === "error" ||
    !summary
  ) {
    return (
      <DashboardState
        type="error"
        message={errorMessage ?? undefined}
        onRetry={() => {
          void load();
        }}
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Operations overview
          </p>

          <h1>Dashboard</h1>

          <p className={styles.description}>
            Authoritative Poster user activity
            and the current state of connected
            Admin services.
          </p>
        </div>

        <div
          className={
            freshness?.stale
              ? styles.stale
              : styles.fresh
          }
          role="status"
        >
          <strong>
            {freshness?.stale
              ? "Data may be stale"
              : "Data current"}
          </strong>

          <span>
            Generated{" "}
            {freshness
              ? freshness.generatedAt
                  .toLocaleString("en-IN")
              : "unknown"}
          </span>

          <button
            type="button"
            onClick={() => {
              void load();
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      <DashboardMetrics
        summary={summary}
      />

      <DashboardOperationalNotice />
    </div>
  );
}

