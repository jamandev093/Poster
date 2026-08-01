export const DEFAULT_AUDIENCE_PRIVACY_SETTING_KEY =
  "default";

export const AUDIENCE_ACTIVE_WINDOW_DAYS =
  30;

export interface AudiencePrivacySettingsRecord {
  settingKey: string;

  minimumReportableAudience: number;

  minimumCampaignAudience: number;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface AudienceInsightTopicCounts {
  totalInterestedUsers: number;

  previousInterestedUsers: number;

  activeInterestedUsers: number;

  campaignEligibleUsers: number;
}

export interface AudienceInsightTopicRecord
  extends AudienceInsightTopicCounts {
  topicId: string;

  topicSlug: string;

  topicName: string;

  parentTopicId:
    string |
    null;

  totalRegisteredUsers: number;
}

export interface AudienceInsightTopicSnapshot {
  topicId: string;

  topicSlug: string;

  topicName: string;

  parentTopicId:
    string |
    null;

  isSuppressed: boolean;

  totalInterestedUsers:
    number |
    null;

  previousInterestedUsers:
    number |
    null;

  activeInterestedUsers:
    number |
    null;

  audiencePercentage:
    number |
    null;

  growthCount:
    number |
    null;

  growthPercentage:
    number |
    null;

  campaignEligibleUsers:
    number |
    null;

  isCampaignEligible: boolean;
}

export interface AudienceInsightsSnapshot {
  generatedAt: Date;

  activeWindowDays: number;

  privacy: {
    minimumReportableAudience: number;

    minimumCampaignAudience: number;
  };

  topics:
    AudienceInsightTopicSnapshot[];
}

export interface ReadAudienceInsightTopicsInput {
  observedAt: Date;

  activeSince: Date;
}

export function assertAudiencePrivacyThreshold(
  value: number,
  label: string
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 10 ||
    value > 1_000_000
  ) {
    throw new RangeError(
      `${label} must be an integer between 10 and 1000000.`
    );
  }

  return value;
}