"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import type {
  ClientPlacement,
  ClientRequestRecord,
  ClientRequestType,
} from "./request.types";

import styles from "./NewRequestForm.module.css";

interface NewRequestFormProps {
  initialRequest?: ClientRequestRecord;
}

interface FormState {
  type: ClientRequestType;

  organization: string;
  contactName: string;
  businessEmail: string;
  website: string;

  campaignName: string;
  requestedStartDate: string;
  requestedEndDate: string;

  proposedContractValue: string;
  proposedBudget: string;
  commissionModel: string;
  conversionDefinition: string;

  headline: string;
  body: string;
  callToAction: string;
  destinationUrl: string;

  rightsConfirmed: boolean;
}

const placementOptions: {
  value: ClientPlacement;
  label: string;
}[] = [
  {
    value: "home",
    label: "Home",
  },
  {
    value: "search",
    label: "Search",
  },
  {
    value: "trending",
    label: "Trending",
  },
];

function createInitialState(
  request?: ClientRequestRecord
): FormState {
  return {
    type:
      request?.type ??
      "direct_sponsorship",

    organization:
      request?.organization ??
      "Example Cloud",

    contactName:
      request?.contactName ??
      "Aarav Mehta",

    businessEmail:
      request?.businessEmail ??
      "marketing@examplecloud.com",

    website:
      request?.website ??
      "https://examplecloud.com",

    campaignName:
      request?.campaignName ??
      "",

    requestedStartDate:
      request?.requestedStartDate ??
      "",

    requestedEndDate:
      request?.requestedEndDate ??
      "",

    proposedContractValue:
      request?.proposedContractValue !==
      undefined
        ? String(
            request.proposedContractValue
          )
        : "",

    proposedBudget:
      request?.proposedBudget !==
      undefined
        ? String(
            request.proposedBudget
          )
        : "",

    commissionModel:
      request?.commissionModel ??
      "",

    conversionDefinition:
      request?.conversionDefinition ??
      "",

    headline:
      request?.creative.headline ??
      "",

    body:
      request?.creative.body ??
      "",

    callToAction:
      request?.creative.callToAction ??
      "",

    destinationUrl:
      request?.creative.destinationUrl ??
      "",

    rightsConfirmed:
      Boolean(request),
  };
}

function createSubmissionReference(): string {
  const timestamp =
    Date.now()
      .toString()
      .slice(-6);

  return `ADV-DEMO-${timestamp}`;
}

export default function NewRequestForm({
  initialRequest,
}: NewRequestFormProps) {
  const isEditMode =
    initialRequest?.status ===
    "changes_requested";

  const initialState =
    useMemo(
      () =>
        createInitialState(
          initialRequest
        ),
      [
        initialRequest,
      ]
    );

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      initialState
    );

  const [
    placements,
    setPlacements,
  ] =
    useState<
      ClientPlacement[]
    >(
      initialRequest?.requestedPlacements ??
        []
    );

  const [
    campaignImage,
    setCampaignImage,
  ] =
    useState("");

  const [
    organizationLogo,
    setOrganizationLogo,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    submittedReference,
    setSubmittedReference,
  ] =
    useState("");

  const updateField = <
    Key extends keyof FormState,
  >(
    key: Key,
    value: FormState[Key]
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]: value,
      })
    );

    setError("");
  };

  const selectType = (
    type: ClientRequestType
  ) => {
    if (
      isEditMode
    ) {
      return;
    }

    updateField(
      "type",
      type
    );
  };

  const togglePlacement = (
    placement:
      ClientPlacement
  ) => {
    setPlacements(
      (
        current
      ) =>
        current.includes(
          placement
        )
          ? current.filter(
              (
                value
              ) =>
                value !==
                placement
            )
          : [
              ...current,
              placement,
            ]
    );

    setError("");
  };

  const resetForm =
    () => {
      setForm(
        initialState
      );

      setPlacements(
        initialRequest?.requestedPlacements ??
          []
      );

      setCampaignImage(
        ""
      );

      setOrganizationLogo(
        ""
      );

      setSubmittedReference(
        ""
      );

      setError(
        ""
      );
    };

  const submitRequest = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      placements.length ===
      0
    ) {
      setError(
        "Select at least one requested placement."
      );

      return;
    }

    if (
      form.requestedStartDate >
      form.requestedEndDate
    ) {
      setError(
        "The requested end date must be after the start date."
      );

      return;
    }

    if (
      form.type ===
        "direct_sponsorship" &&
      Number(
        form.proposedContractValue
      ) <= 0
    ) {
      setError(
        "Enter a valid proposed contract value."
      );

      return;
    }

    if (
      form.type ===
        "affiliate" &&
      !form.commissionModel.trim()
    ) {
      setError(
        "Enter the proposed commission model."
      );

      return;
    }

    if (
      !form.rightsConfirmed
    ) {
      setError(
        "Confirm that you have permission to submit the creative and destination content."
      );

      return;
    }

    setError("");

    /*
     * Frontend-only submission.
     *
     * Backend integration will later:
     * - authenticate the primary client,
     * - scope the request to the organization,
     * - upload creative assets,
     * - create or update an ADV record,
     * - notify Admin,
     * - preserve request history,
     * - return the permanent reference.
     */
    setSubmittedReference(
      initialRequest?.id ??
        createSubmissionReference()
    );
  };

  if (
    submittedReference
  ) {
    return (
      <section
        className={
          styles.success
        }
      >
        <div
          className={
            styles.successMark
          }
        >
          ✓
        </div>

        <div>
          <div
            className={
              styles.successEyebrow
            }
          >
            {isEditMode
              ? "Updates sent"
              : "Request submitted"}
          </div>

          <h2>
            {isEditMode
              ? "Your corrections were sent to Admin."
              : "Your commercial request was received."}
          </h2>

          <p>
            Reference:
            {" "}
            <strong>
              {
                submittedReference
              }
            </strong>
          </p>

          <div
            className={
              styles.successActions
            }
          >
            <Link
              href="/requests"
              className="primaryButton"
            >
              View requests
            </Link>

            <button
              type="button"
              className="secondaryButton"
              onClick={
                resetForm
              }
            >
              {isEditMode
                ? "Review again"
                : "Submit another"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submitRequest
      }
    >
      {isEditMode &&
      initialRequest ? (
        <section
          className={
            styles.adminNotice
          }
        >
          <div>
            <strong>
              Admin requested changes
            </strong>

            <span>
              {
                initialRequest.id
              }
            </span>
          </div>

          <p>
            {
              initialRequest.reviewNote
            }
          </p>
        </section>
      ) : null}

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span>
            1
          </span>

          <div>
            <h2>
              Request type
            </h2>

            <p>
              Choose the commercial model.
            </p>
          </div>
        </div>

        <div
          className={
            styles.typeGrid
          }
        >
          <button
            type="button"
            disabled={
              isEditMode
            }
            className={
              form.type ===
              "direct_sponsorship"
                ? styles.typeCardActive
                : styles.typeCard
            }
            onClick={() =>
              selectType(
                "direct_sponsorship"
              )
            }
          >
            <strong>
              Direct Sponsorship
            </strong>

            <span>
              Contract-based campaign with defined
              placement and delivery.
            </span>
          </button>

          <button
            type="button"
            disabled={
              isEditMode
            }
            className={
              form.type ===
              "affiliate"
                ? styles.typeCardActive
                : styles.typeCard
            }
            onClick={() =>
              selectType(
                "affiliate"
              )
            }
          >
            <strong>
              Affiliate
            </strong>

            <span>
              Performance partnership using tracked
              conversions and commission.
            </span>
          </button>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span>
            2
          </span>

          <div>
            <h2>
              Organization
            </h2>

            <p>
              Primary client contact.
            </p>
          </div>
        </div>

        <div
          className={
            styles.formGrid
          }
        >
          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-organization">
              Organization *
            </label>

            <input
              id="request-organization"
              value={
                form.organization
              }
              onChange={(
                event
              ) =>
                updateField(
                  "organization",
                  event.target.value
                )
              }
              required
              autoComplete="organization"
            />
          </div>

          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-contact">
              Contact name *
            </label>

            <input
              id="request-contact"
              value={
                form.contactName
              }
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

          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-email">
              Business email *
            </label>

            <input
              id="request-email"
              type="email"
              value={
                form.businessEmail
              }
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

          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-website">
              Website *
            </label>

            <input
              id="request-website"
              type="url"
              value={
                form.website
              }
              onChange={(
                event
              ) =>
                updateField(
                  "website",
                  event.target.value
                )
              }
              required
            />
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span>
            3
          </span>

          <div>
            <h2>
              Campaign
            </h2>

            <p>
              Name, placement, and requested dates.
            </p>
          </div>
        </div>

        <div
          className={
            styles.field
          }
        >
          <label htmlFor="request-campaign-name">
            Campaign name *
          </label>

          <input
            id="request-campaign-name"
            value={
              form.campaignName
            }
            onChange={(
              event
            ) =>
              updateField(
                "campaignName",
                event.target.value
              )
            }
            required
            placeholder="Example: Professional Skills Campaign"
          />
        </div>

        <div
          className={
            styles.fieldGroup
          }
        >
          <label>
            Requested placements *
          </label>

          <div
            className={
              styles.placements
            }
          >
            {placementOptions.map(
              (
                placement
              ) => {
                const selected =
                  placements.includes(
                    placement.value
                  );

                return (
                  <button
                    key={
                      placement.value
                    }
                    type="button"
                    className={
                      selected
                        ? styles.placementActive
                        : styles.placement
                    }
                    aria-pressed={
                      selected
                    }
                    onClick={() =>
                      togglePlacement(
                        placement.value
                      )
                    }
                  >
                    <span
                      className={
                        styles.squareCheck
                      }
                    >
                      {selected
                        ? "✓"
                        : ""}
                    </span>

                    {
                      placement.label
                    }
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div
          className={
            styles.formGrid
          }
        >
          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-start-date">
              Requested start *
            </label>

            <input
              id="request-start-date"
              type="date"
              value={
                form.requestedStartDate
              }
              onChange={(
                event
              ) =>
                updateField(
                  "requestedStartDate",
                  event.target.value
                )
              }
              required
            />
          </div>

          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-end-date">
              Requested end *
            </label>

            <input
              id="request-end-date"
              type="date"
              value={
                form.requestedEndDate
              }
              onChange={(
                event
              ) =>
                updateField(
                  "requestedEndDate",
                  event.target.value
                )
              }
              required
            />
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span>
            4
          </span>

          <div>
            <h2>
              Commercial terms
            </h2>

            <p>
              Proposed value and conversion details.
            </p>
          </div>
        </div>

        <div
          className={
            styles.formGrid
          }
        >
          {form.type ===
          "direct_sponsorship" ? (
            <div
              className={
                styles.field
              }
            >
              <label htmlFor="request-contract-value">
                Proposed contract value *
              </label>

              <div
                className={
                  styles.moneyInput
                }
              >
                <span>
                  ₹
                </span>

                <input
                  id="request-contract-value"
                  type="number"
                  min="1"
                  step="1"
                  value={
                    form.proposedContractValue
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "proposedContractValue",
                      event.target.value
                    )
                  }
                  required
                  placeholder="500000"
                />
              </div>
            </div>
          ) : (
            <>
              <div
                className={
                  styles.field
                }
              >
                <label htmlFor="request-budget">
                  Proposed budget
                </label>

                <div
                  className={
                    styles.moneyInput
                  }
                >
                  <span>
                    ₹
                  </span>

                  <input
                    id="request-budget"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.proposedBudget
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "proposedBudget",
                        event.target.value
                      )
                    }
                    placeholder="150000"
                  />
                </div>
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label htmlFor="request-commission">
                  Commission model *
                </label>

                <input
                  id="request-commission"
                  value={
                    form.commissionModel
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "commissionModel",
                      event.target.value
                    )
                  }
                  required
                  placeholder="₹400 per verified enrollment"
                />
              </div>
            </>
          )}

          <div
            className={
              styles.fieldWide
            }
          >
            <label htmlFor="request-conversion">
              Conversion definition
            </label>

            <input
              id="request-conversion"
              value={
                form.conversionDefinition
              }
              onChange={(
                event
              ) =>
                updateField(
                  "conversionDefinition",
                  event.target.value
                )
              }
              placeholder="Example: Completed paid course enrollment"
            />
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <span>
            5
          </span>

          <div>
            <h2>
              Creative
            </h2>

            <p>
              Submitted message and destination.
            </p>
          </div>
        </div>

        <div
          className={
            styles.formGrid
          }
        >
          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-headline">
              Headline *
            </label>

            <input
              id="request-headline"
              value={
                form.headline
              }
              onChange={(
                event
              ) =>
                updateField(
                  "headline",
                  event.target.value
                )
              }
              required
              maxLength={
                90
              }
            />
          </div>

          <div
            className={
              styles.field
            }
          >
            <label htmlFor="request-cta">
              Call to action *
            </label>

            <input
              id="request-cta"
              value={
                form.callToAction
              }
              onChange={(
                event
              ) =>
                updateField(
                  "callToAction",
                  event.target.value
                )
              }
              required
              placeholder="Explore courses"
            />
          </div>

          <div
            className={
              styles.fieldWide
            }
          >
            <label htmlFor="request-body">
              Message *
            </label>

            <textarea
              id="request-body"
              value={
                form.body
              }
              onChange={(
                event
              ) =>
                updateField(
                  "body",
                  event.target.value
                )
              }
              required
              maxLength={
                240
              }
            />
          </div>

          <div
            className={
              styles.fieldWide
            }
          >
            <label htmlFor="request-destination">
              Destination URL *
            </label>

            <input
              id="request-destination"
              type="url"
              value={
                form.destinationUrl
              }
              onChange={(
                event
              ) =>
                updateField(
                  "destinationUrl",
                  event.target.value
                )
              }
              required
              placeholder="https://"
            />
          </div>
        </div>

        <div
          className={
            styles.uploadGrid
          }
        >
          <label
            className={
              styles.uploadBox
            }
          >
            <strong>
              Campaign image
            </strong>

            <span>
              PNG, JPG or WebP
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(
                event
              ) =>
                setCampaignImage(
                  event.target.files?.[
                    0
                  ]?.name ??
                    ""
                )
              }
            />

            <em>
              {campaignImage ||
                "Choose image"}
            </em>
          </label>

          <label
            className={
              styles.uploadBox
            }
          >
            <strong>
              Organization logo
            </strong>

            <span>
              Optional
            </span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(
                event
              ) =>
                setOrganizationLogo(
                  event.target.files?.[
                    0
                  ]?.name ??
                    ""
                )
              }
            />

            <em>
              {organizationLogo ||
                "Choose logo"}
            </em>
          </label>
        </div>
      </section>

      <section
        className={
          styles.declaration
        }
      >
        <label>
          <input
            type="checkbox"
            checked={
              form.rightsConfirmed
            }
            onChange={(
              event
            ) =>
              updateField(
                "rightsConfirmed",
                event.target.checked
              )
            }
          />

          <span>
            I confirm that I have permission to
            submit the creative, branding, links,
            and commercial information in this
            request.
          </span>
        </label>
      </section>

      {error ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {
            error
          }
        </div>
      ) : null}

      <div
        className={
          styles.actions
        }
      >
        <button
          type="button"
          className="secondaryButton"
          onClick={
            resetForm
          }
        >
          Reset
        </button>

        <button
          type="submit"
          className="primaryButton"
        >
          {isEditMode
            ? "Send updates"
            : "Submit request"}
        </button>
      </div>

      <p
        className={
          styles.controlNote
        }
      >
        Admin reviews and controls approval,
        scheduling, activation, pausing, and
        campaign completion.
      </p>
    </form>
  );
}