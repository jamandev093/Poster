"use client";

import {
  conversionGoalLabel,
  mediaTypeLabel,
  offerTypeLabel,
  placementLabel,
  promotionStatusLabel,
} from "./external-promotion.constants";

import type {
  ExternalPromotionRecord,
} from "./external-promotion.types";

import styles from "./ExternalPromotionDetails.module.css";

interface ExternalPromotionDetailsProps {
  promotion: ExternalPromotionRecord;
  programName: string;
  onEdit: () => void;
  onClose: () => void;
  onStatusChange: (
    status: ExternalPromotionRecord["status"]
  ) => void;
}

export default function ExternalPromotionDetails({
  promotion,
  programName,
  onEdit,
  onClose,
  onStatusChange,
}: ExternalPromotionDetailsProps) {
  const ctr =
    promotion.metrics.impressions > 0
      ? (
          (promotion.metrics.validClicks /
            promotion.metrics.impressions) *
          100
        ).toFixed(2)
      : "0.00";

  const conversionRate =
    promotion.metrics.validClicks > 0
      ? (
          (promotion.metrics.conversions /
            promotion.metrics.validClicks) *
          100
        ).toFixed(2)
      : "0.00";

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            External promotion
          </p>

          <h2>{promotion.name}</h2>

          <p className={styles.program}>
            {programName}
          </p>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close promotion details"
        >
          ×
        </button>
      </header>

      <div className={styles.statusRow}>
        <span
          className={styles.status}
          data-status={promotion.status}
        >
          {promotionStatusLabel(
            promotion.status
          )}
        </span>

        <span>
          {offerTypeLabel(
            promotion.offerType
          )}
        </span>
      </div>

      <section className={styles.metrics}>
        <Metric
          label="Impressions"
          value={promotion.metrics.impressions.toLocaleString(
            "en-IN"
          )}
        />

        <Metric
          label="Valid clicks"
          value={promotion.metrics.validClicks.toLocaleString(
            "en-IN"
          )}
        />

        <Metric
          label="CTR"
          value={`${ctr}%`}
        />

        <Metric
          label="Conversions"
          value={promotion.metrics.conversions.toLocaleString(
            "en-IN"
          )}
        />

        <Metric
          label="Conversion rate"
          value={`${conversionRate}%`}
        />
      </section>

      <section className={styles.section}>
        <h3>Offer</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="External offer ID"
            value={
              promotion.externalOfferId ||
              "Not recorded"
            }
          />

          <Detail
            label="Category"
            value={promotion.category}
          />

          <Detail
            label="Offer type"
            value={offerTypeLabel(
              promotion.offerType
            )}
          />

          <Detail
            label="Conversion goal"
            value={conversionGoalLabel(
              promotion.conversionGoal
            )}
          />
        </dl>
      </section>

      <section className={styles.section}>
        <h3>Creative</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Headline"
            value={promotion.headline}
          />

          <Detail
            label="Call to action"
            value={promotion.callToAction}
          />

          <Detail
            label="Media type"
            value={mediaTypeLabel(
              promotion.mediaType
            )}
          />
        </dl>

        <p className={styles.description}>
          {promotion.description}
        </p>

        {promotion.mediaUrl ? (
          <a
            className={styles.externalLink}
            href={promotion.mediaUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open media
          </a>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3>Tracking</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Referral code"
            value={
              promotion.referralCode ||
              "Not used"
            }
          />

          <Detail
            label="Disclosure"
            value={promotion.disclosure}
          />
        </dl>

        <div className={styles.linkActions}>
          <a
            href={promotion.destinationUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open destination
          </a>

          {promotion.trackingUrl ? (
            <a
              href={promotion.trackingUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open tracking link
            </a>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <h3>Placement and schedule</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Placements"
            value={promotion.placements
              .map(placementLabel)
              .join(", ")}
          />

          <Detail
            label="Start date"
            value={
              promotion.startDate ||
              "Not scheduled"
            }
          />

          <Detail
            label="End date"
            value={
              promotion.endDate ||
              "No end date"
            }
          />

          <Detail
            label="Last updated"
            value={promotion.updatedAt}
          />
        </dl>
      </section>

      <section className={styles.section}>
        <h3>Internal notes</h3>

        <p className={styles.notes}>
          {promotion.notes ||
            "No internal notes."}
        </p>
      </section>

      <section className={styles.section}>
        <h3>Audit history</h3>

        <div className={styles.auditList}>
          {promotion.auditHistory.map(
            (entry) => (
              <article
                key={entry.id}
                className={styles.auditEntry}
              >
                <div>
                  <strong>
                    {entry.message}
                  </strong>

                  <span>
                    {entry.actor}
                  </span>
                </div>

                <time>
                  {entry.occurredAt}
                </time>
              </article>
            )
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onEdit}
        >
          Edit promotion
        </button>

        {promotion.status === "draft" ||
        promotion.status === "scheduled" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("active");
            }}
          >
            Activate
          </button>
        ) : null}

        {promotion.status === "active" ? (
          <button
            type="button"
            className={styles.warningButton}
            onClick={() => {
              onStatusChange("paused");
            }}
          >
            Pause
          </button>
        ) : null}

        {promotion.status === "paused" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("active");
            }}
          >
            Resume
          </button>
        ) : null}

        {promotion.status === "ended" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("active");
            }}
          >
            Restart promotion
          </button>
        ) : null}

        {promotion.status !== "ended" ? (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => {
              onStatusChange("ended");
            }}
          >
            End promotion
          </button>
        ) : null}
      </footer>
    </div>
  );
}

interface DetailProps {
  label: string;
  value: string;
}

function Detail({
  label,
  value,
}: DetailProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({
  label,
  value,
}: MetricProps) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

