import Link from "next/link";

import styles from "./page.module.css";

const metrics = [
  {
    label: "Needs attention",
    value: "1",
  },
  {
    label: "Active campaigns",
    value: "2",
  },
  {
    label: "Delivery",
    value: "72.8%",
  },
  {
    label: "Contract value",
    value: "₹5,00,000",
  },
];

const requests = [
  {
    id: "ADV-1002",
    name: "Learning Partner Offer",
    type: "Affiliate",
    status: "Changes requested",
  },
  {
    id: "ADV-1001",
    name: "Cloud Skills Campaign",
    type: "Direct Sponsorship",
    status: "Pending review",
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
    delivery: 72.8,
    impressions: "7,28,000",
  },
  {
    id: "CMP-3010",
    name: "Future Skills Sponsorship",
    status: "Draft",
    delivery: 0,
    impressions: "0",
  },
];

function requestStatusClass(
  status: string
) {
  if (status === "Changes requested") {
    return styles.statusAttention;
  }

  if (status === "Approved") {
    return styles.statusPositive;
  }

  return styles.statusNeutral;
}

function campaignStatusClass(
  status: string
) {
  if (status === "Active") {
    return styles.statusPositive;
  }

  return styles.statusNeutral;
}

export default function DashboardPage() {
  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Dashboard</h1>

          <p>
            Requests, campaigns, and current delivery for
            Example Cloud.
          </p>
        </div>

        <Link
          href="/requests/new"
          className={styles.newRequestButton}
        >
          New request
        </Link>
      </header>

      <section
        className={styles.metrics}
        aria-label="Account summary"
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={styles.metric}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </section>

      <section className={styles.attention}>
        <div className={styles.attentionContent}>
          <span className={styles.attentionLabel}>
            Needs attention
          </span>

          <strong>Learning Partner Offer</strong>

          <p>
            Changes were requested before this affiliate
            request can continue.
          </p>
        </div>

        <Link
          href="/requests/ADV-1002"
          className={styles.reviewLink}
        >
          Review request
        </Link>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Recent requests</h2>
            <p>Your latest commercial submissions.</p>
          </div>

          <Link href="/requests">
            View all
          </Link>
        </div>

        <div className={styles.rows}>
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className={styles.row}
            >
              <div className={styles.primaryCell}>
                <strong>{request.name}</strong>

                <span>
                  {request.id} · {request.type}
                </span>
              </div>

              <span
                className={requestStatusClass(
                  request.status
                )}
              >
                {request.status}
              </span>

              <span className={styles.chevron}>
                ›
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Campaigns</h2>
            <p>Current campaign delivery.</p>
          </div>

          <Link href="/campaigns">
            View all
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
              href={`/campaigns/${campaign.id}`}
              className={styles.campaignRow}
            >
              <div className={styles.primaryCell}>
                <strong>{campaign.name}</strong>
                <span>{campaign.id}</span>
              </div>

              <span
                className={campaignStatusClass(
                  campaign.status
                )}
              >
                {campaign.status}
              </span>

              <div className={styles.delivery}>
                <span>
                  {campaign.delivery}%
                </span>

                <div className={styles.progress}>
                  <i
                    style={{
                      width: `${campaign.delivery}%`,
                    }}
                  />
                </div>
              </div>

              <strong className={styles.impressions}>
                {campaign.impressions}
              </strong>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}