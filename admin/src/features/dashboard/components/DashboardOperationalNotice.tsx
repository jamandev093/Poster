import Link from "next/link";

import styles from "../DashboardManager.module.css";

export default function DashboardOperationalNotice() {
  return (
    <section className={styles.notice}>
      <div>
        <h2>
          Additional operational summaries
          remain deferred
        </h2>

        <p>
          Content, source, campaign,
          copyright-exception, recent-activity,
          and system-health totals will appear
          here after their authoritative Backend
          APIs are implemented.
        </p>
      </div>

      <Link href="/system-status">
        View System Status
      </Link>
    </section>
  );
}
