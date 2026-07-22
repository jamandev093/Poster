"use client";

import styles from "./SignalContact.module.css";

const SIGNAL_URL =
  process.env.NEXT_PUBLIC_SIGNAL_CONTACT_URL?.trim() ?? "";

const SIGNAL_LABEL =
  process.env.NEXT_PUBLIC_SIGNAL_CONTACT_LABEL?.trim() ||
  "Contact on Signal";

function SignalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={styles.iconSvg}
    >
      <path d="M12 4.5c-4.7 0-8.5 3.1-8.5 7s3.8 7 8.5 7c1.1 0 2.2-.2 3.2-.5l4 1.4-1.2-3.3c1.6-1.2 2.5-2.8 2.5-4.6 0-3.9-3.8-7-8.5-7Z" />
      <path d="M8.5 11.5h7" />
    </svg>
  );
}

export default function SignalContact() {
  if (!SIGNAL_URL) {
    return (
      <div
        className={styles.contactDisabled}
        aria-disabled="true"
        title="Signal support is not configured yet"
      >
        <span className={styles.icon}>
          <SignalIcon />
        </span>

        <span className={styles.content}>
          <strong>Contact on Signal</strong>
          <small>Direct support</small>
        </span>

        <span className={styles.unavailable}>
          —
        </span>
      </div>
    );
  }

  return (
    <a
      href={SIGNAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.contact}
      aria-label={`${SIGNAL_LABEL} — opens Signal in a new tab`}
    >
      <span className={styles.icon}>
        <SignalIcon />
      </span>

      <span className={styles.content}>
        <strong>{SIGNAL_LABEL}</strong>
        <small>Direct support</small>
      </span>

      <span
        className={styles.arrow}
        aria-hidden="true"
      >
        ↗
      </span>
    </a>
  );
}