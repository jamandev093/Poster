"use client";

import {
  PAYMENT_SCHEDULE_OPTIONS,
  PAYOUT_METHOD_OPTIONS,
  PROGRAM_STATUS_OPTIONS,
  PROGRAM_TYPE_OPTIONS,
} from "./external-program.constants";

import type {
  ExternalProgramDraft,
  ExternalProgramErrors,
  ExternalProgramPaymentSchedule,
  ExternalProgramPayoutMethod,
  ExternalProgramStatus,
  ExternalProgramType,
} from "./external-program.types";

import styles from "./ExternalProgramEditor.module.css";

interface ExternalProgramEditorProps {
  draft: ExternalProgramDraft;
  errors: ExternalProgramErrors;
  submitLabel: string;
  onChange: (
    draft: ExternalProgramDraft
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ExternalProgramEditor({
  draft,
  errors,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: ExternalProgramEditorProps) {
  const update = <
    Key extends keyof ExternalProgramDraft,
  >(
    key: Key,
    value: ExternalProgramDraft[Key]
  ) => {
    onChange({
      ...draft,
      [key]: value,
    });
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <section className={styles.section}>
        <header>
          <h3>Program details</h3>
          <p>
            Identify the external platform
            and the program Poster is applying
            to or already operates.
          </p>
        </header>

        <div className={styles.grid}>
          <Field
            label="Program name"
            value={draft.programName}
            error={errors.programName}
            onChange={(value) => {
              update("programName", value);
            }}
          />

          <Field
            label="Platform name"
            value={draft.platformName}
            error={errors.platformName}
            onChange={(value) => {
              update("platformName", value);
            }}
          />

          <SelectField
            label="Program type"
            value={draft.programType}
            options={PROGRAM_TYPE_OPTIONS}
            onChange={(value) => {
              update(
                "programType",
                value as ExternalProgramType
              );
            }}
          />

          <SelectField
            label="Application status"
            value={draft.status}
            options={PROGRAM_STATUS_OPTIONS}
            onChange={(value) => {
              update(
                "status",
                value as ExternalProgramStatus
              );
            }}
          />

          <Field
            label="Application URL"
            type="url"
            value={draft.applicationUrl}
            error={errors.applicationUrl}
            placeholder="https://..."
            onChange={(value) => {
              update("applicationUrl", value);
            }}
          />

          <Field
            label="Dashboard URL"
            type="url"
            value={draft.dashboardUrl}
            error={errors.dashboardUrl}
            placeholder="https://..."
            onChange={(value) => {
              update("dashboardUrl", value);
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <header>
          <h3>Poster account references</h3>
          <p>
            Save only operational identifiers
            issued by the external platform.
          </p>
        </header>

        <div className={styles.grid}>
          <Field
            label="Account or publisher reference"
            value={draft.accountReference}
            error={errors.accountReference}
            placeholder="Publisher ID, store ID, partner ID..."
            onChange={(value) => {
              update(
                "accountReference",
                value
              );
            }}
          />

          <Field
            label="Tracking ID"
            value={draft.trackingId}
            placeholder="Optional until issued"
            onChange={(value) => {
              update("trackingId", value);
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <header>
          <h3>Payout arrangement</h3>
          <p>
            Record how the external program
            pays Poster. This does not initiate
            payments.
          </p>
        </header>

        <div className={styles.grid}>
          <SelectField
            label="Payout method"
            value={draft.payoutMethod}
            options={PAYOUT_METHOD_OPTIONS}
            onChange={(value) => {
              update(
                "payoutMethod",
                value as ExternalProgramPayoutMethod
              );
            }}
          />

          <Field
            label="Payout destination label"
            value={
              draft.payoutDestinationLabel
            }
            placeholder="Poster business bank account"
            onChange={(value) => {
              update(
                "payoutDestinationLabel",
                value
              );
            }}
          />

          <Field
            label="Currency"
            value={draft.currency}
            error={errors.currency}
            placeholder="INR"
            onChange={(value) => {
              update(
                "currency",
                value.toUpperCase()
              );
            }}
          />

          <Field
            label="Minimum payout"
            value={draft.minimumPayout}
            placeholder="1,000 or $100"
            onChange={(value) => {
              update("minimumPayout", value);
            }}
          />

          <SelectField
            label="Payment schedule"
            value={draft.paymentSchedule}
            options={
              PAYMENT_SCHEDULE_OPTIONS
            }
            onChange={(value) => {
              update(
                "paymentSchedule",
                value as ExternalProgramPaymentSchedule
              );
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <header>
          <h3>Application timeline</h3>
          <p>
            Keep application, approval and
            follow-up dates visible to Admin.
          </p>
        </header>

        <div className={styles.grid}>
          <Field
            label="Application date"
            type="date"
            value={draft.applicationDate}
            onChange={(value) => {
              update(
                "applicationDate",
                value
              );
            }}
          />

          <Field
            label="Approval date"
            type="date"
            value={draft.approvalDate}
            error={errors.approvalDate}
            onChange={(value) => {
              update("approvalDate", value);
            }}
          />

          <Field
            label="Next review date"
            type="date"
            value={draft.nextReviewDate}
            onChange={(value) => {
              update(
                "nextReviewDate",
                value
              );
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <header>
          <h3>Internal notes</h3>
          <p>
            Add approval requirements,
            restrictions or follow-up context.
          </p>
        </header>

        <label className={styles.field}>
          <span>Notes</span>

          <textarea
            rows={5}
            value={draft.notes}
            onChange={(event) => {
              update(
                "notes",
                event.target.value
              );
            }}
          />
        </label>
      </section>

      <footer className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={styles.primaryButton}
        >
          {submitLabel}
        </button>
      </footer>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  type?: "text" | "url" | "date";
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
}

function Field({
  label,
  value,
  type = "text",
  placeholder,
  error,
  onChange,
}: FieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={
          error ? "true" : undefined
        }
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />

      {error ? (
        <small className={styles.error}>
          {error}
        </small>
      ) : null}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: ReadonlyArray<{
    value: string;
    label: string;
  }>;
  onChange: (value: string) => void;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
