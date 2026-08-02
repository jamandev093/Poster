import type {
  BusinessIdentityDraftInput,
  BusinessIdentityValidationIssue,
  JsonObject,
} from "./business-identity.types.js";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const POSTER_DOMAIN_PATTERN =
  /(^|\.)getpostar\.com$/i;

function addTextIssue(
  issues:
    BusinessIdentityValidationIssue[],
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
) {
  const value =
    input.value.trim();

  if (
    value.length ===
    0
  ) {
    issues.push({
      field:
        input.field,

      code:
        "required",

      message:
        `${input.label} is required.`,
    });

    return;
  }

  if (
    value.length <
    input.min
  ) {
    issues.push({
      field:
        input.field,

      code:
        "too_short",

      message:
        `${input.label} must contain at least ${input.min} characters.`,
    });
  }

  if (
    value.length >
    input.max
  ) {
    issues.push({
      field:
        input.field,

      code:
        "too_long",

      message:
        `${input.label} cannot exceed ${input.max} characters.`,
    });
  }
}

function validateOptionalText(
  issues:
    BusinessIdentityValidationIssue[],
  field:
    string,
  label:
    string,
  value:
    string | null,
  max:
    number
) {
  if (
    value ===
    null
  ) {
    return;
  }

  if (
    value.trim().length >
    max
  ) {
    issues.push({
      field,

      code:
        "too_long",

      message:
        `${label} cannot exceed ${max} characters.`,
    });
  }
}

function validateUrl(
  issues:
    BusinessIdentityValidationIssue[],
  field:
    string,
  label:
    string,
  value:
    string | null,
  required:
    boolean
) {
  const trimmed =
    value?.trim() ??
    "";

  if (
    trimmed.length ===
    0
  ) {
    if (
      required
    ) {
      issues.push({
        field,

        code:
          "required",

        message:
          `${label} is required.`,
      });
    }

    return;
  }

  try {
    const parsed =
      new URL(
        trimmed
      );

    if (
      parsed.protocol !==
        "https:"
    ) {
      issues.push({
        field,

        code:
          "invalid",

        message:
          `${label} must use HTTPS.`,
      });
    }
  } catch {
    issues.push({
      field,

      code:
        "invalid",

      message:
        `${label} must be a valid URL.`,
    });
  }
}

function validateEmail(
  issues:
    BusinessIdentityValidationIssue[],
  field:
    string,
  label:
    string,
  value:
    string | null,
  required:
    boolean
) {
  const trimmed =
    value?.trim() ??
    "";

  if (
    trimmed.length ===
    0
  ) {
    if (
      required
    ) {
      issues.push({
        field,

        code:
          "required",

        message:
          `${label} is required.`,
      });
    }

    return;
  }

  if (
    !EMAIL_PATTERN.test(
      trimmed
    )
  ) {
    issues.push({
      field,

      code:
        "invalid",

      message:
        `${label} must be a valid email address.`,
    });

    return;
  }

  const domain =
    trimmed.split("@")[1] ??
    "";

  if (
    !POSTER_DOMAIN_PATTERN.test(
      domain
    )
  ) {
    issues.push({
      field,

      code:
        "unsupported",

      message:
        `${label} must use the official getpostar.com domain.`,
    });
  }
}

function isJsonObject(
  value:
    unknown
): value is JsonObject {
  return Boolean(
    value
  ) &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    );
}

export function validateBusinessIdentityDraft(
  input:
    BusinessIdentityDraftInput
): BusinessIdentityValidationIssue[] {
  const issues:
    BusinessIdentityValidationIssue[] =
    [];

  addTextIssue(
    issues,
    {
      field:
        "publicBrandName",

      value:
        input.publicBrandName,

      label:
        "Public brand name",

      min:
        2,

      max:
        120,
    }
  );

  validateOptionalText(
    issues,
    "legalBusinessName",
    "Legal business name",
    input.legalBusinessName,
    180
  );

  validateUrl(
    issues,
    "websiteUrl",
    "Website URL",
    input.websiteUrl,
    true
  );

  validateEmail(
    issues,
    "officialBusinessEmail",
    "Official business email",
    input.officialBusinessEmail,
    true
  );

  validateEmail(
    issues,
    "supportEmail",
    "Support email",
    input.supportEmail,
    false
  );

  validateEmail(
    issues,
    "publisherRelationsEmail",
    "Publisher relations email",
    input.publisherRelationsEmail,
    false
  );

  validateEmail(
    issues,
    "advertisingEmail",
    "Advertising email",
    input.advertisingEmail,
    false
  );

  validateEmail(
    issues,
    "copyrightEmail",
    "Copyright email",
    input.copyrightEmail,
    false
  );

  validateUrl(
    issues,
    "signalUrl",
    "Signal URL",
    input.signalUrl,
    false
  );

  validateOptionalText(
    issues,
    "signalLabel",
    "Signal label",
    input.signalLabel,
    120
  );

  validateUrl(
    issues,
    "copyrightPortalUrl",
    "Copyright Portal URL",
    input.copyrightPortalUrl,
    false
  );

  validateUrl(
    issues,
    "clientPortalUrl",
    "Client Portal URL",
    input.clientPortalUrl,
    false
  );

  if (
    !isJsonObject(
      input.socialLinks
    )
  ) {
    issues.push({
      field:
        "socialLinks",

      code:
        "invalid",

      message:
        "Social links must be a JSON object.",
    });
  }

  return issues;
}