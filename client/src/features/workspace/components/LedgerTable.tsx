import Link from "next/link";

import type {
  PaymentDashboardLedgerRow,
} from "../adapters/payment-dashboard.adapter";

import type {
  LedgerEntryStatus,
  LedgerEntryType,
} from "../payments/ledger.types";

import {
  formatFinancialDateTime,
  formatMoneyMinor,
} from "../payments/payment.formatters";

import styles from "./LedgerTable.module.css";

export interface LedgerTableProps {
  entries:
    PaymentDashboardLedgerRow[];
}

function formatLedgerEntryType(
  type:
    LedgerEntryType
): string {
  switch (type) {
    case "payment_credit":
      return "Payment credit";

    case "manual_payment_credit":
      return "Manual payment credit";

    case "campaign_funds_reserved":
      return "Funds reserved";

    case "campaign_funds_released":
      return "Funds released";

    case "estimated_spend":
      return "Estimated spend";

    case "pending_validation_spend":
      return "Pending validation";

    case "finalized_spend":
      return "Finalized spend";

    case "invalid_traffic_credit":
      return "Invalid-traffic credit";

    case "billing_adjustment_credit":
      return "Billing adjustment credit";

    case "billing_adjustment_debit":
      return "Billing adjustment debit";

    case "refund_reservation":
      return "Refund reservation";

    case "refund_debit":
      return "Refund debit";

    case "refund_release":
      return "Refund release";

    case "chargeback_debit":
      return "Chargeback debit";

    case "dispute_hold":
      return "Dispute hold";

    case "dispute_release":
      return "Dispute release";

    case "expired_balance_debit":
      return "Expired balance";

    case "opening_balance":
      return "Opening balance";

    case "migration_adjustment":
      return "Migration adjustment";
  }
}

function formatLedgerStatus(
  status:
    LedgerEntryStatus
): string {
  switch (status) {
    case "pending":
      return "Pending";

    case "finalized":
      return "Finalized";

    case "reversed":
      return "Reversed";

    case "cancelled":
      return "Cancelled";
  }
}

function getStatusClassName(
  status:
    LedgerEntryStatus
): string {
  switch (status) {
    case "pending":
      return styles.statusPending;

    case "finalized":
      return styles.statusFinalized;

    case "reversed":
      return styles.statusReversed;

    case "cancelled":
      return styles.statusCancelled;
  }
}

function formatSignedAmount(
  entry:
    PaymentDashboardLedgerRow
): string {
  const amount =
    formatMoneyMinor(
      entry.amountMinor,
      entry.currency
    );

  return entry.direction ===
    "credit"
    ? `+${amount}`
    : `−${amount}`;
}

function renderReferences(
  entry:
    PaymentDashboardLedgerRow
) {
  const references = [];

  if (entry.campaignId) {
    references.push(
      <li key="campaign">
        <Link
          className={
            styles.referenceLink
          }
          href={`/campaigns/${entry.campaignId}`}
        >
          Campaign {entry.campaignId}
        </Link>
      </li>
    );
  }

  if (entry.invoiceId) {
    references.push(
      <li
        className={
          styles.referenceText
        }
        key="invoice"
      >
        Invoice {entry.invoiceId}
      </li>
    );
  }

  if (entry.paymentId) {
    references.push(
      <li
        className={
          styles.referenceText
        }
        key="payment"
      >
        Payment {entry.paymentId}
      </li>
    );
  }

  if (entry.refundId) {
    references.push(
      <li
        className={
          styles.referenceText
        }
        key="refund"
      >
        Refund {entry.refundId}
      </li>
    );
  }

  if (entry.settlementId) {
    references.push(
      <li
        className={
          styles.referenceText
        }
        key="settlement"
      >
        Settlement {entry.settlementId}
      </li>
    );
  }

  if (references.length === 0) {
    return (
      <span
        className={
          styles.secondaryText
        }
      >
        Organization ledger
      </span>
    );
  }

  return (
    <ul
      className={
        styles.referenceList
      }
    >
      {references}
    </ul>
  );
}

export function LedgerTable(
  props:
    LedgerTableProps
) {
  if (
    props.entries.length ===
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
            No ledger entries yet
          </h2>

          <p
            className={
              styles.emptyDescription
            }
          >
            Verified payment credits, campaign spend,
            reconciliations, refunds, disputes, and balance
            adjustments will appear here as immutable financial
            records.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Financial ledger"
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
                Entry
              </th>

              <th scope="col">
                Type
              </th>

              <th scope="col">
                Direction
              </th>

              <th scope="col">
                Status
              </th>

              <th scope="col">
                Amount
              </th>

              <th scope="col">
                Balance movement
              </th>

              <th scope="col">
                References
              </th>

              <th scope="col">
                Description
              </th>

              <th scope="col">
                Occurred
              </th>

              <th scope="col">
                Finalized
              </th>
            </tr>
          </thead>

          <tbody>
            {props.entries.map(
              (
                entry
              ) => (
                <tr
                  key={
                    entry.ledgerEntryId
                  }
                >
                  <td>
                    <p
                      className={
                        styles.primaryText
                      }
                    >
                      {entry.ledgerEntryId}
                    </p>

                    <p
                      className={
                        styles.secondaryText
                      }
                    >
                      Append-only record
                    </p>
                  </td>

                  <td>
                    <span
                      className={
                        styles.type
                      }
                    >
                      {formatLedgerEntryType(
                        entry.type
                      )}
                    </span>
                  </td>

                  <td>
                    <span
                      className={[
                        styles.direction,
                        entry.direction ===
                        "credit"
                          ? styles.directionCredit
                          : styles.directionDebit,
                      ].join(
                        " "
                      )}
                    >
                      {entry.direction ===
                      "credit"
                        ? "Credit"
                        : "Debit"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={[
                        styles.status,
                        getStatusClassName(
                          entry.status
                        ),
                      ].join(
                        " "
                      )}
                    >
                      {formatLedgerStatus(
                        entry.status
                      )}
                    </span>
                  </td>

                  <td
                    className={[
                      styles.money,
                      entry.direction ===
                      "credit"
                        ? styles.moneyCredit
                        : styles.moneyDebit,
                    ].join(
                      " "
                    )}
                  >
                    {formatSignedAmount(
                      entry
                    )}
                  </td>

                  <td>
                    <div
                      className={
                        styles.balanceStack
                      }
                    >
                      <div
                        className={
                          styles.balanceRow
                        }
                      >
                        <span>
                          Before
                        </span>

                        <span
                          className={
                            styles.balanceValue
                          }
                        >
                          {formatMoneyMinor(
                            entry.balanceBeforeMinor,
                            entry.currency
                          )}
                        </span>
                      </div>

                      <div
                        className={
                          styles.balanceRow
                        }
                      >
                        <span>
                          After
                        </span>

                        <span
                          className={
                            styles.balanceValue
                          }
                        >
                          {formatMoneyMinor(
                            entry.balanceAfterMinor,
                            entry.currency
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {renderReferences(
                      entry
                    )}
                  </td>

                  <td>
                    <div
                      className={
                        styles.description
                      }
                    >
                      {entry.description}
                    </div>
                  </td>

                  <td>
                    {formatFinancialDateTime(
                      entry.occurredAt
                    )}
                  </td>

                  <td>
                    {formatFinancialDateTime(
                      entry.finalizedAt
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}