"use client";

import Image from "next/image";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import styles from "./AdvertiseRequestForm.module.css";

type RequestType =
  | "direct_sponsorship"
  | "affiliate";

type Placement =
  | "Home"
  | "Search"
  | "Trending";

type CtaLabel =
  | "Learn more"
  | "Explore"
  | "Get started"
  | "View course"
  | "Visit website"
  | "Apply now";

interface FormState {
  companyName: string;
  representativeName: string;
  businessEmail: string;
  website: string;

  requestType:
    | RequestType
    | "";

  campaignName: string;
  destinationUrl: string;

  campaignHeadline: string;
  promotionalText: string;
  supportingText: string;

  ctaLabel:
    | CtaLabel
    | "";

  imageAltText: string;

  affiliateTrackingUrl: string;
  termsUrl: string;

  description: string;
  targetAudience: string;

  placements: Placement[];

  preferredStartDate: string;
  preferredEndDate: string;

  commercialNotes: string;
  additionalInformation: string;

  authorizedRepresentative: boolean;
  truthfulInformation: boolean;
  ownsCreativeRights: boolean;
  authorizedClaimsAndLinks: boolean;
  understandsReview: boolean;
}

type ErrorKey =
  | keyof FormState
  | "primaryImage"
  | "brandLogo";

type FormErrors =
  Partial<
    Record<
      ErrorKey,
      string
    >
  >;

const INITIAL_FORM: FormState = {
  companyName: "",
  representativeName: "",
  businessEmail: "",
  website: "",

  requestType: "",

  campaignName: "",
  destinationUrl: "",

  campaignHeadline: "",
  promotionalText: "",
  supportingText: "",

  ctaLabel: "",

  imageAltText: "",

  affiliateTrackingUrl: "",
  termsUrl: "",

  description: "",
  targetAudience: "",

  placements: [],

  preferredStartDate: "",
  preferredEndDate: "",

  commercialNotes: "",
  additionalInformation: "",

  authorizedRepresentative: false,
  truthfulInformation: false,
  ownsCreativeRights: false,
  authorizedClaimsAndLinks: false,
  understandsReview: false,
};

const CTA_OPTIONS: CtaLabel[] = [
  "Learn more",
  "Explore",
  "Get started",
  "View course",
  "Visit website",
  "Apply now",
];

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_PRIMARY_IMAGE_BYTES =
  5 * 1024 * 1024;

const MAX_LOGO_BYTES =
  2 * 1024 * 1024;

function validEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function validUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(
        value.trim()
      );

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function createRequestId(): string {
  const value =
    Date.now()
      .toString()
      .slice(-8);

  return `ADV-${value}`;
}

function requestTypeLabel(
  type:
    | RequestType
    | ""
): string {
  if (
    type ===
    "direct_sponsorship"
  ) {
    return "Direct Sponsorship";
  }

  if (
    type ===
    "affiliate"
  ) {
    return "Affiliate Partnership";
  }

  return "Commercial request";
}

export default function AdvertiseRequestForm() {
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
    primaryImage,
    setPrimaryImage,
  ] =
    useState<File | null>(
      null
    );

  const [
    primaryPreview,
    setPrimaryPreview,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    brandLogo,
    setBrandLogo,
  ] =
    useState<File | null>(
      null
    );

  const [
    logoPreview,
    setLogoPreview,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    submittedId,
    setSubmittedId,
  ] =
    useState<
      string | null
    >(
      null
    );

  useEffect(
    () => {
      return () => {
        if (
          primaryPreview
        ) {
          URL.revokeObjectURL(
            primaryPreview
          );
        }

        if (
          logoPreview
        ) {
          URL.revokeObjectURL(
            logoPreview
          );
        }
      };
    },
    [
      primaryPreview,
      logoPreview,
    ]
  );

  const updateField = <
    K extends keyof FormState
  >(
    field: K,
    value: FormState[K]
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );

    setErrors(
      (
        current
      ) => ({
        ...current,
        [field]:
          undefined,
      })
    );
  };

  const togglePlacement = (
    placement: Placement
  ) => {
    const exists =
      form.placements.includes(
        placement
      );

    const placements =
      exists
        ? form.placements.filter(
            (
              item
            ) =>
              item !==
              placement
          )
        : [
            ...form.placements,
            placement,
          ];

    updateField(
      "placements",
      placements
    );
  };

  const handlePrimaryImage = (
    file:
      File | null
  ) => {
    if (
      !file
    ) {
      return;
    }

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      setErrors(
        (
          current
        ) => ({
          ...current,
          primaryImage:
            "Use a JPG, PNG, or WebP image.",
        })
      );

      return;
    }

    if (
      file.size >
      MAX_PRIMARY_IMAGE_BYTES
    ) {
      setErrors(
        (
          current
        ) => ({
          ...current,
          primaryImage:
            "Primary image must be 5 MB or smaller.",
        })
      );

      return;
    }

    if (
      primaryPreview
    ) {
      URL.revokeObjectURL(
        primaryPreview
      );
    }

    setPrimaryImage(
      file
    );

    setPrimaryPreview(
      URL.createObjectURL(
        file
      )
    );

    setErrors(
      (
        current
      ) => ({
        ...current,
        primaryImage:
          undefined,
      })
    );
  };

  const removePrimaryImage =
    () => {
      if (
        primaryPreview
      ) {
        URL.revokeObjectURL(
          primaryPreview
        );
      }

      setPrimaryImage(
        null
      );

      setPrimaryPreview(
        null
      );
  };

  const handleBrandLogo = (
    file:
      File | null
  ) => {
    if (
      !file
    ) {
      return;
    }

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      setErrors(
        (
          current
        ) => ({
          ...current,
          brandLogo:
            "Use a JPG, PNG, or WebP logo.",
        })
      );

      return;
    }

    if (
      file.size >
      MAX_LOGO_BYTES
    ) {
      setErrors(
        (
          current
        ) => ({
          ...current,
          brandLogo:
            "Logo must be 2 MB or smaller.",
        })
      );

      return;
    }

    if (
      logoPreview
    ) {
      URL.revokeObjectURL(
        logoPreview
      );
    }

    setBrandLogo(
      file
    );

    setLogoPreview(
      URL.createObjectURL(
        file
      )
    );

    setErrors(
      (
        current
      ) => ({
        ...current,
        brandLogo:
          undefined,
      })
    );
  };

  const removeBrandLogo =
    () => {
      if (
        logoPreview
      ) {
        URL.revokeObjectURL(
          logoPreview
        );
      }

      setBrandLogo(
        null
      );

      setLogoPreview(
        null
      );
  };

  const validate =
    (): boolean => {
      const nextErrors:
        FormErrors =
          {};

      if (
        !form.companyName.trim()
      ) {
        nextErrors.companyName =
          "Company or organization name is required.";
      }

      if (
        !form.representativeName.trim()
      ) {
        nextErrors.representativeName =
          "Representative name is required.";
      }

      if (
        !validEmail(
          form.businessEmail
        )
      ) {
        nextErrors.businessEmail =
          "Enter a valid business email address.";
      }

      if (
        !validUrl(
          form.website
        )
      ) {
        nextErrors.website =
          "Enter a valid company website URL.";
      }

      if (
        !form.requestType
      ) {
        nextErrors.requestType =
          "Choose a partnership type.";
      }

      if (
        !form.campaignName.trim()
      ) {
        nextErrors.campaignName =
          "Campaign or offer name is required.";
      }

      if (
        !validUrl(
          form.destinationUrl
        )
      ) {
        nextErrors.destinationUrl =
          "Enter a valid campaign destination URL.";
      }

      if (
        !form.campaignHeadline.trim()
      ) {
        nextErrors.campaignHeadline =
          "Campaign headline is required.";
      } else if (
        form.campaignHeadline
          .trim()
          .length >
        90
      ) {
        nextErrors.campaignHeadline =
          "Headline must be 90 characters or fewer.";
      }

      if (
        form.promotionalText
          .trim()
          .length <
        20
      ) {
        nextErrors.promotionalText =
          "Promotional text must contain at least 20 characters.";
      } else if (
        form.promotionalText
          .trim()
          .length >
        250
      ) {
        nextErrors.promotionalText =
          "Promotional text must be 250 characters or fewer.";
      }

      if (
        form.supportingText
          .trim()
          .length >
        300
      ) {
        nextErrors.supportingText =
          "Supporting text must be 300 characters or fewer.";
      }

      if (
        !form.ctaLabel
      ) {
        nextErrors.ctaLabel =
          "Choose a call-to-action.";
      }

      if (
        !primaryImage
      ) {
        nextErrors.primaryImage =
          "Add a primary campaign image.";
      }

      if (
        !form.imageAltText.trim()
      ) {
        nextErrors.imageAltText =
          "Describe the primary image for accessibility.";
      }

      if (
        form.requestType ===
          "affiliate" &&
        form.affiliateTrackingUrl.trim() &&
        !validUrl(
          form.affiliateTrackingUrl
        )
      ) {
        nextErrors.affiliateTrackingUrl =
          "Enter a valid affiliate or tracking URL.";
      }

      if (
        form.termsUrl.trim() &&
        !validUrl(
          form.termsUrl
        )
      ) {
        nextErrors.termsUrl =
          "Enter a valid terms or offer-information URL.";
      }

      if (
        form.description
          .trim()
          .length <
        20
      ) {
        nextErrors.description =
          "Describe the campaign or offer in at least 20 characters.";
      }

      if (
        form.targetAudience
          .trim()
          .length <
        10
      ) {
        nextErrors.targetAudience =
          "Describe the intended audience or relevant topics.";
      }

      if (
        form.placements.length ===
        0
      ) {
        nextErrors.placements =
          "Select at least one preferred placement.";
      }

      if (
        form.preferredStartDate &&
        form.preferredEndDate &&
        form.preferredEndDate <
          form.preferredStartDate
      ) {
        nextErrors.preferredEndDate =
          "End date must be after the start date.";
      }

      if (
        !form.authorizedRepresentative
      ) {
        nextErrors.authorizedRepresentative =
          "Confirm that you are authorized to submit this request.";
      }

      if (
        !form.truthfulInformation
      ) {
        nextErrors.truthfulInformation =
          "Confirm that the submitted information is accurate.";
      }

      if (
        !form.ownsCreativeRights
      ) {
        nextErrors.ownsCreativeRights =
          "Confirm that you own, license, or are authorized to provide the submitted campaign materials.";
      }

      if (
        !form.authorizedClaimsAndLinks
      ) {
        nextErrors.authorizedClaimsAndLinks =
          "Confirm that campaign claims and destination links are accurate and authorized.";
      }

      if (
        !form.understandsReview
      ) {
        nextErrors.understandsReview =
          "Acknowledge Poster’s manual approval process.";
      }

      setErrors(
        nextErrors
      );

      return (
        Object.keys(
          nextErrors
        ).length ===
        0
      );
    };

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !validate()
    ) {
      return;
    }

    /*
      FRONTEND-ONLY DEVELOPMENT STATE

      Later Backend flow:

      1. Upload primaryImage / brandLogo to secure asset storage.
      2. Receive AST-... asset IDs.
      3. Create ADV-... commercial request in PostgreSQL.
      4. Route request automatically:
         direct_sponsorship -> Sponsorship pending requests
         affiliate -> Affiliate pending partnerships
      5. Send acknowledgement email.
      6. Admin reviews.
      7. Approval creates CMP-... in Draft status.

      We intentionally do not fake persistence here.
    */

    setSubmittedId(
      createRequestId()
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  };

  const resetForm =
    () => {
      if (
        primaryPreview
      ) {
        URL.revokeObjectURL(
          primaryPreview
        );
      }

      if (
        logoPreview
      ) {
        URL.revokeObjectURL(
          logoPreview
        );
      }

      setForm(
        INITIAL_FORM
      );

      setErrors(
        {}
      );

      setPrimaryImage(
        null
      );

      setPrimaryPreview(
        null
      );

      setBrandLogo(
        null
      );

      setLogoPreview(
        null
      );

      setSubmittedId(
        null
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  if (
    submittedId
  ) {
    return (
      <main
        className={
          styles.publicPage
        }
      >
        <header
          className={
            styles.publicHeader
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
            >
              P
            </div>

            <div>
              <strong>
                Poster
              </strong>

              <span>
                Commercial partnerships
              </span>
            </div>
          </div>
        </header>

        <section
          className={
            styles.successWrap
          }
        >
          <div
            className={
              styles.successCard
            }
          >
            <div
              className={
                styles.successIcon
              }
            >
              ✓
            </div>

            <div
              className={
                styles.eyebrow
              }
            >
              Request prepared
            </div>

            <h1>
              Thank you for contacting Poster.
            </h1>

            <p>
              Your{" "}
              {requestTypeLabel(
                form.requestType
              ).toLowerCase()}{" "}
              request passed the frontend
              validation process with its
              campaign creative package.
            </p>

            <div
              className={
                styles.referenceBox
              }
            >
              <span>
                Request reference
              </span>

              <strong>
                {
                  submittedId
                }
              </strong>
            </div>

            <div
              className={
                styles.submissionSummary
              }
            >
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
                  Primary creative
                </span>

                <strong>
                  {
                    primaryImage?.name ??
                    "Not available"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Brand logo
                </span>

                <strong>
                  {
                    brandLogo?.name ??
                    "Not provided"
                  }
                </strong>
              </div>
            </div>

            <div
              className={
                styles.pendingNotice
              }
            >
              <strong>
                Development notice
              </strong>

              <p>
                Backend, secure asset
                storage, database
                persistence, automatic
                request routing, and email
                acknowledgement are not
                connected yet. No files or
                commercial request were
                actually uploaded from this
                frontend demonstration.
              </p>
            </div>

            <button
              type="button"
              className={
                styles.primaryButton
              }
              onClick={
                resetForm
              }
            >
              Submit another request
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className={
        styles.publicPage
      }
    >
      <header
        className={
          styles.publicHeader
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
          >
            P
          </div>

          <div>
            <strong>
              Poster
            </strong>

            <span>
              Commercial partnerships
            </span>
          </div>
        </div>
      </header>

      <div
        className={
          styles.content
        }
      >
        <section
          className={
            styles.intro
          }
        >
          <div
            className={
              styles.eyebrow
            }
          >
            Work with Poster
          </div>

          <h1>
            Advertise or partner with Poster
          </h1>

          <p>
            Submit the business details,
            campaign creative materials,
            destination links, placement
            preferences, and commercial
            information Poster needs to
            review your proposal.
          </p>

          <div
            className={
              styles.policyNote
            }
          >
            <strong>
              Manual approval only
            </strong>

            <p>
              Submission does not create,
              activate, or publish a
              campaign. Every sponsorship
              and affiliate partnership is
              reviewed by Poster before a
              permanent CMP-... campaign
              can be created.
            </p>
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
          {/* 1 — ORGANIZATION */}

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
              <span>1</span>

              <div>
                <h2>
                  Organization
                </h2>

                <p>
                  Tell us who is submitting
                  this request.
                </p>
              </div>
            </div>

            <div
              className={
                styles.gridTwo
              }
            >
              <label
                className={
                  styles.field
                }
              >
                <span>
                  Company or organization *
                </span>

                <input
                  value={
                    form.companyName
                  }
                  placeholder="Example Company"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "companyName",
                      event.target.value
                    )
                  }
                />

                {errors.companyName ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.companyName
                    }
                  </small>
                ) : null}
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Representative name *
                </span>

                <input
                  value={
                    form.representativeName
                  }
                  placeholder="Full name"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "representativeName",
                      event.target.value
                    )
                  }
                />

                {errors.representativeName ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.representativeName
                    }
                  </small>
                ) : null}
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Business email *
                </span>

                <input
                  type="email"
                  value={
                    form.businessEmail
                  }
                  placeholder="name@company.com"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "businessEmail",
                      event.target.value
                    )
                  }
                />

                {errors.businessEmail ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.businessEmail
                    }
                  </small>
                ) : null}
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Company website *
                </span>

                <input
                  type="url"
                  value={
                    form.website
                  }
                  placeholder="https://company.com"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "website",
                      event.target.value
                    )
                  }
                />

                {errors.website ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.website
                    }
                  </small>
                ) : null}
              </label>
            </div>
          </section>

          {/* 2 — PARTNERSHIP TYPE */}

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
              <span>2</span>

              <div>
                <h2>
                  Partnership type
                </h2>

                <p>
                  Choose how you would like
                  to work with Poster.
                </p>
              </div>
            </div>

            <fieldset
              className={
                styles.choiceGrid
              }
            >
              <label
                className={`${styles.choiceCard} ${
                  form.requestType ===
                  "direct_sponsorship"
                    ? styles.choiceActive
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="requestType"
                  checked={
                    form.requestType ===
                    "direct_sponsorship"
                  }
                  onChange={() =>
                    updateField(
                      "requestType",
                      "direct_sponsorship"
                    )
                  }
                />

                <div>
                  <strong>
                    Direct Sponsorship
                  </strong>

                  <p>
                    A paid campaign reviewed
                    and approved directly by
                    Poster.
                  </p>

                  <small>
                    Disclosure: Sponsored by
                    {" {Advertiser}"}
                  </small>
                </div>
              </label>

              <label
                className={`${styles.choiceCard} ${
                  form.requestType ===
                  "affiliate"
                    ? styles.choiceActive
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="requestType"
                  checked={
                    form.requestType ===
                    "affiliate"
                  }
                  onChange={() =>
                    updateField(
                      "requestType",
                      "affiliate"
                    )
                  }
                />

                <div>
                  <strong>
                    Affiliate Partnership
                  </strong>

                  <p>
                    Propose an offer where
                    Poster may receive
                    commission from measurable
                    conversions.
                  </p>

                  <small>
                    Clearly disclosed as an
                    affiliate placement
                  </small>
                </div>
              </label>
            </fieldset>

            {errors.requestType ? (
              <small
                className={
                  styles.error
                }
              >
                {
                  errors.requestType
                }
              </small>
            ) : null}

            <div
              className={
                styles.internalNote
              }
            >
              <strong>
                Poster Promotion is internal only.
              </strong>

              <span>
                Clients cannot request a
                Poster Promotion campaign.
                Programmatic advertising
                remains disabled.
              </span>
            </div>
          </section>

          {/* 3 — CAMPAIGN */}

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
              <span>3</span>

              <div>
                <h2>
                  Campaign or offer
                </h2>

                <p>
                  Explain exactly what you
                  want Poster users to
                  discover.
                </p>
              </div>
            </div>

            <div
              className={
                styles.gridTwo
              }
            >
              <label
                className={
                  styles.field
                }
              >
                <span>
                  Campaign / offer name *
                </span>

                <input
                  value={
                    form.campaignName
                  }
                  placeholder="Professional Skills Campaign"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "campaignName",
                      event.target.value
                    )
                  }
                />

                {errors.campaignName ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.campaignName
                    }
                  </small>
                ) : null}
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Main destination URL *
                </span>

                <input
                  type="url"
                  value={
                    form.destinationUrl
                  }
                  placeholder="https://company.com/campaign"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "destinationUrl",
                      event.target.value
                    )
                  }
                />

                {errors.destinationUrl ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.destinationUrl
                    }
                  </small>
                ) : null}
              </label>
            </div>

            <label
              className={
                styles.field
              }
            >
              <span>
                What are you promoting? *
              </span>

              <textarea
                rows={5}
                value={
                  form.description
                }
                placeholder="Describe the product, service, learning resource, event, offer, or campaign and why it is relevant to Poster users."
                onChange={(
                  event
                ) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
              />

              {errors.description ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.description
                  }
                </small>
              ) : null}
            </label>
          </section>

          {/* 4 — CREATIVE PACKAGE */}

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
              <span>4</span>

              <div>
                <h2>
                  Creative package
                </h2>

                <p>
                  Supply the text and visual
                  materials Poster would use
                  if the campaign is approved.
                </p>
              </div>
            </div>

            <label
              className={
                styles.field
              }
            >
              <span>
                Campaign headline *
              </span>

              <input
                maxLength={90}
                value={
                  form.campaignHeadline
                }
                placeholder="Build your cloud skills"
                onChange={(
                  event
                ) =>
                  updateField(
                    "campaignHeadline",
                    event.target.value
                  )
                }
              />

              <div
                className={
                  styles.fieldMeta
                }
              >
                {errors.campaignHeadline ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.campaignHeadline
                    }
                  </small>
                ) : (
                  <small>
                    Main campaign title shown
                    to users.
                  </small>
                )}

                <small>
                  {
                    form.campaignHeadline.length
                  }
                  /90
                </small>
              </div>
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                Short promotional text *
              </span>

              <textarea
                rows={4}
                maxLength={250}
                value={
                  form.promotionalText
                }
                placeholder="Write the short promotional copy that should appear with the campaign."
                onChange={(
                  event
                ) =>
                  updateField(
                    "promotionalText",
                    event.target.value
                  )
                }
              />

              <div
                className={
                  styles.fieldMeta
                }
              >
                {errors.promotionalText ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.promotionalText
                    }
                  </small>
                ) : (
                  <small>
                    Client-authorized promotional
                    copy.
                  </small>
                )}

                <small>
                  {
                    form.promotionalText.length
                  }
                  /250
                </small>
              </div>
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                Supporting text
                (optional)
              </span>

              <textarea
                rows={3}
                maxLength={300}
                value={
                  form.supportingText
                }
                placeholder="Optional supporting information for the campaign."
                onChange={(
                  event
                ) =>
                  updateField(
                    "supportingText",
                    event.target.value
                  )
                }
              />

              <div
                className={
                  styles.fieldMeta
                }
              >
                {errors.supportingText ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.supportingText
                    }
                  </small>
                ) : (
                  <small>
                    Additional context when
                    a placement supports it.
                  </small>
                )}

                <small>
                  {
                    form.supportingText.length
                  }
                  /300
                </small>
              </div>
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                Call-to-action *
              </span>

              <select
                value={
                  form.ctaLabel
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "ctaLabel",
                    event.target.value as
                      | CtaLabel
                      | ""
                  )
                }
              >
                <option value="">
                  Select CTA
                </option>

                {CTA_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option
                      }
                      value={
                        option
                      }
                    >
                      {
                        option
                      }
                    </option>
                  )
                )}
              </select>

              {errors.ctaLabel ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.ctaLabel
                  }
                </small>
              ) : null}
            </label>

            <div
              className={
                styles.uploadGrid
              }
            >
              <div
                className={
                  styles.uploadField
                }
              >
                <div
                  className={
                    styles.uploadHeading
                  }
                >
                  <strong>
                    Primary campaign image *
                  </strong>

                  <span>
                    JPG, PNG, or WebP · max 5 MB
                  </span>
                </div>

                {primaryPreview ? (
                  <div
                    className={
                      styles.imagePreview
                    }
                  >
                    <Image
                      src={
                        primaryPreview
                      }
                      alt={
                        form.imageAltText ||
                        "Selected campaign creative preview"
                      }
                      width={720}
                      height={405}
                      unoptimized
                    />

                    <div
                      className={
                        styles.assetFooter
                      }
                    >
                      <span>
                        {
                          primaryImage?.name
                        }
                      </span>

                      <button
                        type="button"
                        onClick={
                          removePrimaryImage
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={
                      styles.uploadBox
                    }
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(
                        event
                      ) =>
                        handlePrimaryImage(
                          event.target.files?.[0] ??
                            null
                        )
                      }
                    />

                    <strong>
                      Choose primary image
                    </strong>

                    <span>
                      This file is previewed
                      locally only until Backend
                      storage is connected.
                    </span>
                  </label>
                )}

                {errors.primaryImage ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.primaryImage
                    }
                  </small>
                ) : null}
              </div>

              <div
                className={
                  styles.uploadField
                }
              >
                <div
                  className={
                    styles.uploadHeading
                  }
                >
                  <strong>
                    Brand logo
                    (optional)
                  </strong>

                  <span>
                    JPG, PNG, or WebP · max 2 MB
                  </span>
                </div>

                {logoPreview ? (
                  <div
                    className={
                      styles.logoPreview
                    }
                  >
                    <Image
                      src={
                        logoPreview
                      }
                      alt="Selected brand logo preview"
                      width={240}
                      height={240}
                      unoptimized
                    />

                    <div
                      className={
                        styles.assetFooter
                      }
                    >
                      <span>
                        {
                          brandLogo?.name
                        }
                      </span>

                      <button
                        type="button"
                        onClick={
                          removeBrandLogo
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={
                      styles.uploadBox
                    }
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(
                        event
                      ) =>
                        handleBrandLogo(
                          event.target.files?.[0] ??
                            null
                        )
                      }
                    />

                    <strong>
                      Choose brand logo
                    </strong>

                    <span>
                      Optional brand identity
                      asset.
                    </span>
                  </label>
                )}

                {errors.brandLogo ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.brandLogo
                    }
                  </small>
                ) : null}
              </div>
            </div>

            <label
              className={
                styles.field
              }
            >
              <span>
                Primary image alt text *
              </span>

              <input
                value={
                  form.imageAltText
                }
                placeholder="Describe what the campaign image shows"
                onChange={(
                  event
                ) =>
                  updateField(
                    "imageAltText",
                    event.target.value
                  )
                }
              />

              {errors.imageAltText ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.imageAltText
                  }
                </small>
              ) : null}
            </label>
          </section>

          {/* 5 — LINKS */}

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
              <span>5</span>

              <div>
                <h2>
                  Links & destination
                </h2>

                <p>
                  Poster reviews destination
                  domains and redirects before
                  campaign activation.
                </p>
              </div>
            </div>

            <div
              className={
                styles.gridTwo
              }
            >
              <label
                className={
                  styles.field
                }
              >
                <span>
                  Main destination URL *
                </span>

                <input
                  type="url"
                  value={
                    form.destinationUrl
                  }
                  placeholder="https://company.com/campaign"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "destinationUrl",
                      event.target.value
                    )
                  }
                />

                {errors.destinationUrl ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.destinationUrl
                    }
                  </small>
                ) : null}
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Terms / offer information URL
                  (optional)
                </span>

                <input
                  type="url"
                  value={
                    form.termsUrl
                  }
                  placeholder="https://company.com/terms"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "termsUrl",
                      event.target.value
                    )
                  }
                />

                {errors.termsUrl ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.termsUrl
                    }
                  </small>
                ) : null}
              </label>
            </div>

            {form.requestType ===
            "affiliate" ? (
              <label
                className={
                  styles.field
                }
              >
                <span>
                  Affiliate / tracking URL
                  (optional during initial request)
                </span>

                <input
                  type="url"
                  value={
                    form.affiliateTrackingUrl
                  }
                  placeholder="https://partner.com/offer?affiliate=poster"
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "affiliateTrackingUrl",
                      event.target.value
                    )
                  }
                />

                {errors.affiliateTrackingUrl ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.affiliateTrackingUrl
                    }
                  </small>
                ) : (
                  <small>
                    Poster will verify the
                    final tracking destination
                    before activation.
                  </small>
                )}
              </label>
            ) : null}
          </section>

          {/* 6 — AUDIENCE / PLACEMENT */}

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
              <span>6</span>

              <div>
                <h2>
                  Audience & placement
                </h2>

                <p>
                  Tell Poster who the
                  campaign is relevant to and
                  where you prefer it to
                  appear.
                </p>
              </div>
            </div>

            <label
              className={
                styles.field
              }
            >
              <span>
                Target audience / relevant topics *
              </span>

              <textarea
                rows={4}
                value={
                  form.targetAudience
                }
                placeholder="Example: software developers, students, AI, cloud computing, professional certifications..."
                onChange={(
                  event
                ) =>
                  updateField(
                    "targetAudience",
                    event.target.value
                  )
                }
              />

              {errors.targetAudience ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.targetAudience
                  }
                </small>
              ) : null}
            </label>

            <fieldset
              className={
                styles.placementGroup
              }
            >
              <legend>
                Preferred placement *
              </legend>

              <div
                className={
                  styles.placementGrid
                }
              >
                {(
                  [
                    "Home",
                    "Search",
                    "Trending",
                  ] as Placement[]
                ).map(
                  (
                    placement
                  ) => (
                    <label
                      key={
                        placement
                      }
                      className={`${styles.placementOption} ${
                        form.placements.includes(
                          placement
                        )
                          ? styles.placementActive
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          form.placements.includes(
                            placement
                          )
                        }
                        onChange={() =>
                          togglePlacement(
                            placement
                          )
                        }
                      />

                      <span>
                        {
                          placement
                        }
                      </span>
                    </label>
                  )
                )}
              </div>

              {errors.placements ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.placements
                  }
                </small>
              ) : null}
            </fieldset>
          </section>

          {/* 7 — SCHEDULE */}

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
              <span>7</span>

              <div>
                <h2>
                  Preferred schedule
                </h2>

                <p>
                  Dates are requests only and
                  remain subject to Poster
                  approval and availability.
                </p>
              </div>
            </div>

            <div
              className={
                styles.gridTwo
              }
            >
              <label
                className={
                  styles.field
                }
              >
                <span>
                  Preferred start date
                </span>

                <input
                  type="date"
                  value={
                    form.preferredStartDate
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "preferredStartDate",
                      event.target.value
                    )
                  }
                />
              </label>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Preferred end date
                </span>

                <input
                  type="date"
                  value={
                    form.preferredEndDate
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "preferredEndDate",
                      event.target.value
                    )
                  }
                />

                {errors.preferredEndDate ? (
                  <small
                    className={
                      styles.error
                    }
                  >
                    {
                      errors.preferredEndDate
                    }
                  </small>
                ) : null}
              </label>
            </div>
          </section>

          {/* 8 — COMMERCIAL DETAILS */}

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
              <span>8</span>

              <div>
                <h2>
                  Commercial details
                </h2>

                <p>
                  These details help Poster
                  evaluate the request and do
                  not create a contract.
                </p>
              </div>
            </div>

            <label
              className={
                styles.field
              }
            >
              <span>
                {form.requestType ===
                "affiliate"
                  ? "Commission / commercial model"
                  : "Proposed budget / contract range"}
                {" "}
                (optional)
              </span>

              <textarea
                rows={3}
                value={
                  form.commercialNotes
                }
                placeholder={
                  form.requestType ===
                  "affiliate"
                    ? "Commission percentage, fixed bounty, attribution window, conversion definition..."
                    : "Budget, delivery target, expected impressions, contract range..."
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "commercialNotes",
                    event.target.value
                  )
                }
              />
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                Additional information
                (optional)
              </span>

              <textarea
                rows={4}
                value={
                  form.additionalInformation
                }
                placeholder="Add campaign context, compliance information, partnership details, or anything else Poster should review."
                onChange={(
                  event
                ) =>
                  updateField(
                    "additionalInformation",
                    event.target.value
                  )
                }
              />
            </label>
          </section>

          {/* 9 — RIGHTS / AUTHORIZATION */}

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
              <span>9</span>

              <div>
                <h2>
                  Rights & authorization
                </h2>

                <p>
                  Confirm authority over the
                  organization, creative
                  assets, claims, and links
                  supplied to Poster.
                </p>
              </div>
            </div>

            <div
              className={
                styles.confirmations
              }
            >
              <label
                className={
                  styles.confirmation
                }
              >
                <input
                  type="checkbox"
                  checked={
                    form.authorizedRepresentative
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "authorizedRepresentative",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I am authorized to submit
                  this commercial request on
                  behalf of the organization.
                </span>
              </label>

              {errors.authorizedRepresentative ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.authorizedRepresentative
                  }
                </small>
              ) : null}

              <label
                className={
                  styles.confirmation
                }
              >
                <input
                  type="checkbox"
                  checked={
                    form.ownsCreativeRights
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "ownsCreativeRights",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I confirm that I own,
                  license, or am otherwise
                  authorized to provide all
                  submitted text, images,
                  logos, trademarks, and
                  campaign materials for the
                  proposed use.
                </span>
              </label>

              {errors.ownsCreativeRights ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.ownsCreativeRights
                  }
                </small>
              ) : null}

              <label
                className={
                  styles.confirmation
                }
              >
                <input
                  type="checkbox"
                  checked={
                    form.authorizedClaimsAndLinks
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "authorizedClaimsAndLinks",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I confirm that campaign
                  claims, offers, destination
                  URLs, tracking links, and
                  promotional representations
                  are accurate and authorized.
                </span>
              </label>

              {errors.authorizedClaimsAndLinks ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.authorizedClaimsAndLinks
                  }
                </small>
              ) : null}

              <label
                className={
                  styles.confirmation
                }
              >
                <input
                  type="checkbox"
                  checked={
                    form.truthfulInformation
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "truthfulInformation",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I confirm that the
                  information submitted in
                  this request is accurate to
                  the best of my knowledge.
                </span>
              </label>

              {errors.truthfulInformation ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.truthfulInformation
                  }
                </small>
              ) : null}

              <label
                className={
                  styles.confirmation
                }
              >
                <input
                  type="checkbox"
                  checked={
                    form.understandsReview
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "understandsReview",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I understand that Poster
                  manually reviews every
                  request and may approve,
                  reject, request changes, or
                  decline any campaign.
                </span>
              </label>

              {errors.understandsReview ? (
                <small
                  className={
                    styles.error
                  }
                >
                  {
                    errors.understandsReview
                  }
                </small>
              ) : null}
            </div>

            <div
              className={
                styles.submitArea
              }
            >
              <div>
                <strong>
                  Submission creates a request,
                  not a campaign.
                </strong>

                <p>
                  After future Backend
                  integration, approved
                  requests will become
                  CMP-... Draft campaigns
                  before scheduling or
                  activation.
                </p>
              </div>

              <button
                type="submit"
                className={
                  styles.primaryButton
                }
              >
                Submit request
              </button>
            </div>
          </section>

          <section
            className={
              styles.developmentNotice
            }
          >
            <strong>
              Current development state
            </strong>

            <p>
              Image preview and validation
              work locally. Real file upload,
              secure object storage,
              ADV-... persistence, automatic
              routing to Sponsorship or
              Affiliate review queues, email
              acknowledgement, and CMP-...
              creation will be connected
              during Backend development.
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}