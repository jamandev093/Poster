import type {
  MonetizationPlacement,
} from "../monetization/commercial.types.js";

import type {
  ProgrammaticApprovedFrame,
} from "../monetization/programmatic.types.js";

export const ADVERTISING_AI_CANDIDATE_TYPES = [
  "poster_promotion",
  "direct_sponsorship",
  "affiliate",
  "programmatic",
] as const;

export type AdvertisingAiCandidateType =
  (typeof ADVERTISING_AI_CANDIDATE_TYPES)[number];

export const ADVERTISING_AI_EVENT_TYPES = [
  "impression",
  "view",
  "click",
  "dismiss",
  "hide",
  "report",
  "conversion",
] as const;

export type AdvertisingAiEventType =
  (typeof ADVERTISING_AI_EVENT_TYPES)[number];

export interface AdvertisingAiCandidate {
  readonly candidateId:
    string;

  readonly candidateType:
    AdvertisingAiCandidateType;

  readonly campaignId:
    string |
    null;

  readonly placement:
    MonetizationPlacement;

  readonly frame:
    ProgrammaticApprovedFrame;

  readonly canonicalTopicIds:
    readonly string[];

  readonly evolvingTopicIds:
    readonly string[];

  readonly tags:
    readonly string[];

  /*
   * All numeric values are normalized 0..1 inputs.
   * Financial amounts never enter this generic AI contract.
   */
  readonly basePriority:
    number;

  readonly qualityScore:
    number;

  /*
   * Advertising telemetry only.
   * Never derived from organic Poster Brain engagement.
   */
  readonly advertisingPerformanceScore:
    number;

  readonly valueScore:
    number;
}

export interface AdvertisingAiRequestContext {
  readonly placement:
    MonetizationPlacement;

  readonly frame:
    ProgrammaticApprovedFrame;

  readonly canonicalTopicIds:
    readonly string[];

  readonly evolvingTopicIds:
    readonly string[];

  readonly tags:
    readonly string[];

  readonly query:
    string |
    null;

  /*
   * Personalization is an explicit consent/preference fact.
   * No user id is exposed to the scorer.
   */
  readonly personalizedAdsEnabled:
    boolean;

  readonly selectedInterestTopicIds:
    readonly string[];
}

export interface AdvertisingAiEligibilityFacts {
  /*
   * Authoritative campaign lifecycle / commercial decision.
   */
  readonly campaignDeliveryEligible:
    boolean;

  readonly placementAllowed:
    boolean;

  readonly frameApproved:
    boolean;

  readonly safetyAllowed:
    boolean;

  readonly regionAllowed:
    boolean;

  readonly deviceAllowed:
    boolean;

  readonly frequencyAllowed:
    boolean;

  readonly budgetAvailable:
    boolean;

  readonly notHiddenByUser:
    boolean;
}

export interface AdvertisingAiScoreRequest {
  readonly candidate:
    AdvertisingAiCandidate;

  readonly context:
    AdvertisingAiRequestContext;

  readonly eligibility:
    AdvertisingAiEligibilityFacts;
}

export interface AdvertisingAiScoreComponents {
  readonly contextualRelevance:
    number;

  readonly personalization:
    number;

  readonly quality:
    number;

  readonly advertisingPerformance:
    number;

  readonly value:
    number;

  readonly basePriority:
    number;
}

export type AdvertisingAiScoringEngine =
  | "deterministic_fallback_v1"
  | "promoted_model_v1";

export interface AdvertisingAiScoreResult {
  readonly candidateId:
    string;

  readonly eligible:
    boolean;

  readonly score:
    number;

  readonly components:
    AdvertisingAiScoreComponents;

  readonly reasonCodes:
    readonly string[];

  readonly engine:
    AdvertisingAiScoringEngine;

  readonly modelVersion:
    string |
    null;

  readonly learningDomain:
    "advertising";
}

export interface AdvertisingAiLearningSignal {
  readonly domain:
    "advertising";

  readonly eventType:
    AdvertisingAiEventType;

  readonly candidateId:
    string;

  readonly campaignId:
    string |
    null;

  readonly placement:
    MonetizationPlacement;

  readonly occurredAt:
    string;
}