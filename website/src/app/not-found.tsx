import Link from "next/link";

import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>404 — Page not found</p>

        <h1>
          This page could not
          be found.
        </h1>

        <p className={styles.description}>
          The address may be incorrect, the page may have moved,
          or it may no longer be available.
        </p>

        <div className={styles.actions}>
          <Link
            href="/"
            className={styles.primaryAction}
          >
            Return Home
          </Link>

          <Link
            href="/contact"
            className={styles.secondaryAction}
          >
            Contact Poster
          </Link>
        </div>
      </div>

      <aside className={styles.help}>
        <p className={styles.helpEyebrow}>
          Looking for something specific?
        </p>

        <nav aria-label="Helpful pages">
          <Link href="/how-it-works">
            How Poster Works
            <span aria-hidden="true">→</span>
          </Link>

          <Link href="/get-app">
            Get the App
            <span aria-hidden="true">→</span>
          </Link>

          <Link href="/publishers">
            Publisher information
            <span aria-hidden="true">→</span>
          </Link>

          <Link href="/advertisers">
            Advertiser information
            <span aria-hidden="true">→</span>
          </Link>

          <Link href="/copyright">
            Copyright &amp; Rights
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </aside>
    </section>
  );
}