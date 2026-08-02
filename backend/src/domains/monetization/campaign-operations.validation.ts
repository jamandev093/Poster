import {
  MONETIZATION_PLACEMENTS,
  type MonetizationPlacement,
} from "./commercial.types.js";

import type {
  CampaignOperationValidationIssue,
  CampaignScheduleInput,
  UpdateCampaignOperationsInput,
} from "./campaign-operations.types.js";

const CAMPAIGN_NAME_MIN_LENGTH = 3;
const CAMPAIGN_NAME_MAX_LENGTH = 160;
const CAMPAIGN_REASON_MAX_LENGTH = 1000;

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const ROW_VERSION_PATTERN =
  /^(0|[1-9]\d*)$/;

function isValidIsoDate(
  value: string
): boolean {
  if (
    !ISO_DATE_PATTERN.test(
      value
    )
  ) {
    return false;
  }

  const parsed =
    new Date(
      `${value}T00:00:00.000Z`
    );

  return (
    !Number.isNaN(
      parsed.getTime()
    ) &&
    parsed
      .toISOString()
      .slice(
        0,
        10
      ) === value
  );
}

export function validateCampaignSchedule(
  input: CampaignScheduleInput
): CampaignOperationValidationIssue[] {
  const issues:
    CampaignOperationValidationIssue[] =
    [];

  if (
    !isValidIsoDate(
      input.scheduledStartDate
    )
  ) {
    issues.push({
      field:
        "scheduledStartDate",
      code:
        "invalid",
      message:
        "The campaign start date must be a valid ISO calendar date.",
    });
  }

  if (
    !isValidIsoDate(
      input.scheduledEndDate
    )
  ) {
    issues.push({
      field:
        "scheduledEndDate",
      code:
        "invalid",
      message:
        "The campaign end date must be a valid ISO calendar date.",
    });
  }

  if (
    issues.length === 0 &&
    input.scheduledEndDate <
      input.scheduledStartDate
  ) {
    issues.push({
      field:
        "scheduledEndDate",
      code:
        "date_order",
      message:
        "The campaign end date cannot be earlier than the start date.",
    });
  }

  return issues;
}

export function validateCampaignPlacements(
  placements:
    readonly MonetizationPlacement[]
): CampaignOperationValidationIssue[] {
  const issues:
    CampaignOperationValidationIssue[] =
    [];

  if (
    placements.length === 0
  ) {
    issues.push({
      field:
        "placements",
      code:
        "required",
      message:
        "At least one Poster placement is required.",
    });

    return issues;
  }

  const seen =
    new Set<
      MonetizationPlacement
    >();

  for (
    const placement of
      placements
  ) {
    if (
      !MONETIZATION_PLACEMENTS.includes(
        placement
      )
    ) {
      issues.push({
        field:
          "placements",
        code:
          "unsupported",
        message:
          `The placement "${placement}" is not supported.`,
      });

      continue;
    }

    if (
      seen.has(
        placement
      )
    ) {
      issues.push({
        field:
          "placements",
        code:
          "duplicate",
        message:
          `The placement "${placement}" is duplicated.`,
      });

      continue;
    }

    seen.add(
      placement
    );
  }

  return issues;
}

export function validateExpectedRowVersion(
  expectedRowVersion: string
): CampaignOperationValidationIssue[] {
  if (
    !ROW_VERSION_PATTERN.test(
      expectedRowVersion
    )
  ) {
    return [
      {
        field:
          "expectedRowVersion",
        code:
          "invalid",
        message:
          "The expected campaign row version is invalid.",
      },
    ];
  }

  return [];
}

export function validateCampaignReason(
  reason:
    string |
    null
): CampaignOperationValidationIssue[] {
  if (
    reason === null
  ) {
    return [];
  }

  if (
    reason.trim().length === 0
  ) {
    return [
      {
        field:
          "reason",
        code:
          "invalid",
        message:
          "The campaign operation reason cannot contain only whitespace.",
      },
    ];
  }

  if (
    reason.trim().length >
      CAMPAIGN_REASON_MAX_LENGTH
  ) {
    return [
      {
        field:
          "reason",
        code:
          "too_long",
        message:
          `The campaign operation reason cannot exceed ${CAMPAIGN_REASON_MAX_LENGTH} characters.`,
      },
    ];
  }

  return [];
}

export function validateCampaignOperationsUpdate(
  input: UpdateCampaignOperationsInput
): CampaignOperationValidationIssue[] {
  const issues:
    CampaignOperationValidationIssue[] =
    [];

  const normalizedName =
    input.name.trim();

  if (
    normalizedName.length <
      CAMPAIGN_NAME_MIN_LENGTH
  ) {
    issues.push({
      field:
        "name",
      code:
        "too_short",
      message:
        `The campaign name must contain at least ${CAMPAIGN_NAME_MIN_LENGTH} characters.`,
    });
  }

  if (
    normalizedName.length >
      CAMPAIGN_NAME_MAX_LENGTH
  ) {
    issues.push({
      field:
        "name",
      code:
        "too_long",
      message:
        `The campaign name cannot exceed ${CAMPAIGN_NAME_MAX_LENGTH} characters.`,
    });
  }

  issues.push(
    ...validateCampaignPlacements(
      input.placements
    ),
    ...validateCampaignSchedule(
      input
    ),
    ...validateExpectedRowVersion(
      input.expectedRowVersion
    ),
    ...validateCampaignReason(
      input.reason
    )
  );

  return issues;
}