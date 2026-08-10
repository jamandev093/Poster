import type {
  PosterBrainOfficialApiProviderManifest,
} from "./official-api-provider-manifest.types.js";

export type PosterBrainOfficialApiActivationReason =
  | "active"
  | "manifest_disabled"
  | "missing_credentials"
  | "technical_validation_pending"
  | "rights_review_pending"
  | "rights_blocked"
  | "commercial_review_pending"
  | "commercial_use_restricted";

export interface PosterBrainOfficialApiActivationResult {
  readonly active:
    boolean;

  readonly reason:
    PosterBrainOfficialApiActivationReason;

  readonly missingEnvironmentKeys:
    readonly string[];
}

function requiredEnvironmentKeys(
  manifest:
    PosterBrainOfficialApiProviderManifest
): readonly string[] {
  return manifest.auth.type ===
    "none"
    ? []
    : [
        manifest.auth
          .environmentKey,
      ];
}

export function evaluatePosterBrainOfficialApiProviderActivation(
  input: {
    readonly manifest:
      PosterBrainOfficialApiProviderManifest;

    readonly environment?:
      Readonly<
        Record<
          string,
          string | undefined
        >
      >;
  }
): PosterBrainOfficialApiActivationResult {
  const environment =
    input.environment ??
    process.env;

  if (
    !input.manifest
      .activation
      .enabled
  ) {
    return {
      active:
        false,

      reason:
        "manifest_disabled",

      missingEnvironmentKeys:
        [],
    };
  }

  const missing =
    requiredEnvironmentKeys(
      input.manifest
    ).filter(
      key => {
        const value =
          environment[key];

        return (
          value === undefined ||
          value.trim().length ===
            0
        );
      }
    );

  if (missing.length > 0) {
    return {
      active:
        false,

      reason:
        "missing_credentials",

      missingEnvironmentKeys:
        missing,
    };
  }

  if (
    input.manifest
      .activation
      .technicalStatus !==
    "validated"
  ) {
    return {
      active:
        false,

      reason:
        "technical_validation_pending",

      missingEnvironmentKeys:
        [],
    };
  }

  if (
    input.manifest
      .activation
      .rightsStatus ===
    "blocked"
  ) {
    return {
      active:
        false,

      reason:
        "rights_blocked",

      missingEnvironmentKeys:
        [],
    };
  }

  if (
    input.manifest
      .activation
      .rightsStatus !==
    "approved"
  ) {
    return {
      active:
        false,

      reason:
        "rights_review_pending",

      missingEnvironmentKeys:
        [],
    };
  }

  if (
    input.manifest
      .activation
      .commercialUseStatus ===
    "restricted"
  ) {
    return {
      active:
        false,

      reason:
        "commercial_use_restricted",

      missingEnvironmentKeys:
        [],
    };
  }

  if (
    input.manifest
      .activation
      .commercialUseStatus !==
    "approved"
  ) {
    return {
      active:
        false,

      reason:
        "commercial_review_pending",

      missingEnvironmentKeys:
        [],
    };
  }

  return {
    active:
      true,

    reason:
      "active",

    missingEnvironmentKeys:
      [],
  };
}