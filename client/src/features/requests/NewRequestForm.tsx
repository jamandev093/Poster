"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import CreativeMediaUploader, {
  type CreativeMediaSelection,
} from "@/components/media/CreativeMediaUploader";

import {
  validateCommercialCreative,
} from "@/features/workspace/creative.rules";

import {
  currentOrganization,
} from "@/features/workspace/workspace.mock";

import {
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

import type {
  CommercialCreative,
  CommercialRequest,
  CommercialRequestType,
  CreativeLayout,
  CreativeMediaAsset,
  Placement,
  SlidingCardSlot,
  SlidingCreativeCard,
} from "@/features/workspace/workspace.types";

import styles from "./NewRequestForm.module.css";

interface NewRequestFormProps {
  initialRequest?: CommercialRequest;
}

interface FormState {
  type: CommercialRequestType;

  organizationName: string;

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
  value: Placement;

  label: string;
}[] = [
  {
    value:
      "home",

    label:
      "Home",
  },

  {
    value:
      "search",

    label:
      "Search",
  },

  {
    value:
      "trending",

    label:
      "Trending",
  },
];

const slidingSlots:
  readonly SlidingCardSlot[] = [
  1,
  2,
  3,
];

const MAX_VIDEO_BYTES =
  20 *
  1024 *
  1024;

function createInitialState(
  request?: CommercialRequest
):
  FormState {
  return {
    type:
      request?.type ??
      "direct_sponsorship",

    organizationName:
      request?.organizationName ??
      currentOrganization.name,

    contactName:
      request?.contactName ??
      currentOrganization.primaryContactName,

    businessEmail:
      request?.businessEmail ??
      currentOrganization.primaryContactEmail,

    website:
      request?.website ??
      currentOrganization.website,

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
      request?.rightsConfirmed ??
      false,
  };
}

function createInitialLayout(
  request?: CommercialRequest
):
  CreativeLayout {
  if (
    request?.creative.layout
  ) {
    return request.creative.layout;
  }

  if (
    request?.creative
      .slidingCards
      ?.length
  ) {
    return "sliding";
  }

  return "standard";
}

function createInitialStandardMedia(
  request?: CommercialRequest
):
  CreativeMediaAsset |
  undefined {
  if (
    request?.creative
      .primaryMedia
  ) {
    return request.creative
      .primaryMedia;
  }

  if (
    request?.creative
      .imageName
  ) {
    return {
      role:
        "primary",

      type:
        "image",

      frameProfile:
        "standard_media",

      fileName:
        request.creative
          .imageName,
    };
  }

  return undefined;
}

function createInitialLogoMedia(
  request?: CommercialRequest
):
  CreativeMediaAsset |
  undefined {
  if (
    request?.creative
      .logoMedia
  ) {
    return request.creative
      .logoMedia;
  }

  if (
    request?.creative
      .logoName
  ) {
    return {
      role:
        "logo",

      type:
        "image",

      fileName:
        request.creative
          .logoName,
    };
  }

  return undefined;
}

function createInitialSlideTitles(
  request?: CommercialRequest
):
  Record<
    SlidingCardSlot,
    string
  > {
  const findTitle = (
    slot:
      SlidingCardSlot
  ) =>
    request?.creative
      .slidingCards
      ?.find(
        (
          card
        ) =>
          card.slot ===
          slot
      )
      ?.title ??
    "";

  return {
    1:
      findTitle(
        1
      ),

    2:
      findTitle(
        2
      ),

    3:
      findTitle(
        3
      ),
  };
}

function createInitialSlideMedia(
  request?: CommercialRequest
):
  Partial<
    Record<
      SlidingCardSlot,
      CreativeMediaAsset
    >
  > {
  const result:
    Partial<
      Record<
        SlidingCardSlot,
        CreativeMediaAsset
      >
    > = {};

  for (
    const card of
    request?.creative
      .slidingCards ??
    []
  ) {
    result[
      card.slot
    ] =
      card.media;
  }

  return result;
}

function createPreviewReference():
  string {
  const suffix =
    Date.now()
      .toString()
      .slice(
        -6
      );

  return `ADV-PREVIEW-${suffix}`;
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
      Placement[]
    >(
      initialRequest
        ?.requestedPlacements ??
        []
    );

  const [
    creativeLayout,
    setCreativeLayout,
  ] =
    useState<CreativeLayout>(
      () =>
        createInitialLayout(
          initialRequest
        )
    );

  const [
    standardMedia,
    setStandardMedia,
  ] =
    useState<
      CreativeMediaAsset |
      undefined
    >(
      () =>
        createInitialStandardMedia(
          initialRequest
        )
    );

  const [
    logoMedia,
    setLogoMedia,
  ] =
    useState<
      CreativeMediaAsset |
      undefined
    >(
      () =>
        createInitialLogoMedia(
          initialRequest
        )
    );

  const [
    slideTitles,
    setSlideTitles,
  ] =
    useState<
      Record<
        SlidingCardSlot,
        string
      >
    >(
      () =>
        createInitialSlideTitles(
          initialRequest
        )
    );

  const [
    slideMedia,
    setSlideMedia,
  ] =
    useState<
      Partial<
        Record<
          SlidingCardSlot,
          CreativeMediaAsset
        >
      >
    >(
      () =>
        createInitialSlideMedia(
          initialRequest
        )
    );

  const [
    formResetVersion,
    setFormResetVersion,
  ] =
    useState(
      0
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    submittedReference,
    setSubmittedReference,
  ] =
    useState(
      ""
    );

  const updateField = <
    Key extends keyof FormState,
  >(
    key:
      Key,

    value:
      FormState[
        Key
      ]
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

    setError(
      ""
    );
  };

  const selectType = (
    type:
      CommercialRequestType
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

  const selectCreativeLayout = (
    layout:
      CreativeLayout
  ) => {
    setCreativeLayout(
      layout
    );

    setError(
      ""
    );
  };

  const togglePlacement = (
    placement:
      Placement
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

    setError(
      ""
    );
  };

  const updateSlideTitle = (
    slot:
      SlidingCardSlot,

    value:
      string
  ) => {
    setSlideTitles(
      (
        current
      ) => ({
        ...current,

        [slot]:
          value,
      })
    );

    setError(
      ""
    );
  };

  const updateStandardMedia = (
    selection:
      | CreativeMediaSelection
      | null
  ) => {
    setStandardMedia(
      selection?.asset
    );

    setError(
      ""
    );
  };

  const updateLogoMedia = (
    selection:
      | CreativeMediaSelection
      | null
  ) => {
    setLogoMedia(
      selection?.asset
    );

    setError(
      ""
    );
  };

  const updateSlideMedia = (
    slot:
      SlidingCardSlot,

    selection:
      | CreativeMediaSelection
      | null
  ) => {
    setSlideMedia(
      (
        current
      ) => {
        const next = {
          ...current,
        };

        if (
          selection
        ) {
          next[
            slot
          ] =
            selection.asset;
        } else {
          delete next[
            slot
          ];
        }

        return next;
      }
    );

    setError(
      ""
    );
  };

  const buildCreative =
    ():
      CommercialCreative => {
      const base:
        CommercialCreative = {
        layout:
          creativeLayout,

        headline:
          form.headline
            .trim(),

        body:
          form.body
            .trim(),

        callToAction:
          form.callToAction
            .trim(),

        destinationUrl:
          form.destinationUrl
            .trim(),

        logoMedia,

        logoName:
          logoMedia
            ?.fileName ??
          initialRequest
            ?.creative
            .logoName,
      };

      if (
        creativeLayout ===
        "standard"
      ) {
        return {
          ...base,

          primaryMedia:
            standardMedia,

          imageName:
            standardMedia
              ?.type ===
              "image"
              ? standardMedia
                  .fileName
              : initialRequest
                  ?.creative
                  .imageName,
        };
      }

      const slidingCards:
        SlidingCreativeCard[] = [];

      for (
        const slot of
        slidingSlots
      ) {
        const media =
          slideMedia[
            slot
          ];

        if (
          !media
        ) {
          continue;
        }

        slidingCards.push({
          slot,

          title:
            slideTitles[
              slot
            ].trim(),

          media,
        });
      }

      return {
        ...base,

        slidingCards,
      };
    };

  const resetForm =
    () => {
      setForm(
        initialState
      );

      setPlacements(
        initialRequest
          ?.requestedPlacements ??
          []
      );

      setCreativeLayout(
        createInitialLayout(
          initialRequest
        )
      );

      setStandardMedia(
        createInitialStandardMedia(
          initialRequest
        )
      );

      setLogoMedia(
        createInitialLogoMedia(
          initialRequest
        )
      );

      setSlideTitles(
        createInitialSlideTitles(
          initialRequest
        )
      );

      setSlideMedia(
        createInitialSlideMedia(
          initialRequest
        )
      );

      setFormResetVersion(
        (
          current
        ) =>
          current +
          1
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
      ) <=
        0
    ) {
      setError(
        "Enter a valid proposed contract value."
      );

      return;
    }

    if (
      form.type ===
        "affiliate" &&
      !form.commissionModel
        .trim()
    ) {
      setError(
        "Enter the proposed commission model."
      );

      return;
    }

    const creative =
      buildCreative();

    const creativeValidation =
      validateCommercialCreative(
        creative
      );

    if (
      !creativeValidation
        .valid
    ) {
      setError(
        creativeValidation
          .errors[
          0
        ] ??
          "Review the advertising creative before submitting."
      );

      return;
    }

    if (
      !form.rightsConfirmed
    ) {
      setError(
        "Confirm that you have permission to submit the creative, links, and commercial information."
      );

      return;
    }

    setError(
      ""
    );

    /*
     * Frontend-only workflow.
     *
     * Backend integration will later:
     *
     * - authenticate the client;
     * - enforce organization ownership;
     * - upload media to secure object storage;
     * - re-verify MIME, codec, FPS, duration,
     *   dimensions and aspect ratio;
     * - generate permanent media asset IDs/URLs;
     * - create/update the ADV request;
     * - preserve immutable review history;
     * - notify Admin;
     * - return the permanent request reference.
     *
     * Browser File objects and object URLs are never
     * persisted as canonical campaign data.
     */
    void creative;

    setSubmittedReference(
      initialRequest
        ?.id ??
        createPreviewReference()
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
              ? "Corrections ready"
              : "Request prepared"}
          </div>

          <h2>
            {isEditMode
              ? "Your changes are ready to return to Poster for review."
              : "Your advertising request is ready for Poster review."}
          </h2>

          <p>
            Reference:{" "}
            <strong>
              {
                submittedReference
              }
            </strong>
          </p>

          <p>
            This development build does not persist submissions until
            backend services are connected.
          </p>

          <div
            className={
              styles.successActions
            }
          >
            <Link
              href={
                isEditMode &&
                initialRequest
                  ? `/requests/${initialRequest.id}`
                  : "/requests"
              }
              className="primaryButton"
            >
              {isEditMode
                ? "Back to request"
                : "View requests"}
            </Link>

            <button
              type="button"
              className="secondaryButton"
              onClick={
                resetForm
              }
            >
              {isEditMode
                ? "Edit again"
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
              Poster requested changes
            </strong>

            <span>
              {
                initialRequest.id
              }
            </span>
          </div>

          {initialRequest
            .review
            ?.requestedChanges
            .length ? (
            <ul>
              {initialRequest.review.requestedChanges.map(
                (
                  change
                ) => (
                  <li
                    key={
                      change
                    }
                  >
                    {
                      change
                    }
                  </li>
                )
              )}
            </ul>
          ) : null}

          {initialRequest
            .review
            ?.reviewNote ? (
            <p>
              {
                initialRequest.review.reviewNote
              }
            </p>
          ) : null}
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
              Choose the commercial relationship. Creative format and
              placement are selected independently.
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
              Contract-based advertising with agreed commercial terms,
              placements, schedule, and delivery.
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
              Performance partnership based on tracked conversions
              and commission.
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
              Business contact
            </h2>

            <p>
              The organization submitting this request.
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
                form.organizationName
              }
              readOnly
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
              Campaign request
            </h2>

            <p>
              Choose where the campaign may be delivered.
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
            placeholder="Professional Skills Campaign"
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
              Proposed business terms for Poster to review.
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
                  placeholder="12% per completed purchase"
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
              placeholder="Completed paid course enrollment"
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
              Choose a creative format independently from the commercial
              type and requested placements.
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
            styles.fieldGroup
          }
        >
          <label>
            Creative format *
          </label>

          <div
            className={
              styles.typeGrid
            }
          >
            <button
              type="button"
              className={
                creativeLayout ===
                "standard"
                  ? styles.typeCardActive
                  : styles.typeCard
              }
              onClick={() =>
                selectCreativeLayout(
                  "standard"
                )
              }
            >
              <strong>
                Standard ad
              </strong>

              <span>
                One 16:9 landscape image or short video in Poster&apos;s
                finalized standard advertising frame.
              </span>
            </button>

            <button
              type="button"
              className={
                creativeLayout ===
                "sliding"
                  ? styles.typeCardActive
                  : styles.typeCard
              }
              onClick={() =>
                selectCreativeLayout(
                  "sliding"
                )
              }
            >
              <strong>
                Sliding ad
              </strong>

              <span>
                Three square cards: Card 1 video, then two image cards.
              </span>
            </button>
          </div>
        </div>

        {creativeLayout ===
        "standard" ? (
          <div
            className={
              styles.uploadGrid
            }
          >
            <CreativeMediaUploader
              key={`standard-${formResetVersion}`}
              label="Main advertising media"
              description="16:9 image or video. Video: maximum 10 seconds, 20 MB, 30–45 FPS, maximum 1280 × 720."
              role="primary"
              frameProfile="standard_media"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
              allowVideo
              required
              maxVideoBytes={
                MAX_VIDEO_BYTES
              }
              maxVideoDurationSeconds={
                10
              }
              initialAsset={
                standardMedia
              }
              initialFileName={
                initialRequest
                  ?.creative
                  .imageName
              }
              altTextRequired
              onChange={
                updateStandardMedia
              }
            />

            <CreativeMediaUploader
              key={`logo-${formResetVersion}`}
              label="Organization logo"
              description="Optional logo. PNG, JPG or WebP."
              role="logo"
              accept="image/png,image/jpeg,image/webp"
              initialAsset={
                logoMedia
              }
              initialFileName={
                initialRequest
                  ?.creative
                  .logoName
              }
              onChange={
                updateLogoMedia
              }
            />
          </div>
        ) : (
          <>
            <div
              className={
                styles.adminNotice
              }
            >
              <div>
                <strong>
                  Sliding creative format
                </strong>

                <span>
                  Fixed structure
                </span>
              </div>

              <p>
                Poster&apos;s finalized sliding ad uses exactly three
                square cards: Card 1 is a short video, Card 2 is an image,
                and Card 3 is an image.
              </p>
            </div>

            {slidingSlots.map(
              (
                slot
              ) => {
                const isVideo =
                  slot ===
                  1;

                return (
                  <div
                    key={
                      slot
                    }
                    className={
                      styles.fieldGroup
                    }
                  >
                    <div
                      className={
                        styles.field
                      }
                    >
                      <label
                        htmlFor={`request-slide-${slot}-title`}
                      >
                        Card {slot} title *
                      </label>

                      <input
                        id={`request-slide-${slot}-title`}
                        value={
                          slideTitles[
                            slot
                          ]
                        }
                        onChange={(
                          event
                        ) =>
                          updateSlideTitle(
                            slot,
                            event.target.value
                          )
                        }
                        required
                        maxLength={
                          70
                        }
                        placeholder={
                          slot ===
                          1
                            ? "Research in Motion"
                            : slot ===
                                2
                              ? "Shared Research Workspace"
                              : "Team Collaboration"
                        }
                      />
                    </div>

                    <CreativeMediaUploader
                      key={`slide-${formResetVersion}-${slot}`}
                      label={
                        isVideo
                          ? "Card 1 video"
                          : `Card ${slot} image`
                      }
                      description={
                        isVideo
                          ? "Required square 1:1 video. Maximum 10 seconds, 20 MB, 30–45 FPS, maximum 720 × 720."
                          : "Required square 1:1 image for Poster’s finalized sliding-card frame."
                      }
                      role="slide"
                      frameProfile="sliding_card_media"
                      accept={
                        isVideo
                          ? "video/mp4,video/webm"
                          : "image/png,image/jpeg,image/webp"
                      }
                      allowVideo={
                        isVideo
                      }
                      required
                      maxVideoBytes={
                        MAX_VIDEO_BYTES
                      }
                      maxVideoDurationSeconds={
                        10
                      }
                      initialAsset={
                        slideMedia[
                          slot
                        ]
                      }
                      altTextRequired
                      onChange={(
                        selection
                      ) =>
                        updateSlideMedia(
                          slot,
                          selection
                        )
                      }
                    />
                  </div>
                );
              }
            )}

            <div
              className={
                styles.uploadGrid
              }
            >
              <CreativeMediaUploader
                key={`sliding-logo-${formResetVersion}`}
                label="Organization logo"
                description="Optional logo. PNG, JPG or WebP."
                role="logo"
                accept="image/png,image/jpeg,image/webp"
                initialAsset={
                  logoMedia
                }
                initialFileName={
                  initialRequest
                    ?.creative
                    .logoName
                }
                onChange={
                  updateLogoMedia
                }
              />
            </div>
          </>
        )}
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
            I confirm that I am authorized to submit this creative,
            branding, destination, and commercial information to Poster.
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
          {error}
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
            ? "Resubmit changes"
            : `Submit ${getRequestTypeLabel(
                form.type
              )} request`}
        </button>
      </div>

      <p
        className={
          styles.controlNote
        }
      >
        Poster reviews requests and controls campaign approval,
        scheduling, activation, pausing, and completion.
      </p>
    </form>
  );
}
