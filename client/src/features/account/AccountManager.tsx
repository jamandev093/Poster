"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useClientAccount,
} from "./useClientAccount";

import type {
  ClientAccount,
  UpdateClientOrganizationInput,
} from "./client-account.service";

import styles from "./AccountManager.module.css";

interface AccountFormState {
  organizationName:
    string;

  legalName:
    string;

  website:
    string;

  country:
    string;

  billingEmail:
    string;

  contactName:
    string;

  businessEmail:
    string;
}

interface AccountFormProps {
  account:
    ClientAccount;

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  isSubmitting:
    boolean;

  errorMessage:
    string |
    null;

  savedAt:
    string |
    null;

  refresh:
    () => Promise<void>;

  updateOrganization:
    (
      input:
        UpdateClientOrganizationInput
    ) => Promise<void>;
}

function mapAccountToForm(
  account:
    ClientAccount
): AccountFormState {
  return {
    organizationName:
      account.organization.displayName ??
      account.organization.name ??
      "",

    legalName:
      account.organization.legalName ??
      account.organization.name ??
      "",

    website:
      account.organization.websiteUrl ??
      "",

    country:
      account.organization.countryCode ??
      "IN",

    billingEmail:
      account.organization.billingEmail ??
      account.user.email,

    contactName:
      account.user.fullName,

    businessEmail:
      account.user.email,
  };
}

function normalizeCountryCode(
  value:
    string
): string {
  const normalized =
    value
      .trim()
      .toUpperCase();

  return normalized ||
    "IN";
}

function getStatusLabel(
  status:
    string |
    undefined
): string {
  if (!status) {
    return "Loading";
  }

  return status
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /^\w/,
      character =>
        character.toUpperCase()
    );
}

function getSavedMessage(
  savedAt:
    string |
    null
): string {
  if (!savedAt) {
    return "Account changes saved.";
  }

  return `Account changes saved at ${new Date(savedAt).toLocaleTimeString()}.`;
}

function AccountForm(
  props:
    AccountFormProps
) {
  const {
    account,
    isLoading,
    isRefreshing,
    isSubmitting,
    errorMessage,
    savedAt,
    refresh,
    updateOrganization,
  } =
    props;

  const [
    form,
    setForm,
  ] =
    useState<AccountFormState>(
      () =>
        mapAccountToForm(
          account
        )
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const organization =
    account.organization;

  const user =
    account.user;

  const isBusy =
    isLoading ||
    isSubmitting;

  const canSubmit =
    Boolean(
      organization.rowVersion
    ) &&
    form.organizationName.trim().length > 0 &&
    form.country.trim().length > 0 &&
    !isBusy;

  const summary =
    useMemo(
      () => ({
        organizationName:
          organization.displayName ??
          organization.name ??
          "Loading account",

        organizationStatus:
          getStatusLabel(
            organization.status
          ),

        businessEmail:
          form.businessEmail ||
          user.email ||
          "Loading",

        contactName:
          form.contactName ||
          user.fullName ||
          "Loading",
      }),
      [
        form.businessEmail,
        form.contactName,
        organization.displayName,
        organization.name,
        organization.status,
        user.email,
        user.fullName,
      ]
    );

  const updateField = <
    Key extends keyof AccountFormState,
  >(
    key:
      Key,
    value:
      AccountFormState[Key]
  ) => {
    setForm(
      current => ({
        ...current,

        [key]:
          value,
      })
    );

    setSaved(false);
  };

  const saveChanges =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      await updateOrganization({
        displayName:
          form.organizationName.trim(),

        legalName:
          (
            form.legalName.trim() ||
            form.organizationName.trim()
          ),

        websiteUrl:
          form.website.trim() ||
          null,

        billingEmail:
          form.billingEmail.trim() ||
          null,

        countryCode:
          normalizeCountryCode(
            form.country
          ),

        expectedRowVersion:
          organization.rowVersion,
      });

      setSaved(true);
    };

  const resetChanges =
    () => {
      setForm(
        mapAccountToForm(
          account
        )
      );

      setSaved(false);
    };

  return (
    <form
      className={styles.layout}
      onSubmit={saveChanges}
    >
      <section
        className={styles.summaryGrid}
        aria-label="Client account summary"
      >
        <article className="contentCard">
          <span className="sectionEyebrow">
            Organization
          </span>

          <h2>
            {summary.organizationName}
          </h2>

          <p>
            Backend-connected Client organization profile.
          </p>

          <strong>
            {summary.organizationStatus}
          </strong>
        </article>

        <article className="contentCard">
          <span className="sectionEyebrow">
            Primary contact
          </span>

          <h2>
            {summary.contactName}
          </h2>

          <p>
            {summary.businessEmail}
          </p>

          <strong>
            Client account
          </strong>
        </article>
      </section>

      {errorMessage ? (
        <section
          className="contentCard"
          role="alert"
        >
          <strong>
            Account could not be loaded
          </strong>

          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            disabled={isRefreshing}
          >
            {isRefreshing
              ? "Refreshing..."
              : "Retry"}
          </button>
        </section>
      ) : null}

      <section
        className="contentCard"
        aria-busy={isBusy}
      >
        <div>
          <span className="sectionEyebrow">
            Business identity
          </span>

          <h2>
            Organization
          </h2>

          <p>
            Manage the organization profile stored in Poster Backend.
          </p>
        </div>

        <div className={styles.formGrid}>
          <label
            className={styles.field}
            htmlFor="organization-name"
          >
            <span>
              Organization name
            </span>

            <input
              id="organization-name"
              value={form.organizationName}
              onChange={event =>
                updateField(
                  "organizationName",
                  event.target.value
                )
              }
              autoComplete="organization"
              disabled={isBusy}
            />
          </label>

          <label
            className={styles.field}
            htmlFor="organization-legal-name"
          >
            <span>
              Legal name
            </span>

            <input
              id="organization-legal-name"
              value={form.legalName}
              onChange={event =>
                updateField(
                  "legalName",
                  event.target.value
                )
              }
              autoComplete="organization"
              disabled={isBusy}
            />
          </label>

          <label
            className={styles.field}
            htmlFor="organization-website"
          >
            <span>
              Website
            </span>

            <input
              id="organization-website"
              type="url"
              value={form.website}
              onChange={event =>
                updateField(
                  "website",
                  event.target.value
                )
              }
              placeholder="https://example.com"
              autoComplete="url"
              disabled={isBusy}
            />
          </label>

          <label
            className={styles.field}
            htmlFor="organization-country"
          >
            <span>
              Country code
            </span>

            <input
              id="organization-country"
              value={form.country}
              onChange={event =>
                updateField(
                  "country",
                  event.target.value
                )
              }
              placeholder="IN"
              autoComplete="country"
              disabled={isBusy}
              maxLength={2}
            />
          </label>

          <label
            className={styles.fieldWide}
            htmlFor="billing-email"
          >
            <span>
              Billing contact email
            </span>

            <input
              id="billing-email"
              type="email"
              value={form.billingEmail}
              onChange={event =>
                updateField(
                  "billingEmail",
                  event.target.value
                )
              }
              autoComplete="email"
              disabled={isBusy}
            />
          </label>
        </div>
      </section>

      <section className="contentCard">
        <div>
          <span className="sectionEyebrow">
            Primary contact
          </span>

          <h2>
            Client account
          </h2>

          <p>
            Primary contact is read from the authenticated Backend account.
          </p>
        </div>

        <div className={styles.formGrid}>
          <label
            className={styles.field}
            htmlFor="contact-name"
          >
            <span>
              Contact name
            </span>

            <input
              id="contact-name"
              value={form.contactName}
              readOnly
            />
          </label>

          <label
            className={styles.field}
            htmlFor="business-email"
          >
            <span>
              Business email
            </span>

            <input
              id="business-email"
              type="email"
              value={form.businessEmail}
              readOnly
            />
          </label>
        </div>
      </section>

      <div className={styles.actions}>
        <p className={styles.demoNote}>
          Backend-connected account settings. Public business contact and Signal remain deferred.
        </p>

        <div>
          <button
            type="button"
            onClick={resetChanges}
            disabled={isBusy}
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
          >
            {isSubmitting
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </div>

      {saved ? (
        <p
          className={styles.demoNote}
          role="status"
        >
          {getSavedMessage(
            savedAt
          )}
        </p>
      ) : null}
    </form>
  );
}

export default function AccountManager() {
  const accountState =
    useClientAccount();

  if (
    accountState.isLoading &&
    !accountState.account
  ) {
    return (
      <section
        className="contentCard"
        aria-live="polite"
      >
        Loading Client account from Backend...
      </section>
    );
  }

  if (!accountState.account) {
    return (
      <section
        className="contentCard"
        role="alert"
      >
        <strong>
          Account could not be loaded
        </strong>

        <p>
          {accountState.errorMessage ??
            "Client account could not be loaded."}
        </p>

        <button
          type="button"
          onClick={() => {
            void accountState.refresh();
          }}
          disabled={accountState.isRefreshing}
        >
          {accountState.isRefreshing
            ? "Refreshing..."
            : "Retry"}
        </button>
      </section>
    );
  }

  return (
    <AccountForm
      key={accountState.account.organization.rowVersion}
      account={accountState.account}
      isLoading={accountState.isLoading}
      isRefreshing={accountState.isRefreshing}
      isSubmitting={accountState.isSubmitting}
      errorMessage={accountState.errorMessage}
      savedAt={accountState.savedAt}
      refresh={accountState.refresh}
      updateOrganization={accountState.updateOrganization}
    />
  );
}