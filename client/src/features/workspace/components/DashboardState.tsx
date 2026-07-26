"use client";

import type {
  ReactNode,
} from "react";

import styles from "./DashboardState.module.css";

/**
 * Shared workspace dashboard state presentation.
 *
 * Responsibilities:
 *
 * - initial loading state;
 * - refresh state;
 * - recoverable error state;
 * - empty-result state;
 * - refresh action;
 * - consistent accessible messaging.
 *
 * This component must not:
 *
 * - fetch data;
 * - import fixtures;
 * - calculate analytics;
 * - calculate balances;
 * - process payments;
 * - mutate domain records.
 */

export interface DashboardStateProps {
  isLoading:
    boolean;

  isRefreshing?:
    boolean;

  error?:
    string |
    null;

  isEmpty?:
    boolean;

  loadingTitle?:
    string;

  loadingDescription?:
    string;

  errorTitle?:
    string;

  emptyTitle?:
    string;

  emptyDescription?:
    string;

  refreshLabel?:
    string;

  onRefresh?:
    () =>
      void |
      Promise<void>;

  children:
    ReactNode;
}

function DashboardMessage(
  props: {
    title:
      string;

    description?:
      string;

    actionLabel?:
      string;

    onAction?:
      () =>
        void |
        Promise<void>;

    busy?:
      boolean;
  }
) {
  const handleAction =
    (): void => {
      if (
        !props.onAction ||
        props.busy
      ) {
        return;
      }

      void props.onAction();
    };

  return (
    <section
      aria-busy={
        props.busy
      }
      aria-live="polite"
      className={
        styles.state
      }
    >
      <div
        className={
          styles.content
        }
      >
        <h2
          className={
            styles.title
          }
        >
          {props.title}
        </h2>

        {props.description ? (
          <p
            className={
              styles.description
            }
          >
            {props.description}
          </p>
        ) : null}

        {props.actionLabel &&
        props.onAction ? (
          <button
            className={
              styles.action
            }
            disabled={
              props.busy
            }
            onClick={
              handleAction
            }
            type="button"
          >
            {props.busy
              ? "Refreshing…"
              : props.actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function DashboardState(
  props:
    DashboardStateProps
) {
  if (
    props.isLoading
  ) {
    return (
      <DashboardMessage
        busy
        description={
          props.loadingDescription ??
          "Preparing the latest workspace information."
        }
        title={
          props.loadingTitle ??
          "Loading dashboard"
        }
      />
    );
  }

  if (
    props.error &&
    !props.children
  ) {
    return (
      <DashboardMessage
        actionLabel={
          props.refreshLabel ??
          "Try again"
        }
        busy={
          props.isRefreshing
        }
        description={
          props.error
        }
        onAction={
          props.onRefresh
        }
        title={
          props.errorTitle ??
          "Unable to load dashboard"
        }
      />
    );
  }

  if (
    props.isEmpty
  ) {
    return (
      <DashboardMessage
        actionLabel={
          props.onRefresh
            ? props.refreshLabel ??
              "Refresh"
            : undefined
        }
        busy={
          props.isRefreshing
        }
        description={
          props.emptyDescription ??
          "No records are available for the selected view."
        }
        onAction={
          props.onRefresh
        }
        title={
          props.emptyTitle ??
          "Nothing to show yet"
        }
      />
    );
  }

  return (
    <>
      {props.error ? (
        <div
          aria-live="polite"
          className={
            styles.inlineError
          }
          role="status"
        >
          <span>
            {props.error}
          </span>

          {props.onRefresh ? (
            <button
              disabled={
                props.isRefreshing
              }
              onClick={
                () => {
                  void props.onRefresh?.();
                }
              }
              type="button"
            >
              {props.isRefreshing
                ? "Refreshing…"
                : props.refreshLabel ??
                  "Try again"}
            </button>
          ) : null}
        </div>
      ) : null}

      {props.children}
    </>
  );
}
