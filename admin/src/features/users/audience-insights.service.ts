import type {
  AdminAudienceInsightsResponse,
  AdminAudienceInsightTopic,
} from "./audience-insights.types";

const AUDIENCE_INSIGHTS_ENDPOINT =
  "/api/v1/admin/users/audience-insights";

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

function isNonNegativeInteger(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isNullableNonNegativeInteger(
  value: unknown
): value is number | null {
  return (
    value === null ||
    isNonNegativeInteger(
      value
    )
  );
}

function isNullablePercentage(
  value: unknown
): value is number | null {
  return (
    value === null ||
    (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100
    )
  );
}

function parseTopic(
  value: unknown
): AdminAudienceInsightTopic {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "The Backend returned an invalid audience topic."
    );
  }

  const topic =
    value as Partial<AdminAudienceInsightTopic>;

  if (
    typeof topic.topicId !== "string" ||
    typeof topic.topicSlug !== "string" ||
    typeof topic.topicName !== "string" ||
    !(
      topic.parentTopicId === null ||
      typeof topic.parentTopicId === "string"
    ) ||
    typeof topic.isSuppressed !== "boolean" ||
    !isNullableNonNegativeInteger(
      topic.totalInterestedUsers
    ) ||
    !isNullableNonNegativeInteger(
      topic.previousInterestedUsers
    ) ||
    !isNullableNonNegativeInteger(
      topic.activeInterestedUsers
    ) ||
    !isNullablePercentage(
      topic.audiencePercentage
    ) ||
    !(
      topic.growthCount === null ||
      (
        typeof topic.growthCount === "number" &&
        Number.isSafeInteger(
          topic.growthCount
        )
      )
    ) ||
    !(
      topic.growthPercentage === null ||
      (
        typeof topic.growthPercentage === "number" &&
        Number.isFinite(
          topic.growthPercentage
        )
      )
    ) ||
    !isNullableNonNegativeInteger(
      topic.campaignEligibleUsers
    ) ||
    typeof topic.isCampaignEligible !== "boolean"
  ) {
    throw new Error(
      "The Backend returned incomplete audience topic data."
    );
  }

  if (
    topic.isSuppressed &&
    (
      topic.totalInterestedUsers !== null ||
      topic.previousInterestedUsers !== null ||
      topic.activeInterestedUsers !== null ||
      topic.audiencePercentage !== null ||
      topic.growthCount !== null ||
      topic.growthPercentage !== null ||
      topic.campaignEligibleUsers !== null ||
      topic.isCampaignEligible
    )
  ) {
    throw new Error(
      "The Backend returned an invalid privacy-suppressed topic."
    );
  }

  return topic as AdminAudienceInsightTopic;
}

function parseResponse(
  value: unknown
): AdminAudienceInsightsResponse {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "The Backend returned an invalid Audience Insights response."
    );
  }

  const response =
    value as Partial<AdminAudienceInsightsResponse>;

  if (
    typeof response.generatedAt !== "string" ||
    !isNonNegativeInteger(
      response.activeWindowDays
    ) ||
    !response.privacy ||
    !isNonNegativeInteger(
      response.privacy.minimumReportableAudience
    ) ||
    !isNonNegativeInteger(
      response.privacy.minimumCampaignAudience
    ) ||
    !Array.isArray(
      response.topics
    )
  ) {
    throw new Error(
      "The Backend returned incomplete Audience Insights."
    );
  }

  const generatedAt =
    new Date(
      response.generatedAt
    );

  if (
    !Number.isFinite(
      generatedAt.getTime()
    )
  ) {
    throw new Error(
      "The Backend returned an invalid Audience Insights timestamp."
    );
  }

  return {
    generatedAt:
      response.generatedAt,

    activeWindowDays:
      response.activeWindowDays,

    privacy:
      response.privacy,

    topics:
      response.topics.map(
        parseTopic
      ),
  };
}

async function readErrorMessage(
  response: Response
): Promise<string> {
  try {
    const body =
      await response.json() as ApiErrorResponse;

    if (
      body.error?.message
    ) {
      return body.error.message;
    }

    if (
      body.error?.code
    ) {
      return `Request failed: ${body.error.code}.`;
    }
  } catch {
    // Use the status-based fallback.
  }

  if (
    response.status === 401
  ) {
    return "Your Admin session has expired. Sign in again.";
  }

  if (
    response.status === 403
  ) {
    return "You do not have permission to read Audience Insights.";
  }

  return `Audience Insights could not be loaded (${response.status}).`;
}

export async function fetchAudienceInsights(
  signal?: AbortSignal
): Promise<AdminAudienceInsightsResponse> {
  const response =
    await fetch(
      AUDIENCE_INSIGHTS_ENDPOINT,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        signal,
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await readErrorMessage(
        response
      )
    );
  }

  return parseResponse(
    await response.json()
  );
}
