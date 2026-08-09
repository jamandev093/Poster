import type {
  FastifyPluginAsync,
} from "fastify";

import {
  z,
} from "zod";

import type {
  MobileEngagementService,
} from "../application/mobile-engagement/index.js";

import {
  requireAuthenticatedRequest,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const MetadataSchema =
  z
    .record(
      z.string(),
      z.unknown()
    );

const NullableTrimmedTextSchema =
  z
    .string()
    .trim();

const ShareRequestSchema =
  z
    .object({
      contentId:
        z
          .string()
          .uuid(),

      originalUrl:
        z
          .string()
          .trim()
          .url()
          .max(2048),

      publisher:
        z
          .string()
          .trim()
          .min(1)
          .max(240),

      shareTarget:
        NullableTrimmedTextSchema
          .min(1)
          .max(120)
          .nullable()
          .optional(),

      activityType:
        NullableTrimmedTextSchema
          .min(1)
          .max(160)
          .nullable()
          .optional(),

      metadata:
        MetadataSchema
          .optional(),
    })
    .strict();

const ReportRequestSchema =
  z
    .object({
      contentId:
        z
          .string()
          .uuid(),

      reasonId:
        z
          .string()
          .trim()
          .toLowerCase()
          .regex(
            /^[a-z0-9_-]{2,64}$/
          ),

      details:
        NullableTrimmedTextSchema
          .max(2000)
          .nullable()
          .optional(),

      reportContext:
        MetadataSchema
          .optional(),
    })
    .strict();

const OrganicContentEventRequestSchema =
  z
    .object({
      contentId:
        z
          .string()
          .uuid(),

      eventType:
        z
          .enum([
            "impression",
            "open_original_click",
          ]),

      surface:
        z
          .enum([
            "home",
            "search",
            "trending",
            "bookmarks",
          ]),

      sourceContext:
        NullableTrimmedTextSchema
          .min(1)
          .max(160)
          .nullable()
          .optional(),

      deduplicationKey:
        NullableTrimmedTextSchema
          .min(8)
          .max(240)
          .nullable()
          .optional(),

      occurredAt:
        NullableTrimmedTextSchema
          .min(1)
          .max(80)
          .nullable()
          .optional(),

      metadata:
        MetadataSchema
          .optional(),
    })
    .strict();

const AdInteractionRequestSchema =
  z
    .object({
      eventType:
        z
          .enum([
            "impression",
            "view",
            "click",
            "dismiss",
            "hide",
          ]),

      placement:
        z
          .string()
          .trim()
          .min(1)
          .max(160),

      adSlotId:
        z
          .string()
          .uuid()
          .nullable()
          .optional(),

      campaignId:
        z
          .string()
          .uuid()
          .nullable()
          .optional(),

      creativeId:
        z
          .string()
          .uuid()
          .nullable()
          .optional(),

      contentId:
        z
          .string()
          .uuid()
          .nullable()
          .optional(),

      deduplicationKey:
        NullableTrimmedTextSchema
          .min(8)
          .max(240)
          .nullable()
          .optional(),

      occurredAt:
        NullableTrimmedTextSchema
          .min(1)
          .max(80)
          .nullable()
          .optional(),

      metadata:
        MetadataSchema
          .optional(),
    })
    .strict();

function parseRequestValue<
  TSchema extends z.ZodType
>(
  schema:
    TSchema,
  value:
    unknown,
  location:
    string
): z.infer<TSchema> {
  const result =
    schema.safeParse(
      value
    );

  if (result.success) {
    return result.data;
  }

  throw new ApiRequestValidationError(
    result.error.issues.map(
      (issue) => ({
        path:
          [
            location,
            ...issue.path.map(
              String
            ),
          ].join("."),

        message:
          issue.message,
      })
    )
  );
}

export interface MobileEngagementRoutesOptions {
  service:
    MobileEngagementService;
}

export const mobileEngagementRoutes:
  FastifyPluginAsync<
    MobileEngagementRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.post(
      "/actions/share",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            ShareRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .recordShareEvent({
            userId:
              authorization.userId,

            contentId:
              body.contentId,

            originalUrl:
              body.originalUrl,

            publisher:
              body.publisher,

            shareTarget:
              body.shareTarget ??
              null,

            activityType:
              body.activityType ??
              null,

            metadata:
              body.metadata ??
              {},
          });
      }
    );

    app.post(
      "/actions/report",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            ReportRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .recordReportEvent({
            userId:
              authorization.userId,

            contentId:
              body.contentId,

            reasonId:
              body.reasonId,

            details:
              body.details ??
              null,

            reportContext:
              body.reportContext ??
              {},
          });
      }
    );

    app.post(
      "/actions/content-events",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            OrganicContentEventRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .recordOrganicContentEvent({
            userId:
              authorization.userId,

            contentId:
              body.contentId,

            eventType:
              body.eventType,

            surface:
              body.surface,

            sourceContext:
              body.sourceContext ??
              null,

            deduplicationKey:
              body.deduplicationKey ??
              null,

            occurredAt:
              body.occurredAt ??
              null,

            metadata:
              body.metadata ??
              {},
          });
      }
    );

    app.post(
      "/ads/interactions",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            AdInteractionRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .recordAdInteraction({
            userId:
              authorization.userId,

            eventType:
              body.eventType,

            placement:
              body.placement,

            adSlotId:
              body.adSlotId ??
              null,

            campaignId:
              body.campaignId ??
              null,

            creativeId:
              body.creativeId ??
              null,

            contentId:
              body.contentId ??
              null,

            deduplicationKey:
              body.deduplicationKey ??
              null,

            occurredAt:
              body.occurredAt ??
              null,

            metadata:
              body.metadata ??
              {},
          });
      }
    );
  };
