import type {
  ReactNode,
} from "react";

import styles from "./DashboardSectionHeader.module.css";

/**
 * Shared dashboard section heading.
 *
 * This component handles presentation only.
 * Loading, freshness calculations, and data fetching remain
 * outside the component.
 */

export interface DashboardSectionHeaderProps {
  title:
    string;

  description?:
    string;

  metadata?:
    string;

  isRefreshing?:
    boolean;

  refreshLabel?:
    string;

  onRefresh?:
    () =>
      void |
      Promise<void>;

  actions?:
    ReactNode;
}

export function DashboardSectionHeader(
  props:
    DashboardSectionHeaderProps
) {
  const handleRefresh =
    (): void => {
      if (
        !props.onRefresh ||
        props.isRefreshing
      ) {
        return;
      }

      void props.onRefresh();
    };

  return (
    <header
      className={
        styles.header
      }
    >
      <div
        className={
          styles.copy
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

        {props.metadata ? (
          <p
            className={
              styles.meta
            }
          >
            {props.metadata}
          </p>
        ) : null}
      </div>

      {props.actions ||
      props.onRefresh ? (
        <div
          className={
            styles.actions
          }
        >
          {props.actions}

          {props.onRefresh ? (
            <button
              className={
                styles.refreshButton
              }
              disabled={
                props.isRefreshing
              }
              onClick={
                handleRefresh
              }
              type="button"
            >
              {props.isRefreshing
                ? "Refreshing…"
                : props.refreshLabel ??
                  "Refresh"}
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
