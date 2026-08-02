"use client";

import {
  usePublicBusinessIdentity,
} from "@/features/business-identity";

import styles from "./signalcontact.module.css";

type SignalContactVariant =
  | "sidebar";

interface SignalContactProps {
  variant?:
    SignalContactVariant;
}

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

function createClassName(
  base:
    string,
  variant?:
    SignalContactVariant
): string {
  return [
    base,
    variant === "sidebar"
      ? styles.sidebar
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function DisabledSignalContact(
  props: {
    title:
      string;

    variant?:
      SignalContactVariant;
  }
) {
  return (
    <div
      className={createClassName(
        styles.contactDisabled,
        props.variant
      )}
      aria-disabled="true"
      title={props.title}
    >
      <span className={styles.icon}>
        <SignalIcon />
      </span>

      <span className={styles.content}>
        <strong>
          Contact on Signal
        </strong>

        <small>
          Rights support
        </small>
      </span>

      <span className={styles.unavailable}>
        —
      </span>
    </div>
  );
}

export default function SignalContact(
  props:
    SignalContactProps
) {
  const {
    identity,
    isLoading,
  } =
    usePublicBusinessIdentity();

  const signalUrl =
    identity?.signalUrl?.trim() ??
    "";

  const signalLabel =
    identity?.signalLabel?.trim() ||
    "Contact on Signal";

  if (
    isLoading
  ) {
    return (
      <DisabledSignalContact
        variant={
          props.variant
        }
        title="Loading official Signal contact from Poster Business Identity."
      />
    );
  }

  if (
    !signalUrl
  ) {
    return (
      <DisabledSignalContact
        variant={
          props.variant
        }
        title="Signal support is currently unavailable."
      />
    );
  }

  return (
    <a
      href={signalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={createClassName(
        styles.contact,
        props.variant
      )}
      aria-label={`${signalLabel} — opens Signal in a new tab`}
    >
      <span className={styles.icon}>
        <SignalIcon />
      </span>

      <span className={styles.content}>
        <strong>
          {
            signalLabel
          }
        </strong>

        <small>
          Rights support
        </small>
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