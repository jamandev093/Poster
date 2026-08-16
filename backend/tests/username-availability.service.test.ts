import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  checkUsernameAvailability,
} from "../src/application/authentication/username-availability.service.js";

describe(
  "username availability service",
  () => {
    it(
      "normalizes the username and delegates to database authority",
      async () => {
        const availabilityOperation =
          vi.fn(
            async () => false
          );

        const result =
          await checkUsernameAvailability(
            {
              userId:
                "11111111-1111-4111-8111-111111111111",
              username:
                " Taken_Name ",
            },
            availabilityOperation
          );

        expect(result).toEqual({
          username:
            "taken_name",
          available:
            false,
        });

        expect(
          availabilityOperation
        ).toHaveBeenCalledWith(
          "taken_name",
          "11111111-1111-4111-8111-111111111111"
        );
      }
    );

    it(
      "rejects malformed usernames before querying persistence",
      async () => {
        const availabilityOperation =
          vi.fn(
            async () => true
          );

        const result =
          await checkUsernameAvailability(
            {
              userId:
                "11111111-1111-4111-8111-111111111111",
              username:
                "x",
            },
            availabilityOperation
          );

        expect(result).toEqual({
          username:
            "x",
          available:
            false,
        });

        expect(
          availabilityOperation
        ).not.toHaveBeenCalled();
      }
    );
  }
);
