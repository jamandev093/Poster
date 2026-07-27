"use client";

import Link from "next/link";

import styles from "./RouteBoundary.module.css";

export type RouteBoundaryVariant =
  | "loading"
  | "error";

export interface RouteBoundaryProps {
  variant:
    RouteBoundaryVariant;

  eyebrow:
    string;

  title:
    string;

  description:
    string;

  actionLabel?:
    string;

  onAction?:
    () => void;

  secondaryHref?:
    string;

  secondaryLabel?:
    string;

  contained?:
    boolean;
}

export default function RouteBoundary({
  variant,
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  secondaryHref,
  secondaryLabel,
  contained = false,
}: RouteBoundaryProps) {
  const loading =
    variant ===
    "loading";

  const hasActions =
    Boolean(
      onAction ||
      (
        secondaryHref &&
        secondaryLabel
      )
    );

  return (
    <section
      className={[
        styles.boundary,
        contained
          ? styles.contained
          : styles.fullPage,
      ].join(" ")}
      aria-busy={
        loading
      }
    >
      <div
        className={
          styles.panel
        }
        role={
          loading
            ? "status"
            : "alert"
        }
        aria-live={
          loading
            ? "polite"
            : "assertive"
        }
      >
        <div
          className={
            loading
              ? styles.loadingIcon
              : styles.errorIcon
          }
          aria-hidden="true"
        >
          {loading ? (
            <span
              className={
                styles.spinner
              }
            />
          ) : (
            "!"
          )}
        </div>

        <p
          className={
            styles.eyebrow
          }
        >
          {eyebrow}
        </p>

        <h1
          className={
            styles.title
          }
        >
          {title}
        </h1>

        <p
          className={
            styles.description
          }
        >
          {description}
        </p>

        {hasActions ? (
          <div
            className={
              styles.actions
            }
          >
            {onAction &&
            actionLabel ? (
              <button
                type="button"
                className={
                  styles.primaryAction
                }
                onClick={
                  onAction
                }
              >
                {actionLabel}
              </button>
            ) : null}

            {secondaryHref &&
            secondaryLabel ? (
              <Link
                href={
                  secondaryHref
                }
                className={
                  styles.secondaryAction
                }
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}