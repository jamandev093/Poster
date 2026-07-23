import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  formatClientCurrency,
  formatClientDate,
  getPlacementLabel,
  getRequestStatusLabel,
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

import {
  clientCanEditRequest,
  getCampaignForRequest,
  getRequestById,
} from "@/features/workspace/workspace.selectors";

import type {
  CommercialCreative,
  CommercialRequestStatus,
  CreativeMediaAsset,
  SlidingCreativeCard,
} from "@/features/workspace/workspace.types";

import styles from "./page.module.css";

interface RequestDetailsPageProps {
  params: Promise<{
    requestId: string;
  }>;
}

function getStatusClass(
  status: CommercialRequestStatus
): string {
  switch (status) {
    case "pending_review":
      return "statusBadge statusScheduled";

    case "changes_requested":
      return "statusBadge statusAttention";

    case "approved":
      return "statusBadge statusActive";

    case "rejected":
      return `statusBadge ${styles.statusRejected}`;
  }
}

function getStatusMessage(
  status: CommercialRequestStatus
): string {
  switch (status) {
    case "pending_review":
      return "Poster is reviewing this request. No action is required from you right now.";

    case "changes_requested":
      return "Poster needs corrections before this request can continue.";

    case "approved":
      return "This request was approved. Campaign setup and operational controls remain with Poster Admin.";

    case "rejected":
      return "This request will not continue to campaign setup.";
  }
}

function formatBytes(
  value?: number
): string {
  if (
    value === undefined
  ) {
    return "Not available";
  }

  if (
    value < 1024
  ) {
    return `${value} B`;
  }

  if (
    value <
    1024 * 1024
  ) {
    return `${(
      value /
      1024
    ).toFixed(1)} KB`;
  }

  return `${(
    value /
    (
      1024 *
      1024
    )
  ).toFixed(1)} MB`;
}

function formatDimensions(
  media:
    CreativeMediaAsset
): string {
  if (
    media.width ===
      undefined ||
    media.height ===
      undefined
  ) {
    return "Not available";
  }

  return `${media.width} × ${media.height}`;
}

function formatDuration(
  value?: number
): string {
  if (
    value === undefined
  ) {
    return "Not available";
  }

  return `${value.toFixed(
    value % 1 === 0
      ? 0
      : 1
  )} sec`;
}

function getMediaTypeLabel(
  media:
    CreativeMediaAsset
): string {
  return media.type ===
    "video"
    ? "Video"
    : "Image";
}

function getFrameLabel(
  media:
    CreativeMediaAsset
): string {
  switch (
    media.frameProfile
  ) {
    case "standard_media":
      return "Standard · 16:9";

    case "sliding_card_media":
      return "Sliding card · 1:1";

    default:
      return "Not specified";
  }
}

function getCreativeLayout(
  creative:
    CommercialCreative
):
  "standard" |
  "sliding" {
  if (
    creative.layout
  ) {
    return creative.layout;
  }

  if (
    creative.slidingCards
      ?.length
  ) {
    return "sliding";
  }

  return "standard";
}

function MediaAssetDetails({
  media,
  label,
}: {
  media:
    CreativeMediaAsset;

  label:
    string;
}) {
  const previewUrl =
    media.thumbnailUrl ??
    (
      media.type ===
        "image"
        ? media.url
        : undefined
    );

  return (
    <article
      className={
        styles.assetCard
      }
    >
      <div
        className={
          styles.assetHeader
        }
      >
        <div>
          <span
            className={
              styles.assetEyebrow
            }
          >
            {label}
          </span>

          <strong
            className={
              styles.assetFileName
            }
          >
            {
              media.fileName
            }
          </strong>
        </div>

        <span
          className={
            media.type ===
            "video"
              ? styles.mediaTypeVideo
              : styles.mediaTypeImage
          }
        >
          {getMediaTypeLabel(
            media
          )}
        </span>
      </div>

      {previewUrl ? (
        <div
          className={
            styles.assetPreview
          }
          style={{
            backgroundImage:
              `url("${previewUrl}")`,
          }}
          role="img"
          aria-label={
            media.altText ??
            `${label} preview`
          }
        />
      ) : (
        <div
          className={
            styles.assetPlaceholder
          }
        >
          <span>
            {media.type ===
            "video"
              ? "Video"
              : "Image"}
          </span>

          <small>
            Preview becomes available after media storage processing.
          </small>
        </div>
      )}

      <div
        className={
          styles.assetMetaGrid
        }
      >
        <div>
          <span>
            Frame
          </span>

          <strong>
            {getFrameLabel(
              media
            )}
          </strong>
        </div>

        <div>
          <span>
            Dimensions
          </span>

          <strong>
            {formatDimensions(
              media
            )}
          </strong>
        </div>

        <div>
          <span>
            File size
          </span>

          <strong>
            {formatBytes(
              media.sizeBytes
            )}
          </strong>
        </div>

        <div>
          <span>
            Format
          </span>

          <strong>
            {media.mimeType ??
              "Not available"}
          </strong>
        </div>

        {media.type ===
        "video" ? (
          <>
            <div>
              <span>
                Duration
              </span>

              <strong>
                {formatDuration(
                  media.durationSeconds
                )}
              </strong>
            </div>

            <div>
              <span>
                Frame rate
              </span>

              <strong>
                {media.framesPerSecond !==
                undefined
                  ? `${media.framesPerSecond} FPS`
                  : "Pending verification"}
              </strong>
            </div>
          </>
        ) : null}
      </div>

      {media.altText ? (
        <div
          className={
            styles.altText
          }
        >
          <span>
            Alt text
          </span>

          <p>
            {
              media.altText
            }
          </p>
        </div>
      ) : null}

      {media.url ? (
        <a
          href={
            media.url
          }
          target="_blank"
          rel="noopener noreferrer"
          className={
            styles.assetLink
          }
        >
          Open stored media ↗
        </a>
      ) : (
        <div
          className={
            styles.storageState
          }
        >
          Permanent media URL pending backend storage
        </div>
      )}
    </article>
  );
}

function SlidingCardDetails({
  card,
}: {
  card:
    SlidingCreativeCard;
}) {
  return (
    <div
      className={
        styles.slideCard
      }
    >
      <div
        className={
          styles.slideHeading
        }
      >
        <div>
          <span>
            Card {
              card.slot
            }
          </span>

          <strong>
            {
              card.title
            }
          </strong>
        </div>

        <small>
          {card.slot ===
            1
            ? "Video"
            : "Image"}
        </small>
      </div>

      <MediaAssetDetails
        media={
          card.media
        }
        label={`Card ${card.slot} media`}
      />
    </div>
  );
}

export default async function RequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const {
    requestId,
  } =
    await params;

  const request =
    getRequestById(
      requestId
    );

  if (
    !request
  ) {
    notFound();
  }

  const linkedCampaign =
    getCampaignForRequest(
      request
    );

  const canEdit =
    clientCanEditRequest(
      request
    );

  const creativeLayout =
    getCreativeLayout(
      request.creative
    );

  const sortedSlidingCards =
    [
      ...(
        request.creative
          .slidingCards ??
        []
      ),
    ].sort(
      (
        first,
        second
      ) =>
        first.slot -
        second.slot
    );

  const commercialValue =
    request.proposedContractValue !==
    undefined
      ? formatClientCurrency(
          request.proposedContractValue
        )
      : request.proposedBudget !==
          undefined
        ? formatClientCurrency(
            request.proposedBudget
          )
        : request.commissionModel ??
          "—";

  return (
    <>
      <Link
        href="/requests"
        className={
          styles.backLink
        }
      >
        ← Back to requests
      </Link>

      <header
        className="pageHeader"
      >
        <div>
          <div
            className="pageEyebrow"
          >
            {
              request.id
            }
          </div>

          <h1
            className="pageTitle"
          >
            {
              request.campaignName
            }
          </h1>

          <p
            className="pageDescription"
          >
            {getRequestTypeLabel(
              request.type
            )}
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <span
            className={getStatusClass(
              request.status
            )}
          >
            {getRequestStatusLabel(
              request.status
            )}
          </span>

          {canEdit ? (
            <Link
              href={`/requests/new?edit=${request.id}`}
              className="primaryButton"
            >
              Review changes
            </Link>
          ) : null}

          {linkedCampaign ? (
            <Link
              href={`/campaigns/${linkedCampaign.id}`}
              className="secondaryButton"
            >
              View campaign
            </Link>
          ) : null}
        </div>
      </header>

      <section
        className={
          styles.notice
        }
      >
        <strong>
          {getRequestStatusLabel(
            request.status
          )}
        </strong>

        <p>
          {getStatusMessage(
            request.status
          )}
        </p>
      </section>

      {request.status ===
        "changes_requested" &&
      request.review
        ?.requestedChanges
        .length ? (
        <section
          className={
            styles.notice
          }
        >
          <strong>
            Changes requested by Poster
          </strong>

          <ul>
            {request.review.requestedChanges.map(
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

          {request.review
            .reviewNote ? (
            <p>
              {
                request.review
                  .reviewNote
              }
            </p>
          ) : null}
        </section>
      ) : request.review
          ?.reviewNote ? (
        <section
          className={
            styles.notice
          }
        >
          <strong>
            Review note
          </strong>

          <p>
            {
              request.review
                .reviewNote
            }
          </p>
        </section>
      ) : null}

      <section
        className={
          styles.summaryGrid
        }
      >
        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Submitted
          </span>

          <strong>
            {formatClientDate(
              request.submittedAt
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Requested period
          </span>

          <strong>
            {formatClientDate(
              request.requestedStartDate
            )}
            {" – "}
            {formatClientDate(
              request.requestedEndDate
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Commercial value
          </span>

          <strong>
            {
              commercialValue
            }
          </strong>
        </article>

        <article
          className={
            styles.summaryItem
          }
        >
          <span>
            Campaign
          </span>

          <strong>
            {linkedCampaign
              ?.id ??
              "Not created"}
          </strong>
        </article>
      </section>

      <section
        className={
          styles.grid
        }
      >
        <article
          className="contentCard"
        >
          <h2
            className="sectionTitle"
          >
            Request
          </h2>

          <div
            className={
              styles.detailList
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
                {
                  request.organizationName
                }
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
                {
                  request.contactName
                }
                {" · "}
                {
                  request.businessEmail
                }
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

              <a
                href={
                  request.website
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {
                  request.website
                }
              </a>
            </div>

            <div
              className={
                styles.detailRow
              }
            >
              <span>
                Placements
              </span>

              <div
                className={
                  styles.placements
                }
              >
                {request.requestedPlacements.map(
                  (
                    placement
                  ) => (
                    <span
                      key={
                        placement
                      }
                      className={
                        styles.placement
                      }
                    >
                      {getPlacementLabel(
                        placement
                      )}
                    </span>
                  )
                )}
              </div>
            </div>

            <div
              className={
                styles.detailRow
              }
            >
              <span>
                Creative format
              </span>

              <strong>
                {creativeLayout ===
                "sliding"
                  ? "Sliding · 3 square cards"
                  : "Standard · 16:9"}
              </strong>
            </div>

            <div
              className={
                styles.detailRow
              }
            >
              <span>
                Conversion
              </span>

              <strong>
                {request.conversionDefinition ??
                  "Not provided"}
              </strong>
            </div>

            {request.commissionModel ? (
              <div
                className={
                  styles.detailRow
                }
              >
                <span>
                  Commission model
                </span>

                <strong>
                  {
                    request.commissionModel
                  }
                </strong>
              </div>
            ) : null}
          </div>
        </article>

        <article
          className="contentCard"
        >
          <div
            className={
              styles.creativeSectionHeader
            }
          >
            <div>
              <h2
                className="sectionTitle"
              >
                Submitted creative
              </h2>

              <p>
                The advertising creative attached to this request.
              </p>
            </div>

            <span
              className={
                styles.layoutBadge
              }
            >
              {creativeLayout ===
              "sliding"
                ? "Sliding"
                : "Standard"}
            </span>
          </div>

          <div
            className={
              styles.creative
            }
          >
            <strong>
              {
                request.creative
                  .headline
              }
            </strong>

            <p>
              {
                request.creative
                  .body
              }
            </p>

            <span>
              {
                request.creative
                  .callToAction
              }
              {" →"}
            </span>
          </div>

          <div
            className={
              styles.detailList
            }
          >
            <div
              className={
                styles.detailRow
              }
            >
              <span>
                Destination
              </span>

              <a
                href={
                  request.creative
                    .destinationUrl
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Open destination ↗
              </a>
            </div>

            <div
              className={
                styles.detailRow
              }
            >
              <span>
                Layout
              </span>

              <strong>
                {creativeLayout ===
                "sliding"
                  ? "3 × 1:1 cards"
                  : "Single 16:9 media"}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section
        className={
          styles.mediaSection
        }
      >
        <div
          className={
            styles.mediaSectionHeader
          }
        >
          <div>
            <h2>
              Creative media
            </h2>

            <p>
              Files and metadata submitted with this advertising request.
            </p>
          </div>

          <span>
            {creativeLayout ===
            "sliding"
              ? "Video + 2 images"
              : request.creative
                  .primaryMedia
                  ?.type ===
                "video"
                ? "Standard video"
                : "Standard image"}
          </span>
        </div>

        {creativeLayout ===
        "standard" ? (
          request.creative
            .primaryMedia ? (
            <div
              className={
                styles.standardMedia
              }
            >
              <MediaAssetDetails
                media={
                  request.creative
                    .primaryMedia
                }
                label="Main advertising media"
              />
            </div>
          ) : (
            <div
              className={
                styles.emptyMedia
              }
            >
              <strong>
                No structured media metadata
              </strong>

              <p>
                This request was created before structured media metadata
                was attached.
              </p>
            </div>
          )
        ) : sortedSlidingCards.length >
          0 ? (
          <div
            className={
              styles.slidingGrid
            }
          >
            {sortedSlidingCards.map(
              (
                card
              ) => (
                <SlidingCardDetails
                  key={
                    card.slot
                  }
                  card={
                    card
                  }
                />
              )
            )}
          </div>
        ) : (
          <div
            className={
              styles.emptyMedia
            }
          >
            <strong>
              Sliding creative incomplete
            </strong>

            <p>
              No structured sliding-card media is attached to this request.
            </p>
          </div>
        )}

        {request.creative
          .logoMedia ? (
          <div
            className={
              styles.logoSection
            }
          >
            <h3>
              Organization logo
            </h3>

            <MediaAssetDetails
              media={
                request.creative
                  .logoMedia
              }
              label="Brand asset"
            />
          </div>
        ) : null}
      </section>

      <p
        className={
          styles.note
        }
      >
        Clients can correct a request only when Poster requests changes.
        Campaign scheduling, activation, pausing, and completion remain
        Admin-managed.
      </p>
    </>
  );
}
