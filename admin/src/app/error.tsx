"use client";

import {
  useEffect,
} from "react";

import styles from "./route-boundary.module.css";

interface ErrorPageProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps) {
  useEffect(() => {
    console.error(
      "Poster Admin route error:",
      error
    );
  }, [error]);

  return (
    <main className={styles.boundary}>
      <section
        className={styles.card}
        role="alert"
      >
        <p className={styles.eyebrow}>
          Workspace error
        </p>

        <h1>
          This Admin view could not be loaded
        </h1>

        <p>
          Retry the workspace. If the problem
          continues, review the platform status
          and application logs.
        </p>

        {error.digest ? (
          <span className={styles.errorCode}>
            Reference: {error.digest}
          </span>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={reset}
          >
            Retry
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              window.location.assign(
                "/system-status"
              );
            }}
          >
            View System Status
          </button>
        </div>
      </section>
    </main>
  );
}
