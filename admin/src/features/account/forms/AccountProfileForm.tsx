"use client";

import type {
  AdminAccountProfileDraft,
  AdminAccountProfileErrors,
} from "../contracts/account-profile.types";

import styles from "./AccountProfileForm.module.css";

interface AccountProfileFormProps {
  draft: AdminAccountProfileDraft;
  errors: AdminAccountProfileErrors;
  saving: boolean;
  onChange:
    (
      draft:
        AdminAccountProfileDraft
    ) => void;
  onSubmit: () => void;
}

export default function AccountProfileForm({
  draft,
  errors,
  saving,
  onChange,
  onSubmit,
}: AccountProfileFormProps) {
  const update = <
    Key extends keyof AdminAccountProfileDraft,
  >(
    key: Key,
    value:
      AdminAccountProfileDraft[Key]
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
          <h2>Personal details</h2>

          <p>
            Information used to identify
            the Admin operator internally.
          </p>
        </header>

        <div className={styles.grid}>
          <Field
            label="Full name"
            value={draft.fullName}
            error={errors.fullName}
            onChange={(value) => {
              update("fullName", value);
            }}
          />

          <Field
            label="Display name"
            value={draft.displayName}
            error={errors.displayName}
            onChange={(value) => {
              update(
                "displayName",
                value
              );
            }}
          />

          <Field
            label="Job title"
            value={draft.jobTitle}
            placeholder="Administrator"
            onChange={(value) => {
              update("jobTitle", value);
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <header>
          <h2>Business contact</h2>

          <p>
            Contact details for authorized
            Poster colleagues and operational
            communication.
          </p>
        </header>

        <div className={styles.grid}>
          <Field
            label="Business email"
            type="email"
            value={draft.businessEmail}
            error={errors.businessEmail}
            onChange={(value) => {
              update(
                "businessEmail",
                value
              );
            }}
          />

          <Field
            label="Primary phone"
            type="tel"
            value={draft.primaryPhone}
            error={errors.primaryPhone}
            placeholder="+91..."
            onChange={(value) => {
              update(
                "primaryPhone",
                value
              );
            }}
          />

          <Field
            label="Alternate phone"
            type="tel"
            value={draft.alternatePhone}
            error={errors.alternatePhone}
            placeholder="Optional"
            onChange={(value) => {
              update(
                "alternatePhone",
                value
              );
            }}
          />

          <Field
            label="Signal account"
            value={draft.signalAccount}
            error={errors.signalAccount}
            placeholder="@username or +91..."
            onChange={(value) => {
              update(
                "signalAccount",
                value
              );
            }}
          />

          <Field
            label="Telegram username"
            value={draft.telegramUsername}
            placeholder="Optional"
            onChange={(value) => {
              update(
                "telegramUsername",
                value
              );
            }}
          />
        </div>
      </section>

      <section className={styles.section}>
        <header>
          <h2>Preferences</h2>

          <p>
            Display and regional preferences
            for the Admin workspace.
          </p>
        </header>

        <div className={styles.grid}>
          <SelectField
            label="Preferred language"
            value={
              draft.preferredLanguage
            }
            error={
              errors.preferredLanguage
            }
            options={[
              {
                value: "en",
                label: "English",
              },
              {
                value: "hi",
                label: "Hindi",
              },
            ]}
            onChange={(value) => {
              update(
                "preferredLanguage",
                value
              );
            }}
          />

          <SelectField
            label="Time zone"
            value={draft.timeZone}
            error={errors.timeZone}
            options={[
              {
                value:
                  "Asia/Kolkata",
                label:
                  "India Standard Time",
              },
              {
                value: "UTC",
                label: "UTC",
              },
            ]}
            onChange={(value) => {
              update(
                "timeZone",
                value
              );
            }}
          />
        </div>
      </section>

      <footer className={styles.actions}>
        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving…"
            : "Save profile"}
        </button>
      </footer>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  type?:
    | "text"
    | "email"
    | "tel";
  placeholder?: string;
  error?: string;
  onChange:
    (value: string) => void;
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
        <small>{error}</small>
      ) : null}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  error?: string;
  options:
    ReadonlyArray<{
      value: string;
      label: string;
    }>;
  onChange:
    (value: string) => void;
}

function SelectField({
  label,
  value,
  error,
  options,
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

      {error ? (
        <small>{error}</small>
      ) : null}
    </label>
  );
}
