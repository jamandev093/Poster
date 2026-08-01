import styles from "../DashboardManager.module.css";

interface DashboardStateProps {
  type: "loading" | "error";
  message?: string;
  onRetry?: () => void;
}

export default function DashboardState({
  type,
  message,
  onRetry,
}: DashboardStateProps) {
  if (type === "loading") {
    return (
      <section
        className={styles.state}
        aria-live="polite"
      >
        <span
          className={styles.spinner}
          aria-hidden="true"
        />

        <h2>Loading Dashboard</h2>

        <p>
          Reading the latest operational
          metrics from Poster Backend.
        </p>
      </section>
    );
  }

  return (
    <section
      className={styles.state}
      role="alert"
    >
      <h2>Dashboard unavailable</h2>

      <p>
        {message ??
          "The Dashboard summary could not be loaded."}
      </p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </section>
  );
}
