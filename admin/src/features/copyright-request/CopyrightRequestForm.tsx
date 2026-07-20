"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./CopyrightRequestForm.module.css";

type RequestType =
  | "copyright_claim"
  | "publisher_removal"
  | "other_rights_issue";

interface FormState {
  organization: string;
  representativeName: string;
  businessEmail: string;
  organizationWebsite: string;

  posterContentId: string;
  posterContentUrl: string;
  originalWorkUrl: string;

  requestType: RequestType;
  referenceNumber: string;

  explanation: string;
  supportingLinks: string;

  electronicSignature: string;

  confirmAuthority: boolean;
  confirmGoodFaith: boolean;
  confirmAccuracy: boolean;
  confirmElectronicSignature: boolean;
}

type FormErrors =
  Partial<
    Record<
      keyof FormState | "contentReference",
      string
    >
  >;

const INITIAL_FORM: FormState = {
  organization: "",
  representativeName: "",
  businessEmail: "",
  organizationWebsite: "",

  posterContentId: "",
  posterContentUrl: "",
  originalWorkUrl: "",

  requestType:
    "copyright_claim",

  referenceNumber: "",

  explanation: "",
  supportingLinks: "",

  electronicSignature: "",

  confirmAuthority: false,
  confirmGoodFaith: false,
  confirmAccuracy: false,
  confirmElectronicSignature: false,
};

function isValidUrl(
  value: string
): boolean {
  if (!value.trim()) {
    return false;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function requestTypeLabel(
  type: RequestType
): string {
  switch (type) {
    case "copyright_claim":
      return "Copyright claim";

    case "publisher_removal":
      return "Publisher removal request";

    case "other_rights_issue":
      return "Other rights issue";
  }
}

function validateForm(
  form: FormState
): FormErrors {
  const errors:
    FormErrors = {};

  if (
    !form.organization.trim()
  ) {
    errors.organization =
      "Enter the rights holder or organization name.";
  }

  if (
    !form.representativeName.trim()
  ) {
    errors.representativeName =
      "Enter the authorized representative’s full name.";
  }

  if (
    !isValidEmail(
      form.businessEmail
    )
  ) {
    errors.businessEmail =
      "Enter a valid business email address.";
  }

  if (
    form.organizationWebsite.trim() &&
    !isValidUrl(
      form.organizationWebsite
    )
  ) {
    errors.organizationWebsite =
      "Enter a valid organization website URL.";
  }

  if (
    !form.posterContentId.trim() &&
    !form.posterContentUrl.trim()
  ) {
    errors.contentReference =
      "Provide either the Poster Content ID or the Poster content URL.";
  }

  if (
    form.posterContentUrl.trim() &&
    !isValidUrl(
      form.posterContentUrl
    )
  ) {
    errors.posterContentUrl =
      "Enter a valid Poster content URL.";
  }

  if (
    !isValidUrl(
      form.originalWorkUrl
    )
  ) {
    errors.originalWorkUrl =
      "Enter the original copyrighted-work URL.";
  }

  if (
    form.explanation
      .trim()
      .length <
    20
  ) {
    errors.explanation =
      "Provide a short explanation of at least 20 characters.";
  }

  if (
    !form.electronicSignature.trim()
  ) {
    errors.electronicSignature =
      "Type your full legal name as your electronic signature.";
  }

  if (
    !form.confirmAuthority
  ) {
    errors.confirmAuthority =
      "Confirm that you are the rights holder or authorized to act for the rights holder.";
  }

  if (
    !form.confirmGoodFaith
  ) {
    errors.confirmGoodFaith =
      "Confirm the good-faith statement.";
  }

  if (
    !form.confirmAccuracy
  ) {
    errors.confirmAccuracy =
      "Confirm that the information submitted is accurate.";
  }

  if (
    !form.confirmElectronicSignature
  ) {
    errors.confirmElectronicSignature =
      "Confirm that typing your name constitutes your electronic signature.";
  }

  return errors;
}

export default function CopyrightRequestForm() {
  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      INITIAL_FORM
    );

  const [
    errors,
    setErrors,
  ] =
    useState<FormErrors>(
      {}
    );

  const [
    validated,
    setValidated,
  ] =
    useState(false);

  const [
    localReference,
    setLocalReference,
  ] =
    useState<
      string | null
    >(null);

  const contentReference =
    useMemo(() => {
      if (
        form.posterContentId.trim()
      ) {
        return form.posterContentId
          .trim()
          .toUpperCase();
      }

      return (
        form.posterContentUrl
          .trim() ||
        "Not provided"
      );
    }, [
      form.posterContentId,
      form.posterContentUrl,
    ]);

  const updateField = <
    K extends keyof FormState
  >(
    field: K,
    value: FormState[K]
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setValidated(false);
    setLocalReference(null);

    setErrors(
      (current) => {
        const next = {
          ...current,
        };

        delete next[field];

        if (
          field ===
            "posterContentId" ||
          field ===
            "posterContentUrl"
        ) {
          delete next.contentReference;
        }

        return next;
      }
    );
  };

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextErrors =
      validateForm(form);

    setErrors(
      nextErrors
    );

    if (
      Object.keys(
        nextErrors
      ).length >
      0
    ) {
      setValidated(false);

      const firstError =
        document.querySelector(
          '[data-form-error="true"]'
        );

      firstError?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    const reference =
      `RIGHTS-LOCAL-${Date.now()
        .toString()
        .slice(-8)}`;

    setLocalReference(
      reference
    );

    setValidated(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetForm = () => {
    setForm(
      INITIAL_FORM
    );

    setErrors({});
    setValidated(false);
    setLocalReference(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.shell
        }
      >
        <header
          className={
            styles.header
          }
        >
          <div
            className={
              styles.brand
            }
          >
            <div
              className={
                styles.brandMark
              }
              aria-hidden="true"
            >
              P
            </div>

            <div>
              <strong>
                Poster
              </strong>

              <span>
                Rights & Copyright
              </span>
            </div>
          </div>

          <div
            className={
              styles.headerTag
            }
          >
            Discovery, not publishing
          </div>
        </header>

        {validated ? (
          <section
            className={
              styles.successPanel
            }
          >
            <div
              className={
                styles.successMark
              }
              aria-hidden="true"
            >
              ✓
            </div>

            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Form validated
              </span>

              <h1>
                Your request is ready for submission.
              </h1>

              <p>
                The information passed the current
                frontend validation checks.
                Real transmission, case creation,
                email confirmation, evidence storage,
                and Admin delivery will be connected
                when Poster’s Backend is implemented.
              </p>
            </div>

            <div
              className={
                styles.successSummary
              }
            >
              <div>
                <span>
                  Local preview reference
                </span>

                <strong>
                  {
                    localReference
                  }
                </strong>
              </div>

              <div>
                <span>
                  Request type
                </span>

                <strong>
                  {requestTypeLabel(
                    form.requestType
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Affected Poster record
                </span>

                <strong>
                  {
                    contentReference
                  }
                </strong>
              </div>

              <div>
                <span>
                  Electronic signature
                </span>

                <strong>
                  {
                    form.electronicSignature
                  }
                </strong>
              </div>
            </div>

            <div
              className={
                styles.successNotice
              }
            >
              This development build has not sent
              the request to Poster or created a
              real copyright case.
            </div>

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                resetForm
              }
            >
              Start another request
            </button>
          </section>
        ) : (
          <>
            <section
              className={
                styles.hero
              }
            >
              <span
                className={
                  styles.eyebrow
                }
              >
                Copyright / Rights Request
              </span>

              <h1>
                Request review or removal of content on Poster
              </h1>

              <p>
                Use this form if you are a copyright
                owner, publisher, rights holder, or an
                authorized representative and believe
                content identified on Poster requires
                review or removal.
              </p>

              <div
                className={
                  styles.heroNote
                }
              >
                Poster is a discovery platform.
                Content normally redirects users to
                the original publisher or platform.
                Please provide enough information for
                Poster to identify both the affected
                Poster record and the original work.
              </div>
            </section>

            <form
              className={
                styles.form
              }
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeading
                  }
                >
                  <span>
                    1
                  </span>

                  <div>
                    <h2>
                      Rights holder
                    </h2>

                    <p>
                      Tell us who owns the rights
                      and who is submitting this request.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.gridTwo
                  }
                >
                  <Field
                    label="Organization / rights holder"
                    required
                    error={
                      errors.organization
                    }
                  >
                    <input
                      value={
                        form.organization
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "organization",
                          event.target
                            .value
                        )
                      }
                      placeholder="Example Media Ltd."
                      autoComplete="organization"
                    />
                  </Field>

                  <Field
                    label="Authorized representative"
                    required
                    error={
                      errors.representativeName
                    }
                  >
                    <input
                      value={
                        form.representativeName
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "representativeName",
                          event.target
                            .value
                        )
                      }
                      placeholder="Full legal name"
                      autoComplete="name"
                    />
                  </Field>

                  <Field
                    label="Business email"
                    required
                    error={
                      errors.businessEmail
                    }
                  >
                    <input
                      type="email"
                      value={
                        form.businessEmail
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "businessEmail",
                          event.target
                            .value
                        )
                      }
                      placeholder="rights@example.com"
                      autoComplete="email"
                    />
                  </Field>

                  <Field
                    label="Organization website"
                    error={
                      errors.organizationWebsite
                    }
                  >
                    <input
                      type="url"
                      value={
                        form.organizationWebsite
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "organizationWebsite",
                          event.target
                            .value
                        )
                      }
                      placeholder="https://example.com"
                    />
                  </Field>
                </div>
              </section>

              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeading
                  }
                >
                  <span>
                    2
                  </span>

                  <div>
                    <h2>
                      Identify the Poster content
                    </h2>

                    <p>
                      Provide the Poster Content ID
                      or the Poster URL so we can
                      identify the exact record.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.gridTwo
                  }
                >
                  <Field
                    label="Poster Content ID"
                    hint="Example: CNT-2001"
                    error={
                      errors.contentReference
                    }
                  >
                    <input
                      value={
                        form.posterContentId
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "posterContentId",
                          event.target
                            .value
                        )
                      }
                      placeholder="CNT-2001"
                    />
                  </Field>

                  <Field
                    label="Poster content URL"
                    hint="Use this if you do not know the Content ID."
                    error={
                      errors.posterContentUrl ??
                      (
                        !form.posterContentId.trim()
                          ? errors.contentReference
                          : undefined
                      )
                    }
                  >
                    <input
                      type="url"
                      value={
                        form.posterContentUrl
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "posterContentUrl",
                          event.target
                            .value
                        )
                      }
                      placeholder="https://poster.example/content/..."
                    />
                  </Field>
                </div>

                <Field
                  label="Original copyrighted-work URL"
                  required
                  hint="Provide the original publisher, platform, or rights-holder URL."
                  error={
                    errors.originalWorkUrl
                  }
                >
                  <input
                    type="url"
                    value={
                      form.originalWorkUrl
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "originalWorkUrl",
                        event.target
                          .value
                      )
                    }
                    placeholder="https://publisher.example/original-work"
                  />
                </Field>
              </section>

              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeading
                  }
                >
                  <span>
                    3
                  </span>

                  <div>
                    <h2>
                      Request details
                    </h2>

                    <p>
                      Explain what you are requesting
                      and provide any useful references.
                    </p>
                  </div>
                </div>

                <div
                  className={
                    styles.gridTwo
                  }
                >
                  <Field
                    label="Request type"
                    required
                  >
                    <select
                      value={
                        form.requestType
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "requestType",
                          event.target
                            .value as RequestType
                        )
                      }
                    >
                      <option
                        value="copyright_claim"
                      >
                        Copyright claim
                      </option>

                      <option
                        value="publisher_removal"
                      >
                        Publisher removal request
                      </option>

                      <option
                        value="other_rights_issue"
                      >
                        Other rights issue
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Rights-holder reference"
                    hint="Optional internal case, claim, or reference number."
                  >
                    <input
                      value={
                        form.referenceNumber
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "referenceNumber",
                          event.target
                            .value
                        )
                      }
                      placeholder="Example: RIGHTS-2026-1042"
                    />
                  </Field>
                </div>

                <Field
                  label="Reason / explanation"
                  required
                  error={
                    errors.explanation
                  }
                >
                  <textarea
                    rows={6}
                    value={
                      form.explanation
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "explanation",
                        event.target
                          .value
                      )
                    }
                    placeholder="Explain the rights issue, why you believe the affected content should be reviewed, and the action you are requesting."
                  />
                </Field>

                <Field
                  label="Supporting links or evidence"
                  hint="Optional. Add relevant public links, licensing references, ownership records, or other supporting context. One item per line is fine."
                >
                  <textarea
                    rows={4}
                    value={
                      form.supportingLinks
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "supportingLinks",
                        event.target
                          .value
                      )
                    }
                    placeholder="https://..."
                  />
                </Field>
              </section>

              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeading
                  }
                >
                  <span>
                    4
                  </span>

                  <div>
                    <h2>
                      Declarations
                    </h2>

                    <p>
                      Confirm your authority and the
                      accuracy of the information
                      submitted.
                    </p>
                  </div>
                </div>

                <CheckboxField
                  checked={
                    form.confirmAuthority
                  }
                  error={
                    errors.confirmAuthority
                  }
                  onChange={(
                    checked
                  ) =>
                    updateField(
                      "confirmAuthority",
                      checked
                    )
                  }
                >
                  I confirm that I am the copyright
                  owner, rights holder, publisher,
                  or that I am authorized to act on
                  behalf of the rights holder.
                </CheckboxField>

                <CheckboxField
                  checked={
                    form.confirmGoodFaith
                  }
                  error={
                    errors.confirmGoodFaith
                  }
                  onChange={(
                    checked
                  ) =>
                    updateField(
                      "confirmGoodFaith",
                      checked
                    )
                  }
                >
                  I have a good-faith belief that the
                  use identified in this request is
                  not authorized by the rights holder,
                  its agent, or applicable law.
                </CheckboxField>

                <CheckboxField
                  checked={
                    form.confirmAccuracy
                  }
                  error={
                    errors.confirmAccuracy
                  }
                  onChange={(
                    checked
                  ) =>
                    updateField(
                      "confirmAccuracy",
                      checked
                    )
                  }
                >
                  I confirm that the information in
                  this request is accurate to the best
                  of my knowledge and that I am
                  authorized to submit it.
                </CheckboxField>
              </section>

              <section
                className={
                  styles.section
                }
              >
                <div
                  className={
                    styles.sectionHeading
                  }
                >
                  <span>
                    5
                  </span>

                  <div>
                    <h2>
                      Electronic signature
                    </h2>

                    <p>
                      No handwritten or uploaded
                      signature is required in this
                      form.
                    </p>
                  </div>
                </div>

                <Field
                  label="Type your full legal name"
                  required
                  hint="Your typed name is used as your electronic signature."
                  error={
                    errors.electronicSignature
                  }
                >
                  <input
                    value={
                      form.electronicSignature
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "electronicSignature",
                        event.target
                          .value
                      )
                    }
                    placeholder="Full legal name"
                    autoComplete="name"
                  />
                </Field>

                <CheckboxField
                  checked={
                    form.confirmElectronicSignature
                  }
                  error={
                    errors.confirmElectronicSignature
                  }
                  onChange={(
                    checked
                  ) =>
                    updateField(
                      "confirmElectronicSignature",
                      checked
                    )
                  }
                >
                  I understand that typing my full
                  legal name above constitutes my
                  electronic signature for this
                  request.
                </CheckboxField>
              </section>

              <section
                className={
                  styles.verificationInfo
                }
              >
                <div
                  className={
                    styles.verificationIcon
                  }
                  aria-hidden="true"
                >
                  ✓
                </div>

                <div>
                  <h2>
                    What Poster will cross-check
                  </h2>

                  <p>
                    A submitted request may be checked
                    against the Poster Content ID,
                    original-work URL, claimant and
                    organization identity, business
                    contact information, publisher/source
                    context, references, and supporting
                    evidence.
                  </p>

                  <div
                    className={
                      styles.verificationStatuses
                    }
                  >
                    <span>
                      Verified
                    </span>

                    <span>
                      Needs review
                    </span>

                    <span>
                      Pending
                    </span>
                  </div>
                </div>
              </section>

              <div
                className={
                  styles.formActions
                }
              >
                <div>
                  <strong>
                    Before submitting
                  </strong>

                  <span>
                    Make sure the Poster record and
                    original work are identified as
                    precisely as possible.
                  </span>
                </div>

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                >
                  Submit Copyright / Rights Request
                </button>
              </div>
            </form>
          </>
        )}

        <footer
          className={
            styles.footer
          }
        >
          <strong>
            Poster
          </strong>

          <span>
            Helping people discover knowledge while
            respecting original publishers and
            rights holders.
          </span>
        </footer>
      </div>
    </main>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children:
    React.ReactNode;
}

function Field({
  label,
  required = false,
  hint,
  error,
  children,
}: FieldProps) {
  return (
    <label
      className={
        styles.field
      }
      data-form-error={
        error
          ? "true"
          : undefined
      }
    >
      <span
        className={
          styles.fieldLabel
        }
      >
        {label}

        {required ? (
          <strong>
            *
          </strong>
        ) : null}
      </span>

      {hint ? (
        <span
          className={
            styles.fieldHint
          }
        >
          {hint}
        </span>
      ) : null}

      {children}

      {error ? (
        <span
          className={
            styles.error
          }
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

interface CheckboxFieldProps {
  checked: boolean;
  error?: string;
  onChange:
    (
      checked: boolean
    ) => void;
  children:
    React.ReactNode;
}

function CheckboxField({
  checked,
  error,
  onChange,
  children,
}: CheckboxFieldProps) {
  return (
    <div
      className={
        styles.checkboxWrap
      }
      data-form-error={
        error
          ? "true"
          : undefined
      }
    >
      <label
        className={
          styles.checkboxField
        }
      >
        <input
          type="checkbox"
          checked={
            checked
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .checked
            )
          }
        />

        <span>
          {children}
        </span>
      </label>

      {error ? (
        <span
          className={
            styles.error
          }
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}