"use client";

import {
  paymentScheduleLabel,
  payoutMethodLabel,
  programStatusLabel,
  programTypeLabel,
} from "./external-program.constants";

import type {
  ExternalProgramRecord,
} from "./external-program.types";

import styles from "./ExternalProgramDetails.module.css";

interface ExternalProgramDetailsProps {
  program: ExternalProgramRecord;
  onEdit: () => void;
  onClose: () => void;
  onStatusChange: (
    status: ExternalProgramRecord["status"]
  ) => void;
}

export default function ExternalProgramDetails({
  program,
  onEdit,
  onClose,
  onStatusChange,
}: ExternalProgramDetailsProps) {
  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            External program
          </p>

          <h2>{program.programName}</h2>

          <p className={styles.platform}>
            {program.platformName}
          </p>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close program details"
        >
          ×
        </button>
      </header>

      <div className={styles.statusRow}>
        <span
          className={styles.status}
          data-status={program.status}
        >
          {programStatusLabel(
            program.status
          )}
        </span>

        <span>
          {programTypeLabel(
            program.programType
          )}
        </span>
      </div>

      <section className={styles.section}>
        <h3>Program</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Application date"
            value={
              program.applicationDate ||
              "Not recorded"
            }
          />

          <Detail
            label="Approval date"
            value={
              program.approvalDate ||
              "Not approved"
            }
          />

          <Detail
            label="Next review"
            value={
              program.nextReviewDate ||
              "Not scheduled"
            }
          />

          <Detail
            label="Last updated"
            value={program.updatedAt}
          />
        </dl>

        <div className={styles.linkActions}>
          {program.applicationUrl ? (
            <a
              href={program.applicationUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open application
            </a>
          ) : null}

          {program.dashboardUrl ? (
            <a
              href={program.dashboardUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open dashboard
            </a>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <h3>Poster account references</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Account / publisher ID"
            value={
              program.accountReference ||
              "Not issued"
            }
          />

          <Detail
            label="Tracking ID"
            value={
              program.trackingId ||
              "Not issued"
            }
          />
        </dl>
      </section>

      <section className={styles.section}>
        <h3>Payout arrangement</h3>

        <dl className={styles.definitionGrid}>
          <Detail
            label="Method"
            value={payoutMethodLabel(
              program.payoutMethod
            )}
          />

          <Detail
            label="Destination"
            value={
              program.payoutDestinationLabel ||
              "Not recorded"
            }
          />

          <Detail
            label="Currency"
            value={program.currency}
          />

          <Detail
            label="Minimum payout"
            value={
              program.minimumPayout ||
              "Not specified"
            }
          />

          <Detail
            label="Schedule"
            value={paymentScheduleLabel(
              program.paymentSchedule
            )}
          />
        </dl>
      </section>

      <section className={styles.section}>
        <h3>Internal notes</h3>

        <p className={styles.notes}>
          {program.notes ||
            "No internal notes."}
        </p>
      </section>

      <section className={styles.section}>
        <h3>Audit history</h3>

        <div className={styles.auditList}>
          {program.auditHistory.map(
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
          Edit program
        </button>

        {program.status === "approved" ? (
          <button
            type="button"
            className={styles.warningButton}
            onClick={() => {
              onStatusChange("suspended");
            }}
          >
            Suspend
          </button>
        ) : null}

        {program.status === "suspended" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              onStatusChange("approved");
            }}
          >
            Restore approval
          </button>
        ) : null}

        {program.status !== "closed" ? (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => {
              onStatusChange("closed");
            }}
          >
            Close program
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
