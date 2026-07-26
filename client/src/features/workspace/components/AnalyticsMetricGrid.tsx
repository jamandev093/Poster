import type {
  ReactNode,
} from "react";

import styles from "./AnalyticsMetricGrid.module.css";

/**
 * Responsive analytics metric-card layout.
 *
 * This component only controls layout.
 * Metric content and business meaning remain outside it.
 */

export interface AnalyticsMetricGridProps {
  children:
    ReactNode;

  ariaLabel?:
    string;
}

export function AnalyticsMetricGrid(
  props:
    AnalyticsMetricGridProps
) {
  return (
    <section
      aria-label={
        props.ariaLabel ??
        "Analytics summary"
      }
      className={
        styles.grid
      }
    >
      {props.children}
    </section>
  );
}
