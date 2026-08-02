import type {
  CampaignStatus,
} from "./commercial.types.js";

import {
  CAMPAIGN_TERMINAL_STATUSES,
  type CampaignLifecycleTransition,
  type CampaignOperationAction,
} from "./campaign-operations.types.js";

export const CAMPAIGN_LIFECYCLE_TRANSITIONS =
  [
    {
      from: "draft",
      action: "schedule",
      to: "scheduled",
    },
    {
      from: "draft",
      action: "activate",
      to: "active",
    },
    {
      from: "draft",
      action: "disable",
      to: "disabled",
    },
    {
      from: "scheduled",
      action: "activate",
      to: "active",
    },
    {
      from: "scheduled",
      action: "pause",
      to: "paused",
    },
    {
      from: "scheduled",
      action: "end",
      to: "ended",
    },
    {
      from: "scheduled",
      action: "disable",
      to: "disabled",
    },
    {
      from: "active",
      action: "pause",
      to: "paused",
    },
    {
      from: "active",
      action: "end",
      to: "ended",
    },
    {
      from: "active",
      action: "disable",
      to: "disabled",
    },
    {
      from: "paused",
      action: "resume",
      to: "active",
    },
    {
      from: "paused",
      action: "schedule",
      to: "scheduled",
    },
    {
      from: "paused",
      action: "end",
      to: "ended",
    },
    {
      from: "paused",
      action: "disable",
      to: "disabled",
    },
  ] as const satisfies readonly CampaignLifecycleTransition[];

export function isCampaignTerminalStatus(
  status: CampaignStatus
): boolean {
  return CAMPAIGN_TERMINAL_STATUSES.includes(
    status as
      (typeof CAMPAIGN_TERMINAL_STATUSES)[number]
  );
}

export function findCampaignLifecycleTransition(
  currentStatus: CampaignStatus,
  action: Exclude<
    CampaignOperationAction,
    "update"
  >
): CampaignLifecycleTransition | null {
  return (
    CAMPAIGN_LIFECYCLE_TRANSITIONS.find(
      transition =>
        transition.from === currentStatus &&
        transition.action === action
    ) ?? null
  );
}

export function canTransitionCampaign(
  currentStatus: CampaignStatus,
  action: Exclude<
    CampaignOperationAction,
    "update"
  >
): boolean {
  return (
    findCampaignLifecycleTransition(
      currentStatus,
      action
    ) !== null
  );
}

export function resolveCampaignTargetStatus(
  currentStatus: CampaignStatus,
  action: Exclude<
    CampaignOperationAction,
    "update"
  >
): CampaignStatus | null {
  return (
    findCampaignLifecycleTransition(
      currentStatus,
      action
    )?.to ?? null
  );
}

export function canEditCampaignOperations(
  status: CampaignStatus
): boolean {
  return !isCampaignTerminalStatus(
    status
  );
}