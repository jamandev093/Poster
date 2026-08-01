import type {
  AdminUserMetricsResponse,
} from "./users-metrics.types";

const USERS_METRICS_ENDPOINT =
  "/api/v1/admin/users/metrics";

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

function parseResponse(
  value: unknown
): AdminUserMetricsResponse {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "The Backend returned an invalid user-metrics response."
    );
  }

  const response =
    value as Partial<AdminUserMetricsResponse>;

  if (
    typeof response.generatedAt !== "string" ||
    !response.windows ||
    !response.metrics ||
    !isNonNegativeInteger(
      response.windows.dailyActiveHours
    ) ||
    !isNonNegativeInteger(
      response.windows.monthlyActiveDays
    ) ||
    !isNonNegativeInteger(
      response.windows.liveActiveMinutes
    ) ||
    !isNonNegativeInteger(
      response.metrics.totalUsers
    ) ||
    !isNonNegativeInteger(
      response.metrics.dailyActiveUsers
    ) ||
    !isNonNegativeInteger(
      response.metrics.monthlyActiveUsers
    ) ||
    !isNonNegativeInteger(
      response.metrics.liveActiveUsers
    )
  ) {
    throw new Error(
      "The Backend returned incomplete user metrics."
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
      "The Backend returned an invalid metrics timestamp."
    );
  }

  return response as AdminUserMetricsResponse;
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
    // Use the status-based fallback below.
  }

  if (
    response.status === 401
  ) {
    return "Your Admin session has expired. Sign in again.";
  }

  if (
    response.status === 403
  ) {
    return "You do not have permission to read user metrics.";
  }

  return `User metrics could not be loaded (${response.status}).`;
}

export async function fetchUsersMetrics(
  signal?: AbortSignal
): Promise<AdminUserMetricsResponse> {
  const response =
    await fetch(
      USERS_METRICS_ENDPOINT,
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
