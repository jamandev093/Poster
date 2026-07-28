import {
  describe,
  expect,
  it,
} from "vitest";

import {
  InvalidCredentialsError,
  PasswordPolicyError,
  createNumericVerificationCodePair,
  createOpaqueTokenPair,
  digestAuthenticationSecret,
  generateOpaqueToken,
  hashPassword,
  isSupportedPasswordHash,
  passwordHashNeedsUpgrade,
  timingSafeDigestEqual,
  verifyAuthenticationSecretDigest,
  verifyPassword,
} from "../src/domains/authentication/index.js";

describe(
  "Poster authentication security",
  () => {
    it(
      "hashes passwords with Argon2id and verifies only the correct password",
      async () => {
        const password =
          "Poster-Secure-Password-2026!";

        const passwordHash =
          await hashPassword(
            password
          );

        expect(
          isSupportedPasswordHash(
            passwordHash
          )
        ).toBe(
          true
        );

        expect(
          passwordHash.startsWith(
            "$argon2id$"
          )
        ).toBe(
          true
        );

        expect(
          passwordHash.includes(
            password
          )
        ).toBe(
          false
        );

        await expect(
          verifyPassword(
            password,
            passwordHash
          )
        ).resolves.toBe(
          true
        );

        await expect(
          verifyPassword(
            "Incorrect-Password-2026!",
            passwordHash
          )
        ).resolves.toBe(
          false
        );

        expect(
          passwordHashNeedsUpgrade(
            passwordHash
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "generates different salted hashes for the same password",
      async () => {
        const password =
          "Poster-Repeated-Password-2026!";

        const firstHash =
          await hashPassword(
            password
          );

        const secondHash =
          await hashPassword(
            password
          );

        expect(
          firstHash
        ).not.toBe(
          secondHash
        );

        await expect(
          verifyPassword(
            password,
            firstHash
          )
        ).resolves.toBe(
          true
        );

        await expect(
          verifyPassword(
            password,
            secondHash
          )
        ).resolves.toBe(
          true
        );
      }
    );

    it(
      "rejects passwords below the configured security minimum",
      async () => {
        await expect(
          hashPassword(
            "short"
          )
        ).rejects.toBeInstanceOf(
          PasswordPolicyError
        );
      }
    );

    it(
      "generates opaque tokens while exposing only irreversible database digests",
      () => {
        const firstPair =
          createOpaqueTokenPair();

        const secondPair =
          createOpaqueTokenPair();

        expect(
          firstPair.token
        ).not.toBe(
          secondPair.token
        );

        expect(
          firstPair.digest
        ).not.toBe(
          firstPair.token
        );

        expect(
          firstPair.digest
        ).toMatch(
          /^[a-f0-9]{64}$/
        );

        expect(
          digestAuthenticationSecret(
            firstPair.token
          )
        ).toBe(
          firstPair.digest
        );

        expect(
          verifyAuthenticationSecretDigest(
            firstPair.token,
            firstPair.digest
          )
        ).toBe(
          true
        );

        expect(
          verifyAuthenticationSecretDigest(
            secondPair.token,
            firstPair.digest
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "uses timing-safe equality for valid SHA-256 digests",
      () => {
        const firstDigest =
          digestAuthenticationSecret(
            "poster-token-one"
          );

        const matchingDigest =
          digestAuthenticationSecret(
            "poster-token-one"
          );

        const differentDigest =
          digestAuthenticationSecret(
            "poster-token-two"
          );

        expect(
          timingSafeDigestEqual(
            firstDigest,
            matchingDigest
          )
        ).toBe(
          true
        );

        expect(
          timingSafeDigestEqual(
            firstDigest,
            differentDigest
          )
        ).toBe(
          false
        );

        expect(
          timingSafeDigestEqual(
            firstDigest,
            "invalid"
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "creates fixed-width numeric verification codes without persisting the raw code",
      () => {
        const verificationPair =
          createNumericVerificationCodePair();

        expect(
          verificationPair.code
        ).toMatch(
          /^\d{6}$/
        );

        expect(
          verificationPair.digest
        ).toMatch(
          /^[a-f0-9]{64}$/
        );

        expect(
          verificationPair.digest
        ).not.toContain(
          verificationPair.code
        );

        expect(
          verifyAuthenticationSecretDigest(
            verificationPair.code,
            verificationPair.digest
          )
        ).toBe(
          true
        );
      }
    );

    it(
      "rejects unsupported password hashes and exposes structured authentication errors",
      async () => {
        await expect(
          verifyPassword(
            "Poster-Secure-Password-2026!",
            "not-an-argon2-hash"
          )
        ).resolves.toBe(
          false
        );

        expect(
          passwordHashNeedsUpgrade(
            "not-an-argon2-hash"
          )
        ).toBe(
          true
        );

        const error =
          new InvalidCredentialsError();

        expect(
          error.code
        ).toBe(
          "AUTH_INVALID_CREDENTIALS"
        );

        expect(
          error.statusCode
        ).toBe(
          401
        );

        expect(
          error.operational
        ).toBe(
          true
        );
      }
    );

    it(
      "generates URL-safe tokens with sufficient entropy",
      () => {
        const token =
          generateOpaqueToken();

        expect(
          token.length
        ).toBeGreaterThanOrEqual(
          43
        );

        expect(
          token
        ).toMatch(
          /^[A-Za-z0-9_-]+$/
        );
      }
    );
  }
);