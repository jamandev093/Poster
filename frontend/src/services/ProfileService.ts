import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import { STORAGE_KEYS } from "../constants/storage";

import AuthService from "./AuthService";

export interface UserProfile {
  name: string;
  email: string;
  username?: string;
  photo?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Poster User",
  email: "user@example.com",
};

const PROFILE_DIRECTORY_NAME =
  "poster-profile";

const PROFILE_IMAGE_NAME =
  "profile-image";

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

function normalizeUsername(
  value: string | undefined
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase();

  return normalizedValue ||
    undefined;
}

function parseProfile(
  value: string
): UserProfile | null {
  try {
    const parsed: unknown =
      JSON.parse(value);

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

    return {
      name: profile.name,
      email: profile.email,

      username:
        normalizeUsername(
          profile.username
        ),

      photo:
        typeof profile.photo ===
        "string"
          ? profile.photo
          : undefined,
    };
  } catch {
    return null;
  }
}

class ProfileService {
  async getProfile(): Promise<UserProfile> {
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

      return {
        name:
          resolvedProfile.name,

        email:
          resolvedProfile.email,

        username:
          normalizeUsername(
            resolvedProfile.username
          ),

        photo:
          savedImage ??
          resolvedProfile.photo,
      };
    } catch {
      return {
        ...DEFAULT_PROFILE,
      };
    }
  }

  async saveProfile(
    profile: UserProfile
  ): Promise<void> {
    const normalizedProfile:
      UserProfile = {
      name:
        profile.name.trim(),

      email:
        profile.email
          .trim()
          .toLowerCase(),

      username:
        normalizeUsername(
          profile.username
        ),

      photo:
        profile.photo,
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(
        normalizedProfile
      )
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
      existingImage !==
        destinationUri
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

    if (
      destinationInfo.exists
    ) {
      await FileSystem.deleteAsync(
        destinationUri,
        {
          idempotent: true,
        }
      );
    }

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    await AsyncStorage.setItem(
      STORAGE_KEYS.PROFILE_IMAGE,
      destinationUri
    );

    return destinationUri;
  }

  async getProfileImage(): Promise<
    string | null
  > {
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

  async clearLocalSession(): Promise<void> {
    await AuthService.clearSession();
  }

  async deleteAccountData(): Promise<void> {
    await AuthService.clearSession();

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

    // TODO:
    // DELETE /user/account
  }
}

export default new ProfileService();