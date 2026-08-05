"use client";

import Link from "next/link";

import {
  formatClientDate,
  getPlacementLabel,
  getRequestStatusLabel,
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

import type {
  CommercialRequest,
  CommercialRequestStatus,
} from "@/features/workspace/workspace.types";

import RequestWalletFundingSummary from "./RequestWalletFundingSummary";

import {
  canEditClientCommercialRequest,
  mapClientCommercialRequestToCommercialRequest,
} from "./client-commercial-request.mapper";

import {
  useClientCommercialRequest,
} from "./useClientCommercialRequest";

import type {
  ClientCommercialRequestApiRecord,
} from "./client-commercial-request.service";

import styles from "./RequestDetailsBackendEntry.module.css";

interface RequestDetailsBackendEntryProps {
  requestId:
    string;
}

interface DisplayMediaAsset {
  type?:
    string;

  fileName?:
    string;

  mimeType?:
    string;

  width?:
    number;

  height?:
    number;

  durationSeconds?:
    number;

  altText?:
    string;
}

function isRecord(
  value:
    unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

function getString(
  source:
    Record<string, unknown>,

  key:
    string
): string | undefined {
  const value =
    source[key];

  return typeof value === "string"
    ? value
    : undefined;
}

function getNumber(
  source:
    Record<string, unknown>,

  key:
    string
): number | undefined {
  const value =
    source[key];

  return typeof value === "number" &&
    Number.isFinite(
      value
    )
    ? value
    : undefined;
}

function mapMediaAsset(
  value:
    unknown
): DisplayMediaAsset | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    type:
      getString(
        value,
        "type"
      ),

    fileName:
      getString(
        value,
        "fileName"
      ),

    mimeType:
      getString(
        value,
        "mimeType"
      ),

    width:
      getNumber(
        value,
        "width"
      ),

    height:
      getNumber(
        value,
        "height"
      ),

    durationSeconds:
      getNumber(
        value,
        "durationSeconds"
      ),

    altText:
      getString(
        value,
        "altText"
      ),
  };
}

function getStatusClassName(
  status:
    CommercialRequestStatus
): string {
  switch (status) {
    case "approved":
      return `statusBadge ${styles.statusApproved}`;

    case "changes_requested":
      return `statusBadge ${styles.statusChanges}`;

    case "rejected":
      return `statusBadge ${styles.statusRejected}`;

    case "pending_review":
    default:
      return `statusBadge ${styles.statusPending}`;
  }
}

function formatOptionalMoney(
  value:
    number |
    undefined
): string {
  if (
    value === undefined ||
    !Number.isFinite(
      value
    )
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
        2,
    }
  ).format(
    value
  );
}

function getCommercialValue(
  request:
    CommercialRequest
): string {
  const contract =
    formatOptionalMoney(
      request.proposedContractValue
    );

  if (contract !== "Not provided") {
    return contract;
  }

  return formatOptionalMoney(
    request.proposedBudget
  );
}

function getApiRequestStatus(
  request:
    ClientCommercialRequestApiRecord
): CommercialRequestStatus {
  return request.status as CommercialRequestStatus;
}

function getRequestReference(
  request:
    ClientCommercialRequestApiRecord
): string {
  return (
    request.requestReference ??
    request.id
  );
}

function getLinkedCampaignId(
  request:
    ClientCommercialRequestApiRecord,

  mappedRequest:
    CommercialRequest
): string | null {
  return (
    request.linkedCampaignId ??
    mappedRequest.linkedCampaignId ??
    null
  );
}

function RequestSummaryGrid({
  request,
  apiRequest,
}: {
  request:
    CommercialRequest;

  apiRequest:
    ClientCommercialRequestApiRecord;
}) {
  const status =
    getApiRequestStatus(
      apiRequest
    );

  return (
    <section
      className={
        styles.summaryGrid
      }
      aria-label="Request summary"
    >
      <article
        className={
          styles.summaryCard
        }
      >
        <span>
          Type
        </span>

        <strong>
          {getRequestTypeLabel(
            request.type
          )}
        </strong>
      </article>

      <article
        className={
          styles.summaryCard
        }
      >
        <span>
          Status
        </span>

        <strong>
          {getRequestStatusLabel(
            status
          )}
        </strong>
      </article>

      <article
        className={
          styles.summaryCard
        }
      >
        <span>
          Submitted
        </span>

        <strong>
          {formatClientDate(
            apiRequest.submittedAt
          )}
        </strong>
      </article>

      <article
        className={
          styles.summaryCard
        }
      >
        <span>
          Linked campaign
        </span>

        <strong>
          {getLinkedCampaignId(
            apiRequest,
            request
          ) ??
            "Pending setup"}
        </strong>
      </article>
    </section>
  );
}

function CommercialDetails({
  request,
}: {
  request:
    CommercialRequest;
}) {
  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="commercial-details-title"
    >
      <div
        className={
          styles.panelHeader
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          Commercial details
        </p>

        <h2
          id="commercial-details-title"
        >
          Request terms
        </h2>
      </div>

      <div
        className={
          styles.detailGrid
        }
      >
        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Organization
          </span>

          <strong>
            {request.organizationName ||
              "Not provided"}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Contact
          </span>

          <strong>
            {request.contactName ||
              "Not provided"}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Business email
          </span>

          <strong>
            {request.businessEmail ||
              "Not provided"}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Website
          </span>

          <strong>
            {request.website ||
              "Not provided"}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Start date
          </span>

          <strong>
            {request.requestedStartDate ||
              "Not provided"}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            End date
          </span>

          <strong>
            {request.requestedEndDate ||
              "Not provided"}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Proposed budget
          </span>

          <strong>
            {formatOptionalMoney(
              request.proposedBudget
            )}
          </strong>
        </div>

        <div
          className={
            styles.detailRow
          }
        >
          <span>
            Contract value
          </span>

          <strong>
            {formatOptionalMoney(
              request.proposedContractValue
            )}
          </strong>
        </div>
      </div>

      <div
        className={
          styles.placementList
        }
      >
        {request.requestedPlacements.map(
          placement => (
            <span
              key={
                placement
              }
            >
              {getPlacementLabel(
                placement
              )}
            </span>
          )
        )}
      </div>

      {request.creative.destinationUrl ? (
        <a
          href={
            request.creative.destinationUrl
          }
          target="_blank"
          rel="noreferrer"
          className={
            styles.destination
          }
        >
          Open destination URL
        </a>
      ) : null}
    </section>
  );
}

function CreativeDetails({
  request,
}: {
  request:
    CommercialRequest;
}) {
  const primaryMedia =
    mapMediaAsset(
      request.creative.primaryMedia
    );

  const logoMedia =
    mapMediaAsset(
      request.creative.logoMedia
    );

  const slidingCards =
    Array.isArray(
      request.creative.slidingCards
    )
      ? request.creative.slidingCards
      : [];

  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="creative-details-title"
    >
      <div
        className={
          styles.panelHeader
        }
      >
        <p
          className={
            styles.eyebrow
          }
        >
          Creative
        </p>

        <h2
          id="creative-details-title"
        >
          Submitted creative
        </h2>
      </div>

      <div
        className={
          styles.copyBlock
        }
      >
        <span>
          Headline
        </span>

        <strong>
          {request.creative.headline ||
            "Not provided"}
        </strong>

        <p>
          {request.creative.body ||
            "No body copy provided."}
        </p>

        <small>
          CTA: {request.creative.callToAction ||
            "Not provided"}
        </small>
      </div>

      <div
        className={
          styles.mediaGrid
        }
      >
        <MediaCard
          title="Primary media"
          media={
            primaryMedia
          }
        />

        <MediaCard
          title="Logo media"
          media={
            logoMedia
          }
        />

        <article
          className={
            styles.mediaCard
          }
        >
          <span>
            Sliding cards
          </span>

          <strong>
            {slidingCards.length}
          </strong>

          <small>
            {slidingCards.length > 0
              ? "Structured sliding cards were submitted."
              : "No structured sliding-card media was submitted."}
          </small>
        </article>
      </div>
    </section>
  );
}

function MediaCard({
  title,
  media,
}: {
  title:
    string;

  media:
    DisplayMediaAsset |
    null;
}) {
  return (
    <article
      className={
        styles.mediaCard
      }
    >
      <span>
        {title}
      </span>

      <strong>
        {media?.fileName ??
          "Not attached"}
      </strong>

      <small>
        {media
          ? [
              media.mimeType,
              media.width &&
              media.height
                ? `${media.width}×${media.height}`
                : undefined,
              media.durationSeconds
                ? `${media.durationSeconds}s`
                : undefined,
            ]
              .filter(Boolean)
              .join(" · ")
          : "Backend storage URL may be pending for this request."}
      </small>
    </article>
  );
}

export default function RequestDetailsBackendEntry({
  requestId,
}: RequestDetailsBackendEntryProps) {
  const {
    request:
      apiRequest,
    detail,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
  } =
    useClientCommercialRequest(
      requestId
    );

  if (isLoading) {
    return (
      <div
        className="statePanel"
        role="status"
      >
        Loading request from Poster Backend.
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        className="statePanel"
        role="alert"
      >
        <strong>
          Request could not be loaded
        </strong>

        <p>
          {errorMessage}
        </p>

        <button
          type="button"
          className="secondaryButton"
          onClick={
            () => {
              void refresh();
            }
          }
          disabled={
            isRefreshing
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Retry"}
        </button>
      </div>
    );
  }

  if (!apiRequest) {
    return (
      <div
        className="statePanel"
        role="status"
      >
        <strong>
          Request not found
        </strong>

        <p>
          Poster Backend did not return this advertising request.
        </p>

        <Link
          href="/requests"
          className="secondaryButton"
        >
          Back to requests
        </Link>
      </div>
    );
  }

  const request =
    mapClientCommercialRequestToCommercialRequest(
      apiRequest
    );

  const status =
    getApiRequestStatus(
      apiRequest
    );

  const linkedCampaignId =
    getLinkedCampaignId(
      apiRequest,
      request
    );

  const canEdit =
    canEditClientCommercialRequest(
      apiRequest
    );

  return (
    <>
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
            {getRequestReference(
              apiRequest
            )}
          </div>

          <h1
            className={
              styles.title
            }
          >
            {request.campaignName}
          </h1>

          <p
            className={
              styles.description
            }
          >
            Backend-backed request detail. Poster Admin controls review,
            campaign setup, activation, pausing, and completion.
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <span
            className={
              getStatusClassName(
                status
              )
            }
          >
            {getRequestStatusLabel(
              status
            )}
          </span>

          {canEdit ? (
            <Link
              href={`/requests/new?edit=${apiRequest.id}`}
              className="primaryButton"
            >
              Update request
            </Link>
          ) : null}

          <Link
            href="/requests"
            className="secondaryButton"
          >
            Back to requests
          </Link>
        </div>
      </header>

      <RequestSummaryGrid
        request={
          request
        }
        apiRequest={
          apiRequest
        }
      />

      <RequestWalletFundingSummary
        linkedCampaignId={
          linkedCampaignId
        }
        campaignName={
          request.campaignName
        }
        requestStatus={
          getRequestStatusLabel(
            status
          )
        }
        commercialValue={
          getCommercialValue(
            request
          )
        }
      />

      <CommercialDetails
        request={
          request
        }
      />

      <CreativeDetails
        request={
          request
        }
      />

      <section
        className={
          styles.panel
        }
        aria-labelledby="history-title"
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <p
            className={
              styles.eyebrow
            }
          >
            History
          </p>

          <h2
            id="history-title"
          >
            Review history
          </h2>
        </div>

        <p
          className={
            styles.note
          }
        >
          {detail?.revisions?.length
            ? `${detail.revisions.length} Backend revision record(s) returned.`
            : "No revision records were returned by Poster Backend."}
        </p>
      </section>
    </>
  );
}