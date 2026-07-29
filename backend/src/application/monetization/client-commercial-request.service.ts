import {
  randomUUID,
} from "node:crypto";

import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createCommercialRequest,
  findCommercialRequestById,
  findCommercialRequestByIdForUpdate,
  listCommercialRequests,
  updateCommercialRequestForResubmission,
} from "../../domains/monetization/commercial-request.repository.js";

import {
  createCommercialRequestRevision,
  listCommercialRequestRevisions,
} from "../../domains/monetization/commercial-revision.repository.js";

import type {
  CommercialRequestDraftInput,
  CommercialRequestListResult,
  CommercialRequestRecord,
  CommercialRequestRevisionRecord,
} from "../../domains/monetization/commercial.types.js";

export interface SubmitClientCommercialRequestInput
  extends CommercialRequestDraftInput {
  organizationId: string;
  actorUserId: string;
}

export interface ResubmitClientCommercialRequestInput
  extends CommercialRequestDraftInput {
  organizationId: string;
  actorUserId: string;
  requestId: string;
  expectedRowVersion: string;
}

export type ClientCommercialRequestMutationResult =
  | {
      status: "not_found";
    }
  | {
      status: "conflict";
      request: CommercialRequestRecord;
    }
  | {
      status: "updated";
      request: CommercialRequestRecord;
    };

export interface ClientCommercialRequestDetail {
  request: CommercialRequestRecord;
  revisions: CommercialRequestRevisionRecord[];
}

export interface ClientCommercialRequestService {
  submit:
    (
      input: SubmitClientCommercialRequestInput
    ) => Promise<CommercialRequestRecord>;

  resubmit:
    (
      input: ResubmitClientCommercialRequestInput
    ) => Promise<ClientCommercialRequestMutationResult>;

  listForOrganization:
    (
      organizationId: string,
      pagination?: {
        limit?: number;
        offset?: number;
      }
    ) => Promise<CommercialRequestListResult>;

  getForOrganization:
    (
      organizationId: string,
      requestId: string
    ) => Promise<ClientCommercialRequestDetail | null>;
}

export interface ClientCommercialRequestServiceDependencies {
  runDatabaseTransaction:
    typeof runDatabaseTransaction;

  createCommercialRequest:
    typeof createCommercialRequest;

  createCommercialRequestRevision:
    typeof createCommercialRequestRevision;

  findCommercialRequestById:
    typeof findCommercialRequestById;

  findCommercialRequestByIdForUpdate:
    typeof findCommercialRequestByIdForUpdate;

  listCommercialRequests:
    typeof listCommercialRequests;

  listCommercialRequestRevisions:
    typeof listCommercialRequestRevisions;

  updateCommercialRequestForResubmission:
    typeof updateCommercialRequestForResubmission;

  now: () => Date;
  createReference: () => string;
}

function createPublicRequestReference():
  string {
  return `ADV-${
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

function createRevisionPayload(
  input: CommercialRequestDraftInput
): Record<string, unknown> {
  return {
    requestType:
      input.requestType,

    title:
      input.title,

    objective:
      input.objective,

    destinationUrl:
      input.destinationUrl,

    requestedPlacements:
      [...input.requestedPlacements],

    requestedStartDate:
      input.requestedStartDate,

    requestedEndDate:
      input.requestedEndDate,

    budgetMinorUnits:
      input.budgetMinorUnits ?? null,

    currencyCode:
      input.currencyCode ?? null,

    creativeSpec:
      input.creativeSpec,

    commercialTerms:
      input.commercialTerms,
  };
}

const DEFAULT_DEPENDENCIES:
  ClientCommercialRequestServiceDependencies = {
    runDatabaseTransaction,
    createCommercialRequest,
    createCommercialRequestRevision,
    findCommercialRequestById,
    findCommercialRequestByIdForUpdate,
    listCommercialRequests,
    listCommercialRequestRevisions,
    updateCommercialRequestForResubmission,

    now:
      () => new Date(),

    createReference:
      createPublicRequestReference,
  };

export function createClientCommercialRequestService(
  overrides:
    Partial<ClientCommercialRequestServiceDependencies> =
    {}
): ClientCommercialRequestService {
  const dependencies = {
    ...DEFAULT_DEPENDENCIES,
    ...overrides,
  };

  return {
    async submit(
      input
    ) {
      const submittedAt =
        dependencies.now();

      return await dependencies
        .runDatabaseTransaction(
          async (
            executor
          ) => {
            const request =
              await dependencies
                .createCommercialRequest(
                  {
                    ...input,

                    requestReference:
                      dependencies.createReference(),

                    submittedByUserId:
                      input.actorUserId,

                    submittedAt,
                  },
                  executor
                );

            await dependencies
              .createCommercialRequestRevision(
                {
                  requestId:
                    request.id,

                  submittedByUserId:
                    input.actorUserId,

                  payload:
                    createRevisionPayload(
                      input
                    ),

                  createdAt:
                    submittedAt,
                },
                executor
              );

            return request;
          }
        );
    },

    async resubmit(
      input
    ) {
      const submittedAt =
        dependencies.now();

      return await dependencies
        .runDatabaseTransaction(
          async (
            executor
          ) => {
            const current =
              await dependencies
                .findCommercialRequestByIdForUpdate(
                  input.requestId,
                  executor
                );

            if (
              !current ||
              current.organizationId !== input.organizationId
            ) {
              return {
                status: "not_found",
              } as const;
            }

            if (
              current.status !== "changes_requested" ||
              current.rowVersion !== input.expectedRowVersion
            ) {
              return {
                status: "conflict",
                request: current,
              } as const;
            }

            const updated =
              await dependencies
                .updateCommercialRequestForResubmission(
                  {
                    ...input,

                    submittedByUserId:
                      input.actorUserId,

                    submittedAt,
                  },
                  executor
                );

            if (!updated) {
              return {
                status: "conflict",
                request: current,
              } as const;
            }

            await dependencies
              .createCommercialRequestRevision(
                {
                  requestId:
                    updated.id,

                  submittedByUserId:
                    input.actorUserId,

                  payload:
                    createRevisionPayload(
                      input
                    ),

                  createdAt:
                    submittedAt,
                },
                executor
              );

            return {
              status: "updated",
              request: updated,
            } as const;
          }
        );
    },

    async listForOrganization(
      organizationId,
      pagination =
        {}
    ) {
      return await dependencies
        .listCommercialRequests({
          organizationId,

          limit:
            pagination.limit ?? 50,

          offset:
            pagination.offset ?? 0,
        });
    },

    async getForOrganization(
      organizationId,
      requestId
    ) {
      const request =
        await dependencies
          .findCommercialRequestById(
            requestId
          );

      if (
        !request ||
        request.organizationId !== organizationId
      ) {
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
  };
}
