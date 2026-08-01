export interface AdminAudienceInsightTopic {
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

export interface AdminAudienceInsightsResponse {
  generatedAt: string;

  activeWindowDays: number;

  privacy: {
    minimumReportableAudience: number;

    minimumCampaignAudience: number;
  };

  topics:
    AdminAudienceInsightTopic[];
}