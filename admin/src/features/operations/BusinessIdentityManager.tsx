"use client";

import {
  useState,
} from "react";

import {
  formatBusinessIdentityTimestamp,
  getBusinessIdentityErrorMessage,
  updateBusinessIdentity,
  useBusinessIdentity,
  type BusinessIdentity,
  type UpdateBusinessIdentityRequest,
} from "./business-identity";

import styles from "./BusinessIdentityManager.module.css";
import BusinessIdentityPropagationPanel from "./business-identity/BusinessIdentityPropagationPanel";

interface FormState {
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

const FIELDS: readonly {
  key:
    keyof Omit<
      FormState,
      "socialLinksJson"
    >;

  id:
    string;

  label:
    string;

  placeholder?:
    string;
}[] = [
  {
    key:
      "publicBrandName",

    id:
      "public-brand-name",

    label:
      "Public brand name",

    placeholder:
      "Poster",
  },

  {
    key:
      "legalBusinessName",

    id:
      "legal-business-name",

    label:
      "Legal business name",
  },

  {
    key:
      "websiteUrl",

    id:
      "website-url",

    label:
      "Website URL",

    placeholder:
      "https://getpostar.com",
  },

  {
    key:
      "officialBusinessEmail",

    id:
      "official-business-email",

    label:
      "Official business email",

    placeholder:
      "hello@getpostar.com",
  },

  {
    key:
      "supportEmail",

    id:
      "support-email",

    label:
      "Support email",
  },

  {
    key:
      "publisherRelationsEmail",

    id:
      "publisher-relations-email",

    label:
      "Publisher relations email",
  },

  {
    key:
      "advertisingEmail",

    id:
      "advertising-email",

    label:
      "Advertising email",
  },

  {
    key:
      "copyrightEmail",

    id:
      "copyright-email",

    label:
      "Copyright email",
  },

  {
    key:
      "signalUrl",

    id:
      "signal-url",

    label:
      "Official Signal URL",
  },

  {
    key:
      "signalLabel",

    id:
      "signal-label",

    label:
      "Signal label",
  },

  {
    key:
      "copyrightPortalUrl",

    id:
      "copyright-portal-url",

    label:
      "Copyright Portal URL",
  },

  {
    key:
      "clientPortalUrl",

    id:
      "client-portal-url",

    label:
      "Client Portal URL",
  },
];

function toText(
  value:
    string | null
): string {
  return value ??
    "";
}

function toNullable(
  value:
    string
): string | null {
  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function createFormState(
  identity:
    BusinessIdentity
): FormState {
  return {
    publicBrandName:
      identity.publicBrandName,

    legalBusinessName:
      toText(
        identity.legalBusinessName
      ),

    websiteUrl:
      identity.websiteUrl,

    officialBusinessEmail:
      identity.officialBusinessEmail,

    supportEmail:
      toText(
        identity.supportEmail
      ),

    publisherRelationsEmail:
      toText(
        identity.publisherRelationsEmail
      ),

    advertisingEmail:
      toText(
        identity.advertisingEmail
      ),

    copyrightEmail:
      toText(
        identity.copyrightEmail
      ),

    signalUrl:
      toText(
        identity.signalUrl
      ),

    signalLabel:
      toText(
        identity.signalLabel
      ),

    copyrightPortalUrl:
      toText(
        identity.copyrightPortalUrl
      ),

    clientPortalUrl:
      toText(
        identity.clientPortalUrl
      ),

    socialLinksJson:
      JSON.stringify(
        identity.socialLinks,
        null,
        2
      ),
  };
}

function parseSocialLinks(
  value:
    string
): Record<
  string,
  unknown
> {
  const trimmed =
    value.trim();

  if (
    trimmed.length ===
    0
  ) {
    return {};
  }

  const parsed =
    JSON.parse(
      trimmed
    ) as unknown;

  if (
    !parsed ||
    typeof parsed !==
      "object" ||
    Array.isArray(
      parsed
    )
  ) {
    throw new Error(
      "Social links must be a JSON object."
    );
  }

  return parsed as Record<
    string,
    unknown
  >;
}

function buildRequest(
  form:
    FormState,
  identity:
    BusinessIdentity
): UpdateBusinessIdentityRequest {
  return {
    publicBrandName:
      form.publicBrandName.trim(),

    legalBusinessName:
      toNullable(
        form.legalBusinessName
      ),

    websiteUrl:
      form.websiteUrl.trim(),

    officialBusinessEmail:
      form.officialBusinessEmail.trim(),

    supportEmail:
      toNullable(
        form.supportEmail
      ),

    publisherRelationsEmail:
      toNullable(
        form.publisherRelationsEmail
      ),

    advertisingEmail:
      toNullable(
        form.advertisingEmail
      ),

    copyrightEmail:
      toNullable(
        form.copyrightEmail
      ),

    signalUrl:
      toNullable(
        form.signalUrl
      ),

    signalLabel:
      toNullable(
        form.signalLabel
      ),

    copyrightPortalUrl:
      toNullable(
        form.copyrightPortalUrl
      ),

    clientPortalUrl:
      toNullable(
        form.clientPortalUrl
      ),

    socialLinks:
      parseSocialLinks(
        form.socialLinksJson
      ),

    expectedRowVersion:
      identity.rowVersion,
  };
}

function TextField(
  props: {
    id:
      string;

    label:
      string;

    value:
      string;

    placeholder?:
      string;

    onChange:
      (
        value:
          string
      ) => void;
  }
) {
  return (
    <div
      className={
        styles.field
      }
    >
      <label
        htmlFor={
          props.id
        }
      >
        {
          props.label
        }
      </label>

      <input
        id={
          props.id
        }
        value={
          props.value
        }
        placeholder={
          props.placeholder
        }
        onChange={event =>
          props.onChange(
            event.target.value
          )
        }
      />
    </div>
  );
}

export default function BusinessIdentityManager() {
  const {
    identity,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } =
    useBusinessIdentity();

  const [
    form,
    setForm,
  ] =
    useState<
      FormState | null
    >(
      null
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  const [
    saveError,
    setSaveError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    savedMessage,
    setSavedMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const activeForm =
    form ??
    (
      identity
        ? createFormState(
            identity
          )
        : null
    );

  const updateField =
    (
      key:
        keyof FormState,
      value:
        string
    ) => {
      if (
        !activeForm
      ) {
        return;
      }

      setForm({
        ...activeForm,

        [key]:
          value,
      });
    };

  const refreshAndReset =
    async () => {
      setForm(
        null
      );

      await refresh();
    };

  const save =
    async () => {
      if (
        !identity ||
        !activeForm
      ) {
        return;
      }

      setIsSaving(
        true
      );

      setSaveError(
        null
      );

      setSavedMessage(
        null
      );

      try {
        const response =
          await updateBusinessIdentity(
            buildRequest(
              activeForm,
              identity
            )
          );

        setForm(
          createFormState(
            response.identity
          )
        );

        await refresh();

        setSavedMessage(
          "Official business identity saved."
        );
      } catch (
        caught
      ) {
        setSaveError(
          getBusinessIdentityErrorMessage(
            caught
          )
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  return (
    <div
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <div
            className={
              styles.eyebrow
            }
          >
            Operations
          </div>

          <h2>
            Business Identity
          </h2>

          <p>
            Manage Poster&apos;s official public contact source. These values
            are separate from personal Admin profile contact details and will be
            used by public apps through the Backend API.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.secondaryButton
          }
          disabled={
            isRefreshing
          }
          onClick={() =>
            void refreshAndReset()
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      {error ? (
        <section
          className={
            styles.errorPanel
          }
          role="alert"
        >
          <strong>
            Business identity could not be loaded.
          </strong>

          <p>
            {getBusinessIdentityErrorMessage(
              error
            )}
          </p>
        </section>
      ) : null}

      <section
        className={
          styles.policyBanner
        }
      >
        <strong>
          Central source rule
        </strong>

        <p>
          Official business email, Signal, portal, and public contact links must
          come from this Backend-backed identity. Personal Admin Account Profile
          details must not publish externally unless explicitly promoted here.
        </p>
      </section>

      <BusinessIdentityPropagationPanel
        identity={
          identity
        }
        isLoading={
          isLoading
        }
        hasError={
          Boolean(
            error
          )
        }
      />

      {isLoading ||
      !activeForm ||
      !identity ? (
        <section
          className={
            styles.panel
          }
        >
          <div
            className={
              styles.empty
            }
          >
            Loading official business identity...
          </div>
        </section>
      ) : (
        <section
          className={
            styles.panel
          }
        >
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <span
                className={
                  styles.cardLabel
                }
              >
                Official identity
              </span>

              <h3>
                Public business contact details
              </h3>
            </div>

            <div
              className={
                styles.versionBox
              }
            >
              <span>
                Row version
              </span>

              <strong>
                {
                  identity.rowVersion
                }
              </strong>
            </div>
          </div>

          <div
            className={
              styles.formGrid
            }
          >
            {FIELDS.map(
              item => (
                <TextField
                  key={
                    item.key
                  }
                  id={
                    item.id
                  }
                  label={
                    item.label
                  }
                  value={
                    activeForm[
                      item.key
                    ]
                  }
                  placeholder={
                    item.placeholder
                  }
                  onChange={value =>
                    updateField(
                      item.key,
                      value
                    )
                  }
                />
              )
            )}

            <div
              className={
                styles.fullField
              }
            >
              <label htmlFor="social-links-json">
                Social links JSON
              </label>

              <textarea
                id="social-links-json"
                value={
                  activeForm.socialLinksJson
                }
                onChange={event =>
                  updateField(
                    "socialLinksJson",
                    event.target.value
                  )
                }
              />

              <span>
                Must be a JSON object. Example:
                {" "}
                {"{\"linkedin\":\"https://www.linkedin.com/company/example\"}"}
              </span>
            </div>
          </div>

          {saveError ? (
            <div
              className={
                styles.errorPanel
              }
              role="alert"
            >
              <strong>
                Save failed.
              </strong>

              <p>
                {
                  saveError
                }
              </p>
            </div>
          ) : null}

          {savedMessage ? (
            <div
              className={
                styles.successPanel
              }
              role="status"
            >
              {
                savedMessage
              }
            </div>
          ) : null}

          <div
            className={
              styles.footer
            }
          >
            <div
              className={
                styles.auditNote
              }
            >
              Last updated:
              {" "}
              {formatBusinessIdentityTimestamp(
                identity.updatedAt
              )}
            </div>

            <button
              type="button"
              className={
                styles.primaryButton
              }
              disabled={
                isSaving
              }
              onClick={() =>
                void save()
              }
            >
              {isSaving
                ? "Saving..."
                : "Save official identity"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}