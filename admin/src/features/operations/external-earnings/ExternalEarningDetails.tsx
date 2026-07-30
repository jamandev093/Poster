"use client";

import {
  earningEventLabel,
  earningSourceLabel,
  earningStatusLabel,
  payoutStatusLabel,
} from "./external-earning.constants";

import type {
  ExternalEarningRecord,
} from "./external-earning.types";

import styles from "./ExternalEarningDetails.module.css";

interface ExternalEarningDetailsProps {
  earning: ExternalEarningRecord;
  programName: string;
  promotionName: string;
  onEdit: () => void;
  onClose: () => void;
  onStatusChange: (
    status: ExternalEarningRecord["status"]
  ) => void;
}

function formatAmount(
  value: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default function ExternalEarningDetails({
  earning,
  programName,
  promotionName,
  onEdit,
  onClose,
  onStatusChange,
}: ExternalEarningDetailsProps) {
  const currency =
    earning.amount.currency;

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            External earning
          </p>

          <h2>
            {earning.externalConversionId}
          </h2>

          <p className={styles.context}>
            {promotionName}
            {" · "}
            {programName}
          </p>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close earning details"
        >
          ×
        </button>
      </header>

      <div className={styles.statusRow}>
        <span
          className={styles.status}
          data-status={earning.status}
        >
          {earningStatusLabel(
            earning.status
          )}
        </span>

        <span
          className={styles.payoutStatus}
          data-status={
            earning.payoutStatus
          }
        >
          {payoutStatusLabel(
            earning.payoutStatus
          )}
        </span>

        <span>
          {earningEventLabel(
            earning.eventType
          )}
        </span>
      </div>

      <section className={styles.metrics}>
        <Metric
          label="Gross amount"
          value={formatAmount(
            earning.amount.grossAmount,
            currency
          )}
        />

        <Metric
          label="Commission"
          value={formatAmount(
            earning.amount
              .commissionAmount,
            currency
          )}
        />

        <Metric
          label="Tax withheld"
          value={formatAmount(
            earning.amount.taxWithheld,
            currency
          )}
        />

        <Metric
          label="Fees"
          value={formatAmount(
            earning.amount.fees,
            currency
          )}
        />

        <Metric
          label="Net earning"
          value={formatAmount(
            earning.amount.netAmount,
            currency
          )}
        />
      </section>

      <section className={styles.section}>
        <h3>Program and promotion</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Program"
            value={programName}
          />

          <Detail
            label="Promotion"
            value={promotionName}
          />

          <Detail
            label="Event type"
            value={earningEventLabel(
              earning.eventType
            )}
          />

          <Detail
            label="Source"
            value={earningSourceLabel(
              earning.source
            )}
          />

          <Detail
            label="Customer country"
            value={
              earning.customerCountry ||
              "Not recorded"
            }
          />
        </dl>
      </section>

      <section className={styles.section}>
        <h3>External references</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Conversion ID"
            value={
              earning.externalConversionId
            }
          />

          <Detail
            label="Order ID"
            value={
              earning.externalOrderId ||
              "Not recorded"
            }
          />

          <Detail
            label="Payout ID"
            value={
              earning.externalPayoutId ||
              "Not issued"
            }
          />

          <Detail
            label="Statement reference"
            value={
              earning.statementReference ||
              "Not recorded"
            }
          />
        </dl>

        {earning.evidenceUrl ? (
          <a
            className={styles.externalLink}
            href={earning.evidenceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open evidence
          </a>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3>Timeline</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Conversion date"
            value={earning.conversionDate}
          />

          <Detail
            label="Confirmation date"
            value={
              earning.confirmationDate ||
              "Not confirmed"
            }
          />

          <Detail
            label="Payout date"
            value={
              earning.payoutDate ||
              "Not paid"
            }
          />

          <Detail
            label="Last updated"
            value={earning.updatedAt}
          />
        </dl>
      </section>

      {earning.reversalReason ? (
        <section className={styles.section}>
          <h3>Reversal reason</h3>

          <p className={styles.notes}>
            {earning.reversalReason}
          </p>
        </section>
      ) : null}

      {earning.rejectionReason ? (
        <section className={styles.section}>
          <h3>Rejection reason</h3>

          <p className={styles.notes}>
            {earning.rejectionReason}
          </p>
        </section>
      ) : null}

      <section className={styles.section}>
        <h3>Internal notes</h3>

        <p className={styles.notes}>
          {earning.notes ||
            "No internal notes."}
        </p>
      </section>

      <section className={styles.section}>
        <h3>Audit history</h3>

        <div className={styles.auditList}>
          {earning.auditHistory.map(
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
          Edit earning
        </button>

        {earning.status === "pending" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("confirmed");
            }}
          >
            Confirm
          </button>
        ) : null}

        {earning.status === "confirmed" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("approved");
            }}
          >
            Approve
          </button>
        ) : null}

        {earning.status === "approved" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("payable");
            }}
          >
            Mark payable
          </button>
        ) : null}

        {earning.status === "payable" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("paid");
            }}
          >
            Mark paid
          </button>
        ) : null}

        {earning.status !== "paid" &&
        earning.status !== "reversed" &&
        earning.status !== "rejected" ? (
          <button
            type="button"
            className={styles.warningButton}
            onClick={() => {
              onStatusChange("reversed");
            }}
          >
            Reverse
          </button>
        ) : null}

        {earning.status !== "paid" &&
        earning.status !== "rejected" ? (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => {
              onStatusChange("rejected");
            }}
          >
            Reject
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
