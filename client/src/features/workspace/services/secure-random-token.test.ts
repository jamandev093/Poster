import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createSecureRandomToken,
} from "./secure-random-token";

describe(
  "createSecureRandomToken",
  () => {
    it(
      "creates a cryptographically generated hexadecimal token",
      () => {
        const token =
          createSecureRandomToken();

        expect(
          token
        ).toMatch(
          /^[0-9a-f]{32}$/
        );
      }
    );

    it(
      "creates independent tokens",
      () => {
        const first =
          createSecureRandomToken();

        const second =
          createSecureRandomToken();

        expect(
          second
        ).not.toBe(
          first
        );
      }
    );

    it(
      "supports explicit secure byte lengths",
      () => {
        expect(
          createSecureRandomToken(
            24
          )
        ).toMatch(
          /^[0-9a-f]{48}$/
        );
      }
    );

    it(
      "rejects invalid byte lengths",
      () => {
        expect(
          () =>
            createSecureRandomToken(
              0
            )
        ).toThrow(
          "positive integer"
        );

        expect(
          () =>
            createSecureRandomToken(
              -1
            )
        ).toThrow(
          "positive integer"
        );
      }
    );
  }
);
