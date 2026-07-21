import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  formatClientCurrency,
  formatClientDate,
  getClientRequestById,
  getRequestStatusLabel,
  getRequestTypeLabel,
} from "@/features/requests/request.mock";

import type {
  ClientRequestStatus,
} from "@/features/requests/request.types";

import styles from "./page.module.css";

interface RequestDetailsPageProps {
  params: Promise<{
    requestId: string;
  }>;
}

function getStatusClass(
  status: ClientRequestStatus
): string {
  switch (status) {
    case "pending_review":
      return "statusBadge statusScheduled";

    case "changes_requested":
      return "statusBadge statusAttention";

    case "approved":
      return "statusBadge statusActive";

    case "rejected":
      return `statusBadge ${styles.statusRejected}`;
  }
}

export default async function RequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const {
    requestId,
  } = await params;

  const request =
    getClientRequestById(requestId);

  if (!request) {
    notFound();
  }

  const commercialValue =
    request.proposedContractValue !== undefined
      ? formatClientCurrency(
          request.proposedContractValue
        )
      : request.proposedBudget !== undefined
        ? formatClientCurrency(
            request.proposedBudget
          )
        : request.commissionModel ?? "—";

  return (
    <>
      <Link
        href="/requests"
        className={styles.backLink}
      >
        ← Back to requests
      </Link>

      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            {request.id}
          </div>

          <h1 className="pageTitle">
            {request.campaignName}
          </h1>

          <p className="pageDescription">
            {getRequestTypeLabel(request.type)}
          </p>
        </div>

        <div className={styles.headerActions}>
          <span className={getStatusClass(request.status)}>
            {getRequestStatusLabel(request.status)}
          </span>

          {request.status === "changes_requested" ? (
            <Link
              href={`/requests/new?edit=${request.id}`}
              className="primaryButton"
            >
              Update request
            </Link>
          ) : null}

          {request.status === "approved" ? (
            <Link
              href="/campaigns"
              className="secondaryButton"
            >
              View campaign
            </Link>
          ) : null}
        </div>
      </header>

      {request.reviewNote ? (
        <section className={styles.notice}>
          <strong>
            {request.status === "changes_requested"
              ? "Admin requested changes"
              : request.status === "rejected"
                ? "Admin decision"
                : "Review note"}
          </strong>

          <p>{request.reviewNote}</p>
        </section>
      ) : null}

      <section className={styles.summaryGrid}>
        <article className={styles.summaryItem}>
          <span>Submitted</span>
          <strong>
            {formatClientDate(request.submittedAt)}
          </strong>
        </article>

        <article className={styles.summaryItem}>
          <span>Requested period</span>
          <strong>
            {formatClientDate(request.requestedStartDate)}
            {" – "}
            {formatClientDate(request.requestedEndDate)}
          </strong>
        </article>

        <article className={styles.summaryItem}>
          <span>Commercial value</span>
          <strong>{commercialValue}</strong>
        </article>

        <article className={styles.summaryItem}>
          <span>Linked campaign</span>
          <strong>
            {request.linkedCampaignId ?? "Not created"}
          </strong>
        </article>
      </section>

      <section className={styles.grid}>
        <article className="contentCard">
          <h2 className="sectionTitle">
            Request details
          </h2>

          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span>Organization</span>
              <strong>{request.organization}</strong>
            </div>

            <div className={styles.detailRow}>
              <span>Contact</span>
              <strong>
                {request.contactName}
                {" · "}
                {request.businessEmail}
              </strong>
            </div>

            <div className={styles.detailRow}>
              <span>Website</span>
              <a
                href={request.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {request.website}
              </a>
            </div>

            <div className={styles.detailRow}>
              <span>Placements</span>

              <div className={styles.placements}>
                {request.requestedPlacements.map(
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
              <span>Conversion</span>
              <strong>
                {request.conversionDefinition ??
                  "Not provided"}
              </strong>
            </div>

            {request.commissionModel ? (
              <div className={styles.detailRow}>
                <span>Commission model</span>
                <strong>{request.commissionModel}</strong>
              </div>
            ) : null}
          </div>
        </article>

        <article className="contentCard">
          <h2 className="sectionTitle">
            Submitted creative
          </h2>

          <div className={styles.creative}>
            <strong>{request.creative.headline}</strong>

            <p>{request.creative.body}</p>

            <span>{request.creative.callToAction} →</span>
          </div>

          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span>Destination</span>

              <a
                href={request.creative.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open destination
              </a>
            </div>
          </div>
        </article>
      </section>

      <p className={styles.note}>
        Clients can update a request only when Admin requests changes.
        Campaign activation, pausing, scheduling, and ending remain
        Admin-controlled.
      </p>
    </>
  );
}