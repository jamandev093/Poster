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
      <aside className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <Link
            href="/login"
            className={styles.brand}
          >
            <span className={styles.brandMark}>
              P
            </span>

            <span className={styles.brandText}>
              <strong>Poster</strong>
              <small>Client Workspace</small>
            </span>
          </Link>
        </div>

        <div className={styles.workspaceIntro}>
          <div className={styles.eyebrow}>
            FOR BUSINESS PARTNERS
          </div>

          <h1>
            Manage commercial work with Poster.
          </h1>

          <p>
            Submit requests, follow campaign status,
            and review performance from one workspace.
          </p>

          <div className={styles.capabilities}>
            <div className={styles.capability}>
              <span className={styles.capabilityMark}>
                ✓
              </span>

              <span>
                Sponsorship and affiliate requests
              </span>
            </div>

            <div className={styles.capability}>
              <span className={styles.capabilityMark}>
                ✓
              </span>

              <span>
                Campaign status and delivery
              </span>
            </div>

            <div className={styles.capability}>
              <span className={styles.capabilityMark}>
                ✓
              </span>

              <span>
                Performance and conversion reporting
              </span>
            </div>
          </div>
        </div>

        <footer className={styles.brandFooter}>
          <span>Poster</span>

          <span className={styles.footerDivider}>
            ·
          </span>

          <span>Commercial Operations</span>
        </footer>
      </aside>

      <section className={styles.formPanel}>
        <div className={styles.mobileBrand}>
          <Link href="/login">
            <span>P</span>

            <div>
              <strong>Poster</strong>
              <small>Client Workspace</small>
            </div>
          </Link>
        </div>

        <div className={styles.formWrap}>
          <section className={styles.authCard}>
            <header className={styles.formHeader}>
              <h2>{title}</h2>

              <p>{description}</p>
            </header>

            {children}
          </section>

          <div className={styles.securityNote}>
            Secure access for approved Poster business
            accounts.
          </div>
        </div>
      </section>
    </main>
  );
}