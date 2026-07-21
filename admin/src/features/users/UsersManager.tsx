"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import PageHeader from "@/components/admin/PageHeader";

import styles from "./UsersManager.module.css";

const LIVE_REFRESH_INTERVAL_MS =
  60_000;

const DEMO_LIVE_USERS =
  184;

const userMetrics = [
  {
    label: "Registered users",
    value: "8,250",
    description: "Total accounts created",
    kind: "default",
  },
  {
    label: "Daily active users",
    value: "1,420",
    description: "Active in the last 24 hours",
    kind: "default",
  },
  {
    label: "Monthly active users",
    value: "6,780",
    description: "Active in the last 30 days",
    kind: "default",
  },
] as const;

function formatUpdatedTime(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }
  ).format(date);
}

export default function UsersManager() {
  const [
    liveUsers,
    setLiveUsers,
  ] =
    useState(
      DEMO_LIVE_USERS
    );

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState<Date | null>(
      null
    );

  const refreshLiveUsers =
    useCallback(() => {
      /*
       * FRONTEND DEVELOPMENT STATE
       *
       * Keep the current demonstration count
       * truthful until Backend metrics exist.
       *
       * Later replace this section with:
       *
       * const response = await fetch(
       *   "/api/admin/metrics/live-users",
       *   { cache: "no-store" }
       * );
       *
       * const data = await response.json();
       * setLiveUsers(data.liveUsers);
       *
       * The 60-second refresh cycle below can
       * remain unchanged.
       */

      setLiveUsers(
        DEMO_LIVE_USERS
      );

      setLastUpdated(
        new Date()
      );
    }, []);

      useEffect(
  () => {
    const initialRefreshId =
      window.setTimeout(
        refreshLiveUsers,
        0
      );

    const intervalId =
      window.setInterval(
        refreshLiveUsers,
        LIVE_REFRESH_INTERVAL_MS
      );

    return () => {
      window.clearTimeout(
        initialRefreshId
      );

      window.clearInterval(
        intervalId
      );
    };
  },
  [
    refreshLiveUsers,
  ]
);

  return (
    <div
      className={
        styles.page
      }
    >
      <PageHeader
        eyebrow="Audience"
        title="Users"
        description="A simple view of Poster’s registered and active user base."
      />

      <section
        className={
          styles.liveOverview
        }
        aria-label="Live users"
      >
        <div
          className={
            styles.liveOverviewMain
          }
        >
          <div
            className={
              styles.liveOverviewLabel
            }
          >
            <span
              className={
                styles.livePulse
              }
              aria-hidden="true"
            />

            <span>
              Live users now
            </span>
          </div>

          <strong
            className={
              styles.liveOverviewValue
            }
          >
            {
              liveUsers.toLocaleString()
            }
          </strong>

          <span
            className={
              styles.liveOverviewDescription
            }
          >
            Users currently active
            across Poster
          </span>
        </div>

        <div
          className={
            styles.liveOverviewMeta
          }
        >
          <span
            className={
              styles.liveIndicator
            }
          >
            <span
              className={
                styles.liveDot
              }
              aria-hidden="true"
            />

            Live
          </span>

          <div
            className={
              styles.refreshInfo
            }
          >
            <strong>
              Auto-refresh
            </strong>

            <span>
              Every 60 seconds
            </span>

            <small>
              {lastUpdated
                ? `Last refreshed ${formatUpdatedTime(
                    lastUpdated
                  )}`
                : "Preparing live count"}
            </small>
          </div>
        </div>
      </section>

      <section
        className={
          styles.metrics
        }
        aria-label="User activity metrics"
      >
        {userMetrics.map(
          (
            metric
          ) => (
            <article
              key={
                metric.label
              }
              className={
                styles.metricCard
              }
            >
              <div
                className={
                  styles.metricHeader
                }
              >
                <span
                  className={
                    styles.metricLabel
                  }
                >
                  {
                    metric.label
                  }
                </span>
              </div>

              <strong
                className={
                  styles.metricValue
                }
              >
                {
                  metric.value
                }
              </strong>

              <span
                className={
                  styles.metricDescription
                }
              >
                {
                  metric.description
                }
              </span>
            </article>
          )
        )}

        <article
          className={
            styles.metricCard
          }
        >
          <div
            className={
              styles.metricHeader
            }
          >
            <span
              className={
                styles.metricLabel
              }
            >
              Live active users
            </span>

            <span
              className={
                styles.liveIndicator
              }
            >
              <span
                className={
                  styles.liveDot
                }
                aria-hidden="true"
              />

              Live
            </span>
          </div>

          <strong
            className={
              styles.metricValue
            }
          >
            {
              liveUsers.toLocaleString()
            }
          </strong>

          <span
            className={
              styles.metricDescription
            }
          >
            Currently active
          </span>
        </article>
      </section>

      <section
        className={
          styles.infoPanel
        }
      >
        <div>
          <strong>
            User metrics
          </strong>

          <p>
            These values are currently
            demonstration data. The backend
            will later provide registered-user,
            DAU, MAU, and live-session counts
            from real account and activity
            data.
          </p>
        </div>

        <span
          className={
            styles.updated
          }
        >
          Backend pending
        </span>
      </section>
    </div>
  );
}