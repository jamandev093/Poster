import type {
  FastifyError,
  FastifyInstance
} from "fastify";

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export function registerErrorHandler(
  app: FastifyInstance
): void {
  app.setNotFoundHandler(
    (
      request,
      reply
    ) => {
      const response:
        ApiErrorResponse = {
          error: {
            code: "ROUTE_NOT_FOUND",
            message:
              "The requested API route was not found.",
            requestId:
              request.id
          }
        };

      return reply
        .status(404)
        .send(response);
    }
  );

  app.setErrorHandler(
    (
      error: FastifyError,
      request,
      reply
    ) => {
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
            request.id
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
                : error.message,

            requestId:
              request.id
          }
        };

      return reply
        .status(statusCode)
        .send(response);
    }
  );
}