import type {
  CampaignOperationValidationIssue,
} from "../../domains/monetization/campaign-operations.types.js";

export type CampaignOperationsErrorCode =
  | "CAMPAIGN_NOT_FOUND"
  | "CAMPAIGN_VERSION_CONFLICT"
  | "CAMPAIGN_OPERATION_INVALID"
  | "CAMPAIGN_TRANSITION_NOT_ALLOWED"
  | "CAMPAIGN_TERMINAL"
  | "CAMPAIGN_NOT_READY";

export class CampaignOperationsError
  extends Error {
  readonly code:
    CampaignOperationsErrorCode;

  readonly issues:
    readonly CampaignOperationValidationIssue[];

  constructor(
    code: CampaignOperationsErrorCode,
    message: string,
    issues:
      readonly CampaignOperationValidationIssue[] =
      []
  ) {
    super(
      message
    );

    this.name =
      "CampaignOperationsError";

    this.code =
      code;

    this.issues =
      issues;
  }
}