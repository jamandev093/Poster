import type {
  CampaignReadinessStatus,
  CampaignStatus,
  MonetizationCampaignRecord,
  MonetizationPlacement,
} from "./commercial.types.js";

export const CAMPAIGN_OPERATION_ACTIONS = [
  "update",
  "schedule",
  "activate",
  "pause",
  "resume",
  "end",
  "disable",
] as const;

export type CampaignOperationAction =
  (typeof CAMPAIGN_OPERATION_ACTIONS)[number];

export const CAMPAIGN_TERMINAL_STATUSES = [
  "ended",
  "disabled",
] as const satisfies readonly CampaignStatus[];

export type CampaignTerminalStatus =
  (typeof CAMPAIGN_TERMINAL_STATUSES)[number];

export interface CampaignScheduleInput {
  scheduledStartDate: string;
  scheduledEndDate: string;
}

export interface UpdateCampaignOperationsInput
  extends CampaignScheduleInput {
  campaignId: string;
  actorUserId: string;
  expectedRowVersion: string;
  name: string;
  placements: readonly MonetizationPlacement[];
  readinessStatus: CampaignReadinessStatus;
  reason: string | null;
}

export interface UpdateCampaignRecordInput
  extends CampaignScheduleInput {
  campaignId: string;
  expectedRowVersion: string;
  name: string;
  placements: readonly MonetizationPlacement[];
  readinessStatus: CampaignReadinessStatus;
}

export interface TransitionCampaignInput {
  campaignId: string;
  actorUserId: string;
  expectedRowVersion: string;
  action: Exclude<
    CampaignOperationAction,
    "update"
  >;
  reason: string | null;
}

export interface TransitionCampaignRecordInput {
  campaignId: string;
  expectedRowVersion: string;
  targetStatus: CampaignStatus;
}

export interface CampaignLifecycleTransition {
  from: CampaignStatus;
  action: Exclude<
    CampaignOperationAction,
    "update"
  >;
  to: CampaignStatus;
}

export interface CampaignOperationValidationIssue {
  field: string;
  code:
    | "required"
    | "invalid"
    | "too_short"
    | "too_long"
    | "duplicate"
    | "unsupported"
    | "date_order";
  message: string;
}

export type CampaignMutationOutcome =
  | {
      status: "not_found";
    }
  | {
      status: "conflict";
      campaign: MonetizationCampaignRecord;
    }
  | {
      status: "updated";
      campaign: MonetizationCampaignRecord;
    };