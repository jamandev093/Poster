import Link from "next/link";

import styles from "./page.module.css";

const metrics = [
  {
    label: "Active campaigns",
    value: "2",
    detail: "Currently delivering",
  },
  {
    label: "Requests need attention",
    value: "1",
    detail: "Changes requested",
    attention: true,
  },
  {
    label: "Delivery completed",
    value: "72.8%",
    detail: "Across active campaigns",
  },
  {
    label: "Contract value",
    value: "₹5,00,000",
    detail: "Current sponsorships",
  },
];

const requests = [
  {
    id: "ADV-1001",
    name: "Cloud Skills Campaign",
    type: "Direct Sponsorship",
    status: "Pending review",
  },
  {
    id: "ADV-1002",
    name: "Learning Partner Offer",
    type: "Affiliate",
    status: "Changes requested",
  },
  {
    id: "ADV-1003",
    name: "Future Skills Sponsorship",
    type: "Direct Sponsorship",
    status: "Approved",
  },
];

const campaigns = [
  {
    id: "CMP-3001",
    name: "Cloud Skills Campaign",
    status: "Active",
    delivery: "72.8%",
    impressions: "7,28,000",
  },
  {
    id: "CMP-3010",
    name: "Future Skills Sponsorship",
    status: "Draft",
    delivery: "0%",
    impressions: "0",
  },
];

export default function DashboardPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">Client workspace</div>

          <h1 className="pageTitle">Welcome, Example Cloud</h1>

          <p className="pageDescription">
            Review requests, approved campaigns, and delivery performance.
          </p>
        </div>

        <Link href="/requests/new" className="primaryButton">
          Submit new request
        </Link>
      </header>

      <section className={styles.metrics}>
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={
              metric.attention
                ? styles.metricAttention
                : styles.metric
            }
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className={styles.mainGrid}>
        <article className="contentCard">
          <div className={styles.cardHeader}>
            <div>
              <h2 className="sectionTitle">Recent requests</h2>
              <p className="sectionDescription">
                Latest commercial submissions.
              </p>
            </div>

            <Link href="/requests" className={styles.textLink}>
              View all
            </Link>
          </div>

          <div className={styles.list}>
            {requests.map((request) => (
              <Link
                key={request.id}
                href="/requests"
                className={styles.listRow}
              >
                <div>
                  <strong>{request.name}</strong>
                  <span>
                    {request.id} · {request.type}
                  </span>
                </div>

                <span
                  className={
                    request.status === "Changes requested"
                      ? "statusBadge statusAttention"
                      : request.status === "Approved"
                        ? "statusBadge statusActive"
                        : "statusBadge statusScheduled"
                  }
                >
                  {request.status}
                </span>
              </Link>
            ))}
          </div>
        </article>

        <article className="contentCard">
          <div className={styles.cardHeader}>
            <div>
              <h2 className="sectionTitle">Quick actions</h2>
              <p className="sectionDescription">
                Common client tasks.
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/requests/new" className={styles.actionCard}>
              <strong>Submit new request</strong>
              <span>Direct sponsorship or affiliate</span>
            </Link>

            <Link href="/campaigns" className={styles.actionCard}>
              <strong>View campaigns</strong>
              <span>Delivery and campaign status</span>
            </Link>

            <Link href="/performance" className={styles.actionCard}>
              <strong>Open performance</strong>
              <span>Clicks, conversions, and results</span>
            </Link>
          </div>
        </article>
      </section>

      <section className="contentCard">
        <div className={styles.cardHeader}>
          <div>
            <h2 className="sectionTitle">Campaign delivery</h2>
            <p className="sectionDescription">
              Current approved campaign activity.
            </p>
          </div>

          <Link href="/campaigns" className={styles.textLink}>
            View campaigns
          </Link>
        </div>

        <div className={styles.campaignTable}>
          <div className={styles.tableHeader}>
            <span>Campaign</span>
            <span>Status</span>
            <span>Delivery</span>
            <span>Impressions</span>
          </div>

          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href="/campaigns"
              className={styles.tableRow}
            >
              <div>
                <strong>{campaign.name}</strong>
                <span>{campaign.id}</span>
              </div>

              <span
                className={
                  campaign.status === "Active"
                    ? "statusBadge statusActive"
                    : "statusBadge statusScheduled"
                }
              >
                {campaign.status}
              </span>

              <strong>{campaign.delivery}</strong>
              <span>{campaign.impressions}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.demoNote}>
        Frontend demonstration data · Backend and organization-scoped APIs
        will replace this data source.
      </p>
    </>
  );
}