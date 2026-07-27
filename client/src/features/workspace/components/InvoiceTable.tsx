import type {
  PaymentDashboardInvoiceRow,
} from "../adapters/payment-dashboard.adapter";

import {
  formatFinancialDate,
  formatMoneyMinor,
} from "../payments/payment.formatters";

import {
  getInvoiceStatusPresentation,
} from "../payments/payment.status";

import styles from "./InvoiceTable.module.css";

export interface InvoiceTableProps {
  invoices:
    PaymentDashboardInvoiceRow[];

  onPayInvoice?:
    (
      invoice:
        PaymentDashboardInvoiceRow
    ) =>
      void |
      Promise<void>;

  payingInvoiceId?:
    string |
    null;
}

function canInvoiceRowAcceptPayment(
  invoice:
    PaymentDashboardInvoiceRow
): boolean {
  return (
    invoice.outstandingMinor >
      0 &&
    (
      invoice.status ===
        "issued" ||
      invoice.status ===
        "payment_pending" ||
      invoice.status ===
        "partially_paid" ||
      invoice.status ===
        "overdue"
    )
  );
}

function getStatusClassName(
  tone:
    ReturnType<
      typeof getInvoiceStatusPresentation
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

export function InvoiceTable(
  props:
    InvoiceTableProps
) {
  if (
    props.invoices.length ===
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
            No invoices yet
          </h2>

          <p
            className={
              styles.emptyDescription
            }
          >
            Issued invoices, outstanding balances, payment
            status, and invoice documents will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Invoices"
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
                Invoice
              </th>

              <th scope="col">
                Campaign
              </th>

              <th scope="col">
                Issued
              </th>

              <th scope="col">
                Due
              </th>

              <th scope="col">
                Total
              </th>

              <th scope="col">
                Paid
              </th>

              <th scope="col">
                Outstanding
              </th>

              <th scope="col">
                Status
              </th>

              <th scope="col">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {props.invoices.map(
              (
                invoice
              ) => {
                const status =
                  getInvoiceStatusPresentation(
                    invoice.status
                  );

                const canPay =
                  canInvoiceRowAcceptPayment(
                    invoice
                  );

                const isPaying =
                  props.payingInvoiceId ===
                  invoice.invoiceId;

                return (
                  <tr
                    key={
                      invoice.invoiceId
                    }
                  >
                    <td>
                      <p
                        className={
                          styles.invoiceNumber
                        }
                      >
                        {invoice.invoiceNumber}
                      </p>

                      <p
                        className={
                          styles.secondaryText
                        }
                      >
                        {invoice.invoiceId}
                      </p>
                    </td>

                    <td>
                      {invoice.campaignId ??
                        "General funding"}
                    </td>

                    <td>
                      {formatFinancialDate(
                        invoice.issuedAt
                      )}
                    </td>

                    <td>
                      {formatFinancialDate(
                        invoice.dueAt
                      )}
                    </td>

                    <td
                      className={
                        styles.money
                      }
                    >
                      {formatMoneyMinor(
                        invoice.totalMinor,
                        invoice.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        invoice.paidMinor >
                        0
                          ? styles.paid
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
                        invoice.paidMinor,
                        invoice.currency
                      )}
                    </td>

                    <td
                      className={[
                        styles.money,
                        invoice.outstandingMinor >
                        0
                          ? styles.outstanding
                          : styles.paid,
                      ].join(
                        " "
                      )}
                    >
                      {formatMoneyMinor(
                        invoice.outstandingMinor,
                        invoice.currency
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
                          styles.actions
                        }
                      >
                        {invoice.documentUrl ? (
                          <a
                            className={
                              styles.secondaryAction
                            }
                            href={
                              invoice.documentUrl
                            }
                            rel="noreferrer"
                            target="_blank"
                          >
                            View invoice
                          </a>
                        ) : null}

                        {canPay ? (
                          <button
                            className={
                              styles.primaryAction
                            }
                            disabled={
                              !props.onPayInvoice ||
                              isPaying
                            }
                            onClick={
                              () => {
                                if (
                                  !props.onPayInvoice
                                ) {
                                  return;
                                }

                                void props.onPayInvoice(
                                  invoice
                                );
                              }
                            }
                            title={
                              props.onPayInvoice
                                ? undefined
                                : "Online payment is currently unavailable."
                            }
                            type="button"
                          >
                            {isPaying
                              ? "Opening…"
                              : "Pay now"}
                          </button>
                        ) : null}
                      </div>
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