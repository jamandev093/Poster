import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  PublicCopyrightSubmissionError,
  type LookupPublicCopyrightStatusInput,
  type LookupPublicCopyrightContentMatchesInput,
  type PublicBulkCopyrightItemInput,
  type PublicCopyrightBulkSubmission,
  type PublicCopyrightContentMatchLookup,
  type PublicCopyrightClaimSubmission,
  type PublicCopyrightRelationship,
  type PublicCopyrightService,
  type PublicCopyrightStatusLookup,
  type SubmitPublicBulkCopyrightRequestInput,
  type SubmitPublicCopyrightClaimInput,
} from "../application/copyright/index.js";

export interface PublicCopyrightRoutesOptions {
  service:
    PublicCopyrightService;
}

const RELATIONSHIPS =
  new Set<
    PublicCopyrightRelationship
  >([
    "owner",
    "authorized",
    "publisher",
  ]);

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  body:
    Record<string, unknown>,
  key: string
): string {
  const value =
    body[key];

  return typeof value === "string"
    ? value
    : "";
}

function readOptionalString(
  body:
    Record<string, unknown>,
  key: string
): string | null {
  const value =
    body[key];

  return typeof value === "string"
    ? value
    : null;
}

function readRelationship(
  value: unknown
): PublicCopyrightRelationship {
  return (
    typeof value === "string" &&
    RELATIONSHIPS.has(
      value as PublicCopyrightRelationship
    )
  )
    ? (
        value as PublicCopyrightRelationship
      )
    : (
        "" as PublicCopyrightRelationship
      );
}

function readDeclarations(
  value: unknown
): SubmitPublicCopyrightClaimInput["declarations"] {
  if (!isRecord(value)) {
    return {
      goodFaith:
        false,

      accurate:
        false,

      authorized:
        false,
    };
  }

  return {
    goodFaith:
      value.goodFaith === true,

    accurate:
      value.accurate === true,

    authorized:
      value.authorized === true,
  };
}

function readBulkItems(
  value: unknown
): PublicBulkCopyrightItemInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(
    item =>
      isRecord(item)
        ? {
            value:
              readRequiredString(
                item,
                "value"
              ),
          }
        : {
            value:
              "",
          }
  );
}

function readStringList(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(
    item =>
      typeof item === "string"
        ? item
        : ""
  );
}

function parseJsonObject(
  body: unknown,
  code:
    | "COPYRIGHT_VALIDATION_FAILED"
    | "COPYRIGHT_BULK_VALIDATION_FAILED"
    | "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED"
    | "COPYRIGHT_STATUS_VALIDATION_FAILED",
  message: string
): Record<string, unknown> {
  if (!isRecord(body)) {
    throw new PublicCopyrightSubmissionError(
      code,
      message,
      400,
      [
        "body must be a JSON object.",
      ]
    );
  }

  return body;
}

function parseSubmitSingleClaimInput(
  body: unknown
): SubmitPublicCopyrightClaimInput {
  const parsed =
    parseJsonObject(
      body,
      "COPYRIGHT_VALIDATION_FAILED",
      "The copyright claim submission is invalid."
    );

  return {
    claimantName:
      readRequiredString(
        parsed,
        "claimantName"
      ),

    organization:
      readOptionalString(
        parsed,
        "organization"
      ),

    email:
      readRequiredString(
        parsed,
        "email"
      ),

    relationship:
      readRelationship(
        parsed.relationship
      ),

    workTitle:
      readRequiredString(
        parsed,
        "workTitle"
      ),

    originalUrl:
      readOptionalString(
        parsed,
        "originalUrl"
      ),

    affectedContent:
      readRequiredString(
        parsed,
        "affectedContent"
      ),

    explanation:
      readRequiredString(
        parsed,
        "explanation"
      ),

    evidence:
      readOptionalString(
        parsed,
        "evidence"
      ),

    legalName:
      readRequiredString(
        parsed,
        "legalName"
      ),

    declarations:
      readDeclarations(
        parsed.declarations
      ),
  };
}

function parseSubmitBulkRemovalInput(
  body: unknown
): SubmitPublicBulkCopyrightRequestInput {
  const parsed =
    parseJsonObject(
      body,
      "COPYRIGHT_BULK_VALIDATION_FAILED",
      "The bulk copyright request is invalid."
    );

  return {
    claimantName:
      readRequiredString(
        parsed,
        "claimantName"
      ),

    organization:
      readOptionalString(
        parsed,
        "organization"
      ),

    email:
      readRequiredString(
        parsed,
        "email"
      ),

    relationship:
      readRelationship(
        parsed.relationship
      ),

    workTitle:
      readRequiredString(
        parsed,
        "workTitle"
      ),

    originalUrl:
      readOptionalString(
        parsed,
        "originalUrl"
      ),

    items:
      readBulkItems(
        parsed.items
      ),

    explanation:
      readRequiredString(
        parsed,
        "explanation"
      ),

    evidence:
      readOptionalString(
        parsed,
        "evidence"
      ),

    legalName:
      readRequiredString(
        parsed,
        "legalName"
      ),

    declarations:
      readDeclarations(
        parsed.declarations
      ),
  };
}

function parseLookupContentMatchesInput(
  body: unknown
): LookupPublicCopyrightContentMatchesInput {
  const parsed =
    parseJsonObject(
      body,
      "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED",
      "The content match lookup is invalid."
    );

  return {
    identifiers:
      readStringList(
        parsed.identifiers
      ),
  };
}

function parseLookupStatusInput(
  body: unknown
): LookupPublicCopyrightStatusInput {
  const parsed =
    parseJsonObject(
      body,
      "COPYRIGHT_STATUS_VALIDATION_FAILED",
      "The copyright status lookup is invalid."
    );

  return {
    reference:
      readRequiredString(
        parsed,
        "reference"
      ),

    email:
      readRequiredString(
        parsed,
        "email"
      ),
  };
}

function serializePublicClaimSubmission(
  submission:
    PublicCopyrightClaimSubmission
) {
  return {
    reference:
      submission.case.publicId,

    requestType:
      submission.case.requestType,

    status:
      submission.case.status,

    receivedAt:
      submission.case.receivedAt.toISOString(),

    affectedContent: {
      publicId:
        submission.content.publicId,

      title:
        submission.content.title,

      publisherName:
        submission.content.publisherName,

      originalUrl:
        submission.content.originalUrl,

      status:
        submission.content.status,
    },

    evidenceCount:
      submission.evidence.length,
  };
}

function serializePublicBulkSubmission(
  submission:
    PublicCopyrightBulkSubmission
) {
  return {
    reference:
      submission.case.publicId,

    requestType:
      submission.case.requestType,

    status:
      submission.case.status,

    receivedAt:
      submission.case.receivedAt.toISOString(),

    itemCount:
      submission.itemCount,

    primaryAffectedContent: {
      publicId:
        submission.primaryContent.publicId,

      title:
        submission.primaryContent.title,

      publisherName:
        submission.primaryContent.publisherName,

      originalUrl:
        submission.primaryContent.originalUrl,

      status:
        submission.primaryContent.status,
    },

    evidenceCount:
      submission.evidence.length,
  };
}

function serializePublicContentMatchLookup(
  lookup:
    PublicCopyrightContentMatchLookup
) {
  return {
    results:
      lookup.results.map(
        result => ({
          input:
            result.input,

          status:
            result.status,

          duplicateOfPublicId:
            result.duplicateOfPublicId,

          content:
            result.content
              ? {
                  publicId:
                    result.content.publicId,

                  title:
                    result.content.title,

                  publisherName:
                    result.content.publisherName,

                  originalUrl:
                    result.content.originalUrl,

                  status:
                    result.content.status,
                }
              : undefined,
        })
      ),

    counts: {
      exactMatchCount:
        lookup.exactMatchCount,

      notFoundCount:
        lookup.notFoundCount,

      invalidCount:
        lookup.invalidCount,

      duplicateCount:
        lookup.duplicateCount,
    },
  };
}

function serializePublicStatusLookup(
  lookup:
    PublicCopyrightStatusLookup
) {
  return {
    reference:
      lookup.reference,

    requestType:
      lookup.requestType,

    status:
      lookup.status,

    verificationStatus:
      lookup.verificationStatus,

    actionTaken:
      lookup.actionTaken,

    preventReimport:
      lookup.preventReimport,

    receivedAt:
      lookup.receivedAt.toISOString(),

    resolvedAt:
      lookup.resolvedAt
        ? lookup.resolvedAt.toISOString()
        : null,

    affectedContent: {
      publicId:
        lookup.affectedContent.publicId,

      title:
        lookup.affectedContent.title,

      publisherName:
        lookup.affectedContent.publisherName,

      originalUrl:
        lookup.affectedContent.originalUrl,

      status:
        lookup.affectedContent.status,
    },
  };
}

function sendPublicCopyrightError(
  error:
    PublicCopyrightSubmissionError,
  request:
    FastifyRequest,
  reply:
    FastifyReply
) {
  return reply
    .status(
      error.statusCode
    )
    .send({
      error: {
        code:
          error.code,

        message:
          error.message,

        issues:
          error.issues,

        requestId:
          request.id,
      },
    });
}

async function runPublicCopyrightOperation(
  request:
    FastifyRequest,
  reply:
    FastifyReply,
  operation:
    () => Promise<unknown>
) {
  try {
    return await operation();
  } catch (
    error
  ) {
    if (
      error instanceof
      PublicCopyrightSubmissionError
    ) {
      return sendPublicCopyrightError(
        error,
        request,
        reply
      );
    }

    throw error;
  }
}

export const publicCopyrightRoutes:
  FastifyPluginAsync<
    PublicCopyrightRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.post(
      "/public/copyright/claims",
      async (
        request,
        reply
      ) =>
        await runPublicCopyrightOperation(
          request,
          reply,
          async () => {
            const submission =
              await options
                .service
                .submitSingleClaim(
                  parseSubmitSingleClaimInput(
                    request.body
                  )
                );

            return reply
              .status(
                201
              )
              .send({
                claim:
                  serializePublicClaimSubmission(
                    submission
                  ),
              });
          }
        )
    );

    app.post(
      "/public/copyright/bulk-removal",
      async (
        request,
        reply
      ) =>
        await runPublicCopyrightOperation(
          request,
          reply,
          async () => {
            const submission =
              await options
                .service
                .submitBulkRemoval(
                  parseSubmitBulkRemovalInput(
                    request.body
                  )
                );

            return reply
              .status(
                201
              )
              .send({
                bulkRequest:
                  serializePublicBulkSubmission(
                    submission
                  ),
              });
          }
        )
    );

    app.post(
      "/public/copyright/content-match",
      async (
        request,
        reply
      ) =>
        await runPublicCopyrightOperation(
          request,
          reply,
          async () => {
            if (
              !options.service.lookupContentMatches
            ) {
              throw new Error(
                "Public Copyright content match service is not available."
              );
            }

            const match =
              await options
                .service
                .lookupContentMatches(
                  parseLookupContentMatchesInput(
                    request.body
                  )
                );

            return reply
              .status(
                200
              )
              .send({
                match:
                  serializePublicContentMatchLookup(
                    match
                  ),
              });
          }
        )
    );

    app.post(
      "/public/copyright/status",
      async (
        request,
        reply
      ) =>
        await runPublicCopyrightOperation(
          request,
          reply,
          async () => {
            const status =
              await options
                .service
                .lookupStatus(
                  parseLookupStatusInput(
                    request.body
                  )
                );

            return reply
              .status(
                200
              )
              .send({
                status:
                  serializePublicStatusLookup(
                    status
                  ),
              });
          }
        )
    );
  };
