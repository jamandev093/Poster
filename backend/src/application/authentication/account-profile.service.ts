import {
  type DatabaseQueryExecutor,
  runDatabaseTransaction,
} from "../../database/index.js";

import {
  AuthenticationSessionInvalidError,
} from "../../domains/authentication/authentication.errors.js";

import {
  findUserById,
  updateUserProfile,
  type UpdateUserProfileInput,
  type UserIdentityRecord,
  type UserProfileInterests,
  type UserProfilePreferences,
} from "../../domains/identity/index.js";

import type {
  AccountProfileResponse,
  GetAccountProfileInput,
  UpdateAccountProfileInput,
} from "./account-profile.types.js";

const DEFAULT_PROFILE_INTERESTS:
  UserProfileInterests = {
  topicIds: [],

  topicNames: [],

  unresolvedValues: [],

  displayValues: [],
};

const DEFAULT_PROFILE_PREFERENCES:
  UserProfilePreferences = {
  darkMode:
    false,

  notifications:
    true,

  personalizedAds:
    true,
};

type FindUserByIdOperation =
  (
    userId: string,
    executor?: DatabaseQueryExecutor
  ) => Promise<UserIdentityRecord | null>;

type UpdateUserProfileOperation =
  (
    input: UpdateUserProfileInput,
    executor?: DatabaseQueryExecutor
  ) => Promise<UserIdentityRecord | null>;

type RunDatabaseTransactionOperation =
  <T>(
    operation:
      (
        executor: DatabaseQueryExecutor
      ) => Promise<T>
  ) => Promise<T>;

export interface AccountProfileService {
  getProfile:
    (
      input: GetAccountProfileInput
    ) => Promise<AccountProfileResponse>;

  updateProfile:
    (
      input: UpdateAccountProfileInput
    ) => Promise<AccountProfileResponse>;
}

export interface AccountProfileServiceDependencies {
  findUserById?:
    FindUserByIdOperation;

  updateUserProfile?:
    UpdateUserProfileOperation;

  runDatabaseTransaction?:
    RunDatabaseTransactionOperation;
}

function mapAccountProfile(
  account: UserIdentityRecord
): AccountProfileResponse {
  return {
    account: {
      id:
        account.id,

      email:
        account.email,

      fullName:
        account.fullName,

      username:
        account.username ??
        null,

      profileImageUrl:
        account.profileImageUrl ??
        null,

      interests:
        account.profileInterests ??
        DEFAULT_PROFILE_INTERESTS,

      preferences:
        account.profilePreferences ??
        DEFAULT_PROFILE_PREFERENCES,

      status:
        account.status,

      emailVerifiedAt:
        account.emailVerifiedAt
          ? account.emailVerifiedAt.toISOString()
          : null,

      createdAt:
        account.createdAt.toISOString(),

      updatedAt:
        account.updatedAt.toISOString(),

      rowVersion:
        account.rowVersion,
    },
  };
}

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  return normalized ||
    null;
}

function normalizeUsername(
  value:
    | string
    | null
    | undefined
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        ""
      );

  return normalized ||
    null;
}

function normalizeStringList(
  values: readonly string[]
): string[] {
  const seen =
    new Set<string>();

  const normalized:
    string[] = [];

  values.forEach(
    value => {
      const item =
        value
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const key =
        item.toLowerCase();

      if (
        !item ||
        seen.has(key)
      ) {
        return;
      }

      seen.add(key);
      normalized.push(item);
    }
  );

  return normalized;
}

function normalizeInterests(
  interests:
    | UserProfileInterests
    | undefined
): UserProfileInterests | undefined {
  if (!interests) {
    return undefined;
  }

  const topicIds =
    normalizeStringList(
      interests.topicIds
    );

  const topicNames =
    normalizeStringList(
      interests.topicNames
    );

  const unresolvedValues =
    normalizeStringList(
      interests.unresolvedValues
    );

  return {
    topicIds,

    topicNames,

    unresolvedValues,

    displayValues:
      normalizeStringList([
        ...interests.displayValues,
        ...topicNames,
        ...unresolvedValues,
      ]),
  };
}

function normalizePreferences(
  preferences:
    | UserProfilePreferences
    | undefined
): UserProfilePreferences | undefined {
  if (!preferences) {
    return undefined;
  }

  return {
    darkMode:
      Boolean(
        preferences.darkMode
      ),

    notifications:
      Boolean(
        preferences.notifications
      ),

    personalizedAds:
      Boolean(
        preferences.personalizedAds
      ),
  };
}

function hasProfileMutation(
  input: UpdateAccountProfileInput
): boolean {
  return (
    input.fullName !== undefined ||
    input.username !== undefined ||
    input.profileImageUrl !== undefined ||
    input.interests !== undefined ||
    input.preferences !== undefined
  );
}

function createUpdateUserProfileInput(
  account: UserIdentityRecord,
  input: UpdateAccountProfileInput
): UpdateUserProfileInput {
  const updateInput:
    UpdateUserProfileInput = {
    userId:
      account.id,

    expectedRowVersion:
      account.rowVersion,
  };

  if (input.fullName !== undefined) {
    const fullName =
      normalizeOptionalText(
        input.fullName
      );

    if (fullName) {
      updateInput.fullName =
        fullName;
    }
  }

  if (input.username !== undefined) {
    const username =
      normalizeUsername(
        input.username
      );

    if (username !== undefined) {
      updateInput.username =
        username;
    }
  }

  if (input.profileImageUrl !== undefined) {
    const profileImageUrl =
      normalizeOptionalText(
        input.profileImageUrl
      );

    if (profileImageUrl !== undefined) {
      updateInput.profileImageUrl =
        profileImageUrl;
    }
  }

  if (input.interests !== undefined) {
    const profileInterests =
      normalizeInterests(
        input.interests
      );

    if (profileInterests !== undefined) {
      updateInput.profileInterests =
        profileInterests;
    }
  }

  if (input.preferences !== undefined) {
    const profilePreferences =
      normalizePreferences(
        input.preferences
      );

    if (profilePreferences !== undefined) {
      updateInput.profilePreferences =
        profilePreferences;
    }
  }

  return updateInput;
}

export function createAccountProfileService(
  dependencies:
    AccountProfileServiceDependencies =
    {}
): AccountProfileService {
  const findUserByIdOperation =
    dependencies.findUserById ??
    findUserById;

  const updateUserProfileOperation =
    dependencies.updateUserProfile ??
    updateUserProfile;

  const runTransaction =
    dependencies.runDatabaseTransaction ??
    runDatabaseTransaction;

  return {
    getProfile:
      async (
        input
      ) => {
        const account =
          await findUserByIdOperation(
            input.userId
          );

        if (!account) {
          throw new AuthenticationSessionInvalidError(
            "The authenticated account profile could not be found."
          );
        }

        return mapAccountProfile(
          account
        );
      },

    updateProfile:
      async (
        input
      ) => {
        if (
          !hasProfileMutation(
            input
          )
        ) {
          throw new AuthenticationSessionInvalidError(
            "No account profile changes were provided."
          );
        }

        return await runTransaction(
          async (
            executor
          ) => {
            const account =
              await findUserByIdOperation(
                input.userId,
                executor
              );

            if (!account) {
              throw new AuthenticationSessionInvalidError(
                "The authenticated account profile could not be found."
              );
            }

            const updatedAccount =
              await updateUserProfileOperation(
                createUpdateUserProfileInput(
                  account,
                  input
                ),
                executor
              );

            if (!updatedAccount) {
              throw new AuthenticationSessionInvalidError(
                "The authenticated account profile could not be updated."
              );
            }

            return mapAccountProfile(
              updatedAccount
            );
          }
        );
      },
  };
}
