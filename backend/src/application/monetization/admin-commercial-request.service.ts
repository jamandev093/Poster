import {
  randomUUID,
} from "node:crypto";

import {
  approveCommercialRequestAndCreateDraftCampaign,
  rejectCommercialRequest,
  requestCommercialRequestChanges,
} from "../../domains/monetization/commercial-decision.repository.js";

import {
  findCommercialRequestById,
  listCommercialRequests,
} from "../../domains/monetization/commercial-request.repository.js";

import {
  listCommercialRequestRevisions,
} from "../../domains/monetization/commercial-revision.repository.js";

import type {
  CommercialRequestApprovalOutcome,
  CommercialRequestListResult,
  CommercialRequestMutationOutcome,
  CommercialRequestRecord,
  CommercialRequestRevisionRecord,
  CommercialRequestStatus,
  CommercialRequestType,
} from "../../domains/monetization/commercial.types.js";

export interface AdminCommercialRequestDetail {
  request: CommercialRequestRecord;
  revisions: CommercialRequestRevisionRecord[];
}

export interface AdminCommercialDecisionInput {
  requestId: string;
  actorUserId: string;
  expectedRowVersion: string;
  decisionNote: string | null;
}

export interface AdminCommercialApprovalInput
  extends AdminCommercialDecisionInput {
  campaignName: string | null;
}

export interface AdminCommercialRequestService {
  list:
    (
      input: {
        organizationId?: string | null | undefined;
        status?: CommercialRequestStatus | null | undefined;
        requestType?: CommercialRequestType | null | undefined;
        limit: number;
        offset: number;
      }
    ) => Promise<CommercialRequestListResult>;

  get:
    (
      requestId: string
    ) => Promise<AdminCommercialRequestDetail | null>;

  requestChanges:
    (
      input: AdminCommercialDecisionInput
    ) => Promise<CommercialRequestMutationOutcome>;

  reject:
    (
      input: AdminCommercialDecisionInput
    ) => Promise<CommercialRequestMutationOutcome>;

  approve:
    (
      input: AdminCommercialApprovalInput
    ) => Promise<CommercialRequestApprovalOutcome>;
}

export interface AdminCommercialRequestServiceDependencies {
  listCommercialRequests:
    typeof listCommercialRequests;

  findCommercialRequestById:
    typeof findCommercialRequestById;

  listCommercialRequestRevisions:
    typeof listCommercialRequestRevisions;

  requestCommercialRequestChanges:
    typeof requestCommercialRequestChanges;

  rejectCommercialRequest:
    typeof rejectCommercialRequest;

  approveCommercialRequestAndCreateDraftCampaign:
    typeof approveCommercialRequestAndCreateDraftCampaign;

  now: () => Date;
  createCampaignReference: () => string;
}

function createCampaignReference():
  string {
  return `CMP-${
    randomUUID()
      .replaceAll(
        "-",
        ""
      )
      .slice(
        0,
        12
      )
      .toUpperCase()
  }`;
}

const DEFAULT_DEPENDENCIES:
  AdminCommercialRequestServiceDependencies = {
    listCommercialRequests,
    findCommercialRequestById,
    listCommercialRequestRevisions,
    requestCommercialRequestChanges,
    rejectCommercialRequest,
    approveCommercialRequestAndCreateDraftCampaign,

    now:
      () => new Date(),

    createCampaignReference,
  };

export function createAdminCommercialRequestService(
  overrides:
    Partial<AdminCommercialRequestServiceDependencies> =
    {}
): AdminCommercialRequestService {
  const dependencies = {
    ...DEFAULT_DEPENDENCIES,
    ...overrides,
  };

  return {
    async list(
      input
    ) {
      return await dependencies
        .listCommercialRequests(
          input
        );
    },

    async get(
      requestId
    ) {
      const request =
        await dependencies
          .findCommercialRequestById(
            requestId
          );

      if (!request) {
        return null;
      }

      return {
        request,

        revisions:
          await dependencies
            .listCommercialRequestRevisions(
              request.id
            ),
      };
    },

    async requestChanges(
      input
    ) {
      return await dependencies
        .requestCommercialRequestChanges({
          ...input,
          decidedAt:
            dependencies.now(),
        });
    },

    async reject(
      input
    ) {
      return await dependencies
        .rejectCommercialRequest({
          ...input,
          decidedAt:
            dependencies.now(),
        });
    },

    async approve(
      input
    ) {
      return await dependencies
        .approveCommercialRequestAndCreateDraftCampaign({
          ...input,

          campaignReference:
            dependencies.createCampaignReference(),

          decidedAt:
            dependencies.now(),
        });
    },
  };
}
