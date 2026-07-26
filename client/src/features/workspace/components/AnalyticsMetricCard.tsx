import styles from "./AnalyticsMetricCard.module.css";

/**
 * Presentational analytics KPI card.
 *
 * This component receives already-formatted display values.
 * It must not calculate analytics, format currency, load data,
 * or decide whether an event is valid or chargeable.
 */

export type AnalyticsMetricCardTone =
  | "neutral"
  | "information"
  | "success"
  | "attention"
  | "danger";

export type AnalyticsMetricTrendDirection =
  | "positive"
  | "negative"
  | "neutral";

export interface AnalyticsMetricTrend {
  label:
    string;

  direction:
    AnalyticsMetricTrendDirection;
}

export interface AnalyticsMetricCardProps {
  label:
    string;

  value:
    string;

  supportingText?:
    string;

  trend?:
    AnalyticsMetricTrend;

  tone?:
    AnalyticsMetricCardTone;
}

function getTrendClassName(
  direction:
    AnalyticsMetricTrendDirection
): string {
  switch (direction) {
    case "positive":
      return styles.trendPositive;

    case "negative":
      return styles.trendNegative;

    case "neutral":
      return styles.trendNeutral;
  }
}

export function AnalyticsMetricCard(
  props:
    AnalyticsMetricCardProps
) {
  const tone =
    props.tone ??
    "neutral";

  return (
    <article
      className={
        styles.card
      }
      data-tone={
        tone
      }
    >
      <div
        className={
          styles.header
        }
      >
        <div>
          <p
            className={
              styles.label
            }
          >
            {props.label}
          </p>

          <p
            className={
              styles.value
            }
          >
            {props.value}
          </p>
        </div>

        {props.trend ? (
          <span
            aria-label={
              props.trend.label
            }
            className={[
              styles.trend,
              getTrendClassName(
                props.trend
                  .direction
              ),
            ].join(
              " "
            )}
          >
            {props.trend.label}
          </span>
        ) : null}
      </div>

      {props.supportingText ? (
        <p
          className={
            styles.supportingText
          }
        >
          {props.supportingText}
        </p>
      ) : null}
    </article>
  );
}
