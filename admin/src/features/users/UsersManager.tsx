"use client";

import PageHeader from "@/components/admin/PageHeader";

import {
  formatGeneratedAt,
  formatUserCount,
  formatWindow,
} from "./users-metrics.formatters";

import {
  useAudienceInsights,
} from "./use-audience-insights";

import {
  useUsersMetrics,
} from "./use-users-metrics";

import styles from "./UsersManager.module.css";

function formatSignedCount(
  value:
    number |
    null
): string {
  if (
    value === null
  ) {
    return "—";
  }

  const formatted =
    formatUserCount(
      Math.abs(
        value
      )
    );

  if (
    value > 0
  ) {
    return `+${formatted}`;
  }

  if (
    value < 0
  ) {
    return `-${formatted}`;
  }

  return "0";
}

function formatSignedPercentage(
  value:
    number |
    null
): string {
  if (
    value === null
  ) {
    return "New";
  }

  const formatted =
    Math.abs(
      value
    ).toLocaleString(
      undefined,
      {
        maximumFractionDigits:
          2,
      }
    );

  if (
    value > 0
  ) {
    return `+${formatted}%`;
  }

  if (
    value < 0
  ) {
    return `-${formatted}%`;
  }

  return "0%";
}

function formatPercentage(
  value:
    number |
    null
): string {
  if (
    value === null
  ) {
    return "â€”";
  }

  return `${value.toLocaleString(
    undefined,
    {
      maximumFractionDigits:
        2,
    }
  )}%`;
}

export default function UsersManager() {
  const userMetrics =
    useUsersMetrics();

  const audienceInsights =
    useAudienceInsights();

  const metrics =
    userMetrics
      .data
      ?.metrics;

  const windows =
    userMetrics
      .data
      ?.windows;

  const audienceData =
    audienceInsights.data;

  const metricCards = [
    {
      label:
        "Registered users",

      value:
        metrics?.totalUsers,

      description:
        "Total non-deleted Poster accounts",
    },

    {
      label:
        "Daily active users",

      value:
        metrics?.dailyActiveUsers,

      description:
        windows
          ? `Active during the last ${formatWindow(
              windows.dailyActiveHours,
              "hour",
              "hours"
            )}`
          : "Rolling daily activity window",
    },

    {
      label:
        "Monthly active users",

      value:
        metrics?.monthlyActiveUsers,

      description:
        windows
          ? `Active during the last ${formatWindow(
              windows.monthlyActiveDays,
              "day",
              "days"
            )}`
          : "Rolling monthly activity window",
    },
  ] as const;

  const refreshStatus =
    userMetrics.isLoading ||
    audienceInsights.isLoading
      ? "Loading Users and Audience Insights"
      : userMetrics.isRefreshing ||
          audienceInsights.isRefreshing
        ? "Refreshing Users and Audience Insights"
        : userMetrics.error ||
            audienceInsights.error
          ? "Some Users data could not be refreshed"
          : "Users and Audience Insights are current";

  const refreshAll =
    () => {
      userMetrics.refresh();
      audienceInsights.refresh();
    };

  return (
    <div
      className={
        styles.page
      }
    >
      <PageHeader
        eyebrow="Audience"
        title="Users"
        description="Authoritative user activity and privacy-protected audience insights from Posterâ€™s Backend."
      />

      <p
        className={
          styles.screenReaderStatus
        }
        role="status"
        aria-live="polite"
      >
        {refreshStatus}
      </p>

      {userMetrics.error ? (
        <section
          className={
            styles.errorPanel
          }
          role="alert"
        >
          <div>
            <strong>
              User metrics could not be refreshed
            </strong>

            <p>
              {userMetrics.error}

              {userMetrics.data
                ? " The last successful snapshot remains visible."
                : ""}
            </p>
          </div>

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={
              userMetrics.refresh
            }
            disabled={
              userMetrics.isLoading ||
              userMetrics.isRefreshing
            }
          >
            Retry
          </button>
        </section>
      ) : null}

      <section
        className={
          styles.liveOverview
        }
        aria-label="Live users"
        aria-busy={
          userMetrics.isLoading ||
          userMetrics.isRefreshing
        }
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
            {userMetrics.isLoading
              ? "â€”"
              : formatUserCount(
                  metrics
                    ?.liveActiveUsers
                )}
          </strong>

          <span
            className={
              styles.liveOverviewDescription
            }
          >
            {windows
              ? `Active during the last ${formatWindow(
                  windows.liveActiveMinutes,
                  "minute",
                  "minutes"
                )}`
              : "Current Backend activity window"}
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

          <button
            type="button"
            className={
              styles.refreshButton
            }
            onClick={
              refreshAll
            }
            disabled={
              userMetrics.isLoading ||
              userMetrics.isRefreshing ||
              audienceInsights.isLoading ||
              audienceInsights.isRefreshing
            }
          >
            {userMetrics.isRefreshing ||
            audienceInsights.isRefreshing
              ? "Refreshingâ€¦"
              : "Refresh all"}
          </button>

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
              {userMetrics.data
                ? `Generated ${formatGeneratedAt(
                    userMetrics
                      .data
                      .generatedAt
                  )}`
                : userMetrics.isLoading
                  ? "Loading authoritative metrics"
                  : "No successful snapshot"}
            </small>
          </div>
        </div>
      </section>

      <section
        className={
          styles.metrics
        }
        aria-label="User activity metrics"
        aria-busy={
          userMetrics.isLoading ||
          userMetrics.isRefreshing
        }
      >
        {metricCards.map(
          metric => (
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
                  {metric.label}
                </span>
              </div>

              <strong
                className={
                  styles.metricValue
                }
              >
                {userMetrics.isLoading
                  ? "â€”"
                  : formatUserCount(
                      metric.value
                    )}
              </strong>

              <span
                className={
                  styles.metricDescription
                }
              >
                {metric.description}
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
            {userMetrics.isLoading
              ? "â€”"
              : formatUserCount(
                  metrics
                    ?.liveActiveUsers
                )}
          </strong>

          <span
            className={
              styles.metricDescription
            }
          >
            {windows
              ? `Active during the last ${formatWindow(
                  windows.liveActiveMinutes,
                  "minute",
                  "minutes"
                )}`
              : "Current activity window"}
          </span>
        </article>
      </section>

      <section
        className={
          styles.audiencePanel
        }
        aria-labelledby="audience-insights-title"
        aria-busy={
          audienceInsights.isLoading ||
          audienceInsights.isRefreshing
        }
      >
        <div
          className={
            styles.audienceHeader
          }
        >
          <div>
            <span
              className={
                styles.sectionEyebrow
              }
            >
              Declared interests
            </span>

            <h2
              id="audience-insights-title"
            >
              Audience Insights
            </h2>

            <p>
              Aggregated topic audiences with privacy
              suppression and campaign eligibility safeguards.
            </p>
          </div>

          <div
            className={
              styles.audienceHeaderActions
            }
          >
            {audienceData ? (
              <span
                className={
                  styles.audienceFreshness
                }
              >
                Generated{" "}
                {formatGeneratedAt(
                  audienceData
                    .generatedAt
                )}
              </span>
            ) : null}

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                audienceInsights.refresh
              }
              disabled={
                audienceInsights.isLoading ||
                audienceInsights.isRefreshing
              }
            >
              {audienceInsights.isRefreshing
                ? "Refreshingâ€¦"
                : "Refresh"}
            </button>
          </div>
        </div>

        {audienceInsights.error ? (
          <div
            className={
              styles.audienceError
            }
            role="alert"
          >
            <div>
              <strong>
                Audience Insights could not be refreshed
              </strong>

              <p>
                {audienceInsights.error}

                {audienceData
                  ? " The last successful aggregate snapshot remains visible."
                  : ""}
              </p>
            </div>

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                audienceInsights.refresh
              }
              disabled={
                audienceInsights.isLoading ||
                audienceInsights.isRefreshing
              }
            >
              Retry
            </button>
          </div>
        ) : null}

        {audienceInsights.isLoading &&
        !audienceData ? (
          <div
            className={
              styles.audienceState
            }
          >
            Loading privacy-protected Audience Insightsâ€¦
          </div>
        ) : null}

        {!audienceInsights.isLoading &&
        audienceData &&
        audienceData.topics.length === 0 ? (
          <div
            className={
              styles.audienceState
            }
          >
            <strong>
              No topic audiences yet
            </strong>

            <p>
              Audience rows will appear after canonical topics
              and user-declared interests are stored.
            </p>
          </div>
        ) : null}

        {audienceData &&
        audienceData.topics.length > 0 ? (
          <div
            className={
              styles.tableScroll
            }
          >
            <table
              className={
                styles.audienceTable
              }
            >
              <thead>
                <tr>
                  <th scope="col">
                    Topic
                  </th>

                  <th scope="col">
                    Interested users
                  </th>

                  <th scope="col">
                    Active users
                  </th>

                  <th scope="col">
                    Audience share
                  </th>

                  <th scope="col">
                    Growth
                  </th>

                  <th scope="col">
                    Campaign audience
                  </th>

                  <th scope="col">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {audienceData
                  .topics
                  .map(
                    topic => (
                      <tr
                        key={
                          topic.topicId
                        }
                      >
                        <td>
                          <strong
                            className={
                              styles.topicName
                            }
                          >
                            {topic.topicName}
                          </strong>

                          <span
                            className={
                              styles.topicSlug
                            }
                          >
                            {topic.topicSlug}
                          </span>
                        </td>

                        {topic.isSuppressed ? (
                          <td
                            colSpan={
                              4
                            }
                          >
                            <span
                              className={
                                styles.suppressedValue
                              }
                            >
                              Suppressed below the minimum
                              reportable audience of{" "}
                              {formatUserCount(
                                audienceData
                                  .privacy
                                  .minimumReportableAudience
                              )}
                            </span>
                          </td>
                        ) : (
                          <>
                            <td>
                              {formatUserCount(
                                topic.totalInterestedUsers
                              )}
                            </td>

                            <td>
                              {formatUserCount(
                                topic.activeInterestedUsers
                              )}

                              <span
                                className={
                                  styles.cellMeta
                                }
                              >
                                Last{" "}
                                {audienceData
                                  .activeWindowDays}{" "}
                                days
                              </span>
                            </td>

                            <td>
                              {formatPercentage(
                                topic.audiencePercentage
                              )}
                            </td>

                            <td>
                              <span
                                className={
                                  topic.growthCount !== null &&
                                  topic.growthCount > 0
                                    ? styles.growthPositive
                                    : topic.growthCount !== null &&
                                        topic.growthCount < 0
                                      ? styles.growthNegative
                                      : styles.growthNeutral
                                }
                              >
                                {formatSignedCount(
                                  topic.growthCount
                                )}
                              </span>

                              <span
                                className={
                                  styles.cellMeta
                                }
                              >
                                {formatSignedPercentage(
                                  topic.growthPercentage
                                )} versus previous{" "}
                                {audienceData.activeWindowDays}{" "}
                                days
                              </span>
                            </td>

                            <td>
                              {formatUserCount(
                                topic.campaignEligibleUsers
                              )}
                            </td>
                          </>
                        )}

                        <td>
                          {topic.isSuppressed ? (
                            <span
                              className={
                                styles.statusMuted
                              }
                            >
                              Privacy protected
                            </span>
                          ) : topic.isCampaignEligible ? (
                            <span
                              className={
                                styles.statusEligible
                              }
                            >
                              Campaign eligible
                            </span>
                          ) : (
                            <span
                              className={
                                styles.statusMuted
                              }
                            >
                              Below campaign minimum
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          </div>
        ) : null}

        {audienceData ? (
          <div
            className={
              styles.audienceFooter
            }
          >
            <span>
              Reportable threshold:{" "}
              <strong>
                {formatUserCount(
                  audienceData
                    .privacy
                    .minimumReportableAudience
                )}
              </strong>
            </span>

            <span>
              Campaign threshold:{" "}
              <strong>
                {formatUserCount(
                  audienceData
                    .privacy
                    .minimumCampaignAudience
                )}
              </strong>
            </span>

            <span>
              Aggregate data only. Individual users are never
              exposed.
            </span>
          </div>
        ) : null}
      </section>

      <section
        className={
          styles.infoPanel
        }
      >
        <div>
          <strong>
            Authoritative user and audience data
          </strong>

          <p>
            User counts come from registered identities and
            active sessions. Audience Insights use declared
            interests, explicit targeting consent, and
            Backend-enforced privacy thresholds.
          </p>
        </div>

        <span
          className={
            styles.updated
          }
        >
          {userMetrics.data
            ? `User snapshot: ${formatGeneratedAt(
                userMetrics
                  .data
                  .generatedAt
              )}`
            : "Waiting for Backend"}
        </span>
      </section>
    </div>
  );
}
