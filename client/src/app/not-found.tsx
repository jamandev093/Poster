import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>
          404 — Page not found
        </p>

        <h1>
          This Client page could not be found.
        </h1>

        <p className={styles.description}>
          The address may be incorrect, the page may have
          moved, or you may need to sign in before accessing
          this area.
        </p>

        <div className={styles.actions}>
          <Link
            href="/login"
            className={styles.primaryAction}
          >
            Go to sign in
          </Link>

          <Link
            href="/dashboard"
            className={styles.secondaryAction}
          >
            Open dashboard
          </Link>
        </div>

        <a
          href="https://getpostar.com"
          className={styles.websiteLink}
        >
          Return to getpostar.com
        </a>
      </section>
    </main>
  );
}