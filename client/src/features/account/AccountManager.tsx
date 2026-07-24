"use client";

import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  getWorkspaceAccountRoleLabel,
  getWorkspaceAccountStatusLabel,
  workspaceAccountProfile,
} from "@/features/workspace/workspace.account";

import {
  getCurrentOrganization,
} from "@/features/workspace/workspace.selectors";

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
}

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
] as const;

const organization =
  getCurrentOrganization();

function createInitialState():
  AccountFormState {
  return {
    organizationName:
      organization.name,

    website:
      workspaceAccountProfile
        .organization
        .website,

    industry:
      workspaceAccountProfile
        .organization
        .industry,

    country:
      workspaceAccountProfile
        .organization
        .country,

    billingEmail:
      workspaceAccountProfile
        .organization
        .billingEmail,

    contactName:
      workspaceAccountProfile
        .primaryClient
        .fullName,

    jobTitle:
      workspaceAccountProfile
        .primaryClient
        .jobTitle,

    businessEmail:
      workspaceAccountProfile
        .primaryClient
        .businessEmail,

    phone:
      workspaceAccountProfile
        .primaryClient
        .phone,
  };
}

export default function AccountManager() {
  const [
    form,
    setForm,
  ] =
    useState<AccountFormState>(
      createInitialState
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

        [key]:
          value,
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
     * Frontend-only demonstration save.
     *
     * Backend integration will later:
     * - authenticate the Client account,
     * - enforce organization ownership,
     * - validate editable business fields,
     * - persist organization/contact changes,
     * - maintain account audit history.
     */
    setSaved(true);
  };

  const resetChanges =
    () => {
      setForm(
        createInitialState()
      );

      setSaved(false);
    };

  const accountStatus =
    getWorkspaceAccountStatusLabel(
      workspaceAccountProfile
        .status
    );

  const accountRole =
    getWorkspaceAccountRoleLabel(
      workspaceAccountProfile
        .primaryClient
        .role
    );

  return (
    <form
      className={styles.layout}
      onSubmit={saveChanges}
    >
      <section
        className={styles.summaryGrid}
        aria-label="Client account summary"
      >
        <article
          className={styles.summaryCard}
        >
          <span>
            Workspace
          </span>

          <strong>
            {accountStatus}
          </strong>

          <small>
            {organization.name}
          </small>
        </article>

        <article
          className={styles.summaryCard}
        >
          <span>
            Access
          </span>

          <strong>
            {accountRole}
          </strong>

          <small>
            Organization-scoped workspace
          </small>
        </article>

        <article
          className={styles.summaryCard}
        >
          <span>
            Business email
          </span>

          <strong>
            {workspaceAccountProfile
              .primaryClient
              .emailVerified
              ? "Verified"
              : "Verification pending"}
          </strong>

          <small>
            {form.businessEmail}
          </small>
        </article>
      </section>

      <section
        className={styles.mainGrid}
      >
        <div
          className={styles.primaryColumn}
        >
          <section className="contentCard">
            <div
              className={styles.sectionHeader}
            >
              <div>
                <h2 className="sectionTitle">
                  Organization
                </h2>

                <p className="sectionDescription">
                  Business identity used for your Poster commercial workspace.
                </p>
              </div>
            </div>

            <div
              className={styles.formGrid}
            >
              <div className={styles.field}>
                <label htmlFor="organization-name">
                  Organization name
                </label>

                <input
                  id="organization-name"
                  value={form.organizationName}
                  onChange={(
                    event
                  ) =>
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
                  Website
                </label>

                <input
                  id="organization-website"
                  type="url"
                  value={form.website}
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "website",
                      event.target.value
                    )
                  }
                  required
                  autoComplete="url"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="organization-industry">
                  Industry
                </label>

                <input
                  id="organization-industry"
                  value={form.industry}
                  onChange={(
                    event
                  ) =>
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
                  Country
                </label>

                <input
                  id="organization-country"
                  type="search"
                  list="client-country-options"
                  value={form.country}
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "country",
                      event.target.value
                    )
                  }
                  placeholder="Search country by name"
                  autoComplete="country-name"
                  required
                />

                <datalist id="client-country-options">
                  {COUNTRIES.map(
                    (
                      country
                    ) => (
                      <option
                        key={country}
                        value={country}
                      />
                    )
                  )}
                </datalist>
              </div>

              <div
                className={styles.fieldWide}
              >
                <label htmlFor="billing-email">
                  Billing contact email
                </label>

                <input
                  id="billing-email"
                  type="email"
                  value={form.billingEmail}
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "billingEmail",
                      event.target.value
                    )
                  }
                  required
                  autoComplete="email"
                />

                <span
                  className={styles.fieldHint}
                >
                  Used for future contract and payment communication.
                </span>
              </div>
            </div>
          </section>

          <section className="contentCard">
            <div
              className={styles.sectionHeader}
            >
              <div>
                <h2 className="sectionTitle">
                  Primary contact
                </h2>

                <p className="sectionDescription">
                  Main person responsible for this Client workspace.
                </p>
              </div>

              <span
                className={styles.primaryBadge}
              >
                Primary client
              </span>
            </div>

            <div
              className={styles.formGrid}
            >
              <div className={styles.field}>
                <label htmlFor="contact-name">
                  Full name
                </label>

                <input
                  id="contact-name"
                  value={form.contactName}
                  onChange={(
                    event
                  ) =>
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
                  Job title
                </label>

                <input
                  id="job-title"
                  value={form.jobTitle}
                  onChange={(
                    event
                  ) =>
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
                  Business email
                </label>

                <input
                  id="business-email"
                  type="email"
                  value={form.businessEmail}
                  onChange={(
                    event
                  ) =>
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
                  onChange={(
                    event
                  ) =>
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
      </section>

      {saved ? (
        <div
          className={styles.success}
          role="status"
        >
          Account changes saved for this frontend demonstration.
        </div>
      ) : null}

      <div
        className={styles.actions}
      >
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

      <p
        className={styles.demoNote}
      >
        Development environment · Production account changes will be stored
        through authenticated organization APIs.
      </p>
    </form>
  );
}