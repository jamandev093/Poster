import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  calculateCampaignCtr,
  calculateConversionRate,
  calculateDeliveryProgress,
  calculateRevenuePerClick,
  formatCampaignCurrency,
  formatCampaignDate,
  formatCampaignNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
  getClientCampaignById,
  getTrackingStatusLabel,
} from "@/features/campaigns/campaign.mock";

import type {
  ClientCampaignStatus,
} from "@/features/campaigns/campaign.types";

import type {
  CreativeMediaAsset,
} from "@/features/workspace/workspace.types";

import styles from "./page.module.css";

interface CampaignDetailsPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

function getStatusClass(
  status: ClientCampaignStatus
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
      return `statusBadge ${styles.statusEnded}`;
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
    !media.width ||
    !media.height
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
        {/* External demonstration URLs are used only by frontend mock data. */}
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
        {media.fileName}
      </strong>

      <small>
        {media.type ===
        "video"
          ? "Video preview will be available after secure media storage is connected."
          : "Permanent preview unavailable in this frontend record."}
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
        <span>Type</span>
        <strong>
          {getMediaTypeLabel(
            media
          )}
        </strong>
      </div>

      <div>
        <span>Dimensions</span>
        <strong>
          {getMediaDimensions(
            media
          )}
        </strong>
      </div>

      <div>
        <span>Size</span>
        <strong>
          {formatBytes(
            media.sizeBytes
          )}
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
                    1
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
  } = await params;

  const campaign =
    getClientCampaignById(
      campaignId
    );

  if (!campaign) {
    notFound();
  }

  const ctr =
    calculateCampaignCtr(
      campaign.performance.impressions,
      campaign.performance.clicks
    );

  const conversionRate =
    calculateConversionRate(
      campaign.performance.clicks,
      campaign.performance.conversions
    );

  const delivery =
    calculateDeliveryProgress(
      campaign.financials.deliveryTarget,
      campaign.financials.delivered
    );

  const revenuePerClick =
    calculateRevenuePerClick(
      campaign.performance.clicks,
      campaign.financials.revenue
    );

  const creative =
    campaign.creative;

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

      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            {campaign.id}
          </div>

          <h1 className="pageTitle">
            {campaign.name}
          </h1>

          <p className="pageDescription">
            {getCampaignTypeLabel(
              campaign.type
            )}
          </p>
        </div>

        <span
          className={
            getStatusClass(
              campaign.status
            )
          }
        >
          {getCampaignStatusLabel(
            campaign.status
          )}
        </span>
      </header>

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
            {formatCampaignNumber(
              campaign.performance.impressions
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
            {formatCampaignNumber(
              campaign.performance.clicks
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
            {campaign.performance.conversions ===
            null
              ? "Not tracked"
              : formatCampaignNumber(
                  campaign.performance.conversions
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
              ? formatCampaignCurrency(
                  campaign.financials.commission ??
                    0
                )
              : formatCampaignCurrency(
                  campaign.financials.contractValue ??
                    0
                )}
          </strong>

          <small>
            {campaign.type ===
              "affiliate" &&
            revenuePerClick !==
              null
              ? `${formatCampaignCurrency(
                  revenuePerClick
                )} revenue per click`
              : "Commercial value"}
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
                The creative currently assigned to this campaign.
              </p>
            </div>

            <span
              className={
                styles.layoutBadge
              }
            >
              {creative.layout ===
              "sliding"
                ? "Sliding · 3 cards"
                : "Standard · 16:9"}
            </span>
          </div>

          {creative.layout ===
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
                        creative.primaryMedia.fileName
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {creative.layout ===
            "sliding" &&
          creative.slidingCards?.length ? (
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
                              card.media.fileName
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
            This campaign record does not yet contain an approved creative snapshot.
          </p>
        </section>
      )}

      <section
        className={
          styles.grid
        }
      >
        <article className="contentCard">
          <h2 className="sectionTitle">
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

              <Link
                href={`/requests/${campaign.requestId}`}
              >
                {
                  campaign.requestId
                }
              </Link>
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
                {formatCampaignDate(
                  campaign.startDate
                )}
                {" – "}
                {formatCampaignDate(
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
                      {
                        placement
                      }
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

        <article className="contentCard">
          <h2 className="sectionTitle">
            Delivery
          </h2>

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
                    Completed
                  </span>

                  <strong>
                    {delivery.toFixed(
                      1
                    )}
                    %
                  </strong>
                </div>

                <span>
                  {formatCampaignNumber(
                    campaign.financials.delivered ??
                      0
                  )}
                  {" / "}
                  {formatCampaignNumber(
                    campaign.financials.deliveryTarget ??
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
                    width: `${delivery}%`,
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
              Affiliate campaigns use conversion and commission reporting instead of contracted impression delivery.
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