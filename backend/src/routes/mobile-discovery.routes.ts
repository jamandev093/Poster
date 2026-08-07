import type {
  FastifyPluginAsync,
} from "fastify";

import {
  z,
} from "zod";

import type {
  DiscoverySurface,
} from "../domains/mobile-discovery/index.js";

import type {
  MobileDiscoveryService,
  MobileDiscoveryRefreshMode,
} from "../application/mobile-discovery/index.js";

import {
  requireAuthenticatedRequest,
} from "../http/authorization-context.js";

import {
  ApiRequestValidationError,
} from "../http/request-validation.js";

const DiscoveryQuerySchema =
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
            50
          )
          .optional(),

      cursor:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            4096
          )
          .optional(),

      refreshMode:
        z
          .enum([
            "initial",
            "older",
            "refresh",
          ])
          .optional(),

      query:
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

export interface MobileDiscoveryRoutesOptions {
  service:
    MobileDiscoveryService;
}

async function sendDiscoveryFeed(
  input: {
    service: MobileDiscoveryService;

    surface: DiscoverySurface;

    query: unknown;
  }
) {
  const query =
    parseRequestValue(
      DiscoveryQuerySchema,
      input.query,
      "query"
    );

  return input
    .service
    .listFeed({
      surface:
        input.surface,

      query:
        query.query ??
        null,

      category:
        query.category ??
        null,

      languageCode:
        query.languageCode ??
        null,

      regionCode:
        query.regionCode ??
        null,

      limit:
        query.limit ??
        null,

      cursor:
        query.cursor ??
        null,

      refreshMode:
        (
          query.refreshMode ??
          null
        ) as MobileDiscoveryRefreshMode | null,
    });
}

/**
 * Mobile discovery routes.
 *
 * These routes serve authenticated Mobile app surfaces:
 * Home, Search, and Trending. The response preserves the
 * MobileDiscoveryFeedResponse contract from the application
 * service, including cursor pagination, refreshAfterSeconds,
 * search-engine readiness, recommendation metadata, ad-slot
 * contracts, and Python AI handoff metadata.
 */
export const mobileDiscoveryRoutes:
  FastifyPluginAsync<
    MobileDiscoveryRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/feed/home",
      async (
        request,
        reply
      ) => {
        requireAuthenticatedRequest(
          request
        );

        const response =
          await sendDiscoveryFeed({
            service:
              options.service,

            surface:
              "home",

            query:
              request.query,
          });

        return reply
          .status(
            200
          )
          .send(
            response
          );
      }
    );

    app.get(
      "/feed/trending",
      async (
        request,
        reply
      ) => {
        requireAuthenticatedRequest(
          request
        );

        const response =
          await sendDiscoveryFeed({
            service:
              options.service,

            surface:
              "trending",

            query:
              request.query,
          });

        return reply
          .status(
            200
          )
          .send(
            response
          );
      }
    );

    app.get(
      "/search",
      async (
        request,
        reply
      ) => {
        requireAuthenticatedRequest(
          request
        );

        const response =
          await sendDiscoveryFeed({
            service:
              options.service,

            surface:
              "search",

            query:
              request.query,
          });

        return reply
          .status(
            200
          )
          .send(
            response
          );
      }
    );
  };
