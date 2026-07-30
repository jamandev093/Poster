"use client";

import {
  EARNING_EVENT_OPTIONS,
  EARNING_SOURCE_OPTIONS,
  EARNING_STATUS_OPTIONS,
  PAYOUT_STATUS_OPTIONS,
} from "./external-earning.constants";

import {
  calculateNetAmount,
} from "./external-earning.validation";

import type {
  ExternalEarningDraft,
  ExternalEarningErrors,
  ExternalEarningEventType,
  ExternalEarningSource,
  ExternalEarningStatus,
  ExternalPayoutStatus,
} from "./external-earning.types";

import styles from "./ExternalEarningEditor.module.css";

export interface ExternalEarningProgramOption {
  id: string;
  programName: string;
  platformName: string;
}

export interface ExternalEarningPromotionOption {
  id: string;
  programId: string;
  name: string;
  headline: string;
}

interface ExternalEarningEditorProps {
  draft: ExternalEarningDraft;
  errors: ExternalEarningErrors;
  programs:
    ReadonlyArray<ExternalEarningProgramOption>;
  promotions:
    ReadonlyArray<ExternalEarningPromotionOption>;
  submitLabel: string;
  onChange: (
    draft: ExternalEarningDraft
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ExternalEarningEditor({
  draft,
  errors,
  programs,
  promotions,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: ExternalEarningEditorProps) {
  const update = <
    Key extends keyof ExternalEarningDraft,
  >(
    key: Key,
    value: ExternalEarningDraft[Key]
  ) => {
    onChange({
      ...draft,
      [key]: value,
    });
  };

  const updateAmounts = (
    key:
      | "commissionAmount"
      | "taxWithheld"
      | "fees",
    value: string
  ) => {
    const nextDraft = {
      ...draft,
      [key]: value,
    };

    const netAmount =
      calculateNetAmount(
        nextDraft.commissionAmount,
        nextDraft.taxWithheld,
        nextDraft.fees
      );

    onChange({
      ...nextDraft,
      netAmount:
        netAmount.toFixed(2),
    });
  };

  const matchingPromotions =
    promotions.filter(
      (promotion) =>
        !draft.programId ||
        promotion.programId ===
          draft.programId
    );

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <section className={styles.section}>
        <SectionHeading
          title="Program and promotion"
          description="Connect this earning to the approved external program and promotion that produced the reported conversion."
        />

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Approved program</span>

            <select
              value={draft.programId}
              aria-invalid={
                errors.programId
                  ? "true"
                  : undefined
              }
              onChange={(event) => {
                onChange({
                  ...draft,
                  programId:
                    event.target.value,
                  promotionId: "",
                });
              }}
            >
              <option value="">
                Select a program
              </option>

              {programs.map(
                (program) => (
                  <option
                    key={program.id}
                    value={program.id}
                  >
                    {program.programName}
                    {" · "}
                    {program.platformName}
                  </option>
                )
              )}
            </select>

            <ErrorMessage
              value={errors.programId}
            />
          </label>

          <label className={styles.field}>
            <span>External promotion</span>

            <select
              value={draft.promotionId}
              aria-invalid={
                errors.promotionId
                  ? "true"
                  : undefined
              }
              disabled={!draft.programId}
              onChange={(event) => {
                update(
                  "promotionId",
                  event.target.value
                );
              }}
            >
              <option value="">
                Select a promotion
              </option>

              {matchingPromotions.map(
                (promotion) => (
                  <option
                    key={promotion.id}
                    value={promotion.id}
                  >
                    {promotion.name}
                  </option>
                )
              )}
            </select>

            <ErrorMessage
              value={errors.promotionId}
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="External references"
          description="Record the identifiers issued by the external platform, statement or payout report."
        />

        <div className={styles.grid}>
          <Field
            label="External conversion ID"
            value={
              draft.externalConversionId
            }
            error={
              errors.externalConversionId
            }
            onChange={(value) => {
              update(
                "externalConversionId",
                value
              );
            }}
          />

          <Field
            label="External order ID (optional)"
            value={draft.externalOrderId}
            placeholder="Optional"
            onChange={(value) => {
              update(
                "externalOrderId",
                value
              );
            }}
          />

          <Field
            label="External payout ID (required when paid)"
            value={
              draft.externalPayoutId
            }
            placeholder="Optional until paid"
            onChange={(value) => {
              update(
                "externalPayoutId",
                value
              );
            }}
          />

          <Field
            label="Statement reference (optional)"
            value={
              draft.statementReference
            }
            placeholder="Statement, report or batch reference"
            onChange={(value) => {
              update(
                "statementReference",
                value
              );
            }}
          />

          <Field
            label="Evidence URL (optional)"
            type="url"
            value={draft.evidenceUrl}
            error={errors.evidenceUrl}
            placeholder="https://..."
            onChange={(value) => {
              update(
                "evidenceUrl",
                value
              );
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Conversion"
          description="Record the externally reported outcome and how it entered Poster operations."
        />

        <div className={styles.grid}>
          <SelectField
            label="Event type"
            value={draft.eventType}
            options={
              EARNING_EVENT_OPTIONS
            }
            onChange={(value) => {
              update(
                "eventType",
                value as ExternalEarningEventType
              );
            }}
          />

          <SelectField
            label="Source"
            value={draft.source}
            options={
              EARNING_SOURCE_OPTIONS
            }
            onChange={(value) => {
              update(
                "source",
                value as ExternalEarningSource
              );
            }}
          />

          <Field
            label="Conversion date"
            type="date"
            value={draft.conversionDate}
            error={errors.conversionDate}
            onChange={(value) => {
              update(
                "conversionDate",
                value
              );
            }}
          />

          <Field
            label="Confirmation date (required from confirmed status)"
            type="date"
            value={
              draft.confirmationDate
            }
            error={
              errors.confirmationDate
            }
            onChange={(value) => {
              update(
                "confirmationDate",
                value
              );
            }}
          />

          <Field
            label="Customer country (optional)"
            value={
              draft.customerCountry
            }
            onChange={(value) => {
              update(
                "customerCountry",
                value
              );
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Commission amounts"
          description="Record gross transaction value, externally reported commission, deductions and Poster’s net earning."
        />

        <div className={styles.grid}>
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

          <NumberField
            label="Gross amount (optional)"
            value={draft.grossAmount}
            error={errors.grossAmount}
            onChange={(value) => {
              update(
                "grossAmount",
                value
              );
            }}
          />

          <NumberField
            label="Commission amount (required from approved status)"
            value={
              draft.commissionAmount
            }
            error={
              errors.commissionAmount
            }
            onChange={(value) => {
              updateAmounts(
                "commissionAmount",
                value
              );
            }}
          />

          <NumberField
            label="Tax withheld (optional)"
            value={draft.taxWithheld}
            error={errors.taxWithheld}
            onChange={(value) => {
              updateAmounts(
                "taxWithheld",
                value
              );
            }}
          />

          <NumberField
            label="Fees (optional)"
            value={draft.fees}
            error={errors.fees}
            onChange={(value) => {
              updateAmounts(
                "fees",
                value
              );
            }}
          />

          <NumberField
            label="Net amount"
            value={draft.netAmount}
            error={errors.netAmount}
            readOnly
            onChange={() => {}}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Status and payout"
          description="Track commission review and payout state independently for reconciliation."
        />

        <div className={styles.grid}>
          <SelectField
            label="Earning status"
            value={draft.status}
            options={
              EARNING_STATUS_OPTIONS
            }
            onChange={(value) => {
              update(
                "status",
                value as ExternalEarningStatus
              );
            }}
          />

          <SelectField
            label="Payout status"
            value={draft.payoutStatus}
            options={
              PAYOUT_STATUS_OPTIONS
            }
            error={errors.payoutStatus}
            onChange={(value) => {
              update(
                "payoutStatus",
                value as ExternalPayoutStatus
              );
            }}
          />

          <Field
            label="Payout date (required when paid)"
            type="date"
            value={draft.payoutDate}
            error={errors.payoutDate}
            onChange={(value) => {
              update(
                "payoutDate",
                value
              );
            }}
          />
        </div>

        {draft.status ===
        "reversed" ? (
          <TextAreaField
            label="Reversal reason"
            value={
              draft.reversalReason
            }
            error={
              errors.reversalReason
            }
            onChange={(value) => {
              update(
                "reversalReason",
                value
              );
            }}
          />
        ) : null}

        {draft.status ===
        "rejected" ? (
          <TextAreaField
            label="Rejection reason"
            value={
              draft.rejectionReason
            }
            error={
              errors.rejectionReason
            }
            onChange={(value) => {
              update(
                "rejectionReason",
                value
              );
            }}
          />
        ) : null}
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Internal notes"
          description="Record reconciliation context, platform restrictions or follow-up requirements."
        />

        <TextAreaField
          label="Notes"
          value={draft.notes}
          onChange={(value) => {
            update("notes", value);
          }}
        />
      </section>

      <footer className={styles.actions}>
        <button
          type="button"
          className={
            styles.secondaryButton
          }
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={
            styles.primaryButton
          }
        >
          {submitLabel}
        </button>
      </footer>
    </form>
  );
}

interface SectionHeadingProps {
  title: string;
  description: string;
}

function SectionHeading({
  title,
  description,
}: SectionHeadingProps) {
  return (
    <header
      className={
        styles.sectionHeading
      }
    >
      <h3>{title}</h3>
      <p>{description}</p>
    </header>
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
          onChange(
            event.target.value
          );
        }}
      />

      <ErrorMessage value={error} />
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  error?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

function NumberField({
  label,
  value,
  error,
  readOnly = false,
  onChange,
}: NumberFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        readOnly={readOnly}
        aria-invalid={
          error ? "true" : undefined
        }
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
      />

      <ErrorMessage value={error} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  error,
  onChange,
}: Omit<
  FieldProps,
  "type" | "placeholder"
>) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <textarea
        rows={5}
        value={value}
        aria-invalid={
          error ? "true" : undefined
        }
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
      />

      <ErrorMessage value={error} />
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
  error?: string;
  onChange: (value: string) => void;
}

function SelectField({
  label,
  value,
  options,
  error,
  onChange,
}: SelectFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <select
        value={value}
        aria-invalid={
          error ? "true" : undefined
        }
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
      >
        {options.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          )
        )}
      </select>

      <ErrorMessage value={error} />
    </label>
  );
}

function ErrorMessage({
  value,
}: {
  value?: string;
}) {
  return value ? (
    <small className={styles.error}>
      {value}
    </small>
  ) : null;
}

