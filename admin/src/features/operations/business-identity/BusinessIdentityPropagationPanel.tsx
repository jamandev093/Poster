"use client";

import type {
  BusinessIdentity,
} from "./business-identity.types";

import styles from "./BusinessIdentityPropagationPanel.module.css";

interface BusinessIdentityPropagationPanelProps {
  identity:
    BusinessIdentity | null;

  isLoading:
    boolean;

  hasError:
    boolean;
}

interface PropagationCheck {
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
    string | null | undefined
): boolean {
  return Boolean(
    value?.trim()
  );
}

function getChecks(
  identity:
    BusinessIdentity | null,
  isLoading:
    boolean,
  hasError:
    boolean
): PropagationCheck[] {
  const loaded =
    Boolean(
      identity
    ) &&
    !isLoading &&
    !hasError;

  return [
    {
      label:
        "Backend source",

      value:
        loaded
          ? "Loaded"
          : isLoading
            ? "Loading"
            : "Needs attention",

      healthy:
        loaded,

      note:
        "Admin must read and save the official public identity through the Backend API.",
    },
    {
      label:
        "Public website",

      value:
        identity &&
        hasValue(
          identity.websiteUrl
        ) &&
        hasValue(
          identity.officialBusinessEmail
        )
          ? "Ready"
          : "Missing fields",

      healthy:
        Boolean(
          identity &&
          hasValue(
            identity.websiteUrl
          ) &&
          hasValue(
            identity.officialBusinessEmail
          )
        ),

      note:
        "Website contact pages should use the official website URL and business email from this source.",
    },
    {
      label:
        "Client app Signal",

      value:
        identity &&
        hasValue(
          identity.signalUrl
        )
          ? "Ready"
          : "Signal missing",

      healthy:
        Boolean(
          identity &&
          hasValue(
            identity.signalUrl
          )
        ),

      note:
        "Client Web App Signal contact must come from the official Business Identity source.",
    },
    {
      label:
        "Copyright app",

      value:
        identity &&
        (
          hasValue(
            identity.copyrightEmail
          ) ||
          hasValue(
            identity.officialBusinessEmail
          )
        ) &&
        hasValue(
          identity.copyrightPortalUrl
        )
          ? "Ready"
          : "Missing fields",

      healthy:
        Boolean(
          identity &&
          (
            hasValue(
              identity.copyrightEmail
            ) ||
            hasValue(
              identity.officialBusinessEmail
            )
          ) &&
          hasValue(
            identity.copyrightPortalUrl
          )
        ),

      note:
        "Copyright contact and portal links must stay centralized here.",
    },
    {
      label:
        "Advertiser contact",

      value:
        identity &&
        (
          hasValue(
            identity.advertisingEmail
          ) ||
          hasValue(
            identity.officialBusinessEmail
          )
        ) &&
        hasValue(
          identity.clientPortalUrl
        )
          ? "Ready"
          : "Missing fields",

      healthy:
        Boolean(
          identity &&
          (
            hasValue(
              identity.advertisingEmail
            ) ||
            hasValue(
              identity.officialBusinessEmail
            )
          ) &&
          hasValue(
            identity.clientPortalUrl
          )
        ),

      note:
        "Advertiser-facing contact and Client portal links should propagate from this source.",
    },
    {
      label:
        "Public contacts",

      value:
        identity &&
        hasValue(
          identity.supportEmail
        ) &&
        hasValue(
          identity.publisherRelationsEmail
        )
          ? "Ready"
          : "Optional fields missing",

      healthy:
        Boolean(
          identity &&
          hasValue(
            identity.supportEmail
          ) &&
          hasValue(
            identity.publisherRelationsEmail
          )
        ),

      note:
        "Support and publisher relations emails should be present before public launch.",
    },
    {
      label:
        "Social links",

      value:
        identity
          ? `${Object.keys(
              identity.socialLinks
            ).length} configured`
          : "Not loaded",

      healthy:
        Boolean(
          identity
        ),

      note:
        "Official social/business links must remain separate from personal Admin profile contact details.",
    },
    {
      label:
        "Concurrency",

      value:
        identity?.rowVersion
          ? `Row ${identity.rowVersion}`
          : "Missing",

      healthy:
        Boolean(
          identity?.rowVersion
        ),

      note:
        "Row version protects Admin updates from overwriting another Admin's newer save.",
    },
  ];
}

export default function BusinessIdentityPropagationPanel(
  props:
    BusinessIdentityPropagationPanelProps
) {
  const checks =
    getChecks(
      props.identity,
      props.isLoading,
      props.hasError
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
            Propagation readiness
          </h3>

          <p>
            Confirms that official contact, Signal, portal, social, and row-version
            data are ready to serve Website, Client, Copyright, and advertiser surfaces.
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