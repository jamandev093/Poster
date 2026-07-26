import type {
  ReactNode,
} from "react";

import styles from "./FinancialSummaryGrid.module.css";

/**
 * Responsive financial-summary layout.
 *
 * This component controls layout only.
 * Financial calculations and formatting remain outside it.
 */

export interface FinancialSummaryGridProps {
  children:
    ReactNode;

  ariaLabel?:
    string;
}

export function FinancialSummaryGrid(
  props:
    FinancialSummaryGridProps
) {
  return (
    <section
      aria-label={
        props.ariaLabel ??
        "Financial summary"
      }
      className={
        styles.grid
      }
    >
      {props.children}
    </section>
  );
}
