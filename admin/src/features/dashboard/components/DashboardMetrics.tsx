import type {
  DashboardSummary,
} from "../contracts/dashboard-summary.types";

import styles from "../DashboardManager.module.css";

interface DashboardMetricsProps {
  summary: DashboardSummary;
}

function formatCount(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value);
}

export default function DashboardMetrics({
  summary,
}: DashboardMetricsProps) {
  const {
    metrics,
    windows,
  } = summary.users;

  const cards = [
    {
      label: "Registered users",
      value: metrics.totalUsers,
      detail:
        "All non-deleted Poster accounts",
    },
    {
      label: "Daily active users",
      value: metrics.dailyActiveUsers,
      detail:
        `Active in the last ${windows.dailyActiveHours} hours`,
    },
    {
      label: "Monthly active users",
      value: metrics.monthlyActiveUsers,
      detail:
        `Active in the last ${windows.monthlyActiveDays} days`,
    },
    {
      label: "Live active users",
      value: metrics.liveActiveUsers,
      detail:
        `Active in the last ${windows.liveActiveMinutes} minutes`,
    },
  ] as const;

  return (
    <section
      className={styles.metrics}
      aria-label="Authoritative user metrics"
    >
      {cards.map((card) => (
        <article
          key={card.label}
          className={styles.metricCard}
        >
          <span>{card.label}</span>

          <strong>
            {formatCount(card.value)}
          </strong>

          <small>{card.detail}</small>
        </article>
      ))}
    </section>
  );
}
