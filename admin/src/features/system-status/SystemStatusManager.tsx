import styles from "./SystemStatusManager.module.css";

type HealthStatus =
  | "healthy"
  | "not_connected";

interface SystemService {
  name: string;
  area: string;
  status: HealthStatus;
  statusLabel: string;
  description: string;
}

interface ServiceGroup {
  title: string;
  description: string;
  services: SystemService[];
}

const groups: ServiceGroup[] = [
  {
    title: "Core services",

    description:
      "Essential application and persistence services.",

    services: [
      {
        name: "Admin UI",
        area: "Operations",

        status: "healthy",

        statusLabel:
          "Healthy",

        description:
          "Poster Admin is available and the current frontend build is operating normally.",
      },

      {
        name: "Backend API",
        area: "Application service",

        status:
          "not_connected",

        statusLabel:
          "Not connected",

        description:
          "Server-side APIs and shared business logic have not been connected yet.",
      },

      {
        name: "PostgreSQL Database",
        area: "Persistence",

        status:
          "not_connected",

        statusLabel:
          "Not connected",

        description:
          "Permanent platform data is not connected to PostgreSQL yet.",
      },
    ],
  },

  {
    title: "Content ingestion",

    description:
      "Services responsible for receiving permitted external content.",

    services: [
      {
        name: "Provider APIs",
        area: "External integrations",

        status:
          "not_connected",

        statusLabel:
          "Not connected",

        description:
          "Official publisher and provider API integrations are not connected yet.",
      },

      {
        name: "RSS Ingestion",
        area: "Feed synchronization",

        status:
          "not_connected",

        statusLabel:
          "Not connected",

        description:
          "Authorized RSS scheduling, synchronization, retries, and live feed monitoring are not connected yet.",
      },
    ],
  },

  {
    title:
      "Intelligence & communication",

    description:
      "Essential intelligence and outbound communication services.",

    services: [
      {
        name: "AI Services",
        area: "Intelligence",

        status:
          "not_connected",

        statusLabel:
          "Not connected",

        description:
          "Classification, ranking, recommendation, and taxonomy intelligence services are not connected yet.",
      },

      {
        name: "Email Notifications",
        area: "Communication",

        status:
          "not_connected",

        statusLabel:
          "Not connected",

        description:
          "Automatic copyright, commercial, client, and operational email delivery is not connected yet.",
      },
    ],
  },
];

function statusClass(
  status: HealthStatus
): string {
  return status ===
    "healthy"
    ? styles.statusHealthy
    : styles.statusDisconnected;
}

export default function SystemStatusManager() {
  const services =
    groups.flatMap(
      (group) =>
        group.services
    );

  const operationalCount =
    services.filter(
      (service) =>
        service.status ===
        "healthy"
    ).length;

  const pendingCount =
    services.filter(
      (service) =>
        service.status ===
        "not_connected"
    ).length;

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
            Operational status of
            Poster&apos;s essential
            platform services.
          </p>
        </div>
      </header>

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
              services.length
            }
          </strong>

          <small>
            Core services monitored
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
              operationalCount
            }
          </strong>

          <small>
            Currently available
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Pending
          </span>

          <strong>
            {
              pendingCount
            }
          </strong>

          <small>
            Not connected yet
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
            Status reflects the real
            development state.
          </strong>

          <p>
            Services that are not yet
            implemented or connected are
            shown as Not connected rather
            than being reported as healthy.
            Live health checks will replace
            these development states when
            Backend services are available.
          </p>
        </div>
      </section>

      <div
        className={
          styles.groups
        }
      >
        {groups.map(
          (group) => (
            <section
              key={
                group.title
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
                  (
                    service
                  ) => (
                    <article
                      key={
                        service.name
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

                      <p
                        className={
                          styles.serviceDescription
                        }
                      >
                        {
                          service.description
                        }
                      </p>

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
        <div>
          <strong>
            Live monitoring comes later.
          </strong>

          <p>
            Response time, uptime,
            last-checked timestamps, API
            health, worker failures, and
            service alerts will be populated
            from real monitoring only after
            the corresponding services are
            implemented.
          </p>
        </div>
      </section>
    </div>
  );
}