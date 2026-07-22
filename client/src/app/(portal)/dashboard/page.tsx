import Link from "next/link";

import styles from "./page.module.css";

const metrics = [
  {
    label: "Needs attention",
    value: "1",
    detail: "Changes requested",
    attention: true,
  },
  {
    label: "Active campaigns",
    value: "2",
    detail: "Currently delivering",
  },
  {
    label: "Delivery",
    value: "72.8%",
    detail: "Active sponsorships",
  },
  {
    label: "Contract value",
    value: "₹5,00,000",
    detail: "Current sponsorships",
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

function getRequestStatusClass(
  status: string
) {
  if (
    status ===
    "Changes requested"
  ) {
    return "statusBadge statusAttention";
  }

  if (
    status ===
    "Approved"
  ) {
    return "statusBadge statusActive";
  }

  return "statusBadge statusScheduled";
}

export default function DashboardPage() {
  const attentionRequest =
    requests.find(
      (
        request
      ) =>
        request.status ===
        "Changes requested"
    );

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.pageContext}>
            Example Cloud
          </div>

          <h1 className={styles.pageTitle}>
            Dashboard
          </h1>

          <p className={styles.pageDescription}>
            Commercial activity and campaign delivery at a glance.
          </p>
        </div>

        <Link
          href="/requests/new"
          className={styles.primaryAction}
        >
          New request
        </Link>
      </header>

      <section className={styles.summaryStrip}>
        {metrics.map(
          (
            metric
          ) => (
            <div
              key={
                metric.label
              }
              className={styles.summaryItem}
            >
              <span>
                {
                  metric.label
                }
              </span>

              <strong
                className={
                  metric.attention
                    ? styles.attentionValue
                    : undefined
                }
              >
                {
                  metric.value
                }
              </strong>

              <small>
                {
                  metric.detail
                }
              </small>
            </div>
          )
        )}
      </section>

      <section className={styles.mainGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>
                Recent requests
              </h2>

              <p>
                Latest commercial submissions.
              </p>
            </div>

            <Link
              href="/requests"
              className={styles.textLink}
            >
              View all
            </Link>
          </div>

          <div className={styles.requestList}>
            {requests.map(
              (
                request
              ) => (
                <Link
                  key={
                    request.id
                  }
                  href={`/requests/${request.id}`}
                  className={styles.requestRow}
                >
                  <div className={styles.requestIdentity}>
                    <strong>
                      {
                        request.name
                      }
                    </strong>

                    <span>
                      {
                        request.id
                      }
                      {" · "}
                      {
                        request.type
                      }
                    </span>
                  </div>

                  <span
                    className={getRequestStatusClass(
                      request.status
                    )}
                  >
                    {
                      request.status
                    }
                  </span>

                  <span className={styles.rowArrow}>
                    →
                  </span>
                </Link>
              )
            )}
          </div>
        </article>

        <aside className={styles.attentionPanel}>
          <div className={styles.attentionLabel}>
            Needs attention
          </div>

          {attentionRequest ? (
            <>
              <h2>
                {
                  attentionRequest.name
                }
              </h2>

              <p className={styles.attentionMeta}>
                {
                  attentionRequest.id
                }
                {" · "}
                {
                  attentionRequest.type
                }
              </p>

              <div className={styles.attentionMessage}>
                Poster requested changes before this request can continue.
              </div>

              <Link
                href={`/requests/${attentionRequest.id}`}
                className={styles.secondaryAction}
              >
                Review request
              </Link>
            </>
          ) : (
            <p className={styles.noAttention}>
              Nothing currently needs your attention.
            </p>
          )}
        </aside>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>
              Campaigns
            </h2>

            <p>
              Current approved campaign delivery.
            </p>
          </div>

          <Link
            href="/campaigns"
            className={styles.textLink}
          >
            View all campaigns
          </Link>
        </div>

        <div className={styles.campaignTable}>
          <div className={styles.tableHeader}>
            <span>
              Campaign
            </span>

            <span>
              Status
            </span>

            <span>
              Delivery
            </span>

            <span>
              Impressions
            </span>
          </div>

          {campaigns.map(
            (
              campaign
            ) => (
              <Link
                key={
                  campaign.id
                }
                href={`/campaigns/${campaign.id}`}
                className={styles.tableRow}
              >
                <div className={styles.campaignIdentity}>
                  <strong>
                    {
                      campaign.name
                    }
                  </strong>

                  <span>
                    {
                      campaign.id
                    }
                  </span>
                </div>

                <span
                  className={
                    campaign.status ===
                    "Active"
                      ? "statusBadge statusActive"
                      : "statusBadge statusScheduled"
                  }
                >
                  {
                    campaign.status
                  }
                </span>

                <div className={styles.deliveryCell}>
                  <div className={styles.deliveryHeader}>
                    <strong>
                      {
                        campaign.delivery
                      }
                      %
                    </strong>
                  </div>

                  <div className={styles.progressTrack}>
                    <span
                      style={{
                        width: `${campaign.delivery}%`,
                      }}
                    />
                  </div>
                </div>

                <div className={styles.impressionsCell}>
                  <strong>
                    {
                      campaign.impressions
                    }
                  </strong>

                  <span>
                    impressions
                  </span>
                </div>
              </Link>
            )
          )}
        </div>
      </section>
    </>
  );
}