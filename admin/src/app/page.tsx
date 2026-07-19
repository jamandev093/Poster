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
    "Only reports that need operator action are shown.",
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
            Monitor Poster operations,
            review exceptions, and handle
            the actions that require your
            attention.
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
              <span>
                {label}
              </span>

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
                Needs attention
              </div>

              <h3>
                Exceptions
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
                Activity
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
            Poster handles routine operations automatically.
          </strong>

          <p>
            Admin is focused on exceptions,
            legal requests, source issues,
            reports, campaigns, and essential
            account actions.
          </p>
        </div>

        <Link
          href="/copyright"
          className="primary"
        >
          Review copyright
        </Link>
      </section>
    </div>
  );
}