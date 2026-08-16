import {
  isUsernameAvailable,
} from "../../domains/identity/user.repository.js";

export interface UsernameAvailabilityInput {
  userId: string;
  username: string;
}

export interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
}

export type IsUsernameAvailableOperation =
  (
    username: string,
    excludeUserId: string
  ) => Promise<boolean>;

export type CheckUsernameAvailabilityOperation =
  (
    input: UsernameAvailabilityInput
  ) => Promise<UsernameAvailabilityResponse>;

const USERNAME_PATTERN =
  /^[a-z0-9_]{3,30}$/;

export async function checkUsernameAvailability(
  input: UsernameAvailabilityInput,
  availabilityOperation:
    IsUsernameAvailableOperation =
      isUsernameAvailable
): Promise<UsernameAvailabilityResponse> {
  const username =
    input.username
      .trim()
      .toLowerCase();

  if (!USERNAME_PATTERN.test(username)) {
    return {
      username,
      available: false,
    };
  }

  const available =
    await availabilityOperation(
      username,
      input.userId
    );

  return {
    username,
    available,
  };
}
