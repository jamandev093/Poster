import Link from "next/link";

import {
  formatClientNumber,
  getCampaignStatusLabel,
  getCampaignTypeLabel,
  getPlacementLabel,
  getRequestStatusLabel,
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

import {
  getActiveCampaigns,
  getCurrentOrganization,
  getOrganizationCampaigns,
  getOrganizationRequests,
  getPendingRequests,
  getRequestsNeedingAction,
} from "@/features/workspace/workspace.selectors";

import {
  calculateCtr,
  calculateDeliveryProgress,
} from "@/features/workspace/workspace.types";

import type {
  CampaignStatus,
  CommercialRequestStatus,
} from "@/features/workspace/workspace.types";

import styles from "./page.module.css";

function getRequestStatusClass(
  status: CommercialRequestStatus
): string {
  switch (status) {
    case "changes_requested":
      return styles.statusAttention;

    case "approved":
      return styles.statusPositive;

    case "pending_review":
    case "rejected":
      return styles.statusNeutral;
  }
}

function getCampaignStatusClass(
  status: CampaignStatus
): string {
  switch (status) {
    case "active":
      return styles.statusPositive;

    case "paused":
    case "disabled":
      return styles.statusAttention;

    case "draft":
    case "scheduled":
    case "ended":
      return styles.statusNeutral;
  }
}

export default function DashboardPage() {
  const organization =
    getCurrentOrganization();

  const requests =
    getOrganizationRequests();

  const campaigns =
    getOrganizationCampaigns();

  const needsAction =
    getRequestsNeedingAction();

  const pendingRequests =
    getPendingRequests();

  const activeCampaigns =
    getActiveCampaigns();

  const recentRequests =
    [...requests]
      .sort(
        (
          first,
          second
        ) =>
          new Date(
            second.updatedAt
          ).getTime() -
          new Date(
            first.updatedAt
          ).getTime()
      )
      .slice(
        0,
        4
      );

  const totalImpressions =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.impressions,
      0
    );

  const totalClicks =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        campaign.performance.clicks,
      0
    );

  const trackedConversions =
    campaigns.reduce(
      (
        total,
        campaign
      ) =>
        total +
        (
          campaign.performance.conversions ??
          0
        ),
      0
    );

  const campaignsWithoutTracking =
    campaigns.filter(
      (
        campaign
      ) =>
        campaign.performance.conversions ===
        null
    ).length;

  const overallCtr =
    calculateCtr(
      totalImpressions,
      totalClicks
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
            {organization.name}
          </div>

          <h1>
            Advertising workspace
          </h1>

          <p>
            Submit advertising requests, follow Poster&apos;s review,
            and monitor approved campaign delivery and results.
          </p>
        </div>

        <Link
          href="/requests/new"
          className={
            styles.newRequestButton
          }
        >
          Submit advertising request
        </Link>
      </header>

      <section
        className={
          styles.summary
        }
        aria-label="Advertising workspace summary"
      >
        <div
          className={
            styles.summaryItem
          }
        >
          <span>
            Needs your action
          </span>

          <strong>
            {needsAction.length}
          </strong>

          <small>
            Changes requested
          </small>
        </div>

        <div
          className={
            styles.summaryItem
          }
        >
          <span>
            Pending review
          </span>

          <strong>
            {pendingRequests.length}
          </strong>

          <small>
            With Poster
          </small>
        </div>

        <div
          className={
            styles.summaryItem
          }
        >
          <span>
            Active campaigns
          </span>

          <strong>
            {activeCampaigns.length}
          </strong>

          <small>
            Currently delivering
          </small>
        </div>

        <div
          className={
            styles.summaryItem
          }
        >
          <span>
            Recorded impressions
          </span>

          <strong>
            {formatClientNumber(
              totalImpressions
            )}
          </strong>

          <small>
            Across your campaigns
          </small>
        </div>
      </section>

      {needsAction.length >
      0 ? (
        <section
          className={
            styles.attentionSection
          }
          aria-labelledby="attention-title"
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <span
                className={
                  styles.sectionEyebrow
                }
              >
                Action required
              </span>

              <h2 id="attention-title">
                Poster needs information from you
              </h2>
            </div>
          </div>

          <div
            className={
              styles.attentionList
            }
          >
            {needsAction.map(
              (
                request
              ) => (
                <article
                  key={
                    request.id
                  }
                  className={
                    styles.attention
                  }
                >
                  <div
                    className={
                      styles.attentionContent
                    }
                  >
                    <strong>
                      {
                        request.campaignName
                      }
                    </strong>

                    <span>
                      {
                        request.id
                      }
                      {" · "}
                      {getRequestTypeLabel(
                        request.type
                      )}
                    </span>

                    <p>
                      {request.review
                        ?.requestedChanges
                        .length
                        ? `${request.review.requestedChanges.length} ${
                            request.review.requestedChanges.length ===
                            1
                              ? "change"
                              : "changes"
                          } requested before this request can continue.`
                        : "Poster requested changes before this request can continue."}
                    </p>
                  </div>

                  <Link
                    href={`/requests/${request.id}`}
                    className={
                      styles.reviewLink
                    }
                  >
                    Review changes
                  </Link>
                </article>
              )
            )}
          </div>
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
          <div>
            <h2>
              Active campaigns
            </h2>

            <p>
              Campaigns currently delivering through Poster.
            </p>
          </div>

          <Link href="/campaigns">
            View all campaigns
          </Link>
        </div>

        {activeCampaigns.length >
        0 ? (
          <div
            className={
              styles.campaignTable
            }
          >
            <div
              className={
                styles.tableHeader
              }
            >
              <span>
                Campaign
              </span>

              <span>
                Placement
              </span>

              <span>
                Delivery / result
              </span>

              <span>
                Status
              </span>
            </div>

            {activeCampaigns.map(
              (
                campaign
              ) => {
                const delivery =
                  calculateDeliveryProgress(
                    campaign
                      .financials
                      .deliveryTarget,
                    campaign
                      .financials
                      .delivered
                  );

                const ctr =
                  calculateCtr(
                    campaign
                      .performance
                      .impressions,
                    campaign
                      .performance
                      .clicks
                  );

                return (
                  <Link
                    key={
                      campaign.id
                    }
                    href={`/campaigns/${campaign.id}`}
                    className={
                      styles.campaignRow
                    }
                  >
                    <div
                      className={
                        styles.primaryCell
                      }
                    >
                      <strong>
                        {
                          campaign.name
                        }
                      </strong>

                      <span>
                        {
                          campaign.id
                        }
                        {" · "}
                        {getCampaignTypeLabel(
                          campaign.type
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.placementCell
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
                          >
                            {getPlacementLabel(
                              placement
                            )}
                          </span>
                        )
                      )}
                    </div>

                    <div
                      className={
                        styles.resultCell
                      }
                    >
                      {delivery !==
                      null ? (
                        <>
                          <div
                            className={
                              styles.deliveryHeader
                            }
                          >
                            <strong>
                              {delivery.toFixed(
                                1
                              )}
                              %
                            </strong>

                            <span>
                              {formatClientNumber(
                                campaign
                                  .financials
                                  .delivered ??
                                  0
                              )}
                              {" / "}
                              {formatClientNumber(
                                campaign
                                  .financials
                                  .deliveryTarget ??
                                  0
                              )}
                            </span>
                          </div>

                          <div
                            className={
                              styles.progress
                            }
                          >
                            <i
                              style={{
                                width: `${delivery}%`,
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>
                            {formatClientNumber(
                              campaign
                                .performance
                                .impressions
                            )}
                            {" impressions"}
                          </strong>

                          <span>
                            {campaign
                              .performance
                              .conversions ===
                            null
                              ? `${ctr.toFixed(
                                  2
                                )}% CTR · conversions not tracked`
                              : `${formatClientNumber(
                                  campaign
                                    .performance
                                    .conversions
                                )} conversions · ${ctr.toFixed(
                                  2
                                )}% CTR`}
                          </span>
                        </>
                      )}
                    </div>

                    <span
                      className={getCampaignStatusClass(
                        campaign.status
                      )}
                    >
                      {getCampaignStatusLabel(
                        campaign.status
                      )}
                    </span>
                  </Link>
                );
              }
            )}
          </div>
        ) : (
          <div
            className={
              styles.emptyState
            }
          >
            No campaigns are currently active.
          </div>
        )}
      </section>

      <section
        className={
          styles.performanceSection
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <div>
            <h2>
              Performance
            </h2>

            <p>
              Recorded results across your campaigns.
            </p>
          </div>

          <Link href="/performance">
            View performance
          </Link>
        </div>

        <div
          className={
            styles.performanceSummary
          }
        >
          <div>
            <span>
              Impressions
            </span>

            <strong>
              {formatClientNumber(
                totalImpressions
              )}
            </strong>
          </div>

          <div>
            <span>
              Clicks
            </span>

            <strong>
              {formatClientNumber(
                totalClicks
              )}
            </strong>
          </div>

          <div>
            <span>
              CTR
            </span>

            <strong>
              {overallCtr.toFixed(
                2
              )}
              %
            </strong>
          </div>

          <div>
            <span>
              Conversions
            </span>

            <strong>
              {formatClientNumber(
                trackedConversions
              )}
            </strong>

            {campaignsWithoutTracking >
            0 ? (
              <small>
                {campaignsWithoutTracking}
                {" "}
                {campaignsWithoutTracking ===
                1
                  ? "campaign is"
                  : "campaigns are"}
                {" "}
                not tracking conversions
              </small>
            ) : null}
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
          <div>
            <h2>
              Recent requests
            </h2>

            <p>
              Latest advertising requests submitted to Poster.
            </p>
          </div>

          <Link href="/requests">
            View all requests
          </Link>
        </div>

        <div
          className={
            styles.rows
          }
        >
          {recentRequests.map(
            (
              request
            ) => (
              <Link
                key={
                  request.id
                }
                href={`/requests/${request.id}`}
                className={
                  styles.row
                }
              >
                <div
                  className={
                    styles.primaryCell
                  }
                >
                  <strong>
                    {
                      request.campaignName
                    }
                  </strong>

                  <span>
                    {
                      request.id
                    }
                    {" · "}
                    {getRequestTypeLabel(
                      request.type
                    )}
                  </span>
                </div>

                <span
                  className={getRequestStatusClass(
                    request.status
                  )}
                >
                  {getRequestStatusLabel(
                    request.status
                  )}
                </span>

                <span
                  className={
                    styles.chevron
                  }
                  aria-hidden="true"
                >
                  ›
                </span>
              </Link>
            )
          )}
        </div>
      </section>
    </>
  );
}