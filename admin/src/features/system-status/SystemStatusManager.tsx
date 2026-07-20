import styles from "./SystemStatusManager.module.css";

type HealthStatus =
  | "healthy"
  | "ready"
  | "attention"
  | "not_connected";

interface SystemTool {
  name: string;
  area: string;
  status: HealthStatus;
  statusLabel: string;
  detail: string;
  lastChecked: string;
}

interface StatusGroup {
  title: string;
  description: string;
  tools: SystemTool[];
}

const groups: StatusGroup[] = [
  {
    title: "Admin & public tools",

    description:
      "Frontend tools currently available to the Poster operator and rights holders.",

    tools: [
      {
        name: "Admin frontend",
        area: "Operations UI",
        status: "healthy",
        statusLabel: "Healthy",
        detail:
          "Admin routes, navigation, TypeScript, lint, and production build are working.",
        lastChecked: "Current build",
      },

      {
        name: "Content controls",
        area: "Admin tool",
        status: "healthy",
        statusLabel: "Healthy",
        detail:
          "Search, content details, removal, restoration, prevent re-import decisions, and exact record opening are available.",
        lastChecked: "Current build",
      },

      {
        name: "Sources controls",
        area: "Admin tool",
        status: "healthy",
        statusLabel: "Healthy",
        detail:
          "Source search, health display, pause, enable, block, unblock, and exact source opening are available.",
        lastChecked: "Current build",
      },

      {
        name: "Copyright workflow",
        area: "Rights tool",
        status: "healthy",
        statusLabel: "Healthy",
        detail:
          "Content IDs, claimant details, cross-verification, removal decisions, prevent re-import decisions, and audit history are available.",
        lastChecked: "Current build",
      },

      {
        name: "Reports linking",
        area: "Admin tool",
        status: "healthy",
        statusLabel: "Healthy",
        detail:
          "Reports carry exact Content, Source, and Campaign references. Content and Source deep linking are available.",
        lastChecked: "Current build",
      },

      {
        name: "Public rights request form",
        area: "Public tool",
        status: "ready",
        statusLabel: "Frontend ready",
        detail:
          "Claimant details, affected content identification, declarations, validation, supporting information, and electronic-signature UI are available.",
        lastChecked: "Current build",
      },
    ],
  },

  {
    title: "Core platform services",

    description:
      "Backend and persistence services that will power the real production platform.",

    tools: [
      {
        name: "Backend API",
        area: "Core service",
        status: "not_connected",
        statusLabel: "Not connected",
        detail:
          "Real Poster API endpoints and shared server-side business logic are intentionally deferred to the Backend phase.",
        lastChecked: "Development state",
      },

      {
        name: "PostgreSQL database",
        area: "Persistence",
        status: "not_connected",
        statusLabel: "Not connected",
        detail:
          "Permanent users, content, sources, reports, campaigns, copyright cases, exclusions, and audit records are not connected to PostgreSQL yet.",
        lastChecked: "Development state",
      },
    ],
  },

  {
    title: "Content ingestion",

    description:
      "External source integrations and ingestion services used to discover permitted content.",

    tools: [
      {
        name: "Provider APIs",
        area: "External integrations",
        status: "not_connected",
        statusLabel: "Not connected",
        detail:
          "Official provider API adapters, developer credentials, quotas, and live provider health checks have not been implemented yet.",
        lastChecked: "Development state",
      },

      {
        name: "RSS ingestion engine",
        area: "Content ingestion",
        status: "not_connected",
        statusLabel: "Not connected",
        detail:
          "Authorized RSS scheduling, worker heartbeats, retries, feed synchronization, and live failure monitoring are deferred to Backend.",
        lastChecked: "Development state",
      },

      {
        name: "Embed / oEmbed services",
        area: "Content ingestion",
        status: "not_connected",
        statusLabel: "Not connected",
        detail:
          "Official embed and oEmbed provider adapters have not been connected yet.",
        lastChecked: "Development state",
      },
    ],
  },

  {
    title: "Intelligence & communication",

    description:
      "AI processing and outbound communication services that will be connected later.",

    tools: [
      {
        name: "AI services",
        area: "Intelligence",
        status: "not_connected",
        statusLabel: "Not connected",
        detail:
          "Classification, ranking, recommendation, global taxonomy intelligence, and other Python AI services are intentionally deferred.",
        lastChecked: "Development state",
      },

      {
        name: "Email notifications",
        area: "Communication",
        status: "not_connected",
        statusLabel: "Not connected",
        detail:
          "Automatic copyright claimant decision emails, delivery retries, and notification audit records will be connected during Backend development.",
        lastChecked: "Development state",
      },
    ],
  },
];

function statusClass(
  status: HealthStatus
): string {
  switch (status) {
    case "healthy":
      return styles.statusHealthy;

    case "ready":
      return styles.statusReady;

    case "attention":
      return styles.statusAttention;

    case "not_connected":
      return styles.statusDisconnected;
  }
}

export default function SystemStatusManager() {
  const allTools =
    groups.flatMap(
      (group) =>
        group.tools
    );

  const healthyCount =
    allTools.filter(
      (tool) =>
        tool.status ===
          "healthy" ||
        tool.status ===
          "ready"
    ).length;

  const pendingCount =
    allTools.filter(
      (tool) =>
        tool.status ===
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
            See the current state of
            Poster&apos;s operational tools,
            APIs, ingestion services,
            persistence, AI systems, and
            notification services.
          </p>
        </div>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="System status summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Total tools
          </span>

          <strong>
            {
              allTools.length
            }
          </strong>

          <small>
            Tracked platform components
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Ready now
          </span>

          <strong>
            {
              healthyCount
            }
          </strong>

          <small>
            Frontend / operator tools
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
              pendingCount
            }
          </strong>

          <small>
            Deferred platform services
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
            Current statuses reflect the
            development state.
          </strong>

          <p>
            Backend API, real provider APIs,
            RSS workers, PostgreSQL, AI
            services, and email delivery are
            not connected yet. They are shown
            as Not connected instead of being
            incorrectly reported as healthy.
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

                <span
                  className={
                    styles.groupCount
                  }
                >
                  {
                    group.tools.length
                  }
                </span>
              </div>

              <div
                className={
                  styles.toolList
                }
              >
                {group.tools.map(
                  (tool) => (
                    <article
                      key={
                        tool.name
                      }
                      className={
                        styles.toolRow
                      }
                    >
                      <div
                        className={
                          styles.toolIdentity
                        }
                      >
                        <span
                          className={`${styles.statusDot} ${statusClass(
                            tool.status
                          )}`}
                        />

                        <div>
                          <strong>
                            {
                              tool.name
                            }
                          </strong>

                          <span>
                            {
                              tool.area
                            }
                          </span>
                        </div>
                      </div>

                      <div
                        className={
                          styles.toolDescription
                        }
                      >
                        {
                          tool.detail
                        }
                      </div>

                      <div
                        className={
                          styles.toolMeta
                        }
                      >
                        <span
                          className={`${styles.statusBadge} ${statusClass(
                            tool.status
                          )}`}
                        >
                          {
                            tool.statusLabel
                          }
                        </span>

                        <small>
                          {
                            tool.lastChecked
                          }
                        </small>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          )
        )}
      </div>
    </div>
  );
}