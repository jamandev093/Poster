import Link from "next/link";

const stats = [
  [
    "Active content",
    "2",
    "Currently discoverable records",
  ],
  [
    "Active sources",
    "2",
    "Sources currently active",
  ],
  [
    "Registered users",
    "8,250",
    "Total Poster accounts",
  ],
  [
    "Active campaigns",
    "3",
    "Commercial placements running",
  ],
] as const;

const attention = [
  {
    label: "Copyright",
    reference: "CR-1001 · CNT-2001",
    title: "Copyright strike by BBC",
    description:
      "Verified rights request awaiting an operator decision.",
    href: "/copyright",
    severity: "high",
  },

  {
    label: "Source health",
    reference: "SRC-1003",
    title: "Example News is paused",
    description:
      "Authorized RSS source has a sync issue and should be reviewed before enabling.",
    href: "/sources?record=SRC-1003",
    severity: "medium",
  },

  {
    label: "Reports",
    reference: "RPT queue",
    title: "Actionable reports need review",
    description:
      "Review serious content, source, commercial, and copyright-related exceptions.",
    href: "/reports",
    severity: "low",
  },
] as const;

const activity = [
  {
    title: "Copyright request verified",
    detail: "CR-1001 · CNT-2001 · BBC",
    time: "Today",
  },

  {
    title: "Content removed",
    detail: "CR-1000 · CNT-2000 · Example Media",
    time: "18 min ago",
  },

  {
    title: "Source paused",
    detail: "SRC-1003 · Example News · Sync issue",
    time: "1 hr ago",
  },

  {
    title: "Report received",
    detail: "RPT-2046 · CNT-2003 · Misleading content",
    time: "Today",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="stack">
      <section className="hero">
        <div>
          <div className="eyebrow">
            Operations overview
          </div>

          <h2>
            Dashboard
          </h2>

          <p>
            See Poster&apos;s current operational state,
            review exceptions, and move directly to the
            records that require attention.
          </p>
        </div>

        <div className="hero-status">
          <span className="system-state">
            Admin frontend healthy
          </span>

          <span>
            3 areas need attention
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
              3
            </span>
          </div>

          <div>
            {attention.map(
              ({
                label,
                reference,
                title,
                description,
                href,
                severity,
              }) => (
                <Link
                  key={`${label}-${reference}`}
                  href={href}
                  className="attention"
                >
                  <i
                    className={`marker ${severity}`}
                  />

                  <div>
                    <small>
                      {label}
                      {" · "}
                      {reference}
                    </small>

                    <strong>
                      {title}
                    </strong>

                    <p>
                      {description}
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
              ({
                title,
                detail,
                time,
              }) => (
                <div
                  key={`${title}-${detail}`}
                >
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
            System health has its own dedicated view.
          </strong>

          <p>
            Monitor Admin tools, APIs, RSS ingestion,
            database connectivity, AI services, and
            notification health from System Status.
            Dashboard stays focused on operational
            exceptions and recent activity.
          </p>
        </div>

        <Link
          href="/system-status"
          className="primary"
        >
          View System Status
        </Link>
      </section>
    </div>
  );
}