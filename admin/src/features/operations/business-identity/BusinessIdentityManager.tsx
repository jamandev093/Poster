"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  INITIAL_BUSINESS_IDENTITY,
} from "./business-identity.mock";

import type {
  BusinessIdentityRecord,
  BusinessIdentitySection,
  ReadinessStatus,
} from "./business-identity.types";

import styles from "./BusinessIdentityManager.module.css";

const sections: Array<{
  id: BusinessIdentitySection;
  label: string;
}> = [
  {
    id: "company",
    label: "Company",
  },
  {
    id: "publisher",
    label: "Publisher Profile",
  },
  {
    id: "properties",
    label: "Properties",
  },
  {
    id: "compliance",
    label: "Compliance",
  },
  {
    id: "payout",
    label: "Payout Readiness",
  },
  {
    id: "application-kit",
    label: "Application Kit",
  },
];

function readinessLabel(
  status: ReadinessStatus
) {
  if (status === "complete") {
    return "Complete";
  }

  if (status === "not-applicable") {
    return "Not applicable";
  }

  return "Incomplete";
}

export default function BusinessIdentityManager() {
  const [
    activeSection,
    setActiveSection,
  ] = useState<BusinessIdentitySection>(
    "company"
  );

  const [
    record,
    setRecord,
  ] = useState<BusinessIdentityRecord>(
    INITIAL_BUSINESS_IDENTITY
  );

  const [
    savedMessage,
    setSavedMessage,
  ] = useState("");

  const readiness = useMemo(() => {
    const checks = [
      Boolean(
        record.company.legalBusinessName
      ),
      Boolean(
        record.company.businessEmail
      ),
      Boolean(
        record.company.websiteUrl
      ),
      Boolean(
        record.publisher.audienceDescription
      ),
      record.properties.some(
        (property) =>
          property.approvedForPromotion
      ),
      Boolean(
        record.compliance.affiliateDisclosure
      ),
      record.payout.legalEntityStatus ===
        "complete",
      record.payout.bankAccountStatus ===
        "complete",
    ];

    const completed = checks.filter(
      Boolean
    ).length;

    return {
      completed,
      total: checks.length,
      percentage: Math.round(
        (completed / checks.length) * 100
      ),
    };
  }, [record]);

  const saveIdentity = () => {
    const savedAt =
      new Date().toLocaleString();

    setRecord((current) => ({
      ...current,
      updatedAt: savedAt,
    }));

    setSavedMessage(
      `Business Identity saved locally at ${savedAt}.`
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Operations
          </p>

          <h1>
            Business Identity
          </h1>

          <p className={styles.description}>
            Maintain Poster’s reusable
            company, publisher, compliance
            and payout-readiness information
            for external program applications.
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={saveIdentity}
        >
          Save identity
        </button>
      </header>

      <section className={styles.summary}>
        <div>
          <span>
            Application readiness
          </span>

          <strong>
            {readiness.percentage}%
          </strong>

          <small>
            {readiness.completed} of{" "}
            {readiness.total} core checks
            complete
          </small>
        </div>

        <div>
          <span>
            Registered properties
          </span>

          <strong>
            {record.properties.length}
          </strong>

          <small>
            {
              record.properties.filter(
                (property) =>
                  property
                    .approvedForPromotion
              ).length
            } approved for promotion
          </small>
        </div>

        <div>
          <span>
            Last saved
          </span>

          <strong className={styles.dateValue}>
            {record.updatedAt}
          </strong>

          <small>
            Backend persistence will be
            connected later
          </small>
        </div>
      </section>

      {savedMessage ? (
        <div
          className={styles.savedMessage}
          role="status"
        >
          {savedMessage}
        </div>
      ) : null}

      <div className={styles.layout}>
        <nav
          className={styles.sectionNavigation}
          aria-label="Business identity sections"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={
                activeSection === section.id
                  ? styles.activeSection
                  : ""
              }
              onClick={() => {
                setActiveSection(
                  section.id
                );
              }}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <section className={styles.workspace}>
          {activeSection === "company" ? (
            <>
              <WorkspaceHeading
                title="Company"
                description="Core information used when Poster applies to an external affiliate, referral or publisher program."
              />

              <div className={styles.formGrid}>
                <Field
                  label="Brand name"
                  value={
                    record.company.brandName
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        brandName: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Legal business name"
                  value={
                    record.company
                      .legalBusinessName
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        legalBusinessName:
                          value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Business type"
                  value={
                    record.company.businessType
                  }
                  placeholder="Private limited, LLP, sole proprietor..."
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        businessType: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Founded year"
                  value={
                    record.company.foundedYear
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        foundedYear: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Country"
                  value={
                    record.company.country
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        country: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Business email"
                  type="email"
                  value={
                    record.company.businessEmail
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        businessEmail: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Business phone"
                  value={
                    record.company.businessPhone
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        businessPhone: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Website"
                  type="url"
                  value={
                    record.company.websiteUrl
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        websiteUrl: value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Short description"
                  value={
                    record.company
                      .shortDescription
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        shortDescription:
                          value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Detailed publisher description"
                  value={
                    record.company
                      .detailedDescription
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      company: {
                        ...current.company,
                        detailedDescription:
                          value,
                      },
                    }));
                  }}
                />
              </div>
            </>
          ) : null}

          {activeSection === "publisher" ? (
            <>
              <WorkspaceHeading
                title="Publisher Profile"
                description="Explain Poster’s audience, content, traffic sources and permitted promotion methods."
              />

              <div className={styles.formGrid}>
                <TextAreaField
                  label="Content categories"
                  value={
                    record.publisher
                      .contentCategories
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      publisher: {
                        ...current.publisher,
                        contentCategories:
                          value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Audience description"
                  value={
                    record.publisher
                      .audienceDescription
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      publisher: {
                        ...current.publisher,
                        audienceDescription:
                          value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Primary countries"
                  value={
                    record.publisher
                      .primaryCountries
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      publisher: {
                        ...current.publisher,
                        primaryCountries:
                          value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Languages"
                  value={
                    record.publisher.languages
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      publisher: {
                        ...current.publisher,
                        languages: value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Promotion methods"
                  value={
                    record.publisher
                      .promotionMethods
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      publisher: {
                        ...current.publisher,
                        promotionMethods:
                          value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Traffic sources"
                  value={
                    record.publisher
                      .trafficSources
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      publisher: {
                        ...current.publisher,
                        trafficSources:
                          value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Estimated monthly reach"
                  value={
                    record.publisher
                      .estimatedMonthlyReach
                  }
                  placeholder="Optional until real analytics are available"
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      publisher: {
                        ...current.publisher,
                        estimatedMonthlyReach:
                          value,
                      },
                    }));
                  }}
                />
              </div>
            </>
          ) : null}

          {activeSection === "properties" ? (
            <>
              <WorkspaceHeading
                title="Promotion Properties"
                description="Websites and applications Poster may declare when applying to external programs."
              />

              <div className={styles.propertyList}>
                {record.properties.map(
                  (property) => (
                    <article
                      key={property.id}
                      className={styles.property}
                    >
                      <div>
                        <strong>
                          {property.name}
                        </strong>

                        <span>
                          {property.type
                            .replaceAll(
                              "_",
                              " "
                            )}
                        </span>

                        <p>
                          {property.url ||
                            "URL not available yet"}
                        </p>
                      </div>

                      <div
                        className={
                          styles.propertyStatus
                        }
                      >
                        <span>
                          {property.status}
                        </span>

                        <label>
                          <input
                            type="checkbox"
                            checked={
                              property
                                .approvedForPromotion
                            }
                            onChange={(
                              event
                            ) => {
                              setRecord(
                                (current) => ({
                                  ...current,
                                  properties:
                                    current.properties.map(
                                      (
                                        item
                                      ) =>
                                        item.id ===
                                        property.id
                                          ? {
                                              ...item,
                                              approvedForPromotion:
                                                event
                                                  .target
                                                  .checked,
                                            }
                                          : item
                                    ),
                                })
                              );
                            }}
                          />

                          Approved
                        </label>
                      </div>
                    </article>
                  )
                )}
              </div>
            </>
          ) : null}

          {activeSection === "compliance" ? (
            <>
              <WorkspaceHeading
                title="Compliance"
                description="Reusable disclosure, policy and traffic-quality information for external applications."
              />

              <div className={styles.formGrid}>
                <TextAreaField
                  label="Affiliate disclosure"
                  value={
                    record.compliance
                      .affiliateDisclosure
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      compliance: {
                        ...current.compliance,
                        affiliateDisclosure:
                          value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Traffic integrity statement"
                  value={
                    record.compliance
                      .trafficIntegrityStatement
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      compliance: {
                        ...current.compliance,
                        trafficIntegrityStatement:
                          value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Privacy policy URL"
                  type="url"
                  value={
                    record.compliance
                      .privacyPolicyUrl
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      compliance: {
                        ...current.compliance,
                        privacyPolicyUrl:
                          value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Terms URL"
                  type="url"
                  value={
                    record.compliance.termsUrl
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      compliance: {
                        ...current.compliance,
                        termsUrl: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Contact URL"
                  type="url"
                  value={
                    record.compliance.contactUrl
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      compliance: {
                        ...current.compliance,
                        contactUrl: value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Copyright policy URL"
                  type="url"
                  value={
                    record.compliance
                      .copyrightPolicyUrl
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      compliance: {
                        ...current.compliance,
                        copyrightPolicyUrl:
                          value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Prohibited categories"
                  value={
                    record.compliance
                      .prohibitedCategories
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      compliance: {
                        ...current.compliance,
                        prohibitedCategories:
                          value,
                      },
                    }));
                  }}
                />
              </div>
            </>
          ) : null}

          {activeSection === "payout" ? (
            <>
              <WorkspaceHeading
                title="Payout Readiness"
                description="Internal readiness indicators only. Sensitive bank and tax details will be protected by backend permissions."
              />

              <div className={styles.readinessList}>
                <ReadinessField
                  label="Legal entity"
                  value={
                    record.payout
                      .legalEntityStatus
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      payout: {
                        ...current.payout,
                        legalEntityStatus:
                          value,
                      },
                    }));
                  }}
                />

                <ReadinessField
                  label="Tax identity"
                  value={
                    record.payout
                      .taxIdentityStatus
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      payout: {
                        ...current.payout,
                        taxIdentityStatus:
                          value,
                      },
                    }));
                  }}
                />

                <ReadinessField
                  label="GST"
                  value={
                    record.payout.gstStatus
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      payout: {
                        ...current.payout,
                        gstStatus: value,
                      },
                    }));
                  }}
                />

                <ReadinessField
                  label="Business bank account"
                  value={
                    record.payout
                      .bankAccountStatus
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      payout: {
                        ...current.payout,
                        bankAccountStatus:
                          value,
                      },
                    }));
                  }}
                />
              </div>

              <div className={styles.formGrid}>
                <Field
                  label="Beneficiary name"
                  value={
                    record.payout
                      .beneficiaryName
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      payout: {
                        ...current.payout,
                        beneficiaryName:
                          value,
                      },
                    }));
                  }}
                />

                <Field
                  label="Default currency"
                  value={
                    record.payout
                      .defaultCurrency
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      payout: {
                        ...current.payout,
                        defaultCurrency:
                          value,
                      },
                    }));
                  }}
                />

                <TextAreaField
                  label="Internal notes"
                  value={
                    record.payout
                      .internalNotes
                  }
                  onChange={(value) => {
                    setRecord((current) => ({
                      ...current,
                      payout: {
                        ...current.payout,
                        internalNotes:
                          value,
                      },
                    }));
                  }}
                />
              </div>
            </>
          ) : null}

          {activeSection ===
          "application-kit" ? (
            <>
              <WorkspaceHeading
                title="Application Kit"
                description="Copy-ready information for use while applying directly on an external platform."
              />

              <div className={styles.kit}>
                <ApplicationBlock
                  label="Publisher name"
                  value={
                    record.company.brandName
                  }
                />

                <ApplicationBlock
                  label="Website"
                  value={
                    record.company.websiteUrl
                  }
                />

                <ApplicationBlock
                  label="Publisher description"
                  value={
                    record.company
                      .detailedDescription
                  }
                />

                <ApplicationBlock
                  label="Audience"
                  value={
                    record.publisher
                      .audienceDescription
                  }
                />

                <ApplicationBlock
                  label="Traffic sources"
                  value={
                    record.publisher
                      .trafficSources
                  }
                />

                <ApplicationBlock
                  label="Promotion methods"
                  value={
                    record.publisher
                      .promotionMethods
                  }
                />

                <ApplicationBlock
                  label="Affiliate disclosure"
                  value={
                    record.compliance
                      .affiliateDisclosure
                  }
                />
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

interface WorkspaceHeadingProps {
  title: string;
  description: string;
}

function WorkspaceHeading({
  title,
  description,
}: WorkspaceHeadingProps) {
  return (
    <header className={styles.workspaceHeading}>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

interface FieldProps {
  label: string;
  value: string;
  type?: "text" | "email" | "url";
  placeholder?: string;
  onChange: (value: string) => void;
}

function Field({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: FieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: Omit<FieldProps, "type">) {
  return (
    <label className={styles.field}>
      <span>{label}</span>

      <textarea
        rows={5}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}

interface ReadinessFieldProps {
  label: string;
  value: ReadinessStatus;
  onChange: (
    value: ReadinessStatus
  ) => void;
}

function ReadinessField({
  label,
  value,
  onChange,
}: ReadinessFieldProps) {
  return (
    <label className={styles.readinessItem}>
      <span>
        <strong>{label}</strong>
        <small>
          {readinessLabel(value)}
        </small>
      </span>

      <select
        value={value}
        onChange={(event) => {
          onChange(
            event.target
              .value as ReadinessStatus
          );
        }}
      >
        <option value="incomplete">
          Incomplete
        </option>

        <option value="complete">
          Complete
        </option>

        <option value="not-applicable">
          Not applicable
        </option>
      </select>
    </label>
  );
}

interface ApplicationBlockProps {
  label: string;
  value: string;
}

function ApplicationBlock({
  label,
  value,
}: ApplicationBlockProps) {
  const copyValue = async () => {
    await navigator.clipboard.writeText(
      value
    );
  };

  return (
    <article className={styles.applicationBlock}>
      <div>
        <span>{label}</span>
        <p>{value || "Not completed"}</p>
      </div>

      <button
        type="button"
        onClick={copyValue}
        disabled={!value}
      >
        Copy
      </button>
    </article>
  );
}
