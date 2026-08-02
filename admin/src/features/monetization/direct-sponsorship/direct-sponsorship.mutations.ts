import type {
  AdminCampaign,
} from "../campaigns/campaign-api";

export type DirectSponsorshipTransitionAction =
  | "schedule"
  | "activate"
  | "pause"
  | "resume"
  | "end"
  | "disable";

export interface TransitionDirectSponsorshipInput {
  campaignId: string;

  expectedRowVersion: string;

  action:
    DirectSponsorshipTransitionAction;

  reason: string;
}

interface CampaignMutationResponse {
  campaign:
    AdminCampaign;
}

interface ApiErrorIssue {
  path?: unknown;

  message?: unknown;
}

interface ApiErrorBody {
  error?: {
    code?: unknown;

    message?: unknown;

    details?: unknown;
  };
}

export class DirectSponsorshipMutationError
  extends Error {
  readonly code:
    string;

  readonly status:
    number;

  readonly details:
    readonly {
      path: string;

      message: string;
    }[];

  constructor(
    input: {
      code: string;

      message: string;

      status: number;

      details?: readonly {
        path: string;

        message: string;
      }[];
    }
  ) {
    super(
      input.message
    );

    this.name =
      "DirectSponsorshipMutationError";

    this.code =
      input.code;

    this.status =
      input.status;

    this.details =
      input.details ??
      [];
  }
}

function isRecord(
  value: unknown
): value is
  Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  );
}

function isCampaign(
  value: unknown
): value is
  AdminCampaign {
  if (
    !isRecord(
      value
    )
  ) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.campaignReference ===
      "string" &&
    typeof value.name ===
      "string" &&
    value.campaignType ===
      "direct_sponsorship" &&
    typeof value.status ===
      "string" &&
    Array.isArray(
      value.placements
    ) &&
    typeof value.rowVersion ===
      "string"
  );
}

function parseMutationResponse(
  value: unknown
): CampaignMutationResponse {
  if (
    !isRecord(
      value
    ) ||
    !isCampaign(
      value.campaign
    )
  ) {
    throw new DirectSponsorshipMutationError({
      code:
        "INVALID_CAMPAIGN_RESPONSE",

      message:
        "The Direct Sponsorship API returned an invalid campaign response.",

      status:
        502,
    });
  }

  return {
    campaign:
      value.campaign,
  };
}

function parseErrorDetails(
  value: unknown
): readonly {
  path: string;

  message: string;
}[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value.flatMap(
    item => {
      if (
        !isRecord(
          item
        )
      ) {
        return [];
      }

      const issue =
        item as
          ApiErrorIssue;

      if (
        typeof issue.path !==
          "string" ||
        typeof issue.message !==
          "string"
      ) {
        return [];
      }

      return [
        {
          path:
            issue.path,

          message:
            issue.message,
        },
      ];
    }
  );
}

async function createMutationError(
  response:
    Response
): Promise<
  DirectSponsorshipMutationError
> {
  let code =
    "CAMPAIGN_MUTATION_FAILED";

  let message =
    `Campaign operation failed (${response.status}).`;

  let details:
    readonly {
      path: string;

      message: string;
    }[] =
      [];

  try {
    const body =
      await response.json() as
        ApiErrorBody;

    if (
      typeof body.error?.code ===
      "string"
    ) {
      code =
        body.error.code;
    }

    if (
      typeof body.error?.message ===
      "string"
    ) {
      message =
        body.error.message;
    }

    details =
      parseErrorDetails(
        body.error?.details
      );
  } catch {
    // Preserve the safe fallback.
  }

  if (
    response.status ===
    401
  ) {
    message =
      "Your Admin session has expired. Sign in again.";
  } else if (
    response.status ===
    403
  ) {
    message =
      "You do not have permission to manage campaigns.";
  } else if (
    response.status ===
      409 &&
    code ===
      "CAMPAIGN_VERSION_CONFLICT"
  ) {
    message =
      "This campaign changed after it was loaded. Refresh the campaign and try again.";
  }

  return new DirectSponsorshipMutationError({
    code,

    message,

    status:
      response.status,

    details,
  });
}

export async function transitionDirectSponsorship(
  input:
    TransitionDirectSponsorshipInput
): Promise<
  AdminCampaign
> {
  const response =
    await fetch(
      `/api/v1/admin/monetization/campaigns/${encodeURIComponent(
        input.campaignId
      )}/transitions`,
      {
        method:
          "POST",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            expectedRowVersion:
              input.expectedRowVersion,

            action:
              input.action,

            reason:
              input.reason.trim(),
          }),
      }
    );

  if (
    !response.ok
  ) {
    throw await createMutationError(
      response
    );
  }

  const result =
    parseMutationResponse(
      await response.json()
    );

  return result.campaign;
}

export function getTransitionErrorMessage(
  error: unknown
): string {
  if (
    error instanceof
    DirectSponsorshipMutationError
  ) {
    return error.message;
  }

  if (
    error instanceof
      Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "The Direct Sponsorship operation could not be completed.";
}