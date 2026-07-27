import Link from "next/link";

import type {
  PaymentDashboardBalanceSummary,
} from "../adapters/payment-dashboard.adapter";

import {
  formatFinancialDateTime,
  formatMoneyMinor,
  formatPercentage,
} from "../payments/payment.formatters";

import {
  getCampaignBudgetStatusPresentation,
} from "../payments/payment.status";

import styles from "./CampaignBalancesTable.module.css";

export interface CampaignBalancesTableProps {
  balances:
    PaymentDashboardBalanceSummary[];
}

function getStatusClassName(
  tone:
    ReturnType<
      typeof getCampaignBudgetStatusPresentation
    >["tone"]
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

function clampPercentage(
  value:
    number |
    null
): number {
  if (
    value === null ||
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.min(
    Math.max(
      value,
      0
    ),
    100
  );
}

export function CampaignBalancesTable(
  props:
    CampaignBalancesTableProps
) {
  if (
    props.balances.length ===
    0
  ) {
    return (
      <section
        className={
          styles.card
        }
      >
        <div
          className={
            styles.empty
          }
        >
          <h2
            className={
              styles.emptyTitle
            }
          >
            No campaign balances yet
          </h2>

          <p
            className={
              styles.emptyDescription
            }
          >
            Campaign allocations, available funds, finalized
            spend, credits, refunds, and remaining balances will
            appear here after funding is recorded.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Campaign balances"
      className={
        styles.card
      }
    >
      <div
        className={
          styles.tableScroller
        }
      >
        <table
          className={
            styles.table
          }
        >
          <thead>
            <tr>
              <th scope="col">
                Campaign
              </th>

              <th scope="col">
                Status
              </th>

              <th scope="col">
                Paid funds
              </th>

              <th scope="col">
                Available
              </th>

              <th scope="col">
                Reserved
              </th>

              <th scope="col">
                Estimated spend
              </th>

              <th scope="col">
                Pending validation
              </th>

              <th scope="col">
                Finalized spend
              </th>

              <th scope="col">
                Credits
              </th>

              <th scope="col">
                Refunds
              </th>

              <th scope="col">
                Disputed
              </th>

              <th scope="col">
                Remaining
              </th>

              <th scope="col">
                Utilization
              </th>

              <th scope="col">
                Freshness
              </th>

              <th scope="col">
                Notices
              </th>
            </tr>
          </thead>

          <tbody>
            {props.balances.map(
              (
                balance
              ) => {
                const status =
                  getCampaignBudgetStatusPresentation(
                    balance.budgetStatus
                  );

                const totalCreditMinor =
                  balance.invalidTrafficCreditMinor +
                  balance.adjustmentCreditMinor;

                const totalRefundMinor =
                  balance.refundReservedMinor +
                  balance.refundedMinor;

                const utilizationWidth =
                  clampPercentage(
                    balance.utilizationPercentage
                  );

                return (
                  <tr
                    key={
                      balance.campaignId
                    }
                  >
                    <td>
                      <Link
                        className={
                          styles.campaignLink
                        }
                        href={`/campaigns/${balance.campaignId}`}
                      >
                        {balance.campaignId}
                      </Link>

                      <p
                        className={
                          styles.secondaryText
                        }
                      >
                        Allocated{" "}
                        {formatMoneyMinor(
                          balance.allocatedMinor,
                          balance.currency
                        )}
                      </p>
                    </td>

                    <td>
                      <span
                        className={[
                          styles.status,
                          getStatusClassName(
                            status.tone
                          ),
                        ].join(
                          " "
                        )}
                        title={
                          status.description
                        }
                      >
                        {status.label}
                      </span>
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        balance.paidMinor,
                        balance.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        balance.availableMinor >
                        0
                          ? styles.available
                          : styles.attention,
                      ].join(
                        " "
                      )}
                    >
                      {formatMoneyMinor(
                        balance.availableMinor,
                        balance.currency
                      )}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        balance.reservedMinor,
                        balance.currency
                      )}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        balance.estimatedSpendMinor,
                        balance.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        balance.pendingValidationSpendMinor >
                        0
                          ? styles.attention
                          : "",
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}
                    >
                      {formatMoneyMinor(
                        balance.pendingValidationSpendMinor,
                        balance.currency
                      )}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        balance.finalizedSpendMinor,
                        balance.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        totalCreditMinor >
                        0
                          ? styles.available
                          : "",
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}
                    >
                      {formatMoneyMinor(
                        totalCreditMinor,
                        balance.currency
                      )}

                      {balance.adjustmentDebitMinor >
                      0 ? (
                        <p
                          className={
                            styles.secondaryText
                          }
                        >
                          Debits{" "}
                          {formatMoneyMinor(
                            balance.adjustmentDebitMinor,
                            balance.currency
                          )}
                        </p>
                      ) : null}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        totalRefundMinor,
                        balance.currency
                      )}

                      {balance.refundReservedMinor >
                      0 ? (
                        <p
                          className={
                            styles.secondaryText
                          }
                        >
                          Reserved{" "}
                          {formatMoneyMinor(
                            balance.refundReservedMinor,
                            balance.currency
                          )}
                        </p>
                      ) : null}
                    </td>

                    <td
                      className={[
                        styles.money,
                        balance.disputedMinor >
                        0
                          ? styles.danger
                          : "",
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}
                    >
                      {formatMoneyMinor(
                        balance.disputedMinor,
                        balance.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        balance.remainingMinor >
                        0
                          ? styles.available
                          : styles.attention,
                      ].join(
                        " "
                      )}
                    >
                      {formatMoneyMinor(
                        balance.remainingMinor,
                        balance.currency
                      )}

                      <p
                        className={
                          styles.secondaryText
                        }
                      >
                        {formatPercentage(
                          balance.remainingPercentage
                        )}{" "}
                        remaining
                      </p>
                    </td>

                    <td>
                      <div
                        className={
                          styles.utilization
                        }
                      >
                        <div
                          className={
                            styles.utilizationHeader
                          }
                        >
                          <span>
                            Used
                          </span>

                          <strong>
                            {formatPercentage(
                              balance.utilizationPercentage
                            )}
                          </strong>
                        </div>

                        <div
                          aria-hidden="true"
                          className={
                            styles.progressTrack
                          }
                        >
                          <span
                            className={
                              styles.progressValue
                            }
                            style={{
                              width:
                                `${utilizationWidth}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <p
                        className={
                          styles.secondaryText
                        }
                      >
                        Data through
                      </p>

                      {formatFinancialDateTime(
                        balance.dataThrough
                      )}

                      <p
                        className={
                          styles.secondaryText
                        }
                      >
                        Reconciled{" "}
                        {formatFinancialDateTime(
                          balance.lastReconciledAt
                        )}
                      </p>
                    </td>

                    <td>
                      {balance.warningMessages.length >
                      0 ? (
                        <ul
                          className={
                            styles.warningList
                          }
                        >
                          {balance.warningMessages.map(
                            (
                              warning,
                              warningIndex
                            ) => (
                              <li
                                className={
                                  styles.warningItem
                                }
                                key={`${balance.campaignId}-${warningIndex}`}
                              >
                                {warning}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <span
                          className={
                            styles.noWarnings
                          }
                        >
                          No notices
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}