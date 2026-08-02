import {
  PROGRAMMATIC_APPROVED_FRAMES,
  PROGRAMMATIC_APPROVED_SCREENS,
  PROGRAMMATIC_MAPPING_STATUSES,
  PROGRAMMATIC_PROVIDER_HEALTH_STATUSES,
  PROGRAMMATIC_PROVIDER_STATUSES,
  type ProgrammaticProviderDraftInput,
  type ProgrammaticSlotMappingDraftInput,
  type ProgrammaticValidationIssue,
} from "./programmatic.types.js";

const KEY_PATTERN =
  /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BLOCKED_FRAME_WORDS = [
  "banner",
  "popup",
  "pop_up",
  "interstitial",
  "overlay",
  "floating",
  "vertical",
  "story",
  "reel",
];

function validateText(
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
): ProgrammaticValidationIssue[] {
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

export function validateProgrammaticProviderDraft(
  input:
    ProgrammaticProviderDraftInput
): ProgrammaticValidationIssue[] {
  const issues:
    ProgrammaticValidationIssue[] =
    [];

  issues.push(
    ...validateText({
      field:
        "providerKey",

      value:
        input.providerKey,

      label:
        "The provider key",

      min:
        3,

      max:
        64,
    }),
    ...validateText({
      field:
        "displayName",

      value:
        input.displayName,

      label:
        "The provider display name",

      min:
        2,

      max:
        160,
    })
  );

  if (
    !KEY_PATTERN.test(
      input.providerKey.trim()
    )
  ) {
    issues.push({
      field:
        "providerKey",

      code:
        "invalid",

      message:
        "The provider key must use lowercase letters, numbers, hyphen, or underscore.",
    });
  }

  if (
    !PROGRAMMATIC_PROVIDER_STATUSES.includes(
      input.status
    )
  ) {
    issues.push({
      field:
        "status",

      code:
        "unsupported",

      message:
        "The provider status is not supported.",
    });
  }

  if (
    !PROGRAMMATIC_PROVIDER_HEALTH_STATUSES.includes(
      input.healthStatus
    )
  ) {
    issues.push({
      field:
        "healthStatus",

      code:
        "unsupported",

      message:
        "The provider health status is not supported.",
    });
  }

  if (
    input.notes !==
      null &&
    input.notes.trim().length >
      2000
  ) {
    issues.push({
      field:
        "notes",

      code:
        "too_long",

      message:
        "Provider notes cannot exceed 2000 characters.",
    });
  }

  return issues;
}

export function validateProgrammaticSlotMappingDraft(
  input:
    ProgrammaticSlotMappingDraftInput
): ProgrammaticValidationIssue[] {
  const issues:
    ProgrammaticValidationIssue[] =
    [];

  if (
    !UUID_PATTERN.test(
      input.providerId
    )
  ) {
    issues.push({
      field:
        "providerId",

      code:
        "invalid",

      message:
        "The provider id is invalid.",
    });
  }

  if (
    !PROGRAMMATIC_APPROVED_SCREENS.includes(
      input.screen
    )
  ) {
    issues.push({
      field:
        "screen",

      code:
        "unsupported",

      message:
        "The screen is not approved for programmatic placement.",
    });
  }

  issues.push(
    ...validateText({
      field:
        "placement",

      value:
        input.placement,

      label:
        "The placement key",

      min:
        2,

      max:
        80,
    })
  );

  if (
    !PROGRAMMATIC_APPROVED_FRAMES.includes(
      input.frame
    )
  ) {
    issues.push({
      field:
        "frame",

      code:
        "unsupported",

      message:
        "Only existing Poster-approved sponsored frames are allowed.",
    });
  }

  if (
    BLOCKED_FRAME_WORDS.some(
      word =>
        input.frame.includes(
          word
        ) ||
        input.placement
          .toLowerCase()
          .includes(
            word
          )
    )
  ) {
    issues.push({
      field:
        "frame",

      code:
        "unsupported",

      message:
        "Programmatic cannot use banners, popups, interstitials, overlays, floating ads, vertical creative, or provider-created placements.",
    });
  }

  if (
    !PROGRAMMATIC_MAPPING_STATUSES.includes(
      input.status
    )
  ) {
    issues.push({
      field:
        "status",

      code:
        "unsupported",

      message:
        "The mapping status is not supported.",
    });
  }

  return issues;
}