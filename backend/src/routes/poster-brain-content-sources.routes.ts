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

export type PosterBrainContentSourceRouteStatus =
  | "active"
  | "paused"
  | "disabled"
  | "blocked";

export type PosterBrainContentSourceRouteHealth =
  | "healthy"
  | "degraded"
  | "failing"
  | "unknown";

export interface PosterBrainContentSourcesListInput {
  readonly actorUserId: string;
  readonly status?: PosterBrainContentSourceRouteStatus;
  readonly search?: string;
  readonly limit: number;
}

export interface PosterBrainContentSourceRouteItem {
  readonly sourceKey: string;
  readonly displayName: string;
  readonly feedUrl: string;
  readonly status: PosterBrainContentSourceRouteStatus;
  readonly health: PosterBrainContentSourceRouteHealth;
  readonly priority: number;
  readonly lastFetchedAt: string | null;
  readonly nextAllowedAt: string | null;
}

export interface PosterBrainContentSourcesListResult {
  readonly sources: readonly PosterBrainContentSourceRouteItem[];
  readonly totalSources: number;
  readonly generatedAt: string;
}

export interface PosterBrainContentSourceIngestionRunInput {
  readonly actorUserId: string;
  readonly sourceKeys?: readonly string[];
  readonly maxSources: number;
  readonly force: boolean;
}

export interface PosterBrainContentSourceIngestionRunResult {
  readonly runId: string;
  readonly status:
    | "accepted"
    | "completed"
    | "rejected";
  readonly requestedAt: string;
  readonly summary: {
    readonly plannedSources: number;
    readonly attemptedSources: number;
    readonly succeededSources: number;
    readonly failedSources: number;
    readonly persistedItems: number;
  };
}

export interface PosterBrainContentSourcesRouteService {
  listSources(
    input: PosterBrainContentSourcesListInput
  ): Promise<PosterBrainContentSourcesListResult>;

  requestIngestionRun(
    input: PosterBrainContentSourceIngestionRunInput
  ): Promise<PosterBrainContentSourceIngestionRunResult>;
}

export interface PosterBrainContentSourcesRoutesOptions {
  readonly service: PosterBrainContentSourcesRouteService;
}

const SourcesQuerySchema =
  z
    .object({
      status:
        z
          .enum([
            "active",
            "paused",
            "disabled",
            "blocked",
          ])
          .optional(),

      search:
        z
          .string()
          .trim()
          .min(
            1
          )
          .max(
            160
          )
          .optional(),

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
    })
    .strict();

const IngestionRunBodySchema =
  z
    .object({
      sourceKeys:
        z
          .array(
            z
              .string()
              .trim()
              .min(
                1
              )
              .max(
                120
              )
          )
          .min(
            1
          )
          .max(
            50
          )
          .optional(),

      maxSources:
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
            20
          ),

      force:
        z
          .boolean()
          .default(
            false
          ),
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

function createListInput(input: {
  readonly actorUserId: string;
  readonly query: z.output<typeof SourcesQuerySchema>;
}): PosterBrainContentSourcesListInput {
  const serviceInput:
    PosterBrainContentSourcesListInput = {
      actorUserId:
        input.actorUserId,
      limit:
        input.query.limit,
    };

  if (input.query.status !== undefined) {
    Object.assign(
      serviceInput,
      {
        status:
          input.query.status,
      }
    );
  }

  if (input.query.search !== undefined) {
    Object.assign(
      serviceInput,
      {
        search:
          input.query.search,
      }
    );
  }

  return serviceInput;
}

function createRunInput(input: {
  readonly actorUserId: string;
  readonly body: z.output<typeof IngestionRunBodySchema>;
}): PosterBrainContentSourceIngestionRunInput {
  const serviceInput:
    PosterBrainContentSourceIngestionRunInput = {
      actorUserId:
        input.actorUserId,
      maxSources:
        input.body.maxSources,
      force:
        input.body.force,
    };

  if (input.body.sourceKeys !== undefined) {
    Object.assign(
      serviceInput,
      {
        sourceKeys:
          input.body.sourceKeys,
      }
    );
  }

  return serviceInput;
}

export const posterBrainContentSourcesRoutes:
  FastifyPluginAsync<
    PosterBrainContentSourcesRoutesOptions
  > =
  async (
    app,
    options
  ) => {
    app.get(
      "/sources",
      async request => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const query =
          parseRequestValue(
            SourcesQuerySchema,
            request.query,
            "query"
          );

        const serviceInput =
          createListInput({
            actorUserId:
              authorization.userId,
            query,
          });

        const result =
          await options
            .service
            .listSources(
              serviceInput
            );

        return {
          query: {
            status:
              serviceInput.status ?? null,
            search:
              serviceInput.search ?? null,
            limit:
              serviceInput.limit,
          },
          generatedAt:
            result.generatedAt,
          totalSources:
            result.totalSources,
          sources:
            result.sources,
        };
      }
    );

    app.post(
      "/sources/ingestion-runs",
      async (
        request,
        reply
      ) => {
        const authorization =
          requireAuthenticatedRequest(
            request
          );

        const body =
          parseRequestValue(
            IngestionRunBodySchema,
            request.body ?? {},
            "body"
          );

        const serviceInput =
          createRunInput({
            actorUserId:
              authorization.userId,
            body,
          });

        const result =
          await options
            .service
            .requestIngestionRun(
              serviceInput
            );

        reply.code(
          202
        );

        return {
          run:
            result,
        };
      }
    );
  };