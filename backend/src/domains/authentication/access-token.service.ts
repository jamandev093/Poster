import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  AuthenticationAccessTokenExpiredError,
  AuthenticationAccessTokenInvalidError,
} from "./authentication.errors.js";

export const AUTHENTICATION_ACCESS_TOKEN_HEADER =
  "x-poster-access-token";

export const AUTHENTICATION_ACCESS_TOKEN_EXPIRES_HEADER =
  "x-poster-access-token-expires-at";

export const AUTHENTICATION_ACCESS_TOKEN_LIFETIME_SECONDS =
  15 * 60;

interface SerializedAuthenticationAccessTokenPayload {
  version: 1;

  subject: string;

  sessionId: string;

  issuedAt:
    number;

  expiresAt:
    number;
}

export interface IssueAuthenticationAccessTokenInput {
  userId: string;

  sessionId: string;
}

export interface AuthenticationAccessTokenClaims {
  userId: string;

  sessionId: string;

  issuedAt: Date;

  expiresAt: Date;
}

export interface IssuedAuthenticationAccessToken {
  token: string;

  expiresAt: Date;
}

export interface AuthenticationAccessTokenService {
  issue:
    (
      input:
        IssueAuthenticationAccessTokenInput
    ) => IssuedAuthenticationAccessToken;

  verify:
    (
      token:
        string
    ) => AuthenticationAccessTokenClaims;
}

export interface CreateAuthenticationAccessTokenServiceOptions {
  secret: string;

  lifetimeSeconds?:
    number;

  now?:
    () => Date;
}

function assertRequiredIdentifier(
  value:
    string
): void {
  if (
    value.trim().length === 0 ||
    value.length > 200
  ) {
    throw new AuthenticationAccessTokenInvalidError();
  }
}

function createSignature(
  payloadSegment:
    string,
  secret:
    string
): Buffer {
  return createHmac(
    "sha256",
    secret
  )
    .update(
      payloadSegment,
      "utf8"
    )
    .digest();
}

function parseSerializedPayload(
  payloadSegment:
    string
): SerializedAuthenticationAccessTokenPayload {
  try {
    const decoded =
      Buffer
        .from(
          payloadSegment,
          "base64url"
        )
        .toString(
          "utf8"
        );

    const parsed:
      unknown =
        JSON.parse(
          decoded
        );

    if (
      typeof parsed !==
        "object" ||
      parsed ===
        null
    ) {
      throw new AuthenticationAccessTokenInvalidError();
    }

    const payload =
      parsed as Partial<
        SerializedAuthenticationAccessTokenPayload
      >;

    if (
      payload.version !== 1 ||
      typeof payload.subject !==
        "string" ||
      typeof payload.sessionId !==
        "string" ||
      typeof payload.issuedAt !==
        "number" ||
      !Number.isInteger(
        payload.issuedAt
      ) ||
      typeof payload.expiresAt !==
        "number" ||
      !Number.isInteger(
        payload.expiresAt
      )
    ) {
      throw new AuthenticationAccessTokenInvalidError();
    }

    assertRequiredIdentifier(
      payload.subject
    );

    assertRequiredIdentifier(
      payload.sessionId
    );

    return payload as
      SerializedAuthenticationAccessTokenPayload;
  }
  catch (
    error
  ) {
    if (
      error instanceof
      AuthenticationAccessTokenInvalidError
    ) {
      throw error;
    }

    throw new AuthenticationAccessTokenInvalidError();
  }
}

export function createAuthenticationAccessTokenService(
  options:
    CreateAuthenticationAccessTokenServiceOptions
): AuthenticationAccessTokenService {
  if (
    options.secret.length <
    32
  ) {
    throw new Error(
      "Authentication access-token secret must contain at least 32 characters."
    );
  }

  const lifetimeSeconds =
    options.lifetimeSeconds ??
    AUTHENTICATION_ACCESS_TOKEN_LIFETIME_SECONDS;

  if (
    !Number.isInteger(
      lifetimeSeconds
    ) ||
    lifetimeSeconds <= 0 ||
    lifetimeSeconds > 60 * 60
  ) {
    throw new Error(
      "Authentication access-token lifetime must be between 1 and 3600 seconds."
    );
  }

  const now =
    options.now ??
    (() => new Date());

  return {
    issue: (
      input
    ) => {
      assertRequiredIdentifier(
        input.userId
      );

      assertRequiredIdentifier(
        input.sessionId
      );

      const issuedAt =
        now();

      const issuedAtSeconds =
        Math.floor(
          issuedAt.getTime() /
          1000
        );

      const expiresAtSeconds =
        issuedAtSeconds +
        lifetimeSeconds;

      const payload:
        SerializedAuthenticationAccessTokenPayload = {
        version:
          1,

        subject:
          input.userId,

        sessionId:
          input.sessionId,

        issuedAt:
          issuedAtSeconds,

        expiresAt:
          expiresAtSeconds,
      };

      const payloadSegment =
        Buffer
          .from(
            JSON.stringify(
              payload
            ),
            "utf8"
          )
          .toString(
            "base64url"
          );

      const signatureSegment =
        createSignature(
          payloadSegment,
          options.secret
        )
          .toString(
            "base64url"
          );

      return {
        token:
          `${payloadSegment}.${signatureSegment}`,

        expiresAt:
          new Date(
            expiresAtSeconds *
            1000
          ),
      };
    },

    verify: (
      token
    ) => {
      if (
        token.length === 0 ||
        token.length > 4096
      ) {
        throw new AuthenticationAccessTokenInvalidError();
      }

      const segments =
        token.split(
          "."
        );

      if (
        segments.length !==
        2
      ) {
        throw new AuthenticationAccessTokenInvalidError();
      }

      const [
        payloadSegment,
        signatureSegment,
      ] =
        segments;

      if (
        !payloadSegment ||
        !signatureSegment
      ) {
        throw new AuthenticationAccessTokenInvalidError();
      }

      let suppliedSignature:
        Buffer;

      try {
        suppliedSignature =
          Buffer.from(
            signatureSegment,
            "base64url"
          );
      }
      catch {
        throw new AuthenticationAccessTokenInvalidError();
      }

      const expectedSignature =
        createSignature(
          payloadSegment,
          options.secret
        );

      if (
        suppliedSignature.length !==
          expectedSignature.length ||
        !timingSafeEqual(
          suppliedSignature,
          expectedSignature
        )
      ) {
        throw new AuthenticationAccessTokenInvalidError();
      }

      const payload =
        parseSerializedPayload(
          payloadSegment
        );

      const currentSeconds =
        Math.floor(
          now().getTime() /
          1000
        );

      if (
        payload.issuedAt >
        currentSeconds + 60
      ) {
        throw new AuthenticationAccessTokenInvalidError();
      }

      if (
        payload.expiresAt <=
        currentSeconds
      ) {
        throw new AuthenticationAccessTokenExpiredError();
      }

      if (
        payload.expiresAt <=
        payload.issuedAt
      ) {
        throw new AuthenticationAccessTokenInvalidError();
      }

      return {
        userId:
          payload.subject,

        sessionId:
          payload.sessionId,

        issuedAt:
          new Date(
            payload.issuedAt *
            1000
          ),

        expiresAt:
          new Date(
            payload.expiresAt *
            1000
          ),
      };
    },
  };
}