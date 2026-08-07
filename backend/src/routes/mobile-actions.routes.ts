import type {
  FastifyPluginAsync,
} from "fastify";

import {
  z,
} from "zod";

import type {
  MobileUserActionsService,
} from "../application/mobile-actions/index.js";

import {
  requireAuthenticatedRequest,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const ArticleSnapshotSchema =
  z
    .object({
      title:
        z
          .string()
          .trim()
          .min(1)
          .max(500),

      summary:
        z
          .string()
          .max(2000),

      publisher:
        z
          .string()
          .trim()
          .min(1)
          .max(240),

      publisherUrl:
        z
          .string()
          .trim()
          .min(1)
          .max(2048),

      image:
        z
          .string()
          .max(2048),

      publishedAt:
        z
          .string()
          .trim()
          .min(1)
          .max(64),

      discoveredAt:
        z
          .string()
          .trim()
          .min(1)
          .max(64),

      category:
        z
          .string()
          .trim()
          .min(1)
          .max(120),

      originalUrl:
        z
          .string()
          .trim()
          .url()
          .max(2048),

      verified:
        z
          .boolean(),
    })
    .strict();

const ContentActionRequestSchema =
  z
    .object({
      contentId:
        z
          .string()
          .uuid(),
    })
    .strict();

const BookmarkToggleRequestSchema =
  z
    .object({
      contentId:
        z
          .string()
          .uuid(),

      articleSnapshot:
        ArticleSnapshotSchema
          .optional(),
    })
    .strict();

const FeedbackRequestSchema =
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
    })
    .strict();

function parseRequestValue<
  TSchema extends z.ZodType
>(
  schema:
    TSchema,
  value:
    unknown,
  root:
    string
): z.output<TSchema> {
  const result =
    schema.safeParse(
      value
    );

  if (
    !result.success
  ) {
    throw new ApiRequestValidationError(
      result.error.issues.map(
        issue => ({
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

export interface MobileUserActionsRoutesOptions {
  service:
    MobileUserActionsService;
}

export const mobileUserActionsRoutes:
  FastifyPluginAsync<
    MobileUserActionsRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/actions/bookmarks",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const bookmarks =
          await options
            .service
            .listBookmarks(
              authorization.userId
            );

        return {
          bookmarks,
        };
      }
    );

    app.get(
      "/actions/state",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        return await options
          .service
          .getInteractionState(
            authorization.userId
          );
      }
    );

    app.post(
      "/actions/bookmarks/toggle",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            BookmarkToggleRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .toggleBookmark({
            userId:
              authorization.userId,

            contentId:
              body.contentId,

            articleSnapshot:
              body.articleSnapshot ??
              null,
          });
      }
    );

    app.post(
      "/actions/worth-reading",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            ContentActionRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .markWorthReading({
            userId:
              authorization.userId,

            contentId:
              body.contentId,
          });
      }
    );

    app.post(
      "/actions/helpful",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            ContentActionRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .markHelpful({
            userId:
              authorization.userId,

            contentId:
              body.contentId,
          });
      }
    );

    app.post(
      "/actions/feedback",
      async (
        request
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            FeedbackRequestSchema,
            request.body,
            "body"
          );

        return await options
          .service
          .submitFeedback({
            userId:
              authorization.userId,

            contentId:
              body.contentId,

            reasonId:
              body.reasonId,
          });
      }
    );
  };
