import type {
  PaymentDashboardPaymentRow,
} from "../adapters/payment-dashboard.adapter";

import type {
  PaymentMethodDetails,
  PaymentProvider,
} from "../payments/payment.types";

import {
  formatFinancialDateTime,
  formatMoneyMinor,
} from "../payments/payment.formatters";

import {
  getPaymentStatusPresentation,
} from "../payments/payment.status";

import styles from "./PaymentHistoryTable.module.css";

export interface PaymentHistoryTableProps {
  payments:
    PaymentDashboardPaymentRow[];
}

function formatProvider(
  provider:
    PaymentProvider
): string {
  switch (provider) {
    case "razorpay":
      return "Razorpay";

    case "manual_bank_transfer":
      return "Manual bank transfer";
  }
}

function formatPaymentMethod(
  details:
    PaymentMethodDetails
): string {
  switch (details.method) {
    case "upi":
      return details.upiHandleMasked
        ? `UPI · ${details.upiHandleMasked}`
        : "UPI";

    case "card": {
      const network =
        details.cardNetwork
          ? details.cardNetwork.toUpperCase()
          : "Card";

      const ending =
        details.cardLastFour
          ? ` ending ${details.cardLastFour}`
          : "";

      return `${network}${ending}`;
    }

    case "netbanking":
      return details.bankName
        ? `Netbanking · ${details.bankName}`
        : "Netbanking";

    case "bank_transfer":
      return details.bankName
        ? `Bank transfer · ${details.bankName}`
        : "Bank transfer";

    case "wallet":
      return "Wallet";

    case "unknown":
      return "Method unavailable";
  }
}

function getStatusClassName(
  tone:
    ReturnType<
      typeof getPaymentStatusPresentation
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

export function PaymentHistoryTable(
  props:
    PaymentHistoryTableProps
) {
  if (
    props.payments.length ===
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
            No payment records yet
          </h2>

          <p
            className={
              styles.emptyDescription
            }
          >
            Verified payments, provider references, methods,
            captured amounts, and refund activity will appear
            here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Payment history"
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
                Payment
              </th>

              <th scope="col">
                Invoice
              </th>

              <th scope="col">
                Campaign
              </th>

              <th scope="col">
                Provider
              </th>

              <th scope="col">
                Method
              </th>

              <th scope="col">
                Amount
              </th>

              <th scope="col">
                Captured
              </th>

              <th scope="col">
                Refunded
              </th>

              <th scope="col">
                Status
              </th>

              <th scope="col">
                Verification
              </th>

              <th scope="col">
                Paid
              </th>
            </tr>
          </thead>

          <tbody>
            {props.payments.map(
              (
                payment
              ) => {
                const status =
                  getPaymentStatusPresentation(
                    payment.status
                  );

                return (
                  <tr
                    key={
                      payment.paymentId
                    }
                  >
                    <td>
                      <p
                        className={
                          styles.primaryText
                        }
                      >
                        {payment.paymentId}
                      </p>

                      <p
                        className={
                          styles.secondaryText
                        }
                      >
                        {payment.providerPaymentId ??
                          "Provider reference unavailable"}
                      </p>
                    </td>

                    <td>
                      {payment.invoiceId}
                    </td>

                    <td>
                      {payment.campaignId ??
                        "General funding"}
                    </td>

                    <td>
                      {formatProvider(
                        payment.provider
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          styles.method
                        }
                      >
                        {formatPaymentMethod(
                          payment.methodDetails
                        )}
                      </span>

                      {payment.methodDetails
                        .international ? (
                        <p
                          className={
                            styles.secondaryText
                          }
                        >
                          International
                        </p>
                      ) : null}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        payment.amountMinor,
                        payment.currency
                      )}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        payment.capturedAmountMinor,
                        payment.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        payment.refundedAmountMinor >
                        0
                          ? styles.refunded
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
                        payment.refundedAmountMinor,
                        payment.currency
                      )}
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
                      <div
                        className={
                          styles.validationStack
                        }
                      >
                        <span
                          className={
                            styles.validationItem
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={[
                              styles.validationDot,
                              payment.paymentVerified
                                ? styles.validationDotSuccess
                                : styles.validationDotDanger,
                            ].join(
                              " "
                            )}
                          />

                          {payment.paymentVerified
                            ? "Webhook verified"
                            : "Not verified"}
                        </span>

                        <span
                          className={
                            styles.validationItem
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={[
                              styles.validationDot,
                              payment.riskAccepted
                                ? styles.validationDotSuccess
                                : styles.validationDotDanger,
                            ].join(
                              " "
                            )}
                          />

                          {payment.riskAccepted
                            ? "Risk accepted"
                            : "Risk not accepted"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {formatFinancialDateTime(
                        payment.paidAt ??
                          payment.createdAt
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