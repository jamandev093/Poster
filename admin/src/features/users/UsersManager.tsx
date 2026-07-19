import PageHeader from "@/components/admin/PageHeader";

import styles from "./UsersManager.module.css";

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
  {
    label: "Live active users",
    value: "184",
    description: "Currently active",
    kind: "live",
  },
] as const;

export default function UsersManager() {
  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Audience"
        title="Users"
        description="A simple view of Poster’s registered and active user base."
      />

      <section
        className={styles.metrics}
        aria-label="User activity metrics"
      >
        {userMetrics.map((metric) => (
          <article
            key={metric.label}
            className={styles.metricCard}
          >
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>
                {metric.label}
              </span>

              {metric.kind === "live" ? (
                <span className={styles.liveIndicator}>
                  <span
                    className={styles.liveDot}
                    aria-hidden="true"
                  />

                  Live
                </span>
              ) : null}
            </div>

            <strong className={styles.metricValue}>
              {metric.value}
            </strong>

            <span className={styles.metricDescription}>
              {metric.description}
            </span>
          </article>
        ))}
      </section>

      <section className={styles.infoPanel}>
        <div>
          <strong>User metrics</strong>

          <p>
            These values are currently demonstration data.
            The backend will later provide registered-user,
            DAU, MAU, and live-session counts from real
            account and activity data.
          </p>
        </div>

        <span className={styles.updated}>
          Backend pending
        </span>
      </section>
    </div>
  );
}