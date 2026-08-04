"use client";

import styles from "./BusinessIdentityFormSafetyPanel.module.css";

interface BusinessIdentityFormDraft {
  publicBrandName:
    string;

  legalBusinessName:
    string;

  websiteUrl:
    string;

  officialBusinessEmail:
    string;

  supportEmail:
    string;

  publisherRelationsEmail:
    string;

  advertisingEmail:
    string;

  copyrightEmail:
    string;

  signalUrl:
    string;

  signalLabel:
    string;

  copyrightPortalUrl:
    string;

  clientPortalUrl:
    string;

  socialLinksJson:
    string;
}

interface BusinessIdentityFormSafetyPanelProps {
  form:
    BusinessIdentityFormDraft;

  rowVersion:
    string;
}

interface SafetyCheck {
  label:
    string;

  value:
    string;

  healthy:
    boolean;

  note:
    string;
}

function hasValue(
  value:
    string
): boolean {
  return value.trim().length > 0;
}

function isValidUrl(
  value:
    string,
  required:
    boolean
): boolean {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return !required;
  }

  try {
    const parsed =
      new URL(
        trimmed
      );

    return parsed.protocol === "https:" ||
      parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidEmail(
  value:
    string,
  required:
    boolean
): boolean {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return !required;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    trimmed
  );
}

function allOptionalEmailsValid(
  form:
    BusinessIdentityFormDraft
): boolean {
  return [
    form.supportEmail,
    form.publisherRelationsEmail,
    form.advertisingEmail,
    form.copyrightEmail,
  ].every(
    value =>
      isValidEmail(
        value,
        false
      )
  );
}

function parseSocialLinks(
  value:
    string
): Record<string, unknown> | null {
  try {
    const parsed =
      JSON.parse(
        value
      ) as unknown;

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(
        parsed
      )
    ) {
      return parsed as Record<string, unknown>;
    }

    return null;
  } catch {
    return null;
  }
}

function getSocialLinkCount(
  form:
    BusinessIdentityFormDraft
): number | null {
  const parsed =
    parseSocialLinks(
      form.socialLinksJson
    );

  if (!parsed) {
    return null;
  }

  return Object.keys(
    parsed
  ).length;
}

function getChecks(
  form:
    BusinessIdentityFormDraft,
  rowVersion:
    string
): SafetyCheck[] {
  const officialEmail =
    form.officialBusinessEmail.trim();

  const socialLinkCount =
    getSocialLinkCount(
      form
    );

  const signalLabelHasUrl =
    !hasValue(
      form.signalLabel
    ) ||
    hasValue(
      form.signalUrl
    );

  return [
    {
      label:
        "Row version",

      value:
        rowVersion || "Missing",

      healthy:
        hasValue(
          rowVersion
        ),

      note:
        "Save requests use this row version to prevent overwriting another Admin's newer update.",
    },
    {
      label:
        "Public brand",

      value:
        hasValue(
          form.publicBrandName
        )
          ? "Present"
          : "Missing",

      healthy:
        form.publicBrandName.trim().length >= 2,

      note:
        "Public brand name is required for all public contact surfaces.",
    },
    {
      label:
        "Website URL",

      value:
        isValidUrl(
          form.websiteUrl,
          true
        )
          ? "Valid"
          : "Invalid",

      healthy:
        isValidUrl(
          form.websiteUrl,
          true
        ),

      note:
        "Website URL must be an http or https URL.",
    },
    {
      label:
        "Official email",

      value:
        officialEmail || "Missing",

      healthy:
        isValidEmail(
          officialEmail,
          true
        ) &&
        officialEmail.toLowerCase().endsWith(
          "@getpostar.com"
        ),

      note:
        "Official public business email should use the getpostar.com domain.",
    },
    {
      label:
        "Optional emails",

      value:
        allOptionalEmailsValid(
          form
        )
          ? "Valid"
          : "Review",

      healthy:
        allOptionalEmailsValid(
          form
        ),

      note:
        "Support, publisher, advertising, and copyright emails may be blank, but filled values must be valid emails.",
    },
    {
      label:
        "Signal contact",

      value:
        isValidUrl(
          form.signalUrl,
          false
        ) && signalLabelHasUrl
          ? "Valid"
          : "Review",

      healthy:
        isValidUrl(
          form.signalUrl,
          false
        ) &&
        signalLabelHasUrl,

      note:
        "Signal URL may be blank, but a visible Signal label should have a URL.",
    },
    {
      label:
        "Portal URLs",

      value:
        isValidUrl(
          form.copyrightPortalUrl,
          false
        ) &&
        isValidUrl(
          form.clientPortalUrl,
          false
        )
          ? "Valid"
          : "Review",

      healthy:
        isValidUrl(
          form.copyrightPortalUrl,
          false
        ) &&
        isValidUrl(
          form.clientPortalUrl,
          false
        ),

      note:
        "Copyright and Client portal URLs may be blank until configured, but filled values must be valid URLs.",
    },
    {
      label:
        "Social links JSON",

      value:
        socialLinkCount === null
          ? "Invalid"
          : `${socialLinkCount} link${
              socialLinkCount === 1
                ? ""
                : "s"
            }`,

      healthy:
        socialLinkCount !== null,

      note:
        "Social links must remain a JSON object so public apps can safely consume them.",
    },
  ];
}

export default function BusinessIdentityFormSafetyPanel(
  props:
    BusinessIdentityFormSafetyPanelProps
) {
  const checks =
    getChecks(
      props.form,
      props.rowVersion
    );

  const attentionCount =
    checks.filter(
      check =>
        !check.healthy
    ).length;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h3>
            Form safety checks
          </h3>

          <p>
            Reviews public contact fields before save without changing Backend
            validation or public app integrations.
          </p>
        </div>

        <span
          className={
            attentionCount === 0
              ? styles.readyBadge
              : styles.attentionBadge
          }
        >
          {attentionCount === 0
            ? "Ready"
            : `${attentionCount} checks need attention`}
        </span>
      </header>

      <div className={styles.grid}>
        {checks.map(
          check => (
            <article
              key={check.label}
              className={
                check.healthy
                  ? styles.itemReady
                  : styles.itemAttention
              }
            >
              <span>
                {check.label}
              </span>

              <strong>
                {check.value}
              </strong>

              <p>
                {check.note}
              </p>
            </article>
          )
        )}
      </div>
    </section>
  );
}