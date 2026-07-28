import type * as z
  from "zod";

export interface ApiValidationIssue {
  path: string;

  message: string;
}

/**
 * Safe HTTP request-validation failure.
 *
 * The public message and normalized field issues may be
 * returned to API clients. Raw parser internals are excluded.
 */
export class ApiRequestValidationError
  extends Error {
  public readonly code =
    "REQUEST_VALIDATION_FAILED";

  public readonly statusCode =
    400;

  public readonly publicMessage =
    "The request contains invalid or missing fields.";

  public readonly issues:
    readonly ApiValidationIssue[];

  public constructor(
    issues:
      readonly ApiValidationIssue[]
  ) {
    super(
      "HTTP request validation failed."
    );

    this.name =
      "ApiRequestValidationError";

    this.issues =
      issues.map(
        (
          issue
        ) => ({
          path:
            issue.path,

          message:
            issue.message,
        })
      );

    Object.setPrototypeOf(
      this,
      new.target.prototype
    );
  }
}

/**
 * Parses one unknown request body using a strict Zod schema.
 */
export function parseHttpRequestBody<
  TSchema extends z.ZodType
>(
  schema:
    TSchema,
  body:
    unknown
): z.output<TSchema> {
  const result =
    schema.safeParse(
      body
    );

  if (
    !result.success
  ) {
    throw new ApiRequestValidationError(
      result.error.issues.map(
        (
          issue
        ) => ({
          path:
            issue.path.length >
            0
              ? issue.path
                  .map(
                    String
                  )
                  .join(".")
              : "body",

          message:
            issue.message,
        })
      )
    );
  }

  return result.data;
}