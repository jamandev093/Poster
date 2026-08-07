import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import ConfirmationDialog from "../../components/dialogs/ConfirmationDialog";
import InterestManager from "../../components/profile/InterestManager";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileSettingsSection from "../../components/profile/ProfileSettingsSection";


import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import InterestCatalogService from "../../services/InterestCatalogService";
import PreferenceService from "../../services/PreferenceService";
import ProfileService, {
  UserProfile,
} from "../../services/ProfileService";
import AuthService from "../../services/AuthService";

import {
  Spacing,
  Typography,
} from "../../theme";
import ThemeManager from "../../theme/ThemeManager";
import useTheme from "../../theme/useTheme";

type ProfileNavigation =
  NavigationProp<RootStackParamList>;

type ConfirmationType =
  | "logout"
  | "delete"
  | null;

const DEFAULT_PROFILE: UserProfile = {
  name: "Poster User",
  email: "user@example.com",
  interests: [],
  preferences: {
    darkMode: false,
    notifications: true,
    personalizedAds: true,
  },
};

function normalizeInterestValue(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

async function resolveLivingInterestNames(
  values: readonly string[]
): Promise<string[]> {
  const resolvedValues =
    await Promise.all(
      values.map(
        async (value) => {
          const cleanedValue =
            value
              .trim()
              .replace(/\s+/g, " ");

          if (!cleanedValue) {
            return "";
          }

          try {
            const topic =
              await InterestCatalogService
                .resolveSavedInterest(
                  cleanedValue
                );

            return (
              topic?.name ??
              cleanedValue
            );
          } catch {
            /*
             * Preserve legacy/unresolved
             * values if the live catalog
             * cannot resolve them.
             */
            return cleanedValue;
          }
        }
      )
    );

  const seen =
    new Set<string>();

  return resolvedValues.filter(
    (value) => {
      const key =
        normalizeInterestValue(
          value
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}

export default function ProfileScreen() {
  const navigation =
    useNavigation<ProfileNavigation>();

  const { colors, dark } = useTheme();

  const [profile, setProfile] =
    useState<UserProfile>(
      DEFAULT_PROFILE
    );

  const [
    profileImage,
    setProfileImage,
  ] = useState<string | null>(
    null
  );

  const [interests, setInterests] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const hasLoadedOnceRef =
    useRef(false);

  const loadingRequestRef =
    useRef(false);

  const [
    darkModeEnabled,
    setDarkModeEnabled,
  ] = useState(dark);

  const [
    photoSaving,
    setPhotoSaving,
  ] = useState(false);

  const [
    confirmationType,
    setConfirmationType,
  ] = useState<ConfirmationType>(
    null
  );

  const [
    confirmationLoading,
    setConfirmationLoading,
  ] = useState(false);

  const loadProfileData =
    useCallback(async () => {
      if (
        loadingRequestRef.current
      ) {
        return;
      }

      loadingRequestRef.current =
        true;

      const shouldShowInitialLoading =
        !hasLoadedOnceRef.current;

      const loadingStartedAt =
        Date.now();

      const minimumLoadingDuration =
        1000;

      if (
        shouldShowInitialLoading
      ) {
        setLoading(true);
      }

      try {
        const savedProfile =
          await ProfileService.getProfile();

        const savedImage =
          await ProfileService.getProfileImage();

        const profileInterests =
          savedProfile.interests ?? [];

        const legacyInterests =
          profileInterests.length > 0
            ? profileInterests
            : await PreferenceService.getInterests();

        const resolvedInterests =
          await resolveLivingInterestNames(
            legacyInterests
          );

        const resolvedProfile:
          UserProfile = {
          ...savedProfile,

          interests:
            resolvedInterests,

          preferences:
            savedProfile.preferences ??
            DEFAULT_PROFILE.preferences,
        };

        const resolvedDarkMode =
          resolvedProfile
            .preferences
            ?.darkMode ??
          dark;

        setProfile(
          resolvedProfile
        );

        setProfileImage(
          savedImage ??
            resolvedProfile.photo ??
            null
        );

        setInterests(
          resolvedInterests
        );

        setDarkModeEnabled(
          resolvedDarkMode
        );

        ThemeManager.setTheme(
          resolvedDarkMode
            ? "dark"
            : "light"
        );
      } catch {
        Alert.alert(
          "Profile unavailable",
          "Some profile information could not be loaded."
        );
      } finally {
        if (
          shouldShowInitialLoading
        ) {
          const elapsedTime =
            Date.now() -
            loadingStartedAt;

          const remainingTime =
            Math.max(
              0,
              minimumLoadingDuration -
                elapsedTime
            );

          if (remainingTime > 0) {
            await new Promise(resolve => {
              setTimeout(
                resolve,
                remainingTime
              );
            });
          }

          setLoading(false);
        }

        hasLoadedOnceRef.current =
          true;

        loadingRequestRef.current =
          false;
      }
    }, [dark]);
  useFocusEffect(
    useCallback(() => {
      void loadProfileData();
    }, [loadProfileData])
  );

  useEffect(() => {
    setDarkModeEnabled(dark);
  }, [dark]);

  const selectProfilePhoto =
    useCallback(async () => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo permission required",
          "Allow Poster to access your photos to select a profile picture."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsEditing: true,

            aspect: [1, 1],

            quality: 0.9,
          }
        );

      if (
        result.canceled ||
        !result.assets[0]
      ) {
        return;
      }

      setPhotoSaving(true);

      try {
        const savedUri =
          await ProfileService.saveProfileImage(
            result.assets[0].uri
          );

        const updatedProfile:
          UserProfile = {
          ...profile,

          photo: savedUri,
        };

        await ProfileService.saveProfile(
          updatedProfile
        );

        setProfile(
          updatedProfile
        );

        setProfileImage(
          savedUri
        );
      } catch {
        Alert.alert(
          "Photo not saved",
          "Poster could not save the selected profile picture."
        );
      } finally {
        setPhotoSaving(false);
      }
    }, [profile]);

  const removeProfilePhoto =
    useCallback(async () => {
      setPhotoSaving(true);

      try {
        await ProfileService.removeProfileImage();

        const updatedProfile:
          UserProfile = {
          ...profile,

          photo: undefined,
        };

        await ProfileService.saveProfile(
          updatedProfile
        );

        setProfile(
          updatedProfile
        );

        setProfileImage(null);
      } catch {
        Alert.alert(
          "Photo not removed",
          "Poster could not remove your profile picture."
        );
      } finally {
        setPhotoSaving(false);
      }
    }, [profile]);

  const handleProfilePhotoPress =
    useCallback(() => {
      if (photoSaving) {
        return;
      }

      if (profileImage) {
        Alert.alert(
          "Profile picture",
          "Choose an action.",
          [
            {
              text: "Choose New Photo",

              onPress: () => {
                void selectProfilePhoto();
              },
            },
            {
              text: "Remove Photo",

              style: "destructive",

              onPress: () => {
                void removeProfilePhoto();
              },
            },
            {
              text: "Cancel",

              style: "cancel",
            },
          ]
        );

        return;
      }

      void selectProfilePhoto();
    }, [
      photoSaving,
      profileImage,
      removeProfilePhoto,
      selectProfilePhoto,
    ]);

  const handleEditProfile =
    useCallback(() => {
      navigation.navigate(
        "EditProfile"
      );
    }, [navigation]);

  const handleManageInterests =
    useCallback(() => {
      navigation.navigate(
        "ManageInterests"
      );
    }, [navigation]);

  const handleBookmarksPress =
    useCallback(() => {
      navigation.navigate(
        "Bookmarks"
      );
    }, [navigation]);

  const handlePrivacyAdvertisingPress =
    useCallback(() => {
      navigation.navigate(
        "PrivacyAdvertising"
      );
    }, [navigation]);

  const handleDarkModeChange =
    useCallback(
      (
        enabled: boolean
      ) => {
        const previousEnabled =
          darkModeEnabled;

        const previousProfile =
          profile;

        const updatedProfile:
          UserProfile = {
          ...profile,

          preferences: {
            darkMode:
              enabled,

            notifications:
              profile
                .preferences
                ?.notifications ??
              true,

            personalizedAds:
              profile
                .preferences
                ?.personalizedAds ??
              true,
          },
        };

        setDarkModeEnabled(
          enabled
        );

        setProfile(
          updatedProfile
        );

        ThemeManager.setTheme(
          enabled
            ? "dark"
            : "light"
        );

        void Promise.all([
          PreferenceService.setDarkMode(
            enabled
          ),

          ProfileService.saveProfile(
            updatedProfile
          ),
        ]).catch(() => {
          setDarkModeEnabled(
            previousEnabled
          );

          setProfile(
            previousProfile
          );

          ThemeManager.setTheme(
            previousEnabled
              ? "dark"
              : "light"
          );

          Alert.alert(
            "Theme not saved",
            "Your theme preference could not be saved."
          );
        });
      },
      [
        darkModeEnabled,
        profile,
      ]
    );
  const saveInterests =
    useCallback(
      async (
        nextInterests: string[]
      ) => {
        const previousInterests =
          interests;

        const previousProfile =
          profile;

        const updatedProfile:
          UserProfile = {
          ...profile,

          interests:
            nextInterests,
        };

        setInterests(
          nextInterests
        );

        setProfile(
          updatedProfile
        );

        try {
          await Promise.all([
            PreferenceService.saveInterests(
              nextInterests
            ),

            ProfileService.saveProfile(
              updatedProfile
            ),
          ]);
        } catch {
          setInterests(
            previousInterests
          );

          setProfile(
            previousProfile
          );

          Alert.alert(
            "Interests not saved",
            "Your interests could not be updated."
          );
        }
      },
      [
        interests,
        profile,
      ]
    );
  const handleAddInterest =
    useCallback(
      (interest: string) => {
        const normalizedInterest =
          interest.trim();

        if (!normalizedInterest) {
          return;
        }

        const alreadySelected =
          interests.some(
            (item) =>
              item.toLowerCase() ===
              normalizedInterest.toLowerCase()
          );

        if (alreadySelected) {
          return;
        }

        void saveInterests([
          ...interests,
          normalizedInterest,
        ]);
      },
      [
        interests,
        saveInterests,
      ]
    );

  const handleRemoveInterest =
    useCallback(
      (interest: string) => {
        void saveInterests(
          interests.filter(
            (item) =>
              item !== interest
          )
        );
      },
      [
        interests,
        saveInterests,
      ]
    );

  const handleLogoutPress =
    useCallback(() => {
      setConfirmationType(
        "logout"
      );
    }, []);

  const handleDeleteAccountPress =
    useCallback(() => {
      setConfirmationType(
        "delete"
      );
    }, []);

  const closeConfirmation =
    useCallback(() => {
      if (
        confirmationLoading
      ) {
        return;
      }

      setConfirmationType(null);
    }, [confirmationLoading]);

  const performLogout =
    useCallback(async () => {
      setConfirmationLoading(
        true
      );

      let serverLogoutFailed =
        false;

      try {
        await AuthService.logout();
      } catch {
        serverLogoutFailed =
          true;
      } finally {
        setConfirmationType(null);

        setConfirmationLoading(
          false
        );

        navigation.reset({
          index: 0,

          routes: [
            {
              name: "Login",
            },
          ],
        });
      }

      if (
        serverLogoutFailed
      ) {
        Alert.alert(
          "Signed out locally",
          "Poster could not confirm logout with the server. Your local session was cleared on this device."
        );
      }
    }, [navigation]);

  const performDeleteAccount =
    useCallback(async () => {
      setConfirmationLoading(
        true
      );

      try {
        await ProfileService.deleteAccountData();

        ThemeManager.setTheme(
          "system"
        );

        setConfirmationType(null);

        navigation.reset({
          index: 0,

          routes: [
            {
              name: "Signup",
            },
          ],
        });
      } catch {
        Alert.alert(
          "Account not deleted",
          "Poster could not delete your account. Check your connection and try again."
        );
      } finally {
        setConfirmationLoading(
          false
        );
      }
    }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,

          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </SafeAreaView>
    );
  }

  const isDeleteDialog =
    confirmationType ===
    "delete";

  return (
    <SafeAreaView
      style={[
        styles.container,

        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.content
        }
      >
        <Text
          style={[
            styles.title,

            {
              color: colors.text,
            },
          ]}
        >
          Profile
        </Text>

        <ProfileHeader
          name={profile.name}
          email={profile.email}
          username={
            profile.username
          }
          imageUri={profileImage}
          saving={photoSaving}
          onPressPhoto={
            handleProfilePhotoPress
          }
          onPressEdit={
            handleEditProfile
          }
        />

        <InterestManager
          interests={interests}
          onAdd={
            handleAddInterest
          }
          onRemove={
            handleRemoveInterest
          }
          onManagePress={
            handleManageInterests
          }
        />

        <ProfileSettingsSection
          darkMode={
            darkModeEnabled
          }
          onToggleDarkMode={
            handleDarkModeChange
          }
          onBookmarksPress={
            handleBookmarksPress
          }
          onPrivacyAdvertisingPress={
            handlePrivacyAdvertisingPress
          }
          onLogoutPress={
            handleLogoutPress
          }
          onDeleteAccountPress={
            handleDeleteAccountPress
          }
        />
      </ScrollView>

      <ConfirmationDialog
        visible={
          confirmationType !== null
        }
        title={
          isDeleteDialog
            ? "Delete account?"
            : "Log out?"
        }
        message={
          isDeleteDialog
            ? "Your account data will be permanently removed. This action cannot be undone."
            : "You will need to sign in again."
        }
        cancelLabel="Cancel"
        confirmLabel={
          isDeleteDialog
            ? "Delete"
            : "Log Out"
        }
        destructive={
          isDeleteDialog
        }
        loading={
          confirmationLoading
        }
        onCancel={
          closeConfirmation
        }
        onConfirm={
          isDeleteDialog
            ? performDeleteAccount
            : performLogout
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  content: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.lg,

    paddingBottom:
      Spacing.xxxl * 3,
  },

  title: {
    ...Typography.title,

    marginBottom:
      Spacing.lg,
  },
});
