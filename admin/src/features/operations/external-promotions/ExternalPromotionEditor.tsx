"use client";

import {
  CONVERSION_GOAL_OPTIONS,
  MEDIA_TYPE_OPTIONS,
  OFFER_TYPE_OPTIONS,
  PLACEMENT_OPTIONS,
  PROMOTION_STATUS_OPTIONS,
} from "./external-promotion.constants";

import type {
  ExternalPromotionConversionGoal,
  ExternalPromotionDraft,
  ExternalPromotionErrors,
  ExternalPromotionMediaType,
  ExternalPromotionOfferType,
  ExternalPromotionPlacement,
  ExternalPromotionStatus,
} from "./external-promotion.types";

import styles from "./ExternalPromotionEditor.module.css";

export interface ApprovedProgramOption {
  id: string;
  programName: string;
  platformName: string;
}

interface ExternalPromotionEditorProps {
  draft: ExternalPromotionDraft;
  errors: ExternalPromotionErrors;
  approvedPrograms:
    ReadonlyArray<ApprovedProgramOption>;
  submitLabel: string;
  onChange: (
    draft: ExternalPromotionDraft
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ExternalPromotionEditor({
  draft,
  errors,
  approvedPrograms,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: ExternalPromotionEditorProps) {
  const update = <
    Key extends keyof ExternalPromotionDraft,
  >(
    key: Key,
    value: ExternalPromotionDraft[Key]
  ) => {
    onChange({
      ...draft,
      [key]: value,
    });
  };

  const togglePlacement = (
    placement: ExternalPromotionPlacement
  ) => {
    const selected =
      draft.placements.includes(
        placement
      );

    update(
      "placements",
      selected
        ? draft.placements.filter(
            (item) =>
              item !== placement
          )
        : [
            ...draft.placements,
            placement,
          ]
    );
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
        <SectionHeading
          title="Program and offer"
          description="Connect this promotion to an approved external program and identify the product, service or commercial offer."
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
                update(
                  "programId",
                  event.target.value
                );
              }}
            >
              <option value="">
                Select a program
              </option>

              {approvedPrograms.map(
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

          <Field
            label="Promotion name"
            value={draft.name}
            error={errors.name}
            placeholder="Internal operational name"
            onChange={(value) => {
              update("name", value);
            }}
          />

          <Field
            label="External offer ID"
            value={
              draft.externalOfferId
            }
            placeholder="Optional product or offer reference"
            onChange={(value) => {
              update(
                "externalOfferId",
                value
              );
            }}
          />

          <Field
            label="Category"
            value={draft.category}
            error={errors.category}
            placeholder="Technology, software, education..."
            onChange={(value) => {
              update("category", value);
            }}
          />

          <SelectField
            label="Offer type"
            value={draft.offerType}
            options={
              OFFER_TYPE_OPTIONS
            }
            onChange={(value) => {
              update(
                "offerType",
                value as ExternalPromotionOfferType
              );
            }}
          />

          <SelectField
            label="Conversion goal"
            value={
              draft.conversionGoal
            }
            options={
              CONVERSION_GOAL_OPTIONS
            }
            onChange={(value) => {
              update(
                "conversionGoal",
                value as ExternalPromotionConversionGoal
              );
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Promotion creative"
          description="Create the content Poster users will see. Keep the wording accurate, relevant and clearly commercial."
        />

        <div className={styles.grid}>
          <Field
            label="Headline"
            value={draft.headline}
            error={errors.headline}
            onChange={(value) => {
              update("headline", value);
            }}
          />

          <Field
            label="Call to action"
            value={
              draft.callToAction
            }
            error={
              errors.callToAction
            }
            placeholder="View product"
            onChange={(value) => {
              update(
                "callToAction",
                value
              );
            }}
          />

          <TextAreaField
            label="Description"
            value={draft.description}
            error={errors.description}
            onChange={(value) => {
              update(
                "description",
                value
              );
            }}
          />

          <TextAreaField
            label="Internal notes"
            value={draft.notes}
            onChange={(value) => {
              update("notes", value);
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Media"
          description="Record the approved image or video source used by the promotion."
        />

        <div className={styles.grid}>
          <SelectField
            label="Media type"
            value={draft.mediaType}
            options={
              MEDIA_TYPE_OPTIONS
            }
            onChange={(value) => {
              const mediaType =
                value as ExternalPromotionMediaType;

              onChange({
                ...draft,
                mediaType,
                mediaUrl:
                  mediaType === "none"
                    ? ""
                    : draft.mediaUrl,
              });
            }}
          />

          {draft.mediaType !==
          "none" ? (
            <Field
              label="Media URL"
              type="url"
              value={draft.mediaUrl}
              error={errors.mediaUrl}
              placeholder="https://..."
              onChange={(value) => {
                update(
                  "mediaUrl",
                  value
                );
              }}
            />
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Destination and tracking"
          description="Poster records its own impressions and clicks. The external platform uses its approved destination, tracking link or referral code."
        />

        <div className={styles.grid}>
          <Field
            label="Original destination URL"
            type="url"
            value={
              draft.destinationUrl
            }
            error={
              errors.destinationUrl
            }
            placeholder="https://..."
            onChange={(value) => {
              update(
                "destinationUrl",
                value
              );
            }}
          />

          <Field
            label="Affiliate or tracking URL"
            type="url"
            value={draft.trackingUrl}
            error={errors.trackingUrl}
            placeholder="Optional when referral code is used"
            onChange={(value) => {
              update(
                "trackingUrl",
                value
              );
            }}
          />

          <Field
            label="Referral code"
            value={draft.referralCode}
            placeholder="Optional"
            onChange={(value) => {
              update(
                "referralCode",
                value
              );
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Placements and disclosure"
          description="Choose where Poster may display this promotion and keep the commercial relationship visible."
        />

        <fieldset
          className={styles.placementFieldset}
        >
          <legend>Placements</legend>

          <div
            className={
              styles.placementOptions
            }
          >
            {PLACEMENT_OPTIONS.map(
              (option) => (
                <label
                  key={option.value}
                  className={
                    styles.placementOption
                  }
                >
                  <input
                    type="checkbox"
                    checked={draft.placements.includes(
                      option.value
                    )}
                    onChange={() => {
                      togglePlacement(
                        option.value
                      );
                    }}
                  />

                  <span>
                    {option.label}
                  </span>
                </label>
              )
            )}
          </div>

          <ErrorMessage
            value={errors.placements}
          />
        </fieldset>

        <TextAreaField
          label="Affiliate disclosure"
          value={draft.disclosure}
          error={errors.disclosure}
          onChange={(value) => {
            update(
              "disclosure",
              value
            );
          }}
        />
      </section>

      <section className={styles.section}>
        <SectionHeading
          title="Schedule and status"
          description="Drafts may remain incomplete. Scheduled or active promotions require a valid start date."
        />

        <div className={styles.grid}>
          <SelectField
            label="Status"
            value={draft.status}
            options={
              PROMOTION_STATUS_OPTIONS
            }
            onChange={(value) => {
              update(
                "status",
                value as ExternalPromotionStatus
              );
            }}
          />

          <Field
            label="Start date"
            type="date"
            value={draft.startDate}
            error={errors.startDate}
            onChange={(value) => {
              update(
                "startDate",
                value
              );
            }}
          />

          <Field
            label="End date"
            type="date"
            value={draft.endDate}
            error={errors.endDate}
            onChange={(value) => {
              update(
                "endDate",
                value
              );
            }}
          />
        </div>
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
          className={styles.primaryButton}
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
    <header className={styles.sectionHeading}>
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
          onChange(event.target.value);
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
          onChange(event.target.value);
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
