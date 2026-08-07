import type {
  UserProfileInterests,
  UserProfilePreferences,
} from "../../domains/identity/index.js";

export interface AccountProfileResponse {
  account: {
    id: string;

    email: string;

    fullName: string;

    username:
      | string
      | null;

    profileImageUrl:
      | string
      | null;

    interests:
      UserProfileInterests;

    preferences:
      UserProfilePreferences;

    status: string;

    emailVerifiedAt: string | null;

    createdAt: string;

    updatedAt: string;

    rowVersion: string;
  };
}

export interface GetAccountProfileInput {
  userId: string;
}

export interface UpdateAccountProfileInput {
  userId: string;

  fullName?: string;

  username?:
    | string
    | null;

  profileImageUrl?:
    | string
    | null;

  interests?:
    UserProfileInterests;

  preferences?:
    UserProfilePreferences;
}
