import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  z,
} from "zod";

import type {
  ClientCommercialRequestService,
} from "../application/monetization/client-commercial-request.service.js";

import {
  COMMERCIAL_REQUEST_TYPES,
  MONETIZATION_PLACEMENTS,
  type CommercialRequestRecord,
} from "../domains/monetization/commercial.types.js";

import {
  requireOrganizationRole,
} from "../http/organization-access.js";

import {
  ApiRequestValidationError,
  parseHttpRequestBody,
} from "../http/request-validation.js";

const JsonObjectSchema =
  z.record(
    z.string(),
    z.unknown()
  );

const RequestDraftObjectSchema =
  z
    .object({
      requestType:
        z.enum(
          COMMERCIAL_REQUEST_TYPES
        ),

      title:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            160
          ),

      objective:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            2000
          ),

      destinationUrl:
        z
          .string()
          .trim()
          .url()
          .max(
            2048
          ),

      requestedPlacements:
        z
          .array(
            z.enum(
              MONETIZATION_PLACEMENTS
            )
          )
          .min(
            1
          )
          .max(
            3
          )
          .refine(
            (
              values
            ) =>
              new Set(
                values
              ).size === values.length,
            "Requested placements must be unique."
          ),

      requestedStartDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/
          ),

      requestedEndDate:
        z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}$/
          ),

      budgetMinorUnits:
        z
          .number()
          .int()
          .min(
            0
          )
          .max(
            Number.MAX_SAFE_INTEGER
          )
          .nullable()
          .optional(),

      currencyCode:
        z
          .string()
          .trim()
          .regex(
            /^[A-Za-z]{3}$/
          )
          .transform(
            (
              value
            ) =>
              value.toUpperCase()
          )
          .nullable()
          .optional(),

      creativeSpec:
        JsonObjectSchema,

      commercialTerms:
        JsonObjectSchema,
    })
    .strict();

function validateRequestDraft(
  value:
    z.output<
      typeof RequestDraftObjectSchema
    >,
  context:
    z.RefinementCtx
): void {
  if (
    value.requestedEndDate <
    value.requestedStartDate
  ) {
    context.addIssue({
      code:
        "custom",

      path: [
        "requestedEndDate",
      ],

      message:
        "Requested end date must not be earlier than the start date.",
    });
  }

  const hasBudget =
    value.budgetMinorUnits != null;

  const hasCurrency =
    value.currencyCode != null;

  if (
    hasBudget !== hasCurrency
  ) {
    context.addIssue({
      code:
        "custom",

      path: [
        "currencyCode",
      ],

      message:
        "Budget and currency must be supplied together.",
    });
  }
}

const RequestDraftSchema =
  RequestDraftObjectSchema
    .superRefine(
      validateRequestDraft
    );

const ResubmitSchema =
  RequestDraftObjectSchema
    .extend({
      expectedRowVersion:
        z
          .string()
          .regex(
            /^\d+$/
          ),
    })
    .superRefine(
      validateRequestDraft
    );

const OrganizationParamsSchema =
  z
    .object({
      organizationId:
        z
          .string()
          .uuid(),
    })
    .strict();

const RequestParamsSchema =
  z
    .object({
      organizationId:
        z
          .string()
          .uuid(),

      requestId:
        z
          .string()
          .uuid(),
    })
    .strict();

const PaginationSchema =
  z
    .object({
      limit:
        z
          .coerce
          .number()
          .int()
          .min(
            1
          )
          .max(
            100
          )
          .default(
            50
          ),

      offset:
        z
          .coerce
          .number()
          .int()
          .min(
            0
          )
          .default(
            0
          ),
    })
    .strict();

function parseRequestValue<
  TSchema extends z.ZodType
>(
  schema: TSchema,
  value: unknown,
  root: string
): z.output<TSchema> {
  const result =
    schema.safeParse(
      value
    );

  if (!result.success) {
    throw new ApiRequestValidationError(
      result.error.issues.map(
        (
          issue
        ) => ({
          path:
            [
              root,
              ...issue.path.map(
                String
              ),
            ].join(
              "."
            ),

          message:
            issue.message,
        })
      )
    );
  }

  return result.data;
}

function sendNotFound(
  request: FastifyRequest,
  reply: FastifyReply
) {
  return reply
    .status(
      404
    )
    .send({
      error: {
        code:
          "COMMERCIAL_REQUEST_NOT_FOUND",

        message:
          "The advertising request was not found.",

        requestId:
          request.id,
      },
    });
}

function sendConflict(
  request: FastifyRequest,
  reply: FastifyReply,
  currentStatus: string
) {
  return reply
    .status(
      409
    )
    .send({
      error: {
        code:
          "COMMERCIAL_REQUEST_STATE_CONFLICT",

        message:
          "The advertising request changed or cannot be modified in its current state.",

        requestId:
          request.id,

        currentStatus,
      },
    });
}

function serializeRequest(
  value: CommercialRequestRecord
) {
  return {
    ...value,

    submittedAt:
      value.submittedAt.toISOString(),

    decidedAt:
      value.decidedAt?.toISOString() ?? null,

    createdAt:
      value.createdAt.toISOString(),

    updatedAt:
      value.updatedAt.toISOString(),
  };
}

export interface ClientCommercialRequestRoutesOptions {
  service: ClientCommercialRequestService;
}

export const clientCommercialRequestRoutes:
  FastifyPluginAsync<ClientCommercialRequestRoutesOptions> =
  async (
    app,
    options
  ) => {
    app.post(
      "/organizations/:organizationId/advertising-requests",
      async (
        request,
        reply
      ) => {
        const params =
          parseRequestValue(
            OrganizationParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseHttpRequestBody(
            RequestDraftSchema,
            request.body
          );

        const access =
          requireOrganizationRole(
            request,
            params.organizationId,
            [
              "owner",
              "admin",
              "campaign_manager",
            ]
          );

        const created =
          await options
            .service
            .submit({
              ...body,

              organizationId:
                params.organizationId,

              actorUserId:
                access.context.userId,
            });

        return reply
          .status(
            201
          )
          .send({
            request:
              serializeRequest(
                created
              ),
          });
      }
    );

    app.get(
      "/organizations/:organizationId/advertising-requests",
      async (
        request,
        reply
      ) => {
        const params =
          parseRequestValue(
            OrganizationParamsSchema,
            request.params,
            "params"
          );

        const query =
          parseRequestValue(
            PaginationSchema,
            request.query,
            "query"
          );

        requireOrganizationRole(
          request,
          params.organizationId,
          [
            "owner",
            "admin",
            "campaign_manager",
            "finance",
            "viewer",
          ]
        );

        const result =
          await options
            .service
            .listForOrganization(
              params.organizationId,
              query
            );

        return reply
          .status(
            200
          )
          .send({
            ...result,

            items:
              result.items.map(
                serializeRequest
              ),
          });
      }
    );

    app.get(
      "/organizations/:organizationId/advertising-requests/:requestId",
      async (
        request,
        reply
      ) => {
        const params =
          parseRequestValue(
            RequestParamsSchema,
            request.params,
            "params"
          );

        requireOrganizationRole(
          request,
          params.organizationId,
          [
            "owner",
            "admin",
            "campaign_manager",
            "finance",
            "viewer",
          ]
        );

        const detail =
          await options
            .service
            .getForOrganization(
              params.organizationId,
              params.requestId
            );

        if (!detail) {
          return sendNotFound(
            request,
            reply
          );
        }

        return reply
          .status(
            200
          )
          .send({
            request:
              serializeRequest(
                detail.request
              ),

            revisions:
              detail.revisions.map(
                (
                  revision
                ) => ({
                  ...revision,

                  createdAt:
                    revision.createdAt.toISOString(),
                })
              ),
          });
      }
    );

    app.post(
      "/organizations/:organizationId/advertising-requests/:requestId/resubmit",
      async (
        request,
        reply
      ) => {
        const params =
          parseRequestValue(
            RequestParamsSchema,
            request.params,
            "params"
          );

        const body =
          parseHttpRequestBody(
            ResubmitSchema,
            request.body
          );

        const access =
          requireOrganizationRole(
            request,
            params.organizationId,
            [
              "owner",
              "admin",
              "campaign_manager",
            ]
          );

        const outcome =
          await options
            .service
            .resubmit({
              ...body,

              organizationId:
                params.organizationId,

              requestId:
                params.requestId,

              actorUserId:
                access.context.userId,
            });

        if (
          outcome.status === "not_found"
        ) {
          return sendNotFound(
            request,
            reply
          );
        }

        if (
          outcome.status === "conflict"
        ) {
          return sendConflict(
            request,
            reply,
            outcome.request.status
          );
        }

        return reply
          .status(
            200
          )
          .send({
            request:
              serializeRequest(
                outcome.request
              ),
          });
      }
    );
  };
