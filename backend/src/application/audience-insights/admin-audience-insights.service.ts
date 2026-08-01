import {
  applyAudiencePrivacyPolicy,
  AUDIENCE_ACTIVE_WINDOW_DAYS,
  readAudienceInsightTopics,
  readAudiencePrivacySettings,
  type AudienceInsightsSnapshot,
} from "../../domains/audience-insights/index.js";

export interface AdminAudienceInsightsService {
  getSnapshot:
    () => Promise<
      AudienceInsightsSnapshot
    >;
}

export interface AdminAudienceInsightsServiceDependencies {
  readTopics:
    typeof readAudienceInsightTopics;

  readPrivacy:
    typeof readAudiencePrivacySettings;

  now:
    () => Date;
}

export interface CreateAdminAudienceInsightsServiceOptions {
  dependencies?:
    Partial<
      AdminAudienceInsightsServiceDependencies
    >;
}

function subtractDays(
  value: Date,
  days: number
): Date {
  return new Date(
    value.getTime() -
      days *
        24 *
        60 *
        60 *
        1000
  );
}

export function createAdminAudienceInsightsService(
  options:
    CreateAdminAudienceInsightsServiceOptions =
    {}
): AdminAudienceInsightsService {
  const dependencies:
    AdminAudienceInsightsServiceDependencies = {
    readTopics:
      readAudienceInsightTopics,

    readPrivacy:
      readAudiencePrivacySettings,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  return {
    getSnapshot:
      async () => {
        const generatedAt =
          dependencies.now();

        if (
          !Number.isFinite(
            generatedAt.getTime()
          )
        ) {
          throw new Error(
            "Audience Insights generation time is invalid."
          );
        }

        const activeSince =
          subtractDays(
            generatedAt,
            AUDIENCE_ACTIVE_WINDOW_DAYS
          );

        const [
          privacy,
          topicRecords,
        ] =
          await Promise.all([
            dependencies.readPrivacy(),

            dependencies.readTopics({
              observedAt:
                generatedAt,

              activeSince,
            }),
          ]);

        const topics =
          topicRecords.map(
            topic =>
              applyAudiencePrivacyPolicy(
                topic,
                privacy
              )
          );

        return {
          generatedAt,

          activeWindowDays:
            AUDIENCE_ACTIVE_WINDOW_DAYS,

          privacy: {
            minimumReportableAudience:
              privacy.minimumReportableAudience,

            minimumCampaignAudience:
              privacy.minimumCampaignAudience,
          },

          topics,
        };
      },
  };
}
