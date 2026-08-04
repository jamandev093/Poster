import type {
  AdminCampaignWalletAllocationRow,
  AdminWalletMoney,
} from "./admin-wallet-operations.types";

import styles from "./AdminWalletOperationsManager.module.css";

interface AdminCampaignWalletAllocationsPanelProps {
  allocations:
    AdminCampaignWalletAllocationRow[];

  generatedAt:
    string;
}

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

function formatDate(
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

  if (!Number.isFinite(date.getTime())) {
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
    status === "active"
  ) {
    return styles.badgeGood;
  }

  if (
    status === "paused" ||
    status === "exhausted"
  ) {
    return styles.badgeWarn;
  }

  return styles.badge;
}

export default function AdminCampaignWalletAllocationsPanel(
  props:
    AdminCampaignWalletAllocationsPanelProps
) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>
            Campaign Wallet allocations
          </h2>

          <p className={styles.panelMeta}>
            Reserved, spent, released, and refunded funds by campaign.
            Generated {formatDate(props.generatedAt)}.
          </p>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Campaign</th>
              <th scope="col">Organization</th>
              <th scope="col">Status</th>
              <th scope="col">Allocated</th>
              <th scope="col">Reserved</th>
              <th scope="col">Spent</th>
              <th scope="col">Released</th>
              <th scope="col">Refunded</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>

          <tbody>
            {props.allocations.map(
              allocation => (
                <tr key={allocation.id}>
                  <td>
                    <strong className={styles.recordTitle}>
                      {allocation.campaignId}
                    </strong>

                    <span className={styles.muted}>
                      Allocation {allocation.id}
                    </span>
                  </td>

                  <td>
                    {allocation.organizationName}
                    <span className={styles.muted}>
                      {allocation.organizationId}
                    </span>
                  </td>

                  <td>
                    <span className={statusClassName(allocation.status)}>
                      {formatStatus(allocation.status)}
                    </span>
                  </td>

                  <td>{formatMoney(allocation.allocated)}</td>
                  <td>{formatMoney(allocation.reserved)}</td>
                  <td>{formatMoney(allocation.spent)}</td>
                  <td>{formatMoney(allocation.released)}</td>
                  <td>{formatMoney(allocation.refunded)}</td>
                  <td>{formatDate(allocation.updatedAt)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {props.allocations.length === 0 ? (
        <footer className={styles.footer}>
          No campaign Wallet allocations were returned.
        </footer>
      ) : null}
    </section>
  );
}