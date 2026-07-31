import Link from "next/link";

import styles from "./route-boundary.module.css";

export default function NotFound() {
  return (
    <main className={styles.boundary}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>
          Poster Admin
        </p>

        <h1>Workspace not found</h1>

        <p>
          The requested Admin route does not exist
          or is no longer available.
        </p>

        <div className={styles.actions}>
          <Link
            href="/"
            className={styles.primaryButton}
          >
            Return to Dashboard
          </Link>

          <Link
            href="/system-status"
            className={styles.secondaryButton}
          >
            View System Status
          </Link>
        </div>
      </section>
    </main>
  );
}
