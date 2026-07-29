export const AUTHENTICATION_ERROR_CODES = [
  "AUTH_INVALID_CREDENTIALS",
  "AUTH_PASSWORD_POLICY",
  "AUTH_TOKEN_INVALID",
  "AUTH_TOKEN_EXPIRED",
  "AUTH_REQUIRED",
  "AUTH_ACCESS_TOKEN_INVALID",
  "AUTH_ACCESS_TOKEN_EXPIRED",
  "AUTH_SESSION_INVALID",
  "AUTH_FORBIDDEN",
  "AUTH_CONFLICT",
  "AUTH_CONCURRENCY_CONFLICT",
] as const;

export type AuthenticationErrorCode =
  (typeof AUTHENTICATION_ERROR_CODES)[number];

export interface AuthenticationErrorOptions {
  code: AuthenticationErrorCode;

  message: string;

  publicMessage: string;

  statusCode: number;
}

/**
 * Base error for expected authentication-domain failures.
 *
 * Internal messages may contain diagnostic context.
 * Public messages are safe for API responses.
 */
export class AuthenticationDomainError
  extends Error {
  public readonly code:
    AuthenticationErrorCode;

  public readonly publicMessage:
    string;

  public readonly statusCode:
    number;

  public readonly operational =
    true;

  public constructor(
    options: AuthenticationErrorOptions
  ) {
    super(
      options.message
    );

    this.name =
      "AuthenticationDomainError";

    this.code =
      options.code;

    this.publicMessage =
      options.publicMessage;

    this.statusCode =
      options.statusCode;

    Object.setPrototypeOf(
      this,
      new.target.prototype
    );
  }
}

export class InvalidCredentialsError
  extends AuthenticationDomainError {
  public constructor() {
    super({
      code:
        "AUTH_INVALID_CREDENTIALS",

      message:
        "The supplied authentication credentials were invalid.",

      publicMessage:
        "The email or password is incorrect.",

      statusCode:
        401,
    });

    this.name =
      "InvalidCredentialsError";
  }
}

export class PasswordPolicyError
  extends AuthenticationDomainError {
  public constructor(
    message:
      string
  ) {
    super({
      code:
        "AUTH_PASSWORD_POLICY",

      message,

      publicMessage:
        "The password does not meet the security requirements.",

      statusCode:
        400,
    });

    this.name =
      "PasswordPolicyError";
  }
}

export class AuthenticationTokenInvalidError
  extends AuthenticationDomainError {
  public constructor() {
    super({
      code:
        "AUTH_TOKEN_INVALID",

      message:
        "The supplied authentication token was invalid.",

      publicMessage:
        "The verification link or code is invalid.",

      statusCode:
        401,
    });

    this.name =
      "AuthenticationTokenInvalidError";
  }
}

export class AuthenticationTokenExpiredError
  extends AuthenticationDomainError {
  public constructor() {
    super({
      code:
        "AUTH_TOKEN_EXPIRED",

      message:
        "The supplied authentication token has expired.",

      publicMessage:
        "The verification link or code has expired.",

      statusCode:
        401,
    });

    this.name =
      "AuthenticationTokenExpiredError";
  }
}

export class AuthenticationRequiredError
  extends AuthenticationDomainError {
  public constructor() {
    super({
      code:
        "AUTH_REQUIRED",

      message:
        "The requested operation requires an authenticated identity.",

      publicMessage:
        "Authentication is required.",

      statusCode:
        401,
    });

    this.name =
      "AuthenticationRequiredError";
  }
}

export class AuthenticationAccessTokenInvalidError
  extends AuthenticationDomainError {
  public constructor() {
    super({
      code:
        "AUTH_ACCESS_TOKEN_INVALID",

      message:
        "The supplied access token was invalid.",

      publicMessage:
        "The authentication session is invalid.",

      statusCode:
        401,
    });

    this.name =
      "AuthenticationAccessTokenInvalidError";
  }
}

export class AuthenticationAccessTokenExpiredError
  extends AuthenticationDomainError {
  public constructor() {
    super({
      code:
        "AUTH_ACCESS_TOKEN_EXPIRED",

      message:
        "The supplied access token has expired.",

      publicMessage:
        "The authentication session has expired.",

      statusCode:
        401,
    });

    this.name =
      "AuthenticationAccessTokenExpiredError";
  }
}

export class AuthenticationSessionInvalidError
  extends AuthenticationDomainError {
  public constructor(
    message:
      string =
        "The authentication session or refresh token is invalid."
  ) {
    super({
      code:
        "AUTH_SESSION_INVALID",

      message,

      publicMessage:
        "The authentication session is invalid or has expired.",

      statusCode:
        401,
    });

    this.name =
      "AuthenticationSessionInvalidError";
  }
}

export class AuthenticationForbiddenError
  extends AuthenticationDomainError {
  public constructor(
    message:
      string =
        "The authenticated identity is not permitted to perform this operation."
  ) {
    super({
      code:
        "AUTH_FORBIDDEN",

      message,

      publicMessage:
        "You do not have permission to perform this action.",

      statusCode:
        403,
    });

    this.name =
      "AuthenticationForbiddenError";
  }
}

export class AuthenticationConflictError
  extends AuthenticationDomainError {
  public constructor(
    message:
      string
  ) {
    super({
      code:
        "AUTH_CONFLICT",

      message,

      publicMessage:
        "The authentication request conflicts with an existing record.",

      statusCode:
        409,
    });

    this.name =
      "AuthenticationConflictError";
  }
}

export class AuthenticationConcurrencyError
  extends AuthenticationDomainError {
  public constructor() {
    super({
      code:
        "AUTH_CONCURRENCY_CONFLICT",

      message:
        "The authentication record changed before the operation completed.",

      publicMessage:
        "The account changed during this request. Please try again.",

      statusCode:
        409,
    });

    this.name =
      "AuthenticationConcurrencyError";
  }
}