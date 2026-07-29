"use client";

import type {
  CommercialRequestDetail,
} from "./commercial-request.types";

import styles from "./CommercialRequests.module.css";

interface CommercialRequestDrawerProps {
  detail:
    CommercialRequestDetail;

  busy:
    boolean;

  note:
    string;

  campaignName:
    string;

  onNoteChange:
    (
      value:
        string
    ) => void;

  onCampaignNameChange:
    (
      value:
        string
    ) => void;

  onClose:
    () => void;

  onRequestChanges:
    () => void;

  onReject:
    () => void;

  onApprove:
    () => void;
}

function formatDate(
  value:
    string
): string {
  const date =
    new Date(
      value.includes(
        "T"
      )
        ? value
        : `${value}T00:00:00Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",

      timeZone:
        "UTC",
    }
  ).format(
    date
  );
}

function formatMoney(
  value:
    | number
    | undefined
): string {
  if (
    value ===
    undefined
  ) {
    return "Not provided";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0,
    }
  ).format(
    value
  );
}

export default function CommercialRequestDrawer(
  props:
    CommercialRequestDrawerProps
) {
  const request =
    props.detail.request;

  const canReview =
    request.status ===
    "pending_review";

  return (
    <div
      className={
        styles.drawerLayer
      }
    >
      <button
        type="button"
        className={
          styles.backdrop
        }
        aria-label="Close advertising request"
        onClick={
          props.onClose
        }
      />

      <aside
        className={
          styles.drawer
        }
        aria-label="Advertising request review"
      >
        <header
          className={
            styles.drawerHeader
          }
        >
          <div>
            <span>
              {
                request.id
              }
            </span>

            <h3>
              {
                request.campaignName
              }
            </h3>

            <p>
              {
                request.organization
              }
            </p>
          </div>

          <button
            type="button"
            className={
              styles.closeButton
            }
            aria-label="Close"
            onClick={
              props.onClose
            }
          >
            ×
          </button>
        </header>

        <div
          className={
            styles.drawerBody
          }
        >
          <section
            className={
              styles.section
            }
          >
            <h4>
              Request overview
            </h4>

            <dl
              className={
                styles.detailGrid
              }
            >
              <div>
                <dt>
                  Type
                </dt>

                <dd>
                  {request.type ===
                  "direct_sponsorship"
                    ? "Direct sponsorship"
                    : "Affiliate"}
                </dd>
              </div>

              <div>
                <dt>
                  Status
                </dt>

                <dd>
                  {request.status.replaceAll(
                    "_",
                    " "
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Submitted
                </dt>

                <dd>
                  {formatDate(
                    request.submittedAt
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Schedule
                </dt>

                <dd>
                  {formatDate(
                    request.requestedStartDate
                  )}

                  {" → "}

                  {formatDate(
                    request.requestedEndDate
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Placements
                </dt>

                <dd>
                  {request.requestedPlacements.join(
                    ", "
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Commercial value
                </dt>

                <dd>
                  {formatMoney(
                    request.proposedContractValue ??
                    request.proposedBudget
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section
            className={
              styles.section
            }
          >
            <h4>
              Organization and contact
            </h4>

            <dl
              className={
                styles.detailGrid
              }
            >
              <div>
                <dt>
                  Contact
                </dt>

                <dd>
                  {
                    request.contactName
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Business email
                </dt>

                <dd>
                  {
                    request.businessEmail
                  }
                </dd>
              </div>

              <div
                className={
                  styles.fullWidth
                }
              >
                <dt>
                  Website
                </dt>

                <dd>
                  {
                    request.website
                  }
                </dd>
              </div>
            </dl>
          </section>

          <section
            className={
              styles.section
            }
          >
            <h4>
              Creative and destination
            </h4>

            <div
              className={
                styles.creativeCard
              }
            >
              <strong>
                {
                  request.creative.headline
                }
              </strong>

              <p>
                {
                  request.creative.body
                }
              </p>

              <span>
                {
                  request.creative.callToAction
                }
              </span>

              <small>
                {
                  request.creative.destinationUrl
                }
              </small>
            </div>

            <p
              className={
                request.rightsConfirmed
                  ? styles.integrityPass
                  : styles.integrityWarning
              }
            >
              {request.rightsConfirmed
                ? "Creative rights confirmed by the Client."
                : "Creative-rights confirmation is missing."}
            </p>
          </section>

          {request.type ===
          "affiliate" ? (
            <section
              className={
                styles.section
              }
            >
              <h4>
                Affiliate terms
              </h4>

              <dl
                className={
                  styles.detailGrid
                }
              >
                <div>
                  <dt>
                    Commission
                  </dt>

                  <dd>
                    {
                      request.commissionModel ??
                      "Not provided"
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Conversion
                  </dt>

                  <dd>
                    {
                      request.conversionDefinition ??
                      "Not provided"
                    }
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section
            className={
              styles.section
            }
          >
            <h4>
              Revision history
            </h4>

            <div
              className={
                styles.timeline
              }
            >
              {props.detail.revisions.map(
                (
                  revision
                ) => (
                  <article
                    key={
                      revision.id
                    }
                  >
                    <strong>
                      Revision {
                        revision.revisionNumber
                      }
                    </strong>

                    <span>
                      {
                        revision.submittedBy
                      }

                      {" · "}

                      {formatDate(
                        revision.submittedAt
                      )}
                    </span>

                    <p>
                      {
                        revision.summary
                      }
                    </p>
                  </article>
                )
              )}
            </div>
          </section>

          {canReview ? (
            <section
              className={
                styles.section
              }
            >
              <h4>
                Admin decision
              </h4>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Campaign name after approval
                </span>

                <input
                  value={
                    props.campaignName
                  }
                  onChange={(
                    event
                  ) =>
                    props.onCampaignNameChange(
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
                  Review note
                </span>

                <textarea
                  value={
                    props.note
                  }
                  rows={
                    4
                  }
                  placeholder="Required for changes or rejection."
                  onChange={(
                    event
                  ) =>
                    props.onNoteChange(
                      event.target.value
                    )
                  }
                />
              </label>
            </section>
          ) : request.reviewNote ? (
            <section
              className={
                styles.section
              }
            >
              <h4>
                Latest review note
              </h4>

              <p
                className={
                  styles.reviewNote
                }
              >
                {
                  request.reviewNote
                }
              </p>
            </section>
          ) : null}
        </div>

        <footer
          className={
            styles.drawerFooter
          }
        >
          {canReview ? (
            <>
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                disabled={
                  props.busy ||
                  props.note
                    .trim()
                    .length ===
                    0
                }
                onClick={
                  props.onRequestChanges
                }
              >
                Request changes
              </button>

              <button
                type="button"
                className={
                  styles.dangerButton
                }
                disabled={
                  props.busy ||
                  props.note
                    .trim()
                    .length ===
                    0
                }
                onClick={
                  props.onReject
                }
              >
                Reject
              </button>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={
                  props.busy ||
                  props.campaignName
                    .trim()
                    .length ===
                    0 ||
                  !request.rightsConfirmed
                }
                onClick={
                  props.onApprove
                }
              >
                Approve and create draft
              </button>
            </>
          ) : (
            <span
              className={
                styles.closedMessage
              }
            >
              {request.status ===
              "changes_requested"
                ? "Waiting for the Client to revise and resubmit this request. Admin actions will return when its status becomes Pending review."
                : request.status ===
                  "approved"
                ? "This request was approved and its draft campaign was created."
                : "This request was rejected and remains available as a historical record."}
            </span>
          )}
        </footer>
      </aside>
    </div>
  );
}

