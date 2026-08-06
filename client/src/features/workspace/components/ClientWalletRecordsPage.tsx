"use client";

import {
  useClientWalletOverview,
} from "../hooks/useClientWalletOverview";

import type {
  ClientWalletApiLedgerEntry,
  ClientWalletApiMoney,
  ClientWalletApiOverview,
} from "../services/client-wallet-read.service";

import styles from "./ClientWalletRecordsPage.module.css";

export type ClientWalletRecordsView =
  | "payments"
  | "balances"
  | "history"
  | "invoices"
  | "ledger"
  | "refunds";

interface ClientWalletRecordsPageProps {
  view:
    ClientWalletRecordsView;
}

interface DisplayRecord {
  id:
    string;

  title:
    string;

  amount:
    ClientWalletApiMoney |
    null;

  status:
    string;

  meta:
    string;

  createdAt:
    string | null;
}

const VIEW_COPY: Record<
  ClientWalletRecordsView,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  payments: {
    eyebrow:
      "Payments",

    title:
      "Payment workspace",

    description:
      "Review verified Client payment records from the Backend Wallet system.",
  },

  balances: {
    eyebrow:
      "Balances",

    title:
      "Wallet balances",

    description:
      "Review authoritative available, reserved, credited, spent, and refunded Wallet balances.",
  },

  history: {
    eyebrow:
      "History",

    title:
      "Payment history",

    description:
      "Review recent Wallet activity across ledger entries, funding orders, payments, and refunds.",
  },

  invoices: {
    eyebrow:
      "Invoices",

    title:
      "Invoices",

    description:
      "Review Backend invoice records connected to Client campaigns and Wallet payments.",
  },

  ledger: {
    eyebrow:
      "Ledger",

    title:
      "Wallet ledger",

    description:
      "Review immutable Wallet ledger activity from the Backend.",
  },

  refunds: {
    eyebrow:
      "Refunds",

    title:
      "Refunds",

    description:
      "Review Client refund records from the Backend payment system.",
  },
};

function minorToMajor(
  minorUnits:
    string
): number {
  if (!/^-?[0-9]+$/.test(minorUnits)) {
    return 0;
  }

  return Number(minorUnits) / 100;
}

function formatMoney(
  money:
    ClientWalletApiMoney | null
): string {
  if (!money) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        money.currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    minorToMajor(
      money.minorUnits
    )
  );
}

function formatDateTime(
  value:
    string | null
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function getEmptyStateMessage(
  view:
    ClientWalletRecordsPageProps["view"]
): string {
  switch (view) {
    case "payments":
      return "No Backend payment records have been returned for this Client organization yet.";

    case "balances":
      return "No Backend balance movement records have been returned for this Client organization yet.";

    case "history":
      return "No Backend payment history records have been returned for this Client organization yet.";

    case "invoices":
      return "No Backend invoice records have been returned for this Client organization yet.";

    case "ledger":
      return "No Backend ledger records have been returned for this Client organization yet.";

    case "refunds":
      return "No Backend refund records have been returned for this Client organization yet.";
  }
}

function formatStatus(
  value:
    string
): string {
  return value
    .replaceAll("_", " ")
    .trim();
}

function getLedgerTitle(
  entry:
    ClientWalletApiLedgerEntry
): string {
  if (entry.providerReference) {
    return entry.providerReference;
  }

  if (entry.campaignId) {
    return `Campaign ${entry.campaignId}`;
  }

  if (entry.fundingOrderId) {
    return `Funding order ${entry.fundingOrderId}`;
  }

  return entry.entryType;
}

function getRecords(
  view:
    ClientWalletRecordsView,
  overview:
    ClientWalletApiOverview
): DisplayRecord[] {
  if (view === "ledger") {
    return overview.ledgerEntries.map(
      entry => ({
        id:
          entry.id,

        title:
          getLedgerTitle(
            entry
          ),

        amount:
          entry.amount,

        status:
          entry.status,

        meta:
          `${formatStatus(entry.entryType)} · Balance after ${formatMoney(entry.balanceAfter)}`,

        createdAt:
          entry.createdAt,
      })
    );
  }

  if (view === "payments") {
    return overview.payments.map(
      payment => ({
        id:
          payment.id,

        title:
          payment.providerPaymentId ??
          payment.providerOrderId ??
          payment.id,

        amount:
          payment.captured,

        status:
          payment.status,

        meta:
          `Provider ${payment.provider} · Refunded ${formatMoney(payment.refunded)}`,

        createdAt:
          payment.paidAt ??
          payment.createdAt,
      })
    );
  }

  if (view === "invoices") {
    return overview.invoices.map(
      invoice => ({
        id:
          invoice.id,

        title:
          invoice.invoiceNumber,

        amount:
          invoice.total,

        status:
          invoice.status,

        meta:
          `Paid ${formatMoney(invoice.paid)} · Refunded ${formatMoney(invoice.refunded)}`,

        createdAt:
          invoice.issuedAt ??
          invoice.createdAt,
      })
    );
  }

  if (view === "refunds") {
    return overview.refunds.map(
      refund => ({
        id:
          refund.id,

        title:
          refund.providerRefundId ??
          refund.reason,

        amount:
          refund.refundedAmount,

        status:
          refund.status,

        meta:
          `${formatStatus(refund.reason)} · Requested ${formatMoney(refund.requestedAmount)}`,

        createdAt:
          refund.refundedAt ??
          refund.requestedAt,
      })
    );
  }

  if (view === "history") {
    const ledgerRecords =
      overview.ledgerEntries.map(
        entry => ({
          id:
            `ledger:${entry.id}`,

          title:
            getLedgerTitle(
              entry
            ),

          amount:
            entry.amount,

          status:
            entry.status,

          meta:
            `Ledger · ${formatStatus(entry.entryType)}`,

          createdAt:
            entry.createdAt,
        })
      );

    const fundingRecords =
      overview.fundingOrders.map(
        order => ({
          id:
            `funding:${order.id}`,

          title:
            order.providerOrderId ??
            order.providerReceipt ??
            order.id,

          amount:
            order.amount,

          status:
            order.status,

          meta:
            `Funding order · ${order.provider}`,

          createdAt:
            order.createdAt,
        })
      );

    const paymentRecords =
      overview.payments.map(
        payment => ({
          id:
            `payment:${payment.id}`,

          title:
            payment.providerPaymentId ??
            payment.providerOrderId ??
            payment.id,

          amount:
            payment.captured,

          status:
            payment.status,

          meta:
            `Payment · ${payment.provider}`,

          createdAt:
            payment.paidAt ??
            payment.createdAt,
        })
      );

    const refundRecords =
      overview.refunds.map(
        refund => ({
          id:
            `refund:${refund.id}`,

          title:
            refund.providerRefundId ??
            refund.reason,

          amount:
            refund.refundedAmount,

          status:
            refund.status,

          meta:
            `Refund · ${formatStatus(refund.reason)}`,

          createdAt:
            refund.refundedAt ??
            refund.requestedAt,
        })
      );

    return [
      ...ledgerRecords,
      ...fundingRecords,
      ...paymentRecords,
      ...refundRecords,
    ].sort(
      (
        first,
        second
      ) =>
        new Date(
          second.createdAt ?? ""
        ).getTime() -
        new Date(
          first.createdAt ?? ""
        ).getTime()
    );
  }

  return [];
}

function SummaryCards(
  props: {
    overview:
      ClientWalletApiOverview;
  }
) {
  const wallet =
    props.overview.wallet;

  return (
    <div
      className={
        styles.grid
      }
    >
      <article
        className={
          styles.card
        }
      >
        <p
          className={
            styles.label
          }
        >
          Available
        </p>
        <p
          className={
            styles.value
          }
        >
          {formatMoney(
            wallet?.availableBalance ??
              null
          )}
        </p>
      </article>

      <article
        className={
          styles.card
        }
      >
        <p
          className={
            styles.label
          }
        >
          Reserved
        </p>
        <p
          className={
            styles.value
          }
        >
          {formatMoney(
            wallet?.reservedBalance ??
              null
          )}
        </p>
      </article>

      <article
        className={
          styles.card
        }
      >
        <p
          className={
            styles.label
          }
        >
          Payments
        </p>
        <p
          className={
            styles.value
          }
        >
          {props.overview.payments.length}
        </p>
      </article>

      <article
        className={
          styles.card
        }
      >
        <p
          className={
            styles.label
          }
        >
          Invoices
        </p>
        <p
          className={
            styles.value
          }
        >
          {props.overview.invoices.length}
        </p>
      </article>

      <article
        className={
          styles.card
        }
      >
        <p
          className={
            styles.label
          }
        >
          Refunds
        </p>
        <p
          className={
            styles.value
          }
        >
          {props.overview.refunds.length}
        </p>
      </article>
    </div>
  );
}

export default function ClientWalletRecordsPage(
  props:
    ClientWalletRecordsPageProps
) {
  const {
    overview,
    isLoading,
    errorMessage,
    refresh,
  } =
    useClientWalletOverview(
      25
    );

  const copy =
    VIEW_COPY[
      props.view
    ];

  const records =
    overview
      ? getRecords(
          props.view,
          overview
        )
      : [];

  return (
    <section
      className={
        styles.shell
      }
      aria-labelledby="client-wallet-records-title"
      aria-busy={
        isLoading
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
              styles.eyebrow
            }
          >
            {copy.eyebrow}
          </p>

          <h1
            id="client-wallet-records-title"
            className={
              styles.title
            }
          >
            {copy.title}
          </h1>

          <p
            className={
              styles.description
            }
          >
            {copy.description}
          </p>
        </div>

        <button
          type="button"
          className={
            styles.button
          }
          onClick={
            () => {
              void refresh();
            }
          }
          disabled={
            isLoading
          }
        >
          {isLoading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {errorMessage ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {isLoading && !overview ? (
        <div
          className={
            styles.status
          }
        >
          Loading payment data from Backend...
        </div>
      ) : null}

      {overview ? (
        <>
          <SummaryCards
            overview={
              overview
            }
          />

          {props.view === "balances" ? (
            <div
              className={
                styles.grid
              }
            >
              <article
                className={
                  styles.card
                }
              >
                <p
                  className={
                    styles.label
                  }
                >
                  Credited
                </p>
                <p
                  className={
                    styles.value
                  }
                >
                  {formatMoney(
                    overview.wallet?.totalCredited ??
                      null
                  )}
                </p>
              </article>

              <article
                className={
                  styles.card
                }
              >
                <p
                  className={
                    styles.label
                  }
                >
                  Spent
                </p>
                <p
                  className={
                    styles.value
                  }
                >
                  {formatMoney(
                    overview.wallet?.totalSpent ??
                      null
                  )}
                </p>
              </article>

              <article
                className={
                  styles.card
                }
              >
                <p
                  className={
                    styles.label
                  }
                >
                  Refunded
                </p>
                <p
                  className={
                    styles.value
                  }
                >
                  {formatMoney(
                    overview.wallet?.totalRefunded ??
                      null
                  )}
                </p>
              </article>

              <article
                className={
                  styles.card
                }
              >
                <p
                  className={
                    styles.label
                  }
                >
                  Allocations
                </p>
                <p
                  className={
                    styles.value
                  }
                >
                  {overview.campaignAllocations.length}
                </p>
              </article>

              <article
                className={
                  styles.card
                }
              >
                <p
                  className={
                    styles.label
                  }
                >
                  Ledger entries
                </p>
                <p
                  className={
                    styles.value
                  }
                >
                  {overview.ledgerEntries.length}
                </p>
              </article>
            </div>
          ) : (
            <div
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <h2
                    className={
                      styles.panelTitle
                    }
                  >
                    Records
                  </h2>

                  <p
                    className={
                      styles.panelMeta
                    }
                  >
                    Generated{" "}
                    {formatDateTime(
                      overview.generatedAt
                    )}
                  </p>
                </div>
              </div>

              <div
                className={
                  styles.list
                }
              >
                {records.length ? (
                  records.map(
                    record => (
                      <article
                        key={
                          record.id
                        }
                        className={
                          styles.item
                        }
                      >
                        <div
                          className={
                            styles.itemTop
                          }
                        >
                          <span
                            className={
                              styles.itemTitle
                            }
                          >
                            {record.title}
                          </span>

                          <span
                            className={
                              styles.itemAmount
                            }
                          >
                            {formatMoney(
                              record.amount
                            )}
                          </span>
                        </div>

                        <span
                          className={
                            styles.badge
                          }
                        >
                          {formatStatus(
                            record.status
                          )}
                        </span>

                        <span
                          className={
                            styles.itemMeta
                          }
                        >
                          {record.meta} ·{" "}
                          {formatDateTime(
                            record.createdAt
                          )}
                        </span>
                      </article>
                    )
                  )
                ) : (
                  <div
                    className={
                      styles.empty
                    }
                  >
                    {getEmptyStateMessage(
                      props.view
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}