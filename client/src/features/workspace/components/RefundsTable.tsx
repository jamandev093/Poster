import Link from "next/link";

import type {
  PaymentDashboardRefundRow,
} from "../adapters/payment-dashboard.adapter";

import type {
  RefundReason,
} from "../payments/refund.types";

import {
  formatFinancialDateTime,
  formatMoneyMinor,
} from "../payments/payment.formatters";

import {
  getRefundStatusPresentation,
} from "../payments/payment.status";

import styles from "./RefundsTable.module.css";

export interface RefundsTableProps {
  refunds:
    PaymentDashboardRefundRow[];
}

function formatRefundReason(
  reason:
    RefundReason
): string {
  switch (reason) {
    case "unused_campaign_balance":
      return "Unused campaign balance";

    case "invalid_traffic_credit":
      return "Invalid-traffic credit";

    case "duplicate_charge":
      return "Duplicate charge";

    case "campaign_cancelled":
      return "Campaign cancelled";

    case "campaign_under_delivery":
      return "Campaign under-delivery";

    case "contract_adjustment":
      return "Contract adjustment";

    case "payment_error":
      return "Payment error";

    case "billing_correction":
      return "Billing correction";

    case "goodwill":
      return "Goodwill";

    case "other":
      return "Other";
  }
}

function formatExecutionMode(
  mode:
    PaymentDashboardRefundRow["executionMode"]
): string {
  switch (mode) {
    case "normal":
      return "Standard";

    case "instant":
      return "Instant";

    case "manual":
      return "Manual";
  }
}

function getStatusClassName(
  tone:
    ReturnType<
      typeof getRefundStatusPresentation
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

function getLatestRefundTimestamp(
  refund:
    PaymentDashboardRefundRow
): string {
  return (
    refund.refundedAt ??
    refund.failedAt ??
    refund.approvedAt
  );
}

export function RefundsTable(
  props:
    RefundsTableProps
) {
  if (
    props.refunds.length ===
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
            No refund records yet
          </h2>

          <p
            className={
              styles.emptyDescription
            }
          >
            Refund requests, approvals, processing progress,
            completed amounts, and provider references will
            appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Refund records"
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
                Refund
              </th>

              <th scope="col">
                Invoice
              </th>

              <th scope="col">
                Payment
              </th>

              <th scope="col">
                Campaign
              </th>

              <th scope="col">
                Reason
              </th>

              <th scope="col">
                Requested
              </th>

              <th scope="col">
                Approved
              </th>

              <th scope="col">
                Refunded
              </th>

              <th scope="col">
                Mode
              </th>

              <th scope="col">
                Status
              </th>

              <th scope="col">
                Provider reference
              </th>

              <th scope="col">
                Updated
              </th>
            </tr>
          </thead>

          <tbody>
            {props.refunds.map(
              (
                refund
              ) => {
                const status =
                  getRefundStatusPresentation(
                    refund.status
                  );

                return (
                  <tr
                    key={
                      refund.refundId
                    }
                  >
                    <td>
                      <p
                        className={
                          styles.primaryText
                        }
                      >
                        {refund.refundId}
                      </p>

                      <p
                        className={
                          styles.secondaryText
                        }
                      >
                        Request{" "}
                        {refund.refundRequestId}
                      </p>
                    </td>

                    <td>
                      {refund.invoiceId}
                    </td>

                    <td>
                      {refund.paymentId}
                    </td>

                    <td>
                      {refund.campaignId ? (
                        <Link
                          href={`/campaigns/${refund.campaignId}`}
                        >
                          {refund.campaignId}
                        </Link>
                      ) : (
                        "General funding"
                      )}
                    </td>

                    <td>
                      {formatRefundReason(
                        refund.reason
                      )}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        refund.requestedAmountMinor,
                        refund.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        refund.approvedAmountMinor >
                        0
                          ? styles.moneyAttention
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
                        refund.approvedAmountMinor,
                        refund.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        refund.refundedAmountMinor >
                        0
                          ? styles.moneySuccess
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
                        refund.refundedAmountMinor,
                        refund.currency
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          styles.executionMode
                        }
                      >
                        {formatExecutionMode(
                          refund.executionMode
                        )}
                      </span>
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

                    <td>
                      {refund.providerRefundId ??
                        "Not assigned"}

                      {!refund.providerRefundId ? (
                        <p
                          className={
                            styles.secondaryText
                          }
                        >
                          Provider processing has not created a
                          reference.
                        </p>
                      ) : null}
                    </td>

                    <td>
                      {formatFinancialDateTime(
                        getLatestRefundTimestamp(
                          refund
                        )
                      )}

                      {refund.failedAt ? (
                        <p
                          className={
                            styles.secondaryText
                          }
                        >
                          Failed
                        </p>
                      ) : refund.refundedAt ? (
                        <p
                          className={
                            styles.secondaryText
                          }
                        >
                          Completed
                        </p>
                      ) : (
                        <p
                          className={
                            styles.secondaryText
                          }
                        >
                          Approved
                        </p>
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