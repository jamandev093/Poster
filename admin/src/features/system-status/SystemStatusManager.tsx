"use client";

import {
  formatSystemTimestamp,
  type SystemServiceStatus,
} from "./system-status-api";

import {
  useSystemStatus,
} from "./use-system-status";

import styles from "./SystemStatusManager.module.css";

function statusClass(
  status:
    SystemServiceStatus
): string {
  return status ===
    "healthy"
    ? styles.statusHealthy
    : styles.statusDisconnected;
}

export default function SystemStatusManager() {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } =
    useSystemStatus();

  return (
    <div
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <div
            className={
              styles.eyebrow
            }
          >
            Platform health
          </div>

          <h2>
            System Status
          </h2>

          <p>
            Authoritative operational
            status of Poster&apos;s
            essential services.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          onClick={
            refresh
          }
          disabled={
            isLoading ||
            isRefreshing
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Refresh status"}
        </button>
      </header>

      {error ? (
        <section
          className={
            styles.notice
          }
          role="alert"
        >
          <div
            className={
              styles.noticeMark
            }
          >
            !
          </div>

          <div>
            <strong>
              System Status could not
              be refreshed
            </strong>

            <p>
              {error}

              {data
                ? " The last successful snapshot remains visible."
                : ""}
            </p>
          </div>
        </section>
      ) : null}

      {isLoading &&
      !data ? (
        <section
          className={
            styles.footerNote
          }
        >
          <strong>
            Loading System Status
          </strong>

          <p>
            Checking the Backend API
            and PostgreSQL connection.
          </p>
        </section>
      ) : data ? (
        <>
          <section
            className={
              styles.summaryGrid
            }
            aria-label="Platform status summary"
          >
            <article
              className={
                styles.summaryCard
              }
            >
              <span>
                Essential services
              </span>

              <strong>
                {
                  data.summary.total
                }
              </strong>

              <small>
                Services represented
              </small>
            </article>

            <article
              className={
                styles.summaryCard
              }
            >
              <span>
                Operational
              </span>

              <strong>
                {
                  data.summary
                    .operational
                }
              </strong>

              <small>
                Healthy now
              </small>
            </article>

            <article
              className={
                styles.summaryCard
              }
            >
              <span>
                Needs attention
              </span>

              <strong>
                {
                  data.summary
                    .degraded +
                  data.summary
                    .unavailable
                }
              </strong>

              <small>
                Degraded or unavailable
              </small>
            </article>

            <article
              className={
                styles.summaryCard
              }
            >
              <span>
                Not connected
              </span>

              <strong>
                {
                  data.summary
                    .notConnected
                }
              </strong>

              <small>
                No authoritative probe
              </small>
            </article>
          </section>

          <section
            className={
              styles.notice
            }
          >
            <div
              className={
                styles.noticeMark
              }
              aria-hidden="true"
            >
              i
            </div>

            <div>
              <strong>
                Live Backend health
                snapshot
              </strong>

              <p>
                Environment:{" "}
                <strong>
                  {
                    data.environment
                  }
                </strong>
                . Generated{" "}
                {formatSystemTimestamp(
                  data.generatedAt
                )}.
                Services without real
                health probes remain
                explicitly marked Not
                connected.
              </p>
            </div>
          </section>

          <div
            className={
              styles.groups
            }
          >
            {data.groups.map(
              group => (
                <section
                  key={
                    group.key
                  }
                  className={
                    styles.panel
                  }
                >
                  <div
                    className={
                      styles.panelHeader
                    }
                  >
                    <div>
                      <h3>
                        {
                          group.title
                        }
                      </h3>

                      <p>
                        {
                          group.description
                        }
                      </p>
                    </div>
                  </div>

                  <div
                    className={
                      styles.serviceList
                    }
                  >
                    {group.services.map(
                      service => (
                        <article
                          key={
                            service.key
                          }
                          className={
                            styles.serviceRow
                          }
                        >
                          <div
                            className={
                              styles.serviceIdentity
                            }
                          >
                            <span
                              className={`${styles.statusDot} ${statusClass(
                                service.status
                              )}`}
                              aria-hidden="true"
                            />

                            <div>
                              <strong>
                                {
                                  service.name
                                }
                              </strong>

                              <span>
                                {
                                  service.area
                                }
                              </span>
                            </div>
                          </div>

                          <div>
                            <p
                              className={
                                styles.serviceDescription
                              }
                            >
                              {
                                service.description
                              }
                            </p>

                            <small
                              className={
                                styles.serviceCheck
                              }
                            >
                              Checked:{" "}
                              {formatSystemTimestamp(
                                service.checkedAt
                              )}

                              {service.latencyMilliseconds !==
                              null
                                ? ` · ${service.latencyMilliseconds} ms`
                                : ""}
                            </small>
                          </div>

                          <div
                            className={
                              styles.serviceMeta
                            }
                          >
                            <span
                              className={`${styles.statusBadge} ${statusClass(
                                service.status
                              )}`}
                            >
                              {
                                service.statusLabel
                              }
                            </span>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                </section>
              )
            )}
          </div>

          <section
            className={
              styles.footerNote
            }
          >
            <strong>
              Safe operational metadata
            </strong>

            <p>
              The endpoint exposes
              service state, timestamps,
              latency, environment, and
              non-sensitive PostgreSQL
              metadata. Credentials and
              connection secrets are
              never returned.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}