"use client";

import {
  FormEvent,
  useState,
} from "react";

import styles from "./AccountManager.module.css";

interface AccountFormState {
  organizationName: string;
  website: string;
  industry: string;
  country: string;
  billingEmail: string;

  contactName: string;
  jobTitle: string;
  businessEmail: string;
  phone: string;

  requestUpdates: boolean;
  campaignUpdates: boolean;
  billingUpdates: boolean;
}

const initialState: AccountFormState = {
  organizationName: "Example Cloud",
  website: "https://examplecloud.com",
  industry: "Professional learning",
  country: "India",
  billingEmail: "billing@examplecloud.com",

  contactName: "Aarav Mehta",
  jobTitle: "Marketing Manager",
  businessEmail: "marketing@examplecloud.com",
  phone: "",

  requestUpdates: true,
  campaignUpdates: true,
  billingUpdates: true,
};

export default function AccountManager() {
  const [
    form,
    setForm,
  ] =
    useState<AccountFormState>(
      initialState
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const updateField = <
    Key extends keyof AccountFormState,
  >(
    key: Key,
    value: AccountFormState[Key]
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]: value,
      })
    );

    setSaved(false);
  };

  const saveChanges = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    /*
     * Frontend-only save.
     *
     * Backend integration will later:
     * - authenticate the client,
     * - validate organization ownership,
     * - persist organization details,
     * - preserve account audit history,
     * - update notification preferences.
     */
    setSaved(true);
  };

  const resetChanges =
    () => {
      setForm(initialState);
      setSaved(false);
    };

  return (
    <form
      className={styles.layout}
      onSubmit={saveChanges}
    >
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span>Organization</span>
          <strong>Active</strong>
          <small>Example Cloud</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Account role</span>
          <strong>Primary client</strong>
          <small>Full organization access</small>
        </article>

        <article className={styles.summaryCard}>
          <span>Business email</span>
          <strong>Verified</strong>
          <small>marketing@examplecloud.com</small>
        </article>

      </section>

      <section className={styles.mainGrid}>
        <div className={styles.primaryColumn}>
          <section className="contentCard">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className="sectionTitle">
                  Organization
                </h2>

                <p className="sectionDescription">
                  Business and billing information.
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="organization-name">
                  Organization name *
                </label>

                <input
                  id="organization-name"
                  value={form.organizationName}
                  onChange={(event) =>
                    updateField(
                      "organizationName",
                      event.target.value
                    )
                  }
                  required
                  autoComplete="organization"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="organization-website">
                  Website *
                </label>

                <input
                  id="organization-website"
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    updateField(
                      "website",
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="organization-industry">
                  Industry *
                </label>

                <input
                  id="organization-industry"
                  value={form.industry}
                  onChange={(event) =>
                    updateField(
                      "industry",
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="organization-country">
                  Country *
                </label>

                <select
                  id="organization-country"
                  value={form.country}
                  onChange={(event) =>
                    updateField(
                      "country",
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="India">
                    India
                  </option>

                  <option value="United States">
                    United States
                  </option>

                  <option value="United Kingdom">
                    United Kingdom
                  </option>

                  <option value="Singapore">
                    Singapore
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className={styles.fieldWide}>
                <label htmlFor="billing-email">
                  Billing email *
                </label>

                <input
                  id="billing-email"
                  type="email"
                  value={form.billingEmail}
                  onChange={(event) =>
                    updateField(
                      "billingEmail",
                      event.target.value
                    )
                  }
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          </section>

          <section className="contentCard">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className="sectionTitle">
                  Primary client
                </h2>

                <p className="sectionDescription">
                  Main organization contact.
                </p>
              </div>

              <span className={styles.primaryBadge}>
                Primary
              </span>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="contact-name">
                  Full name *
                </label>

                <input
                  id="contact-name"
                  value={form.contactName}
                  onChange={(event) =>
                    updateField(
                      "contactName",
                      event.target.value
                    )
                  }
                  required
                  autoComplete="name"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="job-title">
                  Job title *
                </label>

                <input
                  id="job-title"
                  value={form.jobTitle}
                  onChange={(event) =>
                    updateField(
                      "jobTitle",
                      event.target.value
                    )
                  }
                  required
                  autoComplete="organization-title"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="business-email">
                  Business email *
                </label>

                <input
                  id="business-email"
                  type="email"
                  value={form.businessEmail}
                  onChange={(event) =>
                    updateField(
                      "businessEmail",
                      event.target.value
                    )
                  }
                  required
                  autoComplete="email"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">
                  Phone
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  placeholder="+91"
                  autoComplete="tel"
                />
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.secondaryColumn}>
          <section className="contentCard">
            <h2 className="sectionTitle">
              Notifications
            </h2>

            <div className={styles.preferenceList}>
              <label className={styles.preference}>
                <div>
                  <strong>
                    Request updates
                  </strong>

                  <span>
                    Review and correction notices
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={form.requestUpdates}
                  onChange={(event) =>
                    updateField(
                      "requestUpdates",
                      event.target.checked
                    )
                  }
                />
              </label>

              <label className={styles.preference}>
                <div>
                  <strong>
                    Campaign updates
                  </strong>

                  <span>
                    Status and delivery changes
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={form.campaignUpdates}
                  onChange={(event) =>
                    updateField(
                      "campaignUpdates",
                      event.target.checked
                    )
                  }
                />
              </label>

              <label className={styles.preference}>
                <div>
                  <strong>
                    Billing updates
                  </strong>

                  <span>
                    Contract and payment notices
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={form.billingUpdates}
                  onChange={(event) =>
                    updateField(
                      "billingUpdates",
                      event.target.checked
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="contentCard">
            <h2 className="sectionTitle">
              Security
            </h2>

            <div className={styles.securityList}>
              <div>
                <span>Email status</span>
                <strong>Verified</strong>
              </div>

              <div>
                <span>Password</span>
                <strong>Configured</strong>
              </div>

              <div>
                <span>Last sign-in</span>
                <strong>22 Jul 2026</strong>
              </div>
            </div>

            <button
              type="button"
              className="secondaryButton"
              disabled
            >
              Change password
            </button>

            <p className={styles.pendingNote}>
              Password management will connect with
              Client authentication services later.
            </p>
          </section>

          
        </aside>
      </section>

      {saved ? (
        <div
          className={styles.success}
          role="status"
        >
          Account changes saved in this frontend
          demonstration.
        </div>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className="secondaryButton"
          onClick={resetChanges}
        >
          Reset
        </button>

        <button
          type="submit"
          className="primaryButton"
        >
          Save changes
        </button>
      </div>

      <p className={styles.demoNote}>
        Frontend demonstration · Backend account and
        organization APIs will replace local state.
      </p>
    </form>
  );
}