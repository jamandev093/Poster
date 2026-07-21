import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  calculateCampaignCtr,
  calculateConversionRate,
  calculateDeliveryProgress,
  calculateRevenuePerClick,
  formatCampaignCurrency,
  formatCampaignDate,
  formatCampaignNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
  getClientCampaignById,
  getTrackingStatusLabel,
} from "@/features/campaigns/campaign.mock";

import type {
  ClientCampaignStatus,
} from "@/features/campaigns/campaign.types";

import styles from "./page.module.css";

interface CampaignDetailsPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

function getStatusClass(
  status: ClientCampaignStatus
): string {
  switch (status) {
    case "active":
      return "statusBadge statusActive";

    case "scheduled":
      return "statusBadge statusScheduled";

    case "paused":
      return "statusBadge statusAttention";

    case "draft":
      return `statusBadge ${styles.statusDraft}`;

    case "ended":
      return `statusBadge ${styles.statusEnded}`;
  }
}

export default async function CampaignDetailsPage({
  params,
}: CampaignDetailsPageProps) {
  const {
    campaignId,
  } = await params;

  const campaign =
    getClientCampaignById(campaignId);

  if (!campaign) {
    notFound();
  }

  const ctr =
    calculateCampaignCtr(
      campaign.performance.impressions,
      campaign.performance.clicks
    );

  const conversionRate =
    calculateConversionRate(
      campaign.performance.clicks,
      campaign.performance.conversions
    );

  const delivery =
    calculateDeliveryProgress(
      campaign.financials.deliveryTarget,
      campaign.financials.delivered
    );

  const revenuePerClick =
    calculateRevenuePerClick(
      campaign.performance.clicks,
      campaign.financials.revenue
    );

  return (
    <>
      <Link
        href="/campaigns"
        className={styles.backLink}
      >
        ← Back to campaigns
      </Link>

      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            {campaign.id}
          </div>

          <h1 className="pageTitle">
            {campaign.name}
          </h1>

          <p className="pageDescription">
            {getCampaignTypeLabel(campaign.type)}
          </p>
        </div>

        <span className={getStatusClass(campaign.status)}>
          {getCampaignStatusLabel(campaign.status)}
        </span>
      </header>

      <section className={styles.metrics}>
        <article className={styles.metric}>
          <span>Impressions</span>

          <strong>
            {formatCampaignNumber(
              campaign.performance.impressions
            )}
          </strong>

          <small>Recorded delivery</small>
        </article>

        <article className={styles.metric}>
          <span>Clicks</span>

          <strong>
            {formatCampaignNumber(
              campaign.performance.clicks
            )}
          </strong>

          <small>{ctr.toFixed(2)}% CTR</small>
        </article>

        <article className={styles.metric}>
          <span>Conversions</span>

          <strong>
            {campaign.performance.conversions === null
              ? "Not tracked"
              : formatCampaignNumber(
                  campaign.performance.conversions
                )}
          </strong>

          <small>
            {conversionRate === null
              ? "Tracking unavailable"
              : `${conversionRate.toFixed(2)}% conversion rate`}
          </small>
        </article>

        <article className={styles.metric}>
          <span>
            {campaign.type === "affiliate"
              ? "Commission"
              : "Contract value"}
          </span>

          <strong>
            {campaign.type === "affiliate"
              ? formatCampaignCurrency(
                  campaign.financials.commission ?? 0
                )
              : formatCampaignCurrency(
                  campaign.financials.contractValue ?? 0
                )}
          </strong>

          <small>
            {campaign.type === "affiliate" &&
            revenuePerClick !== null
              ? `${formatCampaignCurrency(
                  revenuePerClick
                )} revenue per click`
              : "Commercial value"}
          </small>
        </article>
      </section>

      <section className={styles.grid}>
        <article className="contentCard">
          <h2 className="sectionTitle">
            Campaign details
          </h2>

          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span>Request</span>

              <Link href={`/requests/${campaign.requestId}`}>
                {campaign.requestId}
              </Link>
            </div>

            <div className={styles.detailRow}>
              <span>Schedule</span>

              <strong>
                {formatCampaignDate(campaign.startDate)}
                {" – "}
                {formatCampaignDate(campaign.endDate)}
              </strong>
            </div>

            <div className={styles.detailRow}>
              <span>Placements</span>

              <div className={styles.placements}>
                {campaign.placements.map(
                  (placement) => (
                    <span
                      key={placement}
                      className={styles.placement}
                    >
                      {placement}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className={styles.detailRow}>
              <span>Tracking</span>

              <strong>
                {getTrackingStatusLabel(
                  campaign.trackingStatus
                )}
              </strong>
            </div>

            <div className={styles.detailRow}>
              <span>Conversion</span>

              <strong>
                {campaign.conversionDefinition ??
                  "Not configured"}
              </strong>
            </div>
          </div>
        </article>

        <article className="contentCard">
          <h2 className="sectionTitle">
            Delivery
          </h2>

          {delivery !== null ? (
            <>
              <div className={styles.deliveryHeader}>
                <div>
                  <span>Completed</span>
                  <strong>{delivery.toFixed(1)}%</strong>
                </div>

                <span>
                  {formatCampaignNumber(
                    campaign.financials.delivered ?? 0
                  )}
                  {" / "}
                  {formatCampaignNumber(
                    campaign.financials.deliveryTarget ?? 0
                  )}
                </span>
              </div>

              <div className={styles.progressTrack}>
                <span
                  style={{
                    width: `${delivery}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className={styles.notice}>
              Affiliate campaigns use conversion and commission reporting
              instead of contracted impression delivery.
            </div>
          )}

          {campaign.status === "draft" ? (
            <div className={styles.notice}>
              Poster Admin is completing campaign setup. The campaign is not
              active yet.
            </div>
          ) : null}
        </article>
      </section>

      <p className={styles.note}>
        This workspace is view-only. Poster Admin controls campaign setup,
        scheduling, activation, pausing, and completion.
      </p>
    </>
  );
}