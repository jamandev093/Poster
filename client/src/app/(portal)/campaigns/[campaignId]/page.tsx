import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  formatClientCurrency,
  formatClientDate,
  formatClientNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
  getPlacementLabel,
  getTrackingStatusLabel,
} from "@/features/workspace/workspace.formatters";

import {
  getCampaignById,
  getRequestById,
} from "@/features/workspace/workspace.selectors";

import {
  calculateConversionRate,
  calculateCtr,
  calculateDeliveryProgress,
  calculateRevenuePerClick,
} from "@/features/workspace/workspace.types";

import type {
  CampaignStatus,
  CreativeMediaAsset,
} from "@/features/workspace/workspace.types";

import styles from "./page.module.css";

interface CampaignDetailsPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

function getStatusClass(
  status: CampaignStatus
): string {
  switch (status) {
    case "active":
      return "statusBadge statusActive";

    case "scheduled":
      return "statusBadge statusScheduled";

    case "paused":
      return "statusBadge statusAttention";

    case "draft":
      return `statusBadge ${styles.statusDraft}`;

    case "ended":
    case "disabled":
      return `statusBadge ${styles.statusEnded}`;
  }
}

function getCampaignStateMessage(
  status: CampaignStatus
): string {
  switch (status) {
    case "draft":
      return "Poster Admin is completing campaign setup. This campaign is not delivering yet.";

    case "scheduled":
      return "This campaign is approved and scheduled. Delivery will begin according to the campaign schedule.";

    case "active":
      return "This campaign is currently active. Performance shown below belongs only to this campaign.";

    case "paused":
      return "This campaign is currently paused by Poster Admin. Historical performance remains available.";

    case "ended":
      return "This campaign has completed and is no longer delivering.";

    case "disabled":
      return "This campaign is currently unavailable for delivery.";
  }
}

function formatBytes(
  bytes?: number
): string {
  if (
    bytes === undefined
  ) {
    return "—";
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(0)} KB`;
  }

  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(1)} MB`;
}

function getMediaDimensions(
  media: CreativeMediaAsset
): string {
  if (
    media.width === undefined ||
    media.height === undefined
  ) {
    return "—";
  }

  return `${media.width} × ${media.height}`;
}

function getMediaTypeLabel(
  media: CreativeMediaAsset
): string {
  return media.type ===
    "video"
    ? "Video"
    : "Image";
}

function formatOptionalCurrency(
  value: number | undefined
): string {
  if (
    value === undefined
  ) {
    return "—";
  }

  return formatClientCurrency(
    value
  );
}

function formatOptionalNumber(
  value: number | undefined
): string {
  if (
    value === undefined
  ) {
    return "—";
  }

  return formatClientNumber(
    value
  );
}

function MediaPreview({
  media,
  square = false,
}: {
  media: CreativeMediaAsset;
  square?: boolean;
}) {
  if (
    media.type ===
      "image" &&
    media.url
  ) {
    return (
      <div
        className={
          square
            ? styles.squareMedia
            : styles.standardMedia
        }
      >
        {/* Mock external media only. Production media uses approved storage URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={
            media.altText ??
            media.fileName
          }
        />
      </div>
    );
  }

  if (
    media.type ===
      "video" &&
    media.url
  ) {
    return (
      <div
        className={
          square
            ? styles.squareMedia
            : styles.standardMedia
        }
      >
        <video
          src={media.url}
          poster={
            media.thumbnailUrl
          }
          controls
          muted
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div
      className={
        square
          ? styles.squareMediaPlaceholder
          : styles.standardMediaPlaceholder
      }
    >
      <span
        className={
          styles.mediaType
        }
      >
        {getMediaTypeLabel(
          media
        )}
      </span>

      <strong>
        {
          media.fileName
        }
      </strong>

      <small>
        {media.type ===
        "video"
          ? "Video preview becomes available after secure media storage is connected."
          : "Permanent preview is unavailable for this frontend record."}
      </small>
    </div>
  );
}

function MediaMetadata({
  media,
}: {
  media: CreativeMediaAsset;
}) {
  return (
    <div
      className={
        styles.mediaMetadata
      }
    >
      <div>
        <span>
          Type
        </span>

        <strong>
          {getMediaTypeLabel(
            media
          )}
        </strong>
      </div>

      <div>
        <span>
          Dimensions
        </span>

        <strong>
          {getMediaDimensions(
            media
          )}
        </strong>
      </div>

      <div>
        <span>
          Size
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
            "—"}
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
              {media.durationSeconds !==
              undefined
                ? `${media.durationSeconds.toFixed(
                    media.durationSeconds %
                      1 ===
                      0
                      ? 0
                      : 1
                  )} sec`
                : "—"}
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
                : "Backend verification"}
            </strong>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default async function CampaignDetailsPage({
  params,
}: CampaignDetailsPageProps) {
  const {
    campaignId,
  } =
    await params;

  const campaign =
    getCampaignById(
      campaignId
    );

  if (
    !campaign
  ) {
    notFound();
  }

  const relatedRequest =
    getRequestById(
      campaign.requestId
    );

  const ctr =
    calculateCtr(
      campaign.performance
        .impressions,
      campaign.performance
        .clicks
    );

  const conversionRate =
    calculateConversionRate(
      campaign.performance
        .clicks,
      campaign.performance
        .conversions
    );

  const delivery =
    calculateDeliveryProgress(
      campaign.financials
        .deliveryTarget,
      campaign.financials
        .delivered
    );

  const deliveryRemaining =
    campaign.financials
      .deliveryTarget !==
      undefined &&
    campaign.financials
      .delivered !==
      undefined
      ? Math.max(
          campaign.financials
            .deliveryTarget -
            campaign.financials
              .delivered,
          0
        )
      : undefined;

  const revenuePerClick =
    calculateRevenuePerClick(
      campaign.performance
        .clicks,
      campaign.financials
        .revenue
    );

  const creative =
    campaign.creative;

  const creativeLayout =
    creative?.layout ??
    (
      creative?.slidingCards
        ?.length
        ? "sliding"
        : "standard"
    );

  return (
    <>
      <Link
        href="/campaigns"
        className={
          styles.backLink
        }
      >
        ← Back to campaigns
      </Link>

      <header
        className="pageHeader"
      >
        <div>
          <div
            className="pageEyebrow"
          >
            {
              campaign.id
            }
          </div>

          <h1
            className="pageTitle"
          >
            {
              campaign.name
            }
          </h1>

          <p
            className="pageDescription"
          >
            {getCampaignTypeLabel(
              campaign.type
            )}
          </p>
        </div>

        <span
          className={getStatusClass(
            campaign.status
          )}
        >
          {getCampaignStatusLabel(
            campaign.status
          )}
        </span>
      </header>

      <section
        className={
          styles.notice
        }
      >
        {getCampaignStateMessage(
          campaign.status
        )}
      </section>

      <section
        className={
          styles.metrics
        }
      >
        <article
          className={
            styles.metric
          }
        >
          <span>
            Impressions
          </span>

          <strong>
            {formatClientNumber(
              campaign.performance
                .impressions
            )}
          </strong>

          <small>
            Recorded delivery
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Clicks
          </span>

          <strong>
            {formatClientNumber(
              campaign.performance
                .clicks
            )}
          </strong>

          <small>
            {ctr.toFixed(
              2
            )}
            % CTR
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            Conversions
          </span>

          <strong>
            {campaign.performance
              .conversions ===
            null
              ? "Not tracked"
              : formatClientNumber(
                  campaign.performance
                    .conversions
                )}
          </strong>

          <small>
            {conversionRate ===
            null
              ? "Tracking unavailable"
              : `${conversionRate.toFixed(
                  2
                )}% conversion rate`}
          </small>
        </article>

        <article
          className={
            styles.metric
          }
        >
          <span>
            {campaign.type ===
            "affiliate"
              ? "Commission"
              : "Contract value"}
          </span>

          <strong>
            {campaign.type ===
            "affiliate"
              ? formatOptionalCurrency(
                  campaign.financials
                    .commission
                )
              : formatOptionalCurrency(
                  campaign.financials
                    .contractValue
                )}
          </strong>

          <small>
            {campaign.type ===
              "affiliate" &&
            revenuePerClick !==
              null
              ? `${formatClientCurrency(
                  revenuePerClick
                )} revenue per click`
              : campaign.type ===
                  "affiliate"
                ? "Revenue per click unavailable"
                : "Agreed commercial value"}
          </small>
        </article>
      </section>

      {creative ? (
        <section
          className={
            styles.creativeSection
          }
        >
          <div
            className={
              styles.creativeHeader
            }
          >
            <div>
              <span
                className={
                  styles.sectionEyebrow
                }
              >
                Approved creative
              </span>

              <h2>
                Campaign advertisement
              </h2>

              <p>
                The exact approved creative currently assigned to this campaign.
              </p>
            </div>

            <span
              className={
                styles.layoutBadge
              }
            >
              {creativeLayout ===
              "sliding"
                ? "Sliding · 3 cards"
                : "Standard · 16:9"}
            </span>
          </div>

          {creativeLayout ===
            "standard" &&
          creative.primaryMedia ? (
            <div
              className={
                styles.standardCreativeGrid
              }
            >
              <div>
                <MediaPreview
                  media={
                    creative.primaryMedia
                  }
                />

                <MediaMetadata
                  media={
                    creative.primaryMedia
                  }
                />
              </div>

              <div
                className={
                  styles.creativeCopy
                }
              >
                <span>
                  Headline
                </span>

                <h3>
                  {
                    creative.headline
                  }
                </h3>

                <p>
                  {
                    creative.body
                  }
                </p>

                <div
                  className={
                    styles.creativeDetails
                  }
                >
                  <div>
                    <span>
                      Call to action
                    </span>

                    <strong>
                      {
                        creative.callToAction
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Destination
                    </span>

                    <a
                      href={
                        creative.destinationUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open destination ↗
                    </a>
                  </div>

                  <div>
                    <span>
                      File
                    </span>

                    <strong>
                      {
                        creative.primaryMedia
                          .fileName
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {creativeLayout ===
            "sliding" &&
          creative.slidingCards
            ?.length ? (
            <>
              <div
                className={
                  styles.slidingIntro
                }
              >
                <div>
                  <span>
                    Headline
                  </span>

                  <strong>
                    {
                      creative.headline
                    }
                  </strong>
                </div>

                <p>
                  {
                    creative.body
                  }
                </p>
              </div>

              <div
                className={
                  styles.slidingCards
                }
              >
                {[
                  ...creative.slidingCards,
                ]
                  .sort(
                    (
                      first,
                      second
                    ) =>
                      first.slot -
                      second.slot
                  )
                  .map(
                    (
                      card
                    ) => (
                      <article
                        key={
                          card.slot
                        }
                        className={
                          styles.slideCard
                        }
                      >
                        <div
                          className={
                            styles.slideTopline
                          }
                        >
                          <span>
                            Card{" "}
                            {
                              card.slot
                            }
                          </span>

                          <strong>
                            {card.media.type ===
                            "video"
                              ? "Video"
                              : "Image"}
                          </strong>
                        </div>

                        <MediaPreview
                          media={
                            card.media
                          }
                          square
                        />

                        <div
                          className={
                            styles.slideContent
                          }
                        >
                          <h3>
                            {
                              card.title
                            }
                          </h3>

                          <small>
                            {
                              card.media
                                .fileName
                            }
                          </small>
                        </div>

                        <MediaMetadata
                          media={
                            card.media
                          }
                        />
                      </article>
                    )
                  )}
              </div>

              <div
                className={
                  styles.slidingFooter
                }
              >
                <div>
                  <span>
                    Call to action
                  </span>

                  <strong>
                    {
                      creative.callToAction
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Destination
                  </span>

                  <a
                    href={
                      creative.destinationUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open destination ↗
                  </a>
                </div>
              </div>
            </>
          ) : null}
        </section>
      ) : (
        <section
          className={
            styles.noCreative
          }
        >
          <strong>
            Creative details not available
          </strong>

          <p>
            This campaign does not yet contain an approved creative snapshot.
          </p>
        </section>
      )}

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
            Campaign details
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
                Request
              </span>

              {relatedRequest ? (
                <Link
                  href={`/requests/${relatedRequest.id}`}
                >
                  {
                    relatedRequest.id
                  }
                </Link>
              ) : (
                <strong>
                  {
                    campaign.requestId
                  }
                </strong>
              )}
            </div>

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
                  campaign.organizationName
                }
              </strong>
            </div>

            <div
              className={
                styles.detailRow
              }
            >
              <span>
                Schedule
              </span>

              <strong>
                {formatClientDate(
                  campaign.startDate
                )}
                {" – "}
                {formatClientDate(
                  campaign.endDate
                )}
              </strong>
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
                {campaign.placements.map(
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
                Tracking
              </span>

              <strong>
                {getTrackingStatusLabel(
                  campaign.trackingStatus
                )}
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
                {campaign.conversionDefinition ??
                  "Not configured"}
              </strong>
            </div>
          </div>
        </article>

        <article
          className="contentCard"
        >
          <h2
            className="sectionTitle"
          >
            {campaign.type ===
            "affiliate"
              ? "Commercial performance"
              : "Delivery"}
          </h2>

          {campaign.type ===
          "direct_sponsorship" ? (
            <>
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
                    Contract value
                  </span>

                  <strong>
                    {formatOptionalCurrency(
                      campaign.financials
                        .contractValue
                    )}
                  </strong>
                </div>

                <div
                  className={
                    styles.detailRow
                  }
                >
                  <span>
                    Delivery target
                  </span>

                  <strong>
                    {formatOptionalNumber(
                      campaign.financials
                        .deliveryTarget
                    )}
                  </strong>
                </div>

                <div
                  className={
                    styles.detailRow
                  }
                >
                  <span>
                    Delivered
                  </span>

                  <strong>
                    {formatOptionalNumber(
                      campaign.financials
                        .delivered
                    )}
                  </strong>
                </div>

                <div
                  className={
                    styles.detailRow
                  }
                >
                  <span>
                    Remaining
                  </span>

                  <strong>
                    {formatOptionalNumber(
                      deliveryRemaining
                    )}
                  </strong>
                </div>
              </div>

              {delivery !==
              null ? (
                <>
                  <div
                    className={
                      styles.deliveryHeader
                    }
                  >
                    <div>
                      <span>
                        Delivery completed
                      </span>

                      <strong>
                        {delivery.toFixed(
                          1
                        )}
                        %
                      </strong>
                    </div>

                    <span>
                      {formatClientNumber(
                        campaign.financials
                          .delivered ??
                          0
                      )}
                      {" / "}
                      {formatClientNumber(
                        campaign.financials
                          .deliveryTarget ??
                          0
                      )}
                    </span>
                  </div>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <span
                      style={{
                        width:
                          `${delivery}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <div
                  className={
                    styles.notice
                  }
                >
                  Contracted delivery information is not available yet.
                </div>
              )}
            </>
          ) : (
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
                  Commission
                </span>

                <strong>
                  {formatOptionalCurrency(
                    campaign.financials
                      .commission
                  )}
                </strong>
              </div>

              <div
                className={
                  styles.detailRow
                }
              >
                <span>
                  Revenue
                </span>

                <strong>
                  {formatOptionalCurrency(
                    campaign.financials
                      .revenue
                  )}
                </strong>
              </div>

              <div
                className={
                  styles.detailRow
                }
              >
                <span>
                  Revenue per click
                </span>

                <strong>
                  {revenuePerClick ===
                  null
                    ? "—"
                    : formatClientCurrency(
                        revenuePerClick
                      )}
                </strong>
              </div>

              <div
                className={
                  styles.detailRow
                }
              >
                <span>
                  Conversion rate
                </span>

                <strong>
                  {conversionRate ===
                  null
                    ? "Not tracked"
                    : `${conversionRate.toFixed(
                        2
                      )}%`}
                </strong>
              </div>
            </div>
          )}

          {campaign.status ===
          "draft" ? (
            <div
              className={
                styles.notice
              }
            >
              Poster Admin is completing campaign setup. This campaign is not active yet.
            </div>
          ) : null}
        </article>
      </section>

      <p
        className={
          styles.note
        }
      >
        This workspace is view-only. Poster Admin controls creative approval,
        campaign setup, scheduling, activation, pausing, and completion.
      </p>
    </>
  );
}
