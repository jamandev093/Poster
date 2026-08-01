import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  appendContentAuditEvent,
  findDiscoveryContentById,
  listContentAuditEvents,
  removeDiscoveryContent,
  restoreDiscoveryContent,
  type DiscoveryContentRecord,
} from "../../domains/content-sources/index.js";

import {
  appendCopyrightAuditEvent,
  findCopyrightCaseById,
  listCopyrightAuditEvents,
  listCopyrightCases,
  listCopyrightEvidenceReferences,
  listCopyrightVerificationChecks,
  reopenCopyrightCase,
  resolveCopyrightCase,
  type CopyrightCaseRecord,
  type CopyrightVerificationCheckRecord,
} from "../../domains/copyright/index.js";

import {
  CopyrightApplicationError,
} from "./copyright.errors.js";

import type {
  AdminCopyrightCaseDetails,
  AdminCopyrightCaseSummary,
  CopyrightCaseActionInput,
  RemoveCopyrightContentInput,
} from "./admin-copyright.types.js";

export interface AdminCopyrightService {
  list:
    () => Promise<
      AdminCopyrightCaseSummary[]
    >;

  getById:
    (
      caseId: string
    ) => Promise<
      AdminCopyrightCaseDetails
    >;

  remove:
    (
      input:
        RemoveCopyrightContentInput
    ) => Promise<
      AdminCopyrightCaseDetails
    >;

  dismiss:
    (
      input:
        CopyrightCaseActionInput
    ) => Promise<
      AdminCopyrightCaseDetails
    >;

  restore:
    (
      input:
        CopyrightCaseActionInput & {
          contentExpectedRowVersion:
            string;
        }
    ) => Promise<
      AdminCopyrightCaseDetails
    >;
}

export interface AdminCopyrightServiceDependencies {
  listCases:
    typeof listCopyrightCases;

  findCase:
    typeof findCopyrightCaseById;

  resolveCase:
    typeof resolveCopyrightCase;

  reopenCase:
    typeof reopenCopyrightCase;

  listVerification:
    typeof listCopyrightVerificationChecks;

  listEvidence:
    typeof listCopyrightEvidenceReferences;

  listAudit:
    typeof listCopyrightAuditEvents;

  appendAudit:
    typeof appendCopyrightAuditEvent;

  findContent:
    typeof findDiscoveryContentById;

  removeContent:
    typeof removeDiscoveryContent;

  restoreContent:
    typeof restoreDiscoveryContent;

  listContentAudit:
    typeof listContentAuditEvents;

  appendContentAudit:
    typeof appendContentAuditEvent;

  now:
    () => Date;
}

export interface CreateAdminCopyrightServiceOptions {
  dependencies?:
    Partial<
      AdminCopyrightServiceDependencies
    >;
}

function assertVerificationAllowsRemoval(
  copyrightCase:
    CopyrightCaseRecord,
  checks:
    readonly CopyrightVerificationCheckRecord[]
): void {
  if (
    copyrightCase.verificationStatus !==
    "verified"
  ) {
    throw new CopyrightApplicationError(
      "COPYRIGHT_VERIFICATION_INCOMPLETE",
      "The copyright case must be verified before content removal."
    );
  }

  if (
    checks.length === 0 ||
    checks.some(
      check =>
        check.status !==
        "passed"
    )
  ) {
    throw new CopyrightApplicationError(
      "COPYRIGHT_VERIFICATION_INCOMPLETE",
      "All required copyright verification checks must pass before content removal."
    );
  }
}

export function createAdminCopyrightService(
  options:
    CreateAdminCopyrightServiceOptions =
    {}
): AdminCopyrightService {
  const dependencies:
    AdminCopyrightServiceDependencies = {
    listCases:
      listCopyrightCases,

    findCase:
      findCopyrightCaseById,

    resolveCase:
      resolveCopyrightCase,

    reopenCase:
      reopenCopyrightCase,

    listVerification:
      listCopyrightVerificationChecks,

    listEvidence:
      listCopyrightEvidenceReferences,

    listAudit:
      listCopyrightAuditEvents,

    appendAudit:
      appendCopyrightAuditEvent,

    findContent:
      findDiscoveryContentById,

    removeContent:
      removeDiscoveryContent,

    restoreContent:
      restoreDiscoveryContent,

    listContentAudit:
      listContentAuditEvents,

    appendContentAudit:
      appendContentAuditEvent,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  const getRequiredCase =
    async (
      caseId: string
    ): Promise<
      CopyrightCaseRecord
    > => {
      const copyrightCase =
        await dependencies
          .findCase(
            caseId
          );

      if (
        !copyrightCase
      ) {
        throw new CopyrightApplicationError(
          "COPYRIGHT_CASE_NOT_FOUND",
          "Copyright case was not found."
        );
      }

      return copyrightCase;
    };

  const getRequiredContent =
    async (
      contentId: string
    ): Promise<
      DiscoveryContentRecord
    > => {
      const content =
        await dependencies
          .findContent(
            contentId
          );

      if (
        !content
      ) {
        throw new CopyrightApplicationError(
          "COPYRIGHT_CONTENT_NOT_FOUND",
          "The discovery content linked to this copyright case was not found."
        );
      }

      return content;
    };

  const buildSummary =
    async (
      copyrightCase:
        CopyrightCaseRecord
    ): Promise<
      AdminCopyrightCaseSummary
    > => ({
      case:
        copyrightCase,

      content:
        await getRequiredContent(
          copyrightCase.contentId
        ),
    });

  const buildDetails =
    async (
      copyrightCase:
        CopyrightCaseRecord
    ): Promise<
      AdminCopyrightCaseDetails
    > => {
      const [
        content,
        verificationChecks,
        evidence,
        audit,
        contentAudit,
      ] =
        await Promise.all([
          getRequiredContent(
            copyrightCase.contentId
          ),

          dependencies
            .listVerification(
              copyrightCase.id
            ),

          dependencies
            .listEvidence(
              copyrightCase.id
            ),

          dependencies
            .listAudit(
              copyrightCase.id
            ),

          dependencies
            .listContentAudit(
              copyrightCase.contentId
            ),
        ]);

      return {
        case:
          copyrightCase,

        content,
        verificationChecks,
        evidence,
        audit,
        contentAudit,
      };
    };

  return {
    list:
      async () => {
        const cases =
          await dependencies
            .listCases();

        return await Promise.all(
          cases.map(
            buildSummary
          )
        );
      },

    getById:
      async caseId =>
        await buildDetails(
          await getRequiredCase(
            caseId
          )
        ),

    remove:
      async input => {
        const actionAt =
          dependencies.now();

        const updatedCase =
          await runDatabaseTransaction(
            async executor => {
              const copyrightCase =
                await dependencies
                  .findCase(
                    input.caseId,
                    executor
                  );

              if (
                !copyrightCase
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_NOT_FOUND",
                  "Copyright case was not found."
                );
              }

              if (
                copyrightCase.status !==
                "needs_action"
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_STATE_CONFLICT",
                  "Only copyright cases requiring action can remove content."
                );
              }

              const checks =
                await dependencies
                  .listVerification(
                    copyrightCase.id,
                    executor
                  );

              assertVerificationAllowsRemoval(
                copyrightCase,
                checks
              );

              const content =
                await dependencies
                  .findContent(
                    copyrightCase.contentId,
                    executor
                  );

              if (
                !content
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CONTENT_NOT_FOUND",
                  "The discovery content linked to this copyright case was not found."
                );
              }

              if (
                content.status !==
                "active"
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_STATE_CONFLICT",
                  "The linked content is not active and cannot be removed again."
                );
              }

              const removedContent =
                await dependencies
                  .removeContent(
                    {
                      contentId:
                        content.id,

                      expectedRowVersion:
                        input.contentExpectedRowVersion,

                      reason:
                        "copyright",

                      note:
                        input.internalNote ??
                        null,

                      copyrightCaseId:
                        copyrightCase.publicId,

                      copyrightClaimant:
                        copyrightCase.claimantName,

                      preventReimport:
                        input.preventReimport,

                      removedAt:
                        actionAt,
                    },
                    executor
                  );

              if (
                !removedContent
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CONTENT_VERSION_CONFLICT",
                  "The linked content changed before removal completed. Refresh and retry."
                );
              }

              const resolvedCase =
                await dependencies
                  .resolveCase(
                    {
                      caseId:
                        copyrightCase.id,

                      expectedRowVersion:
                        input.expectedRowVersion,

                      status:
                        "removed",

                      actionTaken:
                        input.preventReimport
                          ? "removed_prevent_reimport"
                          : "removed",

                      preventReimport:
                        input.preventReimport,

                      resolvedAt:
                        actionAt,

                      resolvedByUserId:
                        input.actorUserId,
                    },
                    executor
                  );

              if (
                !resolvedCase
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_VERSION_CONFLICT",
                  "The copyright case changed before removal completed. Refresh and retry."
                );
              }

              await dependencies
                .appendContentAudit(
                  {
                    contentId:
                      removedContent.id,

                    action:
                      input.preventReimport
                        ? "Removed for verified copyright case and prevented from re-import"
                        : "Removed for verified copyright case",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    metadata: {
                      copyrightCaseId:
                        resolvedCase.publicId,

                      claimant:
                        resolvedCase.claimantName,

                      preventReimport:
                        input.preventReimport,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              await dependencies
                .appendAudit(
                  {
                    caseId:
                      resolvedCase.id,

                    action:
                      input.preventReimport
                        ? "Content removed and future re-import prevented"
                        : "Content removed from Poster",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    previousStatus:
                      copyrightCase.status,

                    resultingStatus:
                      resolvedCase.status,

                    metadata: {
                      contentId:
                        removedContent.id,

                      posterContentId:
                        removedContent.publicId,

                      originalUrl:
                        removedContent.originalUrl,

                      claimant:
                        resolvedCase.claimantName,

                      preventReimport:
                        input.preventReimport,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              return resolvedCase;
            }
          );

        return await buildDetails(
          updatedCase
        );
      },

    dismiss:
      async input => {
        const actionAt =
          dependencies.now();

        const updatedCase =
          await runDatabaseTransaction(
            async executor => {
              const copyrightCase =
                await dependencies
                  .findCase(
                    input.caseId,
                    executor
                  );

              if (
                !copyrightCase
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_NOT_FOUND",
                  "Copyright case was not found."
                );
              }

              if (
                copyrightCase.status !==
                "needs_action"
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_STATE_CONFLICT",
                  "Only copyright cases requiring action can be dismissed."
                );
              }

              const resolvedCase =
                await dependencies
                  .resolveCase(
                    {
                      caseId:
                        copyrightCase.id,

                      expectedRowVersion:
                        input.expectedRowVersion,

                      status:
                        "resolved",

                      actionTaken:
                        "dismissed",

                      preventReimport:
                        false,

                      resolvedAt:
                        actionAt,

                      resolvedByUserId:
                        input.actorUserId,
                    },
                    executor
                  );

              if (
                !resolvedCase
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_VERSION_CONFLICT",
                  "The copyright case changed before dismissal completed. Refresh and retry."
                );
              }

              await dependencies
                .appendAudit(
                  {
                    caseId:
                      resolvedCase.id,

                    action:
                      "Copyright case dismissed and resolved",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    previousStatus:
                      copyrightCase.status,

                    resultingStatus:
                      resolvedCase.status,

                    metadata: {
                      contentId:
                        copyrightCase.contentId,

                      claimant:
                        copyrightCase.claimantName,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              return resolvedCase;
            }
          );

        return await buildDetails(
          updatedCase
        );
      },

    restore:
      async input => {
        const actionAt =
          dependencies.now();

        const updatedCase =
          await runDatabaseTransaction(
            async executor => {
              const copyrightCase =
                await dependencies
                  .findCase(
                    input.caseId,
                    executor
                  );

              if (
                !copyrightCase
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_NOT_FOUND",
                  "Copyright case was not found."
                );
              }

              if (
                copyrightCase.status !==
                  "removed" ||
                copyrightCase.actionTaken !==
                  "removed"
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_RESTORE_BLOCKED",
                  "Only removed cases without prevent-reimport protection can be restored."
                );
              }

              if (
                copyrightCase.preventReimport
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_RESTORE_BLOCKED",
                  "Prevent-reimport copyright cases cannot be restored."
                );
              }

              const content =
                await dependencies
                  .findContent(
                    copyrightCase.contentId,
                    executor
                  );

              if (
                !content
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CONTENT_NOT_FOUND",
                  "The discovery content linked to this copyright case was not found."
                );
              }

              if (
                content.status !==
                  "removed" ||
                content.removalReason !==
                  "copyright" ||
                content.preventReimport
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_RESTORE_BLOCKED",
                  "The linked content is not eligible for copyright restoration."
                );
              }

              const restoredContent =
                await dependencies
                  .restoreContent(
                    {
                      contentId:
                        content.id,

                      expectedRowVersion:
                        input.contentExpectedRowVersion,
                    },
                    executor
                  );

              if (
                !restoredContent
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CONTENT_VERSION_CONFLICT",
                  "The linked content changed before restoration completed. Refresh and retry."
                );
              }

              const reopenedCase =
                await dependencies
                  .reopenCase(
                    {
                      caseId:
                        copyrightCase.id,

                      expectedRowVersion:
                        input.expectedRowVersion,
                    },
                    executor
                  );

              if (
                !reopenedCase
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_VERSION_CONFLICT",
                  "The copyright case changed before restoration completed. Refresh and retry."
                );
              }

              const resolvedCase =
                await dependencies
                  .resolveCase(
                    {
                      caseId:
                        reopenedCase.id,

                      expectedRowVersion:
                        reopenedCase.rowVersion,

                      status:
                        "resolved",

                      actionTaken:
                        "restored",

                      preventReimport:
                        false,

                      resolvedAt:
                        actionAt,

                      resolvedByUserId:
                        input.actorUserId,
                    },
                    executor
                  );

              if (
                !resolvedCase
              ) {
                throw new CopyrightApplicationError(
                  "COPYRIGHT_CASE_VERSION_CONFLICT",
                  "The copyright case changed before restoration was recorded."
                );
              }

              await dependencies
                .appendContentAudit(
                  {
                    contentId:
                      restoredContent.id,

                    action:
                      "Content restored after copyright case review",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    metadata: {
                      copyrightCaseId:
                        resolvedCase.publicId,

                      claimant:
                        resolvedCase.claimantName,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              await dependencies
                .appendAudit(
                  {
                    caseId:
                      resolvedCase.id,

                    action:
                      "Content restored and copyright case resolved",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    previousStatus:
                      copyrightCase.status,

                    resultingStatus:
                      resolvedCase.status,

                    metadata: {
                      contentId:
                        restoredContent.id,

                      posterContentId:
                        restoredContent.publicId,
                    },

                    occurredAt:
                      actionAt,
                  },
                  executor
                );

              return resolvedCase;
            }
          );

        return await buildDetails(
          updatedCase
        );
      },
  };
}