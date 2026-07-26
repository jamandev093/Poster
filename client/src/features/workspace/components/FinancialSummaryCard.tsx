import styles from "./FinancialSummaryCard.module.css";

/**
 * Presentational advertiser financial-summary card.
 *
 * All monetary values must be formatted before they reach
 * this component.
 *
 * This component must not calculate balances, read ledger
 * entries, load invoices, or process payments.
 */

export type FinancialSummaryCardTone =
  | "neutral"
  | "information"
  | "success"
  | "attention"
  | "danger";

export interface FinancialSummaryCardStatus {
  label:
    string;

  tone:
    FinancialSummaryCardTone;
}

export interface FinancialSummaryCardDetail {
  label:
    string;

  value:
    string;
}

export interface FinancialSummaryCardProps {
  label:
    string;

  value:
    string;

  description?:
    string;

  status?:
    FinancialSummaryCardStatus;

  details?:
    FinancialSummaryCardDetail[];

  tone?:
    FinancialSummaryCardTone;
}

function getStatusClassName(
  tone:
    FinancialSummaryCardTone
): string {
  switch (tone) {
    case "neutral":
      return styles.statusNeutral;

    case "information":
      return styles.statusInformation;

    case "success":
      return styles.statusSuccess;

    case "attention":
      return styles.statusAttention;

    case "danger":
      return styles.statusDanger;
  }
}

export function FinancialSummaryCard(
  props:
    FinancialSummaryCardProps
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

        {props.status ? (
          <span
            className={[
              styles.status,
              getStatusClassName(
                props.status.tone
              ),
            ].join(
              " "
            )}
          >
            {props.status.label}
          </span>
        ) : null}
      </div>

      {props.description ? (
        <p
          className={
            styles.description
          }
        >
          {props.description}
        </p>
      ) : null}

      {props.details?.length ? (
        <dl
          className={
            styles.detailList
          }
        >
          {props.details.map(
            (
              detail
            ) => (
              <div
                className={
                  styles.detail
                }
                key={
                  detail.label
                }
              >
                <dt
                  className={
                    styles.detailLabel
                  }
                >
                  {detail.label}
                </dt>

                <dd
                  className={
                    styles.detailValue
                  }
                >
                  {detail.value}
                </dd>
              </div>
            )
          )}
        </dl>
      ) : null}
    </article>
  );
}
