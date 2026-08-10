import type {
  AdvertisingAiCandidateType,
  AdvertisingAiEligibilityFacts,
} from "./advertising-ai.types.js";

import {
  evaluateAdvertisingAiHardEligibility,
} from "./advertising-ai.policy.js";

import type {
  MonetizationCampaignRecord,
  MonetizationPlacement,
} from "../monetization/commercial.types.js";

import {
  PROGRAMMATIC_APPROVED_FRAMES,
  PROGRAMMATIC_APPROVED_SCREENS,
  type ProgrammaticApprovedFrame,
  type ProgrammaticProviderHealthStatus,
  type ProgrammaticProviderStatus,
  type ProgrammaticSlotMappingDraftInput,
} from "../monetization/programmatic.types.js";

import {
  validateProgrammaticSlotMappingDraft,
} from "../monetization/programmatic.validation.js";

export interface AdvertisingAiAuthoritativeRuleDecisions {
  /*
   * These are authoritative decisions produced by the owning
   * business/policy layers.
   *
   * Advertising AI consumes them. It does not reinterpret the
   * Admin JSON rules and cannot override a false decision.
   */
  readonly safetyAllowed:
    boolean;

  readonly regionAllowed:
    boolean;

  readonly deviceAllowed:
    boolean;

  readonly frequencyAllowed:
    boolean;

  /*
   * Supplied by the authoritative Wallet/payment allocation
   * layer. AI never calculates spendable financial balance.
   */
  readonly budgetAvailable:
    boolean;
}

export interface AdvertisingAiProgrammaticRuntimeFacts {
  readonly providerStatus:
    ProgrammaticProviderStatus |
    null;

  readonly providerHealthStatus:
    ProgrammaticProviderHealthStatus |
    null;

  readonly mapping:
    ProgrammaticSlotMappingDraftInput |
    null;
}

export interface AdvertisingAiEligibilityPolicyInput {
  readonly candidateId:
    string;

  readonly candidateType:
    AdvertisingAiCandidateType;

  readonly placement:
    MonetizationPlacement;

  readonly frame:
    ProgrammaticApprovedFrame;

  /*
   * deliveryEligible remains authoritative. The monetization
   * repository already owns active/readiness/commercial/date
   * lifecycle calculation.
   */
  readonly campaign:
    Pick<
      MonetizationCampaignRecord,
      "deliveryEligible" |
      "placements"
    >;

  readonly decisions:
    AdvertisingAiAuthoritativeRuleDecisions;

  /*
   * Direct projection of the user's existing advertising
   * preference state. No user identity enters AI scoring.
   */
  readonly hiddenMonetizationItemIds:
    readonly string[];

  readonly programmatic?:
    AdvertisingAiProgrammaticRuntimeFacts |
    null;
}

export interface AdvertisingAiEligibilityPolicyResult {
  readonly eligible:
    boolean;

  readonly facts:
    AdvertisingAiEligibilityFacts;

  readonly reasonCodes:
    readonly string[];

  readonly policySource:
    "authoritative_policy_v1";
}

function unique(
  values:
    readonly string[]
): string[] {
  return [
    ...new Set(
      values
    ),
  ];
}

function cleanIdentifier(
  value:
    string
): string {
  return value
    .trim();
}

function hasApprovedPlacement(
  placement:
    MonetizationPlacement
): boolean {
  return PROGRAMMATIC_APPROVED_SCREENS
    .includes(
      placement
    );
}

function hasApprovedFrame(
  frame:
    ProgrammaticApprovedFrame
): boolean {
  return PROGRAMMATIC_APPROVED_FRAMES
    .includes(
      frame
    );
}

function evaluateProgrammaticFacts(
  input:
    AdvertisingAiEligibilityPolicyInput
): {
  readonly placementAllowed:
    boolean;

  readonly frameApproved:
    boolean;

  readonly reasonCodes:
    readonly string[];
} {
  if (
    input.candidateType !==
    "programmatic"
  ) {
    return {
      placementAllowed:
        true,

      frameApproved:
        true,

      reasonCodes:
        [],
    };
  }

  const reasons:
    string[] =
    [];

  const runtime =
    input.programmatic ??
    null;

  if (
    runtime === null
  ) {
    return {
      placementAllowed:
        false,

      frameApproved:
        false,

      reasonCodes: [
        "programmatic_runtime_missing",
      ],
    };
  }

  if (
    runtime.providerStatus !==
    "enabled"
  ) {
    reasons.push(
      "programmatic_provider_not_enabled"
    );
  }

  /*
   * Fail-safe runtime policy:
   * only a provider currently reported healthy can enter AI
   * ranking. degraded/unknown/unhealthy providers stay out.
   */
  if (
    runtime.providerHealthStatus !==
    "healthy"
  ) {
    reasons.push(
      "programmatic_provider_not_healthy"
    );
  }

  const mapping =
    runtime.mapping;

  if (
    mapping === null
  ) {
    reasons.push(
      "programmatic_mapping_missing"
    );

    return {
      placementAllowed:
        false,

      frameApproved:
        false,

      reasonCodes:
        reasons,
    };
  }

  if (
    mapping.status !==
    "enabled"
  ) {
    reasons.push(
      "programmatic_mapping_not_enabled"
    );
  }

  if (
    mapping.screen !==
    input.placement
  ) {
    reasons.push(
      "programmatic_screen_mismatch"
    );
  }

  if (
    mapping.frame !==
    input.frame
  ) {
    reasons.push(
      "programmatic_frame_mismatch"
    );
  }

  const mappingIssues =
    validateProgrammaticSlotMappingDraft(
      mapping
    );

  if (
    mappingIssues.length > 0
  ) {
    reasons.push(
      "programmatic_mapping_invalid"
    );
  }

  const placementAllowed =
    runtime.providerStatus ===
      "enabled" &&
    runtime.providerHealthStatus ===
      "healthy" &&
    mapping.status ===
      "enabled" &&
    mapping.screen ===
      input.placement &&
    mappingIssues.length ===
      0;

  const frameApproved =
    mapping.frame ===
      input.frame &&
    hasApprovedFrame(
      input.frame
    ) &&
    mappingIssues.length ===
      0;

  return {
    placementAllowed,
    frameApproved,
    reasonCodes:
      reasons,
  };
}

export function evaluateAdvertisingAiEligibilityPolicy(
  input:
    AdvertisingAiEligibilityPolicyInput
): AdvertisingAiEligibilityPolicyResult {
  const candidateId =
    cleanIdentifier(
      input.candidateId
    );

  if (
    candidateId.length ===
    0
  ) {
    throw new Error(
      "Advertising AI candidate id is required."
    );
  }

  const reasons:
    string[] =
    [];

  const placementApproved =
    hasApprovedPlacement(
      input.placement
    );

  if (
    !placementApproved
  ) {
    reasons.push(
      "surface_not_approved"
    );
  }

  const campaignPlacementAllowed =
    input.campaign
      .placements
      .includes(
        input.placement
      );

  if (
    !campaignPlacementAllowed
  ) {
    reasons.push(
      "campaign_placement_not_allowed"
    );
  }

  const baseFrameApproved =
    hasApprovedFrame(
      input.frame
    );

  if (
    !baseFrameApproved
  ) {
    reasons.push(
      "poster_frame_not_approved"
    );
  }

  const programmatic =
    evaluateProgrammaticFacts(
      input
    );

  reasons.push(
    ...programmatic
      .reasonCodes
  );

  const hidden =
    input
      .hiddenMonetizationItemIds
      .some(
        itemId =>
          cleanIdentifier(
            itemId
          ) ===
          candidateId
      );

  const facts:
    AdvertisingAiEligibilityFacts =
    {
      campaignDeliveryEligible:
        input.campaign
          .deliveryEligible,

      placementAllowed:
        placementApproved &&
        campaignPlacementAllowed &&
        programmatic
          .placementAllowed,

      frameApproved:
        baseFrameApproved &&
        programmatic
          .frameApproved,

      safetyAllowed:
        input.decisions
          .safetyAllowed,

      regionAllowed:
        input.decisions
          .regionAllowed,

      deviceAllowed:
        input.decisions
          .deviceAllowed,

      frequencyAllowed:
        input.decisions
          .frequencyAllowed,

      budgetAvailable:
        input.decisions
          .budgetAvailable,

      notHiddenByUser:
        !hidden,
    };

  const hardDecision =
    evaluateAdvertisingAiHardEligibility(
      facts
    );

  return {
    eligible:
      hardDecision.eligible &&
      reasons.length ===
        0,

    facts,

    reasonCodes:
      unique([
        ...reasons,
        ...hardDecision
          .reasonCodes,
      ]),

    policySource:
      "authoritative_policy_v1",
  };
}