import type {
  FastifyError,
  FastifyInstance,
} from "fastify";

import {
  AuthenticationDomainError,
} from "../domains/authentication/authentication.errors.js";

import {
  ApiRequestValidationError,
  type ApiValidationIssue,
} from "../http/request-validation.js";

interface ApiErrorResponse {
  error: {
    code: string;

    message: string;

    requestId: string;

    details?:
      readonly ApiValidationIssue[];
  };
}

export function registerErrorHandler(
  app:
    FastifyInstance
): void {
  app.setNotFoundHandler(
    (
      request,
      reply
    ) => {
      const response:
        ApiErrorResponse = {
          error: {
            code:
              "ROUTE_NOT_FOUND",

            message:
              "The requested API route was not found.",

            requestId:
              request.id,
          },
        };

      return reply
        .status(
          404
        )
        .send(
          response
        );
    }
  );

  app.setErrorHandler(
    (
      error:
        FastifyError,
      request,
      reply
    ) => {
      if (
        error instanceof
        ApiRequestValidationError
      ) {
        request.log.info(
          {
            code:
              error.code,

            requestId:
              request.id,
          },
          "Poster API request validation failed."
        );

        const response:
          ApiErrorResponse = {
            error: {
              code:
                error.code,

              message:
                error.publicMessage,

              requestId:
                request.id,

              details:
                error.issues,
            },
          };

        return reply
          .status(
            error.statusCode
          )
          .send(
            response
          );
      }

      if (
        error instanceof
        AuthenticationDomainError
      ) {
        request.log.warn(
          {
            code:
              error.code,

            requestId:
              request.id,
          },
          "Poster authentication request was rejected."
        );

        const response:
          ApiErrorResponse = {
            error: {
              code:
                error.code,

              message:
                error.publicMessage,

              requestId:
                request.id,
            },
          };

        return reply
          .status(
            error.statusCode
          )
          .send(
            response
          );
      }

      const statusCode =
        typeof error.statusCode ===
          "number" &&
        error.statusCode >= 400 &&
        error.statusCode <= 599
          ? error.statusCode
          : 500;

      request.log.error(
        {
          error,

          requestId:
            request.id,
        },
        "Poster API request failed."
      );

      const response:
        ApiErrorResponse = {
          error: {
            code:
              statusCode >= 500
                ? "INTERNAL_SERVER_ERROR"
                : error.code ||
                  "REQUEST_FAILED",

            message:
              statusCode >= 500
                ? "The request could not be completed."
                : "The request could not be processed.",

            requestId:
              request.id,
          },
        };

      return reply
        .status(
          statusCode
        )
        .send(
          response
        );
    }
  );
}