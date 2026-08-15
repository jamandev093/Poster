import {
  randomBytes,
} from "node:crypto";

import {
  OAuth2Client,
} from "google-auth-library";

import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  AuthenticationConcurrencyError,
  AuthenticationDomainError,
  AuthenticationForbiddenError,
} from "../../domains/authentication/authentication.errors.js";

import {
  hashPassword,
} from "../../domains/authentication/password.security.js";

import {
  createOpaqueTokenPair,
} from "../../domains/authentication/token.security.js";

import type {
  AuthenticationAccountSummary,
} from "../../domains/authentication/authentication.service.types.js";

import {
  createUserExternalIdentity,
  findUserExternalIdentityByProviderSubject,
  touchUserExternalIdentity,
  type UserExternalIdentityRecord,
} from "../../domains/identity/external-identity.repository.js";

import {
  normalizeIdentityEmail,
  normalizeRequiredIdentityText,
  type CreateUserSessionInput,
  type UserIdentityRecord,
  type UserSessionRecord,
} from "../../domains/identity/identity.types.js";

import {
  createUserSession,
} from "../../domains/identity/session.repository.js";

import {
  createUser,
  findUserByEmail,
  findUserById,
  markUserEmailVerified,
  recordSuccessfulUserLogin,
} from "../../domains/identity/user.repository.js";

import {
  LOGIN_SESSION_POLICY,
} from "./login-session.service.js";

import type {
  AuthenticationSessionSummary,
} from "./login-session.types.js";

import type {
  GoogleAuthenticationInput,
  GoogleAuthenticationResult,
} from "./google-authentication.types.js";

const GOOGLE_PROVIDER =
  "google" as const;

const GOOGLE_FULL_NAME_MAXIMUM_LENGTH =
  200;

const DEFAULT_GOOGLE_OAUTH_CLIENT =
  new OAuth2Client();

export interface VerifiedGoogleIdentity {
  subject: string;

  email: string;

  emailVerified: boolean;

  fullName:
    | string
    | null;
}

export type VerifyGoogleIdToken =
  (
    input: {
      idToken: string;

      audience: string;
    }
  ) => Promise<
    VerifiedGoogleIdentity
  >;

export type GoogleAuthenticationTransactionRunner =
  <T>(
    operation:
      (
        executor:
          DatabaseQueryExecutor
      ) => Promise<T>
  ) => Promise<T>;

export class GoogleAuthenticationInvalidError
  extends AuthenticationDomainError {
  public constructor(
    message:
      string =
        "The Google identity token could not be verified."
  ) {
    super({
      code:
        "AUTH_INVALID_CREDENTIALS",

      message,

      publicMessage:
        "Google authentication could not be verified. Please try again.",

      statusCode:
        401,
    });

    this.name =
      "GoogleAuthenticationInvalidError";
  }
}

export class GoogleAuthenticationConflictError
  extends AuthenticationDomainError {
  public constructor(
    message: string,
    publicMessage: string
  ) {
    super({
      code:
        "AUTH_CONFLICT",

      message,

      publicMessage,

      statusCode:
        409,
    });

    this.name =
      "GoogleAuthenticationConflictError";
  }
}

export interface GoogleAuthenticationService {
  authenticate:
    (
      input:
        GoogleAuthenticationInput
    ) => Promise<
      GoogleAuthenticationResult
    >;
}

export interface GoogleAuthenticationServiceOptions {
  webClientId?: string;

  verifyGoogleIdToken?:
    VerifyGoogleIdToken;

  runDatabaseTransaction?:
    GoogleAuthenticationTransactionRunner;

  findUserExternalIdentityByProviderSubject?:
    typeof findUserExternalIdentityByProviderSubject;

  createUserExternalIdentity?:
    typeof createUserExternalIdentity;

  touchUserExternalIdentity?:
    typeof touchUserExternalIdentity;

  findUserById?:
    typeof findUserById;

  findUserByEmail?:
    typeof findUserByEmail;

  createUser?:
    typeof createUser;

  markUserEmailVerified?:
    typeof markUserEmailVerified;

  recordSuccessfulUserLogin?:
    typeof recordSuccessfulUserLogin;

  createUserSession?:
    typeof createUserSession;

  createOpaqueTokenPair?:
    typeof createOpaqueTokenPair;

  hashPassword?:
    typeof hashPassword;

  createPlaceholderPassword?:
    () => string;

  now?:
    () => Date;
}

async function verifyGoogleIdTokenWithGoogle(
  input: {
    idToken: string;

    audience: string;
  }
): Promise<
  VerifiedGoogleIdentity
> {
  try {
    const ticket =
      await DEFAULT_GOOGLE_OAUTH_CLIENT
        .verifyIdToken({
          idToken:
            input.idToken,

          audience:
            input.audience,
        });

    const payload =
      ticket.getPayload();

    if (
      !payload ||
      typeof payload.sub !==
        "string" ||
      typeof payload.email !==
        "string" ||
      payload.email_verified !==
        true
    ) {
      throw new GoogleAuthenticationInvalidError(
        "The verified Google token was missing a subject, verified email, or required identity claims."
      );
    }

    return {
      subject:
        payload.sub,

      email:
        payload.email,

      emailVerified:
        payload.email_verified,

      fullName:
        typeof payload.name ===
          "string"
          ? payload.name
          : null,
    };
  } catch (error) {
    if (
      error instanceof
      GoogleAuthenticationInvalidError
    ) {
      throw error;
    }

    throw new GoogleAuthenticationInvalidError(
      error instanceof Error
        ? `Google ID-token verification failed: ${error.message}`
        : "Google ID-token verification failed."
    );
  }
}

function createPlaceholderPassword():
  string {
  /*
   * app.users.password_hash remains the authoritative existing
   * schema. Google-created users therefore receive a random,
   * unknowable local secret whose Argon2 hash satisfies that
   * schema. The raw value is immediately discarded.
   */
  return randomBytes(
    48
  ).toString(
    "base64url"
  );
}

function assertValidAuthenticationDate(
  value:
    Date
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      "Google authentication time must be a valid date."
    );
  }
}

function normalizeVerifiedGoogleIdentity(
  identity:
    VerifiedGoogleIdentity
): {
  subject: string;

  email: string;

  fullName: string;
} {
  if (
    identity.emailVerified !==
      true
  ) {
    throw new GoogleAuthenticationInvalidError(
      "Google did not assert a verified email address."
    );
  }

  const subject =
    normalizeRequiredIdentityText(
      identity.subject
    );

  const email =
    normalizeIdentityEmail(
      identity.email
    );

  if (
    !subject ||
    !email ||
    !email.includes(
      "@"
    )
  ) {
    throw new GoogleAuthenticationInvalidError(
      "Google returned an incomplete identity."
    );
  }

  const emailLocalPart =
    email
      .split(
        "@"
      )[0]
      ?.trim() ??
    "";

  const fullName =
    (
      identity.fullName
        ?.trim() ||
      emailLocalPart ||
      "Poster User"
    )
      .slice(
        0,
        GOOGLE_FULL_NAME_MAXIMUM_LENGTH
      )
      .trim();

  return {
    subject,
    email,

    fullName:
      fullName ||
      "Poster User",
  };
}

function assertAccountMayAuthenticateWithGoogle(
  user:
    UserIdentityRecord,
  authenticatedAt:
    Date
): void {
  if (
    user.lockedUntil &&
    user.lockedUntil.getTime() >
      authenticatedAt.getTime()
  ) {
    throw new AuthenticationForbiddenError(
      "The account is temporarily locked and cannot create a Google-authenticated session."
    );
  }

  if (
    user.emailVerifiedAt ===
      null ||
    user.status ===
      "pending_verification"
  ) {
    throw new AuthenticationForbiddenError(
      "The account has not completed identity verification."
    );
  }

  if (
    user.status !==
      "active"
  ) {
    throw new AuthenticationForbiddenError(
      "The account is not active and cannot create a session."
    );
  }
}

function mapAuthenticationAccountSummary(
  user:
    UserIdentityRecord
): AuthenticationAccountSummary {
  return {
    id:
      user.id,

    email:
      user.email,

    fullName:
      user.fullName,

    status:
      user.status,

    emailVerifiedAt:
      user.emailVerifiedAt,

    createdAt:
      user.createdAt,
  };
}

function mapAuthenticationSessionSummary(
  session:
    UserSessionRecord
): AuthenticationSessionSummary {
  return {
    id:
      session.id,

    userId:
      session.userId,

    organizationId:
      session.organizationId,

    createdAt:
      session.createdAt,

    expiresAt:
      session.expiresAt,
  };
}

function createGoogleSessionInput(
  input:
    GoogleAuthenticationInput,
  userId:
    string,
  refreshTokenDigest:
    string,
  expiresAt:
    Date
): CreateUserSessionInput {
  return {
    userId,

    organizationId:
      null,

    refreshTokenDigest,

    ipAddress:
      input.ipAddress ??
      null,

    userAgent:
      input.userAgent ??
      null,

    expiresAt,
  };
}

export function createGoogleAuthenticationService(
  options:
    GoogleAuthenticationServiceOptions =
      {}
): GoogleAuthenticationService {
  const webClientId =
    (
      options.webClientId ??
      process.env
        .GOOGLE_OAUTH_WEB_CLIENT_ID ??
      ""
    ).trim();

  const verifyGoogleIdToken =
    options.verifyGoogleIdToken ??
    verifyGoogleIdTokenWithGoogle;

  const transactionRunner =
    options.runDatabaseTransaction ??
    (
      async (
        operation
      ) => {
        return await runDatabaseTransaction(
          operation
        );
      }
    );

  const findExternalIdentity =
    options
      .findUserExternalIdentityByProviderSubject ??
    findUserExternalIdentityByProviderSubject;

  const createExternalIdentity =
    options
      .createUserExternalIdentity ??
    createUserExternalIdentity;

  const touchExternalIdentity =
    options
      .touchUserExternalIdentity ??
    touchUserExternalIdentity;

  const findIdentityUserById =
    options.findUserById ??
    findUserById;

  const findIdentityUserByEmail =
    options.findUserByEmail ??
    findUserByEmail;

  const createIdentityUser =
    options.createUser ??
    createUser;

  const markIdentityEmailVerified =
    options.markUserEmailVerified ??
    markUserEmailVerified;

  const recordSuccessfulLogin =
    options.recordSuccessfulUserLogin ??
    recordSuccessfulUserLogin;

  const createSession =
    options.createUserSession ??
    createUserSession;

  const createRefreshTokenPair =
    options.createOpaqueTokenPair ??
    createOpaqueTokenPair;

  const hashLocalPassword =
    options.hashPassword ??
    hashPassword;

  const generatePlaceholderPassword =
    options.createPlaceholderPassword ??
    createPlaceholderPassword;

  const now =
    options.now ??
    (() => new Date());

  return {
    async authenticate(
      input
    ) {
      const idToken =
        input.idToken.trim();

      if (!idToken) {
        throw new GoogleAuthenticationInvalidError(
          "A Google ID token was not supplied."
        );
      }

      if (
        input.mode !==
          "login" &&
        input.mode !==
          "signup"
      ) {
        throw new GoogleAuthenticationInvalidError(
          "The Google authentication mode was invalid."
        );
      }

      if (!webClientId) {
        throw new Error(
          "GOOGLE_OAUTH_WEB_CLIENT_ID is required before Google authentication can be used."
        );
      }

      const verifiedIdentity =
        normalizeVerifiedGoogleIdentity(
          await verifyGoogleIdToken({
            idToken,

            audience:
              webClientId,
          })
        );

      const authenticatedAt =
        now();

      assertValidAuthenticationDate(
        authenticatedAt
      );

      /*
       * Only signup may need a local placeholder hash. Compute it
       * before opening PostgreSQL transaction time.
       */
      const placeholderPasswordHash =
        input.mode ===
          "signup"
          ? await hashLocalPassword(
              generatePlaceholderPassword()
            )
          : null;

      const refreshTokenPair =
        createRefreshTokenPair();

      const expiresAt =
        new Date(
          authenticatedAt.getTime() +
            LOGIN_SESSION_POLICY
              .refreshTokenLifetimeMilliseconds
        );

      const result =
        await transactionRunner(
          async (
            executor
          ) => {
            let externalIdentity:
              | UserExternalIdentityRecord
              | null =
              await findExternalIdentity(
                {
                  provider:
                    GOOGLE_PROVIDER,

                  providerSubject:
                    verifiedIdentity
                      .subject,
                },
                executor
              );

            let user:
              UserIdentityRecord;

            let isNewAccount =
              false;

            if (
              externalIdentity
            ) {
              const existingUser =
                await findIdentityUserById(
                  externalIdentity
                    .userId,
                  executor
                );

              if (
                !existingUser
              ) {
                throw new AuthenticationForbiddenError(
                  "The Google identity points to a missing or deleted Poster user."
                );
              }

              user =
                existingUser;
            } else {
              if (
                input.mode ===
                  "login"
              ) {
                throw new GoogleAuthenticationConflictError(
                  "No Poster identity is linked to the verified Google subject.",
                  "No Poster account is linked to this Google account. Create your Poster account with Google first."
                );
              }

              const existingEmailUser =
                await findIdentityUserByEmail(
                  verifiedIdentity
                    .email,
                  executor
                );

              /*
               * Never auto-link a Google subject to an existing
               * password account solely because the email matches.
               * Account linking requires proof through the existing
               * Poster authentication method.
               */
              if (
                existingEmailUser
              ) {
                throw new GoogleAuthenticationConflictError(
                  "A Poster account already exists for the Google email but has no verified Google identity link.",
                  "A Poster account already exists for this email. Sign in with its existing method before linking Google."
                );
              }

              if (
                !placeholderPasswordHash
              ) {
                throw new Error(
                  "Google signup placeholder password hash was not prepared."
                );
              }

              const createdUser =
                await createIdentityUser(
                  {
                    email:
                      verifiedIdentity
                        .email,

                    passwordHash:
                      placeholderPasswordHash,

                    fullName:
                      verifiedIdentity
                        .fullName,
                  },
                  executor
                );

              const verifiedUser =
                await markIdentityEmailVerified(
                  {
                    userId:
                      createdUser.id,

                    expectedRowVersion:
                      createdUser
                        .rowVersion,

                    verifiedAt:
                      authenticatedAt,
                  },
                  executor
                );

              if (
                !verifiedUser
              ) {
                throw new AuthenticationConcurrencyError();
              }

              externalIdentity =
                await createExternalIdentity(
                  {
                    userId:
                      verifiedUser.id,

                    provider:
                      GOOGLE_PROVIDER,

                    providerSubject:
                      verifiedIdentity
                        .subject,

                    providerEmail:
                      verifiedIdentity
                        .email,

                    authenticatedAt,
                  },
                  executor
                );

              user =
                verifiedUser;

              isNewAccount =
                true;
            }

            assertAccountMayAuthenticateWithGoogle(
              user,
              authenticatedAt
            );

            const authenticatedUser =
              await recordSuccessfulLogin(
                {
                  userId:
                    user.id,

                  expectedRowVersion:
                    user.rowVersion,

                  loggedInAt:
                    authenticatedAt,
                },
                executor
              );

            if (
              !authenticatedUser
            ) {
              throw new AuthenticationConcurrencyError();
            }

            if (
              !isNewAccount &&
              externalIdentity
            ) {
              await touchExternalIdentity(
                {
                  identityId:
                    externalIdentity.id,

                  providerEmail:
                    verifiedIdentity
                      .email,

                  authenticatedAt,
                },
                executor
              );
            }

            const session =
              await createSession(
                createGoogleSessionInput(
                  input,
                  authenticatedUser.id,
                  refreshTokenPair.digest,
                  expiresAt
                ),
                executor
              );

            return {
              user:
                authenticatedUser,

              session,

              isNewAccount,
            };
          }
        );

      return {
        account:
          mapAuthenticationAccountSummary(
            result.user
          ),

        session:
          mapAuthenticationSessionSummary(
            result.session
          ),

        refreshToken:
          refreshTokenPair.token,

        isNewAccount:
          result.isNewAccount,
      };
    },
  };
}