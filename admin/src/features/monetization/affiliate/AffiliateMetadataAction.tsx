"use client";

import {
  useState,
} from "react";

import type {
  AffiliateCommissionModel,
  AffiliateDetailResponse,
  AffiliateMetadataCreateRequest,
  AffiliatePayoutReadinessStatus,
  AffiliateTrackingStatus,
} from "./affiliate.types";

import {
  createAffiliateMetadata,
  updateAffiliateMetadata,
} from "./affiliate.service";

import {
  getAffiliateErrorMessage,
} from "./affiliate.errors";

import styles from "./AffiliateMetadataAction.module.css";

const COMMISSION_MODELS: {
  value:
    AffiliateCommissionModel;

  label:
    string;
}[] = [
  {
    value:
      "cpa",

    label:
      "CPA",
  },

  {
    value:
      "cpc",

    label:
      "CPC",
  },

  {
    value:
      "revenue_share",

    label:
      "Revenue share",
  },

  {
    value:
      "flat_fee",

    label:
      "Flat fee",
  },

  {
    value:
      "hybrid",

    label:
      "Hybrid",
  },
];

const TRACKING_STATUSES: {
  value:
    AffiliateTrackingStatus;

  label:
    string;
}[] = [
  {
    value:
      "not_configured",

    label:
      "Not configured",
  },

  {
    value:
      "pending_verification",

    label:
      "Pending verification",
  },

  {
    value:
      "active",

    label:
      "Active",
  },

  {
    value:
      "paused",

    label:
      "Paused",
  },

  {
    value:
      "blocked",

    label:
      "Blocked",
  },
];

const PAYOUT_STATUSES: {
  value:
    AffiliatePayoutReadinessStatus;

  label:
    string;
}[] = [
  {
    value:
      "not_ready",

    label:
      "Not ready",
  },

  {
    value:
      "ready",

    label:
      "Ready",
  },

  {
    value:
      "blocked",

    label:
      "Blocked",
  },
];

interface AffiliateMetadataFormState {
  partnerName:
    string;

  offerName:
    string;

  destinationUrl:
    string;

  commissionModel:
    AffiliateCommissionModel;

  commissionTermsJson:
    string;

  trackingStatus:
    AffiliateTrackingStatus;

  trackingUrl:
    string;

  payoutReadinessStatus:
    AffiliatePayoutReadinessStatus;
}

function createInitialForm(
  detail:
    AffiliateDetailResponse
): AffiliateMetadataFormState {
  const metadata =
    detail.metadata;

  return {
    partnerName:
      metadata?.partnerName ??
      "",

    offerName:
      metadata?.offerName ??
      detail.campaign.name,

    destinationUrl:
      metadata?.destinationUrl ??
      "",

    commissionModel:
      metadata?.commissionModel ??
      "cpa",

    commissionTermsJson:
      JSON.stringify(
        metadata?.commissionTerms ??
          {},
        null,
        2
      ),

    trackingStatus:
      metadata?.trackingStatus ??
      "not_configured",

    trackingUrl:
      metadata?.trackingUrl ??
      "",

    payoutReadinessStatus:
      metadata?.payoutReadinessStatus ??
      "not_ready",
  };
}

function parseCommissionTerms(
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
      "Commission terms must be a JSON object."
    );
  }

  return parsed as
    Record<
      string,
      unknown
    >;
}

function buildRequest(
  form:
    AffiliateMetadataFormState
): AffiliateMetadataCreateRequest {
  return {
    partnerName:
      form.partnerName.trim(),

    offerName:
      form.offerName.trim(),

    destinationUrl:
      form.destinationUrl.trim(),

    commissionModel:
      form.commissionModel,

    commissionTerms:
      parseCommissionTerms(
        form.commissionTermsJson
      ),

    trackingStatus:
      form.trackingStatus,

    trackingUrl:
      form.trackingUrl.trim().length > 0
        ? form.trackingUrl.trim()
        : null,

    payoutReadinessStatus:
      form.payoutReadinessStatus,
  };
}

interface AffiliateMetadataActionProps {
  detail:
    AffiliateDetailResponse;

  onSaved:
    (
      detail:
        AffiliateDetailResponse
    ) => void;
}

export default function AffiliateMetadataAction(
  props:
    AffiliateMetadataActionProps
) {
  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false
    );

  const [
    form,
    setForm,
  ] =
    useState<
      AffiliateMetadataFormState
    >(
      () =>
        createInitialForm(
          props.detail
        )
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const isEdit =
    Boolean(
      props.detail.metadata
    );

  const openEditor =
    () => {
      setForm(
        createInitialForm(
          props.detail
        )
      );

      setErrorMessage(
        null
      );

      setIsOpen(
        true
      );
    };

  const saveMetadata =
    async () => {
      setIsSaving(
        true
      );

      setErrorMessage(
        null
      );

      try {
        const request =
          buildRequest(
            form
          );

        const saved =
          props.detail.metadata
            ? await updateAffiliateMetadata(
                props.detail.campaign.id,
                {
                  ...request,

                  expectedRowVersion:
                    props.detail.metadata.rowVersion,
                }
              )
            : await createAffiliateMetadata(
                props.detail.campaign.id,
                request
              );

        props.onSaved(
          saved
        );

        setIsOpen(
          false
        );
      } catch (
        error
      ) {
        setErrorMessage(
          getAffiliateErrorMessage(
            error
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
        styles.actionStack
      }
    >
      <button
        type="button"
        className={
          styles.primaryButton
        }
        disabled={
          isSaving
        }
        onClick={
          openEditor
        }
      >
        {isEdit
          ? "Edit metadata"
          : "Create metadata"}
      </button>

      {errorMessage ? (
        <span
          className={
            styles.errorText
          }
          role="alert"
        >
          {
            errorMessage
          }
        </span>
      ) : null}

      {isOpen ? (
        <div
          className={
            styles.modalLayer
          }
        >
          <button
            type="button"
            className={
              styles.backdrop
            }
            aria-label="Close affiliate metadata editor"
            onClick={() =>
              setIsOpen(
                false
              )
            }
          />

          <section
            className={
              styles.modal
            }
            aria-label="Affiliate metadata editor"
          >
            <header
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  Affiliate metadata
                </span>

                <h3>
                  {isEdit
                    ? "Edit metadata"
                    : "Create metadata"}
                </h3>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Close"
                onClick={() =>
                  setIsOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </header>

            <div
              className={
                styles.form
              }
            >
              {errorMessage ? (
                <div
                  className={
                    styles.formError
                  }
                  role="alert"
                >
                  {
                    errorMessage
                  }
                </div>
              ) : null}

              <div
                className={
                  styles.fieldGrid
                }
              >
                <div
                  className={
                    styles.field
                  }
                >
                  <label htmlFor="affiliate-partner-name">
                    Partner name
                  </label>

                  <input
                    id="affiliate-partner-name"
                    value={
                      form.partnerName
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          partnerName:
                            event.target.value,
                        })
                      )
                    }
                  />
                </div>

                <div
                  className={
                    styles.field
                  }
                >
                  <label htmlFor="affiliate-offer-name">
                    Offer name
                  </label>

                  <input
                    id="affiliate-offer-name"
                    value={
                      form.offerName
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          offerName:
                            event.target.value,
                        })
                      )
                    }
                  />
                </div>

                <div
                  className={
                    styles.fullField
                  }
                >
                  <label htmlFor="affiliate-destination-url">
                    Destination URL
                  </label>

                  <input
                    id="affiliate-destination-url"
                    value={
                      form.destinationUrl
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          destinationUrl:
                            event.target.value,
                        })
                      )
                    }
                  />
                </div>

                <div
                  className={
                    styles.field
                  }
                >
                  <label htmlFor="affiliate-commission-model">
                    Commission model
                  </label>

                  <select
                    id="affiliate-commission-model"
                    value={
                      form.commissionModel
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          commissionModel:
                            event.target.value as
                              AffiliateCommissionModel,
                        })
                      )
                    }
                  >
                    {COMMISSION_MODELS.map(
                      option => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div
                  className={
                    styles.field
                  }
                >
                  <label htmlFor="affiliate-tracking-status">
                    Tracking status
                  </label>

                  <select
                    id="affiliate-tracking-status"
                    value={
                      form.trackingStatus
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          trackingStatus:
                            event.target.value as
                              AffiliateTrackingStatus,
                        })
                      )
                    }
                  >
                    {TRACKING_STATUSES.map(
                      option => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div
                  className={
                    styles.fullField
                  }
                >
                  <label htmlFor="affiliate-tracking-url">
                    Tracking URL
                  </label>

                  <input
                    id="affiliate-tracking-url"
                    value={
                      form.trackingUrl
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          trackingUrl:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <span
                    className={
                      styles.helpText
                    }
                  >
                    Leave empty when tracking is not configured.
                  </span>
                </div>

                <div
                  className={
                    styles.field
                  }
                >
                  <label htmlFor="affiliate-payout-readiness">
                    Payout readiness
                  </label>

                  <select
                    id="affiliate-payout-readiness"
                    value={
                      form.payoutReadinessStatus
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          payoutReadinessStatus:
                            event.target.value as
                              AffiliatePayoutReadinessStatus,
                        })
                      )
                    }
                  >
                    {PAYOUT_STATUSES.map(
                      option => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div
                  className={
                    styles.fullField
                  }
                >
                  <label htmlFor="affiliate-commission-terms">
                    Commission terms JSON
                  </label>

                  <textarea
                    id="affiliate-commission-terms"
                    value={
                      form.commissionTermsJson
                    }
                    onChange={event =>
                      setForm(
                        current => ({
                          ...current,

                          commissionTermsJson:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <span
                    className={
                      styles.helpText
                    }
                  >
                    Stored as authoritative JSONB metadata. Use an object like
                    {" "}
                    {"{\"currencyCode\":\"INR\",\"amountMinorUnits\":50000}"}.
                  </span>
                </div>
              </div>
            </div>

            <footer
              className={
                styles.formFooter
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                disabled={
                  isSaving
                }
                onClick={() =>
                  setIsOpen(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={
                  isSaving
                }
                onClick={() =>
                  void saveMetadata()
                }
              >
                {isSaving
                  ? "Saving..."
                  : isEdit
                    ? "Save metadata"
                    : "Create metadata"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}