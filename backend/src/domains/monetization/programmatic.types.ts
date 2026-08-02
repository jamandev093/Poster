import type {
  JsonObject,
} from "./commercial.types.js";

export const PROGRAMMATIC_PROVIDER_STATUSES = [
  "disabled",
  "enabled",
  "paused",
] as const;

export type ProgrammaticProviderStatus =
  (typeof PROGRAMMATIC_PROVIDER_STATUSES)[number];

export const PROGRAMMATIC_PROVIDER_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
] as const;

export type ProgrammaticProviderHealthStatus =
  (typeof PROGRAMMATIC_PROVIDER_HEALTH_STATUSES)[number];

export const PROGRAMMATIC_APPROVED_FRAMES = [
  "full_width_sponsored_card",
  "three_card_sponsored_frame",
] as const;

export type ProgrammaticApprovedFrame =
  (typeof PROGRAMMATIC_APPROVED_FRAMES)[number];

export const PROGRAMMATIC_APPROVED_SCREENS = [
  "home",
  "search",
  "trending",
] as const;

export type ProgrammaticApprovedScreen =
  (typeof PROGRAMMATIC_APPROVED_SCREENS)[number];

export const PROGRAMMATIC_MAPPING_STATUSES = [
  "disabled",
  "enabled",
  "paused",
] as const;

export type ProgrammaticMappingStatus =
  (typeof PROGRAMMATIC_MAPPING_STATUSES)[number];

export interface ProgrammaticProviderRecord {
  id:
    string;

  providerKey:
    string;

  displayName:
    string;

  status:
    ProgrammaticProviderStatus;

  healthStatus:
    ProgrammaticProviderHealthStatus;

  notes:
    string | null;

  createdAt:
    Date;

  updatedAt:
    Date;

  rowVersion:
    string;
}

export interface ProgrammaticSlotMappingRecord {
  id:
    string;

  providerId:
    string;

  screen:
    ProgrammaticApprovedScreen;

  placement:
    string;

  frame:
    ProgrammaticApprovedFrame;

  status:
    ProgrammaticMappingStatus;

  safetyRules:
    JsonObject;

  regionRules:
    JsonObject;

  deviceRules:
    JsonObject;

  frequencyRules:
    JsonObject;

  fallbackRules:
    JsonObject;

  createdAt:
    Date;

  updatedAt:
    Date;

  rowVersion:
    string;
}

export interface ProgrammaticProviderDraftInput {
  providerKey:
    string;

  displayName:
    string;

  status:
    ProgrammaticProviderStatus;

  healthStatus:
    ProgrammaticProviderHealthStatus;

  notes:
    string | null;
}

export interface ProgrammaticSlotMappingDraftInput {
  providerId:
    string;

  screen:
    ProgrammaticApprovedScreen;

  placement:
    string;

  frame:
    ProgrammaticApprovedFrame;

  status:
    ProgrammaticMappingStatus;

  safetyRules:
    JsonObject;

  regionRules:
    JsonObject;

  deviceRules:
    JsonObject;

  frequencyRules:
    JsonObject;

  fallbackRules:
    JsonObject;
}

export interface CreateProgrammaticProviderInput
  extends ProgrammaticProviderDraftInput {
  id:
    string;

  createdAt:
    Date;
}

export interface CreateProgrammaticSlotMappingInput
  extends ProgrammaticSlotMappingDraftInput {
  id:
    string;

  createdAt:
    Date;
}

export interface ProgrammaticValidationIssue {
  field:
    string;

  code:
    | "required"
    | "invalid"
    | "too_short"
    | "too_long"
    | "unsupported";

  message:
    string;
}