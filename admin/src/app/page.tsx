import Link from "next/link";

const stats = [
  [
    "Active content",
    "18,420",
    "Currently discoverable",
  ],
  [
    "Active sources",
    "134",
    "Connected publishers",
  ],
  [
    "Users",
    "8,250",
    "Registered accounts",
  ],
  [
    "Active campaigns",
    "3",
    "Commercial placements",
  ],
] as const;

const attention = [
  [
    "Copyright",
    "Copyright strike by BBC",
    "1 article requires takedown review.",
    "/copyright",
    "high",
  ],
  [
    "Source health",
    "1 source needs attention",
    "A publisher feed has not synced successfully.",
    "/sources",
    "medium",
  ],
  [
    "Reports",
    "3 content reports",
    "Only reports marked as needing action are shown.",
    "/reports",
    "low",
  ],
] as const;

const activity = [
  [
    "Article removed",
    "Copyright request · Example Media",
    "18 min ago",
  ],
  [
    "Source paused",
    "RSS unavailable · Example News",
    "1 hr ago",
  ],
  [
    "Campaign activated",
    "Poster promotion",
    "Today",
  ],
] as const;

export default function DashboardPage() {
  return (
    <div className="stack">
      <section className="hero">
        <div>
          <div className="eyebrow">
            Overview
          </div>

          <h2>
            Dashboard
          </h2>

          <p>
            Platform status,
            operational exceptions,
            and recent administrative
            activity.
          </p>
        </div>

        <div className="hero-status">
          <span className="system-state">
            Systems normal
          </span>

          <span>
            5 items need attention
          </span>
        </div>
      </section>

      <section
        className="stats"
        aria-label="Platform summary"
      >
        {stats.map(
          ([
            label,
            value,
            detail,
          ]) => (
            <article
              key={label}
              className="stat"
            >
              <span>{label}</span>

              <strong>
                {value}
              </strong>

              <small>
                {detail}
              </small>
            </article>
          )
        )}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">
                Exception queue
              </div>

              <h3>
                Needs attention
              </h3>
            </div>

            <span className="count">
              5
            </span>
          </div>

          <div>
            {attention.map(
              ([
                label,
                title,
                description,
                href,
                severity,
              ]) => (
                <Link
                  key={title}
                  href={href}
                  className="attention"
                >
                  <i
                    className={`marker ${severity}`}
                  />

                  <div>
                    <small>
                      {label}
                    </small>

                    <strong>
                      {title}
                    </strong>

                    <p>
                      {
                        description
                      }
                    </p>
                  </div>

                  <b aria-hidden="true">
                    →
                  </b>
                </Link>
              )
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">
                Audit trail
              </div>

              <h3>
                Recent activity
              </h3>
            </div>
          </div>

          <div className="activity">
            {activity.map(
              ([
                title,
                detail,
                time,
              ]) => (
                <div key={title}>
                  <i />

                  <p>
                    <strong>
                      {title}
                    </strong>

                    <span>
                      {detail}
                    </span>
                  </p>

                  <time>
                    {time}
                  </time>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      <section className="operator-note">
        <div>
          <strong>
            Exception-based operation
          </strong>

          <p>
            Normal ingestion,
            taxonomy evolution,
            ranking, and routine
            processing remain
            automatic. Admin is
            reserved for decisions
            that require operator
            attention.
          </p>
        </div>

        <Link
          className="primary"
          href="/copyright"
        >
          Review copyright
        </Link>
      </section>
    </div>
  );
}