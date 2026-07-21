import type { ReactNode } from "react";

import Link from "next/link";

import styles from "./AuthShell.module.css";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  description: string;
}

export default function AuthShell({
  children,
  title,
  description,
}: AuthShellProps) {
  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <Link href="/login" className={styles.brand}>
          <span className={styles.brandMark}>P</span>

          <span>
            <strong>Poster</strong>
            <small>Client</small>
          </span>
        </Link>

        <div className={styles.brandContent}>
          <span className={styles.eyebrow}>
            Commercial workspace
          </span>

          <h1>
            Requests, campaigns, and performance in one place.
          </h1>

          <div className={styles.featureList}>
            <div>
              <span>01</span>
              Submit sponsorship and affiliate requests
            </div>

            <div>
              <span>02</span>
              Track Admin review and requested changes
            </div>

            <div>
              <span>03</span>
              View campaign delivery and results
            </div>
          </div>
        </div>

        <p className={styles.brandFooter}>
          One organization · One primary client
        </p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.mobileBrand}>
          <Link href="/login">
            <span>P</span>
            <strong>Poster Client</strong>
          </Link>
        </div>

        <div className={styles.formContainer}>
          <header className={styles.formHeader}>
            <h2>{title}</h2>
            <p>{description}</p>
          </header>

          {children}
        </div>
      </section>
    </main>
  );
}