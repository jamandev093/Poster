export type ProgrammaticProviderStatus =
  | "disabled"
  | "enabled"
  | "paused";

export type ProgrammaticProviderHealthStatus =
  | "unknown"
  | "healthy"
  | "degraded"
  | "unhealthy";

export type ProgrammaticApprovedFrame =
  | "full_width_sponsored_card"
  | "three_card_sponsored_frame";

export type ProgrammaticApprovedScreen =
  | "home"
  | "search"
  | "trending";

export type ProgrammaticMappingStatus =
  | "disabled"
  | "enabled"
  | "paused";

export interface ProgrammaticProvider {
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
    string;

  updatedAt:
    string;

  rowVersion:
    string;
}

export interface ProgrammaticSlotMapping {
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
    Record<string, unknown>;

  regionRules:
    Record<string, unknown>;

  deviceRules:
    Record<string, unknown>;

  frequencyRules:
    Record<string, unknown>;

  fallbackRules:
    Record<string, unknown>;

  createdAt:
    string;

  updatedAt:
    string;

  rowVersion:
    string;
}

export interface ProgrammaticOverviewResponse {
  providers:
    ProgrammaticProvider[];

  slotMappings:
    ProgrammaticSlotMapping[];
}

export interface CreateProgrammaticProviderRequest {
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

export interface CreateProgrammaticSlotMappingRequest {
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
    Record<string, unknown>;

  regionRules:
    Record<string, unknown>;

  deviceRules:
    Record<string, unknown>;

  frequencyRules:
    Record<string, unknown>;

  fallbackRules:
    Record<string, unknown>;
}

export interface ProgrammaticApiIssue {
  path:
    string;

  message:
    string;
}

export interface ProgrammaticApiErrorBody {
  error?: {
    code?:
      string;

    message?:
      string;

    requestId?:
      string;

    details?:
      ProgrammaticApiIssue[];
  };
}