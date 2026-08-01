import type {
  AudienceInsightTopicRecord,
  AudienceInsightTopicSnapshot,
  AudiencePrivacySettingsRecord,
} from "./audience-insights.types.js";

function calculateAudiencePercentage(
  interestedUsers: number,
  registeredUsers: number
): number {
  if (
    registeredUsers === 0
  ) {
    return 0;
  }

  return Number(
    (
      (
        interestedUsers /
        registeredUsers
      ) *
      100
    ).toFixed(
      2
    )
  );
}

function calculateGrowthPercentage(
  growthCount: number,
  previousInterestedUsers: number
): number | null {
  if (
    previousInterestedUsers === 0
  ) {
    return null;
  }

  return Number(
    (
      (
        growthCount /
        previousInterestedUsers
      ) *
      100
    ).toFixed(
      2
    )
  );
}

/**
 * Suppresses all audience and comparison values when either
 * the current or previous audience is below the reportable
 * threshold. This prevents growth calculations from revealing
 * small historical audiences.
 */
export function applyAudiencePrivacyPolicy(
  topic:
    AudienceInsightTopicRecord,
  privacy:
    AudiencePrivacySettingsRecord
): AudienceInsightTopicSnapshot {
  const isSuppressed =
    topic.totalInterestedUsers <
      privacy.minimumReportableAudience ||
    topic.previousInterestedUsers <
      privacy.minimumReportableAudience;

  if (
    isSuppressed
  ) {
    return {
      topicId:
        topic.topicId,

      topicSlug:
        topic.topicSlug,

      topicName:
        topic.topicName,

      parentTopicId:
        topic.parentTopicId,

      isSuppressed:
        true,

      totalInterestedUsers:
        null,

      previousInterestedUsers:
        null,

      activeInterestedUsers:
        null,

      audiencePercentage:
        null,

      growthCount:
        null,

      growthPercentage:
        null,

      campaignEligibleUsers:
        null,

      isCampaignEligible:
        false,
    };
  }

  const growthCount =
    topic.totalInterestedUsers -
    topic.previousInterestedUsers;

  return {
    topicId:
      topic.topicId,

    topicSlug:
      topic.topicSlug,

    topicName:
      topic.topicName,

    parentTopicId:
      topic.parentTopicId,

    isSuppressed:
      false,

    totalInterestedUsers:
      topic.totalInterestedUsers,

    previousInterestedUsers:
      topic.previousInterestedUsers,

    activeInterestedUsers:
      topic.activeInterestedUsers,

    audiencePercentage:
      calculateAudiencePercentage(
        topic.totalInterestedUsers,
        topic.totalRegisteredUsers
      ),

    growthCount,

    growthPercentage:
      calculateGrowthPercentage(
        growthCount,
        topic.previousInterestedUsers
      ),

    campaignEligibleUsers:
      topic.campaignEligibleUsers,

    isCampaignEligible:
      topic.campaignEligibleUsers >=
      privacy.minimumCampaignAudience,
  };
}