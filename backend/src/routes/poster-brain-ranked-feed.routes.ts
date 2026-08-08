import type {
  FastifyPluginAsync,
} from "fastify";

import {
  z,
} from "zod";

import {
  requireAuthenticatedRequest,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

export type PosterBrainRankedFeedRouteSurface =
  | "home"
  | "search"
  | "trending";

export interface PosterBrainRankedFeedRouteServiceInput {
  readonly actorUserId: string;
  readonly surface: PosterBrainRankedFeedRouteSurface;
  readonly limit: number;
  readonly candidatePoolLimit?: number;
  readonly searchQuery?: string;
  readonly languageCode?: string;
  readonly regionCode?: string;
  readonly category?: string;
}

export interface PosterBrainRankedFeedRouteItem {
  readonly id: string;
  readonly title: string;
  readonly originalUrl: string;
  readonly publisherName: string;
  readonly score: number;
  readonly publishedAt: string | null;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface PosterBrainRankedFeedRouteServiceResult {
  readonly items: readonly PosterBrainRankedFeedRouteItem[];
  readonly totalItems: number;
  readonly generatedAt: string;
}

export interface PosterBrainRankedFeedRouteService {
  readRankedFeed(
    input: PosterBrainRankedFeedRouteServiceInput
  ): Promise<PosterBrainRankedFeedRouteServiceResult>;
}

export interface PosterBrainRankedFeedRoutesOptions {
  readonly service: PosterBrainRankedFeedRouteService;
}

const RankedFeedQuerySchema =
  z
    .object({
      surface:
        z
          .enum([
            "home",
            "search",
            "trending",
          ])
          .default(
            "home"
          ),

      limit:
        z
          .coerce
          .number()
          .int()
          .min(
            1
          )
          .max(
            50
          )
          .default(
            20
          ),

      candidatePoolLimit:
        z
          .coerce
          .number()
          .int()
          .min(
            1
          )
          .max(
            200
          )
          .optional(),

      searchQuery:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            240
          )
          .optional(),

      languageCode:
        z
          .string()
          .trim()
          .min(
            2
          )
          .max(
            12
          )
          .optional(),

      regionCode:
        z
          .string()
          .trim()
          .min(
            2
          )
          .max(
            12
          )
          .optional(),

      category:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            100
          )
          .optional(),
    })
    .strict();

function parseRequestValue<
  TSchema extends z.ZodTypeAny
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

  if (!result.success) {
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

function createServiceInput(input: {
  readonly actorUserId: string;
  readonly query: z.output<typeof RankedFeedQuerySchema>;
}): PosterBrainRankedFeedRouteServiceInput {
  const serviceInput:
    PosterBrainRankedFeedRouteServiceInput = {
      actorUserId:
        input.actorUserId,
      surface:
        input.query.surface,
      limit:
        input.query.limit,
    };

  if (input.query.candidatePoolLimit !== undefined) {
    Object.assign(
      serviceInput,
      {
        candidatePoolLimit:
          input.query.candidatePoolLimit,
      }
    );
  }

  if (input.query.searchQuery !== undefined) {
    Object.assign(
      serviceInput,
      {
        searchQuery:
          input.query.searchQuery,
      }
    );
  }

  if (input.query.languageCode !== undefined) {
    Object.assign(
      serviceInput,
      {
        languageCode:
          input.query.languageCode,
      }
    );
  }

  if (input.query.regionCode !== undefined) {
    Object.assign(
      serviceInput,
      {
        regionCode:
          input.query.regionCode,
      }
    );
  }

  if (input.query.category !== undefined) {
    Object.assign(
      serviceInput,
      {
        category:
          input.query.category,
      }
    );
  }

  return serviceInput;
}

export const posterBrainRankedFeedRoutes:
  FastifyPluginAsync<
    PosterBrainRankedFeedRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/ranked-feed",
      async request => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const query =
          parseRequestValue(
            RankedFeedQuerySchema,
            request.query,
            "query"
          );

        const serviceInput =
          createServiceInput({
            actorUserId:
              authorization.userId,
            query,
          });

        const result =
          await options
            .service
            .readRankedFeed(
              serviceInput
            );

        return {
          surface:
            serviceInput.surface,
          query: {
            searchQuery:
              serviceInput.searchQuery ?? null,
            languageCode:
              serviceInput.languageCode ?? null,
            regionCode:
              serviceInput.regionCode ?? null,
            category:
              serviceInput.category ?? null,
            limit:
              serviceInput.limit,
            candidatePoolLimit:
              serviceInput.candidatePoolLimit ?? null,
          },
          generatedAt:
            result.generatedAt,
          totalItems:
            result.totalItems,
          items:
            result.items,
        };
      }
    );
  };