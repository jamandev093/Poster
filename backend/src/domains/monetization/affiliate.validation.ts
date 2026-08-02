import {
  AFFILIATE_COMMISSION_MODELS,
  AFFILIATE_DISCLOSURE,
  AFFILIATE_PAYOUT_READINESS_STATUSES,
  AFFILIATE_TRACKING_STATUSES,
  type AffiliateMetadataDraftInput,
  type AffiliateValidationIssue,
} from "./affiliate.types.js";

const NAME_MIN_LENGTH =
  2;

const NAME_MAX_LENGTH =
  160;

const URL_MAX_LENGTH =
  2048;

const ROW_VERSION_PATTERN =
  /^(0|[1-9]\d*)$/;

function isHttpUrl(
  value:
    string
): boolean {
  try {
    const parsed =
      new URL(
        value
      );

    return (
      parsed.protocol ===
        "https:" ||
      parsed.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

function validateRequiredText(
  input: {
    field:
      string;

    value:
      string;

    label:
      string;

    min:
      number;

    max:
      number;
  }
): AffiliateValidationIssue[] {
  const value =
    input.value.trim();

  if (
    value.length ===
    0
  ) {
    return [
      {
        field:
          input.field,

        code:
          "required",

        message:
          `${input.label} is required.`,
      },
    ];
  }

  if (
    value.length <
    input.min
  ) {
    return [
      {
        field:
          input.field,

        code:
          "too_short",

        message:
          `${input.label} must contain at least ${input.min} characters.`,
      },
    ];
  }

  if (
    value.length >
    input.max
  ) {
    return [
      {
        field:
          input.field,

        code:
          "too_long",

        message:
          `${input.label} cannot exceed ${input.max} characters.`,
      },
    ];
  }

  return [];
}

export function validateAffiliateMetadataDraft(
  input:
    AffiliateMetadataDraftInput
): AffiliateValidationIssue[] {
  const issues:
    AffiliateValidationIssue[] =
    [];

  issues.push(
    ...validateRequiredText({
      field:
        "partnerName",

      value:
        input.partnerName,

      label:
        "The affiliate partner name",

      min:
        NAME_MIN_LENGTH,

      max:
        NAME_MAX_LENGTH,
    }),
    ...validateRequiredText({
      field:
        "offerName",

      value:
        input.offerName,

      label:
        "The affiliate offer name",

      min:
        NAME_MIN_LENGTH,

      max:
        NAME_MAX_LENGTH,
    })
  );

  const destinationUrl =
    input.destinationUrl.trim();

  if (
    destinationUrl.length ===
    0
  ) {
    issues.push({
      field:
        "destinationUrl",

      code:
        "required",

      message:
        "The affiliate destination URL is required.",
    });
  } else if (
    destinationUrl.length >
      URL_MAX_LENGTH ||
    !isHttpUrl(
      destinationUrl
    )
  ) {
    issues.push({
      field:
        "destinationUrl",

      code:
        "invalid",

      message:
        "The affiliate destination URL must be a valid HTTP or HTTPS URL.",
    });
  }

  if (
    input.disclosure !==
    AFFILIATE_DISCLOSURE
  ) {
    issues.push({
      field:
        "disclosure",

      code:
        "unsupported",

      message:
        "Affiliate campaigns must use the required affiliate disclosure.",
    });
  }

  if (
    !AFFILIATE_COMMISSION_MODELS.includes(
      input.commissionModel
    )
  ) {
    issues.push({
      field:
        "commissionModel",

      code:
        "unsupported",

      message:
        "The affiliate commission model is not supported.",
    });
  }

  if (
    !AFFILIATE_TRACKING_STATUSES.includes(
      input.trackingStatus
    )
  ) {
    issues.push({
      field:
        "trackingStatus",

      code:
        "unsupported",

      message:
        "The affiliate tracking status is not supported.",
    });
  }

  if (
    input.trackingUrl !==
      null &&
    (
      input.trackingUrl.trim().length >
        URL_MAX_LENGTH ||
      !isHttpUrl(
        input.trackingUrl.trim()
      )
    )
  ) {
    issues.push({
      field:
        "trackingUrl",

      code:
        "invalid",

      message:
        "The affiliate tracking URL must be null or a valid HTTP or HTTPS URL.",
    });
  }

  if (
    !AFFILIATE_PAYOUT_READINESS_STATUSES.includes(
      input.payoutReadinessStatus
    )
  ) {
    issues.push({
      field:
        "payoutReadinessStatus",

      code:
        "unsupported",

      message:
        "The affiliate payout readiness status is not supported.",
    });
  }

  return issues;
}

export function validateAffiliateExpectedRowVersion(
  expectedRowVersion:
    string
): AffiliateValidationIssue[] {
  if (
    ROW_VERSION_PATTERN.test(
      expectedRowVersion
    )
  ) {
    return [];
  }

  return [
    {
      field:
        "expectedRowVersion",

      code:
        "invalid",

      message:
        "The expected affiliate metadata row version is invalid.",
    },
  ];
}