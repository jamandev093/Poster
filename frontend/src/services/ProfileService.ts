import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import {
  STORAGE_KEYS,
} from "../constants/storage";

import AuthService, {
  AuthenticationApiError,
} from "./AuthService";

declare const process: {
  env?: {
    EXPO_PUBLIC_POSTER_API_BASE_URL?: string;
  };
};

export interface UserProfileInterests {
  topicIds: string[];

  topicNames: string[];

  unresolvedValues: string[];

  displayValues: string[];
}

export interface UserProfilePreferences {
  darkMode: boolean;

  notifications: boolean;

  personalizedAds: boolean;
}

export interface UserProfile {
  name: string;

  email: string;

  username?: string;

  photo?: string;

  interests?: string[];

  preferences?: UserProfilePreferences;
}

interface AccountProfileApiResponse {
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

    emailVerifiedAt:
      | string
      | null;

    createdAt: string;

    updatedAt: string;

    rowVersion: string;
  };
}

export interface SelectedInterestDetails {
  topicId: string;

  topicSlug: string;

  topicName: string;

  personalizationAllowed: boolean;

  campaignTargetingAllowed: boolean;

  selectedAt:
    | string
    | null;

  consentUpdatedAt:
    | string
    | null;
}

export interface SelectedInterestsSnapshot {
  userId: string;

  selectedInterests: string[];

  interests: SelectedInterestDetails[];

  updatedAt: string;
}

const DEFAULT_PROFILE:
  UserProfile = {
  name:
    "Poster User",

  email:
    "user@example.com",

  interests:
    [],

  preferences: {
    darkMode:
      false,

    notifications:
      true,

    personalizedAds:
      true,
  },
};

const DEFAULT_POSTER_API_BASE_URL =
  "http://localhost:4000";

const API_VERSION_PREFIX =
  "/api/v1";

const PROFILE_DIRECTORY_NAME =
  "poster-profile";

const PROFILE_IMAGE_NAME =
  "profile-image";

function normalizeApiBaseUrl(
  value: string | undefined
): string {
  const normalized =
    (
      value ??
      DEFAULT_POSTER_API_BASE_URL
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  return normalized ||
    DEFAULT_POSTER_API_BASE_URL;
}

function buildAuthenticationUrl(
  path: string
): string {
  const baseUrl =
    normalizeApiBaseUrl(
      process
        .env
        ?.EXPO_PUBLIC_POSTER_API_BASE_URL
    );

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${baseUrl}${API_VERSION_PREFIX}/auth${normalizedPath}`;
}

function getProfileDirectory(): string | null {
  if (!FileSystem.documentDirectory) {
    return null;
  }

  return `${FileSystem.documentDirectory}${PROFILE_DIRECTORY_NAME}/`;
}

function getFileExtension(
  uri: string
): string {
  const uriWithoutQuery =
    uri.split("?")[0];

  const extensionMatch =
    uriWithoutQuery.match(
      /\.([a-zA-Z0-9]+)$/
    );

  const extension =
    extensionMatch?.[1]?.toLowerCase();

  if (
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png" ||
    extension === "webp"
  ) {
    return extension;
  }

  return "jpg";
}

function normalizeName(
  value: string
): string {
  return value
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function normalizeEmail(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
}

function normalizeUsername(
  value: string | undefined
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        ""
      );

  return normalizedValue ||
    undefined;
}

function normalizeStringList(
  values: readonly string[] | undefined
): string[] {
  if (!values) {
    return [];
  }

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

function normalizePreferences(
  value:
    | UserProfilePreferences
    | undefined
): UserProfilePreferences | undefined {
  if (!value) {
    return undefined;
  }

  return {
    darkMode:
      Boolean(
        value.darkMode
      ),

    notifications:
      Boolean(
        value.notifications
      ),

    personalizedAds:
      Boolean(
        value.personalizedAds
      ),
  };
}

function normalizeProfile(
  profile: UserProfile
): UserProfile {
  const normalized:
    UserProfile = {
    name:
      normalizeName(
        profile.name
      ),

    email:
      normalizeEmail(
        profile.email
      ),
  };

  const username =
    normalizeUsername(
      profile.username
    );

  if (username) {
    normalized.username =
      username;
  }

  if (profile.photo) {
    normalized.photo =
      profile.photo;
  }

  const interests =
    normalizeStringList(
      profile.interests
    );

  if (interests.length > 0) {
    normalized.interests =
      interests;
  }

  const preferences =
    normalizePreferences(
      profile.preferences
    );

  if (preferences) {
    normalized.preferences =
      preferences;
  }

  return normalized;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function getStringProperty(
  value: unknown,
  key: string
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const property =
    value[key];

  return typeof property === "string"
    ? property
    : null;
}

function getApiErrorDetails(
  body: unknown
): {
  message: string | null;
  code: string | null;
} {
  return {
    message:
      getStringProperty(
        body,
        "message"
      ) ??
      getStringProperty(
        body,
        "error"
      ),

    code:
      getStringProperty(
        body,
        "code"
      ),
  };
}

async function readJsonResponse(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as unknown;
  } catch {
    return text;
  }
}

function isStringArray(
  value: unknown
): value is string[] {
  return Array.isArray(
    value
  ) &&
    value.every(
      item =>
        typeof item === "string"
    );
}

function isUserProfileInterests(
  value: unknown
): value is UserProfileInterests {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringArray(value.topicIds) &&
    isStringArray(value.topicNames) &&
    isStringArray(value.unresolvedValues) &&
    isStringArray(value.displayValues)
  );
}

function isUserProfilePreferences(
  value: unknown
): value is UserProfilePreferences {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.darkMode === "boolean" &&
    typeof value.notifications === "boolean" &&
    typeof value.personalizedAds === "boolean"
  );
}

function isAccountProfileApiResponse(
  value: unknown
): value is AccountProfileApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  const account =
    value.account;

  if (!isRecord(account)) {
    return false;
  }

  return (
    typeof account.id === "string" &&
    typeof account.email === "string" &&
    typeof account.fullName === "string" &&
    (
      typeof account.username === "string" ||
      account.username === null
    ) &&
    (
      typeof account.profileImageUrl === "string" ||
      account.profileImageUrl === null
    ) &&
    isUserProfileInterests(account.interests) &&
    isUserProfilePreferences(account.preferences) &&
    typeof account.status === "string" &&
    (
      typeof account.emailVerifiedAt === "string" ||
      account.emailVerifiedAt === null
    ) &&
    typeof account.createdAt === "string" &&
    typeof account.updatedAt === "string" &&
    typeof account.rowVersion === "string"
  );
}

function isNullableString(
  value: unknown
): value is string | null {
  return (
    typeof value === "string" ||
    value === null
  );
}

function isSelectedInterestDetails(
  value: unknown
): value is SelectedInterestDetails {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.topicId === "string" &&
    typeof value.topicSlug === "string" &&
    typeof value.topicName === "string" &&
    typeof value.personalizationAllowed === "boolean" &&
    typeof value.campaignTargetingAllowed === "boolean" &&
    isNullableString(value.selectedAt) &&
    isNullableString(value.consentUpdatedAt)
  );
}

function isSelectedInterestsSnapshot(
  value: unknown
): value is SelectedInterestsSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.userId === "string" &&
    isStringArray(value.selectedInterests) &&
    Array.isArray(value.interests) &&
    value.interests.every(
      isSelectedInterestDetails
    ) &&
    typeof value.updatedAt === "string"
  );
}

function normalizeSelectedInterestIdentifiers(
  selectedInterests:
    readonly string[]
): string[] {
  if (selectedInterests.length > 80) {
    throw new AuthenticationApiError(
      "Selected interests cannot exceed 80.",
      400,
      "REQUEST_VALIDATION_FAILED"
    );
  }

  const seen =
    new Set<string>();

  const normalized:
    string[] = [];

  selectedInterests.forEach((interest) => {
    const value =
      interest
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

    if (
      !value ||
      seen.has(
        value
      )
    ) {
      return;
    }

    seen.add(
      value
    );

    normalized.push(
      value
    );
  });

  return normalized;
}

async function getRequiredAccessToken(): Promise<string> {
  const accessToken =
    await AuthService.getAccessToken();

  const normalizedAccessToken =
    accessToken?.trim() ?? "";

  if (!normalizedAccessToken) {
    throw new AuthenticationApiError(
      "Sign in again to manage your profile.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  return normalizedAccessToken;
}

async function requestAccountProfile(
  method: "GET" | "PATCH",
  body?: Record<string, unknown>
): Promise<AccountProfileApiResponse> {
  const accessToken =
    await getRequiredAccessToken();

  const response =
    await fetch(
      buildAuthenticationUrl(
        "/account/profile"
      ),
      {
        method,

        headers: {
          Accept:
            "application/json",

          ...(body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          Authorization:
            `Bearer ${accessToken}`,
        },

        credentials:
          "include",

        ...(body
          ? {
              body:
                JSON.stringify(
                  body
                ),
            }
          : {}),
      }
    );

  const responseBody =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const errorDetails =
      getApiErrorDetails(
        responseBody
      );

    throw new AuthenticationApiError(
      errorDetails.message ??
        "Poster could not update your profile. Please try again.",
      response.status,
      errorDetails.code
    );
  }

  if (
    !isAccountProfileApiResponse(
      responseBody
    )
  ) {
    throw new AuthenticationApiError(
      "Poster returned an invalid profile response.",
      response.status,
      null
    );
  }

  return responseBody;
}

async function requestAccountSelectedInterests(
  method: "GET" | "PATCH",
  selectedInterests?:
    readonly string[]
): Promise<SelectedInterestsSnapshot> {
  const accessToken =
    await getRequiredAccessToken();

  const body =
    method === "PATCH"
      ? {
          selectedInterests:
            normalizeSelectedInterestIdentifiers(
              selectedInterests ?? []
            ),
        }
      : undefined;

  const response =
    await fetch(
      buildAuthenticationUrl(
        "/account/interests"
      ),
      {
        method,

        headers: {
          Accept:
            "application/json",

          ...(body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          Authorization:
            `Bearer ${accessToken}`,
        },

        credentials:
          "include",

        ...(body
          ? {
              body:
                JSON.stringify(
                  body
                ),
            }
          : {}),
      }
    );

  const responseBody =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const errorDetails =
      getApiErrorDetails(
        responseBody
      );

    throw new AuthenticationApiError(
      errorDetails.message ??
        "Poster could not update your selected interests. Please try again.",
      response.status,
      errorDetails.code
    );
  }

  if (
    !isSelectedInterestsSnapshot(
      responseBody
    )
  ) {
    throw new AuthenticationApiError(
      "Poster returned an invalid selected interests response.",
      response.status,
      null
    );
  }

  return responseBody;
}

function mapBackendInterestsToDisplayValues(
  interests: UserProfileInterests
): string[] {
  const displayValues =
    normalizeStringList(
      interests.displayValues
    );

  if (displayValues.length > 0) {
    return displayValues;
  }

  return normalizeStringList([
    ...interests.topicNames,
    ...interests.unresolvedValues,
  ]);
}

function mapProfileToBackendInterests(
  interests: readonly string[] | undefined
): UserProfileInterests | undefined {
  const displayValues =
    normalizeStringList(
      interests
    );

  if (displayValues.length === 0) {
    return undefined;
  }

  return {
    topicIds:
      [],

    topicNames:
      displayValues,

    unresolvedValues:
      [],

    displayValues,
  };
}

function isRemoteProfileImageUrl(
  value: string | undefined
): value is string {
  return typeof value === "string" &&
    /^https?:\/\//i.test(value);
}

function mapAccountProfileResponse(
  response: AccountProfileApiResponse,
  localProfile?: UserProfile
): UserProfile {
  const backendImageUrl =
    response.account.profileImageUrl ??
    undefined;

  const localPhoto =
    localProfile?.photo;

  return normalizeProfile({
    name:
      response.account.fullName,

    email:
      response.account.email,

    username:
      response.account.username ??
      undefined,

    photo:
      localPhoto ??
      backendImageUrl,

    interests:
      mapBackendInterestsToDisplayValues(
        response.account.interests
      ),

    preferences:
      response.account.preferences,
  });
}

function parseProfile(
  value: string
): UserProfile | null {
  try {
    const parsed: unknown =
      JSON.parse(
        value
      );

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return null;
    }

    const profile =
      parsed as Partial<UserProfile>;

    if (
      typeof profile.name !== "string" ||
      typeof profile.email !== "string"
    ) {
      return null;
    }

    return normalizeProfile({
      name:
        profile.name,

      email:
        profile.email,

      username:
        profile.username,

      photo:
        typeof profile.photo === "string"
          ? profile.photo
          : undefined,

      interests:
        Array.isArray(profile.interests)
          ? profile.interests.filter(
              (item): item is string =>
                typeof item === "string"
            )
          : undefined,

      preferences:
        isUserProfilePreferences(
          profile.preferences
        )
          ? profile.preferences
          : undefined,
    });
  } catch {
    return null;
  }
}

function buildProfileUpdateBody(
  profile: UserProfile
): Record<string, unknown> {
  const normalizedProfile =
    normalizeProfile(
      profile
    );

  const body:
    Record<string, unknown> = {
    fullName:
      normalizedProfile.name,
  };

  if (normalizedProfile.username !== undefined) {
    body.username =
      normalizedProfile.username;
  }

  if (normalizedProfile.photo === undefined) {
    body.profileImageUrl =
      null;
  } else if (
    isRemoteProfileImageUrl(
      normalizedProfile.photo
    )
  ) {
    body.profileImageUrl =
      normalizedProfile.photo;
  }

  const interests =
    mapProfileToBackendInterests(
      normalizedProfile.interests
    );

  if (interests) {
    body.interests =
      interests;
  }

  if (normalizedProfile.preferences) {
    body.preferences =
      normalizedProfile.preferences;
  }

  return body;
}

class ProfileService {
  private async readCachedProfile(): Promise<UserProfile> {
    try {
      const [
        profileValue,
        savedImage,
      ] = await Promise.all([
        AsyncStorage.getItem(
          STORAGE_KEYS.USER_PROFILE
        ),

        this.getProfileImage(),
      ]);

      const savedProfile =
        profileValue
          ? parseProfile(
              profileValue
            )
          : null;

      const resolvedProfile =
        savedProfile ??
        DEFAULT_PROFILE;

      return normalizeProfile({
        ...resolvedProfile,

        photo:
          savedImage ??
          resolvedProfile.photo,
      });
    } catch {
      return {
        ...DEFAULT_PROFILE,
      };
    }
  }

  private async cacheProfile(
    profile: UserProfile
  ): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(
        normalizeProfile(
          profile
        )
      )
    );
  }

  async getProfile(): Promise<UserProfile> {
    const cachedProfile =
      await this.readCachedProfile();

    try {
      const response =
        await requestAccountProfile(
          "GET"
        );

      const profile =
        mapAccountProfileResponse(
          response,
          cachedProfile
        );

      await this.cacheProfile(
        profile
      );

      return profile;
    } catch {
      return cachedProfile;
    }
  }

  async getSelectedInterests(): Promise<SelectedInterestsSnapshot> {
    return requestAccountSelectedInterests(
      "GET"
    );
  }

  async updateSelectedInterests(
    selectedInterests:
      readonly string[]
  ): Promise<SelectedInterestsSnapshot> {
    return requestAccountSelectedInterests(
      "PATCH",
      selectedInterests
    );
  }
  async saveProfile(
    profile: UserProfile
  ): Promise<void> {
    const localProfile =
      normalizeProfile(
        profile
      );

    const response =
      await requestAccountProfile(
        "PATCH",
        buildProfileUpdateBody(
          localProfile
        )
      );

    const savedImage =
      await this.getProfileImage();

    const updatedProfile =
      mapAccountProfileResponse(
        response,
        {
          ...localProfile,

          photo:
            savedImage ??
            localProfile.photo,
        }
      );

    await this.cacheProfile(
      updatedProfile
    );
  }

  async saveProfileImage(
    sourceUri: string
  ): Promise<string> {
    const directory =
      getProfileDirectory();

    if (!directory) {
      throw new Error(
        "Persistent file storage is unavailable."
      );
    }

    const directoryInfo =
      await FileSystem.getInfoAsync(
        directory
      );

    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(
        directory,
        {
          intermediates: true,
        }
      );
    }

    const extension =
      getFileExtension(
        sourceUri
      );

    const destinationUri =
      `${directory}${PROFILE_IMAGE_NAME}.${extension}`;

    const existingImage =
      await this.getProfileImage();

    if (
      existingImage &&
      existingImage !== destinationUri
    ) {
      const existingInfo =
        await FileSystem.getInfoAsync(
          existingImage
        );

      if (existingInfo.exists) {
        await FileSystem.deleteAsync(
          existingImage,
          {
            idempotent: true,
          }
        );
      }
    }

    const destinationInfo =
      await FileSystem.getInfoAsync(
        destinationUri
      );

    if (destinationInfo.exists) {
      await FileSystem.deleteAsync(
        destinationUri,
        {
          idempotent: true,
        }
      );
    }

    await FileSystem.copyAsync({
      from:
        sourceUri,

      to:
        destinationUri,
    });

    await AsyncStorage.setItem(
      STORAGE_KEYS.PROFILE_IMAGE,
      destinationUri
    );

    return destinationUri;
  }

  async getProfileImage(): Promise<string | null> {
    try {
      const savedUri =
        await AsyncStorage.getItem(
          STORAGE_KEYS.PROFILE_IMAGE
        );

      if (!savedUri) {
        return null;
      }

      const imageInfo =
        await FileSystem.getInfoAsync(
          savedUri
        );

      if (!imageInfo.exists) {
        await AsyncStorage.removeItem(
          STORAGE_KEYS.PROFILE_IMAGE
        );

        return null;
      }

      return savedUri;
    } catch {
      return null;
    }
  }

  async removeProfileImage(): Promise<void> {
    const savedUri =
      await AsyncStorage.getItem(
        STORAGE_KEYS.PROFILE_IMAGE
      );

    if (savedUri) {
      await FileSystem.deleteAsync(
        savedUri,
        {
          idempotent: true,
        }
      );
    }

    await AsyncStorage.removeItem(
      STORAGE_KEYS.PROFILE_IMAGE
    );
  }

  async deleteAccountData(): Promise<void> {
    await AuthService.deleteAccount();

    const directory =
      getProfileDirectory();

    if (directory) {
      await FileSystem.deleteAsync(
        directory,
        {
          idempotent: true,
        }
      );
    }

    const posterStorageKeys =
      Object.values(
        STORAGE_KEYS
      );

    await AsyncStorage.multiRemove(
      posterStorageKeys
    );
  }
}

export default new ProfileService();
