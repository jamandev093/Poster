"use client";

import AdminCampaignWalletAllocationsPanel from "./AdminCampaignWalletAllocationsPanel";

import {
  useAdminWalletOperations,
} from "./use-admin-wallet-operations";

import type {
  AdminWalletMoney,
} from "./admin-wallet-operations.types";

import styles from "./AdminWalletOperationsManager.module.css";

function minorToMajor(
  value:
    string
): number {
  if (!/^-?[0-9]+$/.test(value)) {
    return 0;
  }

  return Number(value) / 100;
}

function formatMoney(
  money:
    AdminWalletMoney
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: money.currency,
      maximumFractionDigits: 2,
    }
  ).format(
    minorToMajor(
      money.minorUnits
    )
  );
}

function formatDate(
  value:
    string | null
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function formatStatus(
  value:
    string
): string {
  return value
    .replaceAll("_", " ")
    .trim();
}

function statusClassName(
  status:
    string
): string {
  if (
    status === "active" ||
    status === "posted" ||
    status === "captured" ||
    status === "credited"
  ) {
    return styles.badgeGood;
  }

  if (
    status.includes("pending") ||
    status.includes("failed") ||
    status.includes("expired")
  ) {
    return styles.badgeWarn;
  }

  return styles.badge;
}

export default function AdminWalletOperationsManager() {
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } =
    useAdminWalletOperations();

  const summary =
    data?.summary;

  return (
    <div
      className={styles.page}
      aria-busy={
        isLoading ||
        isRefreshing
      }
    >
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>
            Payments
          </p>

          <h1 className={styles.title}>
            Wallet Operations
          </h1>

          <p className={styles.description}>
            Review advertiser Wallet balances, Razorpay funding orders,
            captured payments, immutable ledger records, refunds,
            invoices, and reconciliation risk from Backend-owned data.
          </p>
        </div>

        <button
          type="button"
          className={styles.button}
          onClick={() => {
            void refresh();
          }}
          disabled={
            isLoading ||
            isRefreshing
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      {error ? (
        <section
          className={styles.error}
          role="alert"
        >
          {error}
        </section>
      ) : null}

      {isLoading && !data ? (
        <section className={styles.status}>
          Loading Wallet Operations from Backend...
        </section>
      ) : null}

      {summary ? (
        <section
          className={styles.summaryGrid}
          aria-label="Wallet Operations summary"
        >
          <article className={styles.card}>
            <span className={styles.label}>
              Available balance
            </span>
            <strong className={styles.value}>
              {formatMoney(summary.totalAvailable)}
            </strong>
          </article>

          <article className={styles.card}>
            <span className={styles.label}>
              Reserved balance
            </span>
            <strong className={styles.value}>
              {formatMoney(summary.totalReserved)}
            </strong>
          </article>

          <article className={styles.card}>
            <span className={styles.label}>
              Total credited
            </span>
            <strong className={styles.value}>
              {formatMoney(summary.totalCredited)}
            </strong>
          </article>

          <article className={styles.card}>
            <span className={styles.label}>
              Total spent
            </span>
            <strong className={styles.value}>
              {formatMoney(summary.totalSpent)}
            </strong>
          </article>

          <article className={styles.card}>
            <span className={styles.label}>
              Wallets
            </span>
            <strong className={styles.value}>
              {summary.activeWalletCount}/{summary.walletCount}
            </strong>
          </article>

          <article className={styles.card}>
            <span className={styles.label}>
              Pending funding
            </span>
            <strong className={styles.value}>
              {summary.pendingFundingOrderCount}
            </strong>
          </article>

          <article className={styles.card}>
            <span className={styles.label}>
              Failed payments
            </span>
            <strong className={styles.value}>
              {summary.failedPaymentCount}
            </strong>
          </article>

          <article className={styles.card}>
            <span className={styles.label}>
              Unreconciled webhooks
            </span>
            <strong className={styles.value}>
              {summary.unreconciledWebhookCount}
            </strong>
          </article>
        </section>
      ) : null}

      {data ? (
        <>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  Organization wallets
                </h2>

                <p className={styles.panelMeta}>
                  Generated {formatDate(data.generatedAt)}
                </p>
              </div>
            </header>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Organization</th>
                    <th scope="col">Status</th>
                    <th scope="col">Available</th>
                    <th scope="col">Reserved</th>
                    <th scope="col">Credited</th>
                    <th scope="col">Spent</th>
                    <th scope="col">Records</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>

                <tbody>
                  {data.organizations.map(
                    organization => (
                      <tr key={organization.organizationId}>
                        <td>
                          <strong className={styles.recordTitle}>
                            {organization.organizationName}
                          </strong>
                          <span className={styles.muted}>
                            {organization.organizationId}
                          </span>
                        </td>

                        <td>
                          <span className={statusClassName(organization.walletStatus)}>
                            {formatStatus(organization.walletStatus)}
                          </span>
                        </td>

                        <td>{formatMoney(organization.available)}</td>
                        <td>{formatMoney(organization.reserved)}</td>
                        <td>{formatMoney(organization.credited)}</td>
                        <td>{formatMoney(organization.spent)}</td>

                        <td>
                          {organization.paymentCount} payments
                          <span className={styles.muted}>
                            {organization.fundingOrderCount} funding · {organization.refundCount} refunds · {organization.allocationCount} allocations
                          </span>
                        </td>

                        <td>
                          {formatDate(organization.updatedAt)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {data.organizations.length === 0 ? (
              <footer className={styles.footer}>
                No organization Wallet records were returned.
              </footer>
            ) : null}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  Recent funding orders and payments
                </h2>

                <p className={styles.panelMeta}>
                  Monitor Razorpay order/payment state before reconciliation.
                </p>
              </div>
            </header>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Record</th>
                    <th scope="col">Organization</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Provider</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>

                <tbody>
                  {data.fundingOrders.map(
                    order => (
                      <tr key={`order-${order.id}`}>
                        <td>
                          <strong className={styles.recordTitle}>
                            Funding order
                          </strong>
                          <span className={styles.muted}>
                            {order.providerOrderId ?? order.id}
                          </span>
                        </td>

                        <td>{order.organizationName}</td>
                        <td>{formatMoney(order.amount)}</td>

                        <td>
                          <span className={statusClassName(order.status)}>
                            {formatStatus(order.status)}
                          </span>
                        </td>

                        <td>{order.provider}</td>
                        <td>{formatDate(order.createdAt)}</td>
                      </tr>
                    )
                  )}

                  {data.payments.map(
                    payment => (
                      <tr key={`payment-${payment.id}`}>
                        <td>
                          <strong className={styles.recordTitle}>
                            Payment
                          </strong>
                          <span className={styles.muted}>
                            {payment.providerPaymentId ?? payment.id}
                          </span>
                        </td>

                        <td>{payment.organizationName}</td>
                        <td>{formatMoney(payment.captured)}</td>

                        <td>
                          <span className={statusClassName(payment.status)}>
                            {formatStatus(payment.status)}
                          </span>
                        </td>

                        <td>{payment.provider}</td>
                        <td>{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {data.fundingOrders.length === 0 &&
            data.payments.length === 0 ? (
              <footer className={styles.footer}>
                No recent funding orders or payments were returned.
              </footer>
            ) : null}
          </section>

          <AdminCampaignWalletAllocationsPanel
            allocations={
              data.campaignAllocations
            }
            generatedAt={
              data.generatedAt
            }
          />

          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  Recent Wallet ledger
                </h2>

                <p className={styles.panelMeta}>
                  Immutable ledger activity for payment, refund, and campaign allocation review.
                </p>
              </div>
            </header>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Entry</th>
                    <th scope="col">Organization</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Direction</th>
                    <th scope="col">Balance after</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {data.ledgerEntries.map(
                    entry => (
                      <tr key={entry.id}>
                        <td>
                          <strong className={styles.recordTitle}>
                            {formatStatus(entry.entryType)}
                          </strong>
                          <span className={styles.muted}>
                            {entry.providerReference ?? entry.id}
                          </span>
                        </td>

                        <td>{entry.organizationName}</td>
                        <td>{formatMoney(entry.amount)}</td>
                        <td>{formatStatus(entry.direction)}</td>
                        <td>{formatMoney(entry.balanceAfter)}</td>

                        <td>
                          <span className={statusClassName(entry.status)}>
                            {formatStatus(entry.status)}
                          </span>
                        </td>

                        <td>{formatDate(entry.createdAt)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {data.ledgerEntries.length === 0 ? (
              <footer className={styles.footer}>
                No ledger records were returned.
              </footer>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}