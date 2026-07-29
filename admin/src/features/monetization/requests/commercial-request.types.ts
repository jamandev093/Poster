import type {
  CommercialRequest,
  CommercialRequestStatus,
  CommercialRequestType,
} from "../monetization.types";

export interface CommercialRequestRevision {
  id: string;

  revisionNumber: number;

  submittedBy: string;

  submittedAt: string;

  summary: string;
}

export interface CommercialRequestDetail {
  request:
    CommercialRequest;

  revisions:
    CommercialRequestRevision[];
}

export interface CommercialRequestListInput {
  query: string;

  status:
    | "all"
    | CommercialRequestStatus;

  type:
    | "all"
    | CommercialRequestType;
}

export interface CommercialRequestDecisionInput {
  requestId: string;

  note: string;
}

export interface CommercialRequestApprovalInput
  extends CommercialRequestDecisionInput {
  campaignName: string;
}

export interface CommercialRequestGateway {
  list:
    (
      input:
        CommercialRequestListInput
    ) => Promise<
      CommercialRequest[]
    >;

  get:
    (
      requestId:
        string
    ) => Promise<
      CommercialRequestDetail | null
    >;

  requestChanges:
    (
      input:
        CommercialRequestDecisionInput
    ) => Promise<
      CommercialRequest
    >;

  reject:
    (
      input:
        CommercialRequestDecisionInput
    ) => Promise<
      CommercialRequest
    >;

  approve:
    (
      input:
        CommercialRequestApprovalInput
    ) => Promise<
      CommercialRequest
    >;
}
