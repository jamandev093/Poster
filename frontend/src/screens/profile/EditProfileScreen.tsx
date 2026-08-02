import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import ProfileService, {
  UserProfile,
} from "../../services/ProfileService";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "EditProfile"
>;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USERNAME_PATTERN =
  /^[a-z0-9][a-z0-9_]{2,19}$/;

const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "api",
  "help",
  "moderator",
  "news",
  "official",
  "poster",
  "root",
  "security",
  "support",
  "system",
];

const MAXIMUM_NAME_LENGTH = 60;
const MAXIMUM_EMAIL_LENGTH = 120;
const MINIMUM_USERNAME_LENGTH = 3;
const MAXIMUM_USERNAME_LENGTH = 20;

function createFallbackUsername(
  profile: UserProfile
): string {
  const emailName =
    profile.email
      .split("@")[0] ??
    "";

  const candidates = [
    profile.username ?? "",
    emailName,
    profile.name.replace(
      /\s+/g,
      "_"
    ),
    "poster_user",
  ];

  for (const candidate of candidates) {
    const normalizedCandidate =
      candidate
        .trim()
        .toLowerCase()
        .replace(
          /\s+/g,
          "_"
        )
        .replace(
          /[^a-z0-9_]/g,
          ""
        )
        .replace(
          /^_+/,
          ""
        )
        .slice(
          0,
          MAXIMUM_USERNAME_LENGTH
        );

    if (
      USERNAME_PATTERN.test(
        normalizedCandidate
      ) &&
      !RESERVED_USERNAMES.includes(
        normalizedCandidate
      )
    ) {
      return normalizedCandidate;
    }
  }

  return "poster_user";
}

export default function EditProfileScreen({
  navigation,
}: Props) {
  const { colors } = useTheme();

  const [
    originalProfile,
    setOriginalProfile,
  ] = useState<UserProfile | null>(
    null
  );

  const [name, setName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    existingImageUri,
    setExistingImageUri,
  ] = useState<string | null>(
    null
  );

  const [
    selectedImageUri,
    setSelectedImageUri,
  ] = useState<string | null>(
    null
  );

  const [
    removeExistingImage,
    setRemoveExistingImage,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    nameTouched,
    setNameTouched,
  ] = useState(false);

  const [
    usernameTouched,
    setUsernameTouched,
  ] = useState(false);

  const [
    emailTouched,
    setEmailTouched,
  ] = useState(false);

  const normalizedName =
    name.trim();

  const normalizedUsername =
    username
      .trim()
      .toLowerCase();

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const displayedImageUri =
    selectedImageUri ??
    (removeExistingImage
      ? null
      : existingImageUri);

  const nameError =
    useMemo(() => {
      if (!normalizedName) {
        return "Enter your full name.";
      }

      if (
        normalizedName.length < 2
      ) {
        return "Name is too short.";
      }

      if (
        normalizedName.length >
        MAXIMUM_NAME_LENGTH
      ) {
        return `Name cannot exceed ${MAXIMUM_NAME_LENGTH} characters.`;
      }

      return "";
    }, [normalizedName]);

  const usernameError =
    useMemo(() => {
      if (!normalizedUsername) {
        return "Enter your username.";
      }

      if (
        normalizedUsername.length <
        MINIMUM_USERNAME_LENGTH
      ) {
        return "Username is too short.";
      }

      if (
        normalizedUsername.length >
        MAXIMUM_USERNAME_LENGTH
      ) {
        return "Username is too long.";
      }

      if (
        !/^[a-z0-9_]+$/.test(
          normalizedUsername
        )
      ) {
        return "Use lowercase letters, numbers and underscores only.";
      }

      if (
        !/^[a-z0-9]/.test(
          normalizedUsername
        )
      ) {
        return "Username must start with a letter or number.";
      }

      if (
        RESERVED_USERNAMES.includes(
          normalizedUsername
        )
      ) {
        return "This username is unavailable.";
      }

      if (
        !USERNAME_PATTERN.test(
          normalizedUsername
        )
      ) {
        return "Enter a valid username.";
      }

      return "";
    }, [normalizedUsername]);

  const emailError =
    useMemo(() => {
      if (!normalizedEmail) {
        return "Enter your email address.";
      }

      if (
        !EMAIL_PATTERN.test(
          normalizedEmail
        )
      ) {
        return "Enter a valid email address.";
      }

      return "";
    }, [normalizedEmail]);

  const isValid =
    !nameError &&
    !usernameError &&
    !emailError;

  const hasChanges =
    useMemo(() => {
      if (!originalProfile) {
        return false;
      }

      const originalName =
        originalProfile.name
          .trim();

      const originalUsername =
        (
          originalProfile.username ??
          ""
        )
          .trim()
          .toLowerCase();

      const originalEmail =
        originalProfile.email
          .trim()
          .toLowerCase();

      return (
        normalizedName !==
          originalName ||
        normalizedUsername !==
          originalUsername ||
        normalizedEmail !==
          originalEmail ||
        selectedImageUri !== null ||
        removeExistingImage
      );
    }, [
      normalizedEmail,
      normalizedName,
      normalizedUsername,
      originalProfile,
      removeExistingImage,
      selectedImageUri,
    ]);

  const loadProfile =
    useCallback(async () => {
      setLoading(true);

      try {
        const [
          savedProfile,
          savedImage,
        ] = await Promise.all([
          ProfileService.getProfile(),
          ProfileService.getProfileImage(),
        ]);

        const resolvedUsername =
          createFallbackUsername(
            savedProfile
          );

        const resolvedProfile:
          UserProfile = {
          ...savedProfile,

          username:
            resolvedUsername,
        };

        setOriginalProfile(
          resolvedProfile
        );

        setName(
          resolvedProfile.name
        );

        setUsername(
          resolvedUsername
        );

        setEmail(
          resolvedProfile.email
        );

        setExistingImageUri(
          savedImage ??
            resolvedProfile.photo ??
            null
        );

        setSelectedImageUri(
          null
        );

        setRemoveExistingImage(
          false
        );

        setNameTouched(false);
        setUsernameTouched(false);
        setEmailTouched(false);
      } catch {
        Alert.alert(
          "Profile unavailable",
          "Your profile could not be loaded."
        );

        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }, [navigation]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const chooseProfilePhoto =
    useCallback(async () => {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo permission required",
          "Allow photo access to choose a profile picture."
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

      setSelectedImageUri(
        result.assets[0].uri
      );

      setRemoveExistingImage(
        false
      );
    }, []);

  const handleRemovePhoto =
    useCallback(() => {
      if (selectedImageUri) {
        setSelectedImageUri(
          null
        );

        setRemoveExistingImage(
          Boolean(
            existingImageUri
          )
        );

        return;
      }

      setRemoveExistingImage(
        Boolean(existingImageUri)
      );
    }, [
      existingImageUri,
      selectedImageUri,
    ]);

  const handleRestorePhoto =
    useCallback(() => {
      setSelectedImageUri(null);

      setRemoveExistingImage(
        false
      );
    }, []);

  const handleUsernameChange =
    useCallback(
      (value: string) => {
        const sanitizedValue =
          value
            .toLowerCase()
            .replace(
              /\s/g,
              ""
            )
            .replace(
              /[^a-z0-9_]/g,
              ""
            )
            .slice(
              0,
              MAXIMUM_USERNAME_LENGTH
            );

        setUsername(
          sanitizedValue
        );
      },
      []
    );

  const handleSave =
    useCallback(async () => {
      setNameTouched(true);
      setUsernameTouched(true);
      setEmailTouched(true);

      if (
        !isValid ||
        !hasChanges ||
        saving
      ) {
        return;
      }

      setSaving(true);

      try {
        let finalImageUri:
          | string
          | undefined =
          existingImageUri ??
          undefined;

        if (removeExistingImage) {
          await ProfileService.removeProfileImage();

          finalImageUri =
            undefined;
        }

        if (selectedImageUri) {
          finalImageUri =
            await ProfileService.saveProfileImage(
              selectedImageUri
            );
        }

        const updatedProfile:
          UserProfile = {
          name:
            normalizedName,

          username:
            normalizedUsername,

          email:
            normalizedEmail,

          photo:
            finalImageUri,
        };

        await ProfileService.saveProfile(
          updatedProfile
        );

        navigation.goBack();
      } catch {
        Alert.alert(
          "Profile not saved",
          "Your changes could not be saved."
        );
      } finally {
        setSaving(false);
      }
    }, [
      existingImageUri,
      hasChanges,
      isValid,
      navigation,
      normalizedEmail,
      normalizedName,
      normalizedUsername,
      removeExistingImage,
      saving,
      selectedImageUri,
    ]);

  const leaveScreen =
    useCallback(() => {
      if (saving) {
        return;
      }

      if (!hasChanges) {
        navigation.goBack();

        return;
      }

      Alert.alert(
        "Discard changes?",
        "Your unsaved changes will be lost.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",

            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    }, [
      hasChanges,
      navigation,
      saving,
    ]);

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

  const initial =
    normalizedName
      .charAt(0)
      .toUpperCase() || "P";

  const showNameError =
    nameTouched &&
    Boolean(nameError);

  const showUsernameError =
    usernameTouched &&
    Boolean(usernameError);

  const showEmailError =
    emailTouched &&
    Boolean(emailError);

  const photoChanged =
    selectedImageUri !== null ||
    removeExistingImage;

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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={[
            styles.navigationBar,
            {
              borderBottomColor:
                colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={Spacing.sm}
            style={({ pressed }) => [
              styles.navigationButton,
              {
                opacity: pressed
                  ? 0.55
                  : 1,
              },
            ]}
            onPress={leaveScreen}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={Icons.md}
              color={colors.icon}
            />
          </Pressable>

          <Text
            style={[
              styles.navigationTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Edit Profile
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save profile"
            disabled={
              !isValid ||
              !hasChanges ||
              saving
            }
            hitSlop={Spacing.sm}
            style={({ pressed }) => [
              styles.headerSaveButton,
              {
                opacity:
                  !isValid ||
                  !hasChanges ||
                  saving
                    ? 0.35
                    : pressed
                    ? 0.55
                    : 1,
              },
            ]}
            onPress={() => {
              void handleSave();
            }}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <Text
                style={[
                  styles.headerSaveText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                Save
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
        >
          <View
            style={
              styles.photoSection
            }
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose profile photo"
              disabled={saving}
              style={({ pressed }) => [
                styles.avatarButton,
                {
                  opacity: pressed
                    ? 0.72
                    : 1,
                },
              ]}
              onPress={() => {
                void chooseProfilePhoto();
              }}
            >
              {displayedImageUri ? (
                <Image
                  source={{
                    uri:
                      displayedImageUri,
                  }}
                  resizeMode="cover"
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    {
                      backgroundColor:
                        colors.surface,

                      borderColor:
                        colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarInitial,
                      {
                        color:
                          colors.primary,
                      },
                    ]}
                  >
                    {initial}
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.cameraButton,
                  {
                    backgroundColor:
                      colors.background,

                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={Icons.sm}
                  color={colors.primary}
                />
              </View>
            </Pressable>

            <View
              style={
                styles.photoActions
              }
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  displayedImageUri
                    ? "Change profile photo"
                    : "Choose profile photo"
                }
                disabled={saving}
                hitSlop={Spacing.sm}
                style={({ pressed }) => [
                  styles.photoActionButton,
                  {
                    opacity: pressed
                      ? 0.55
                      : 1,
                  },
                ]}
                onPress={() => {
                  void chooseProfilePhoto();
                }}
              >
                <Text
                  style={[
                    styles.photoActionText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  {displayedImageUri
                    ? "Change Photo"
                    : "Choose Photo"}
                </Text>
              </Pressable>

              {displayedImageUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove profile photo"
                  disabled={saving}
                  hitSlop={Spacing.sm}
                  style={({ pressed }) => [
                    styles.photoActionButton,
                    {
                      opacity: pressed
                        ? 0.55
                        : 1,
                    },
                  ]}
                  onPress={
                    handleRemovePhoto
                  }
                >
                  <Text
                    style={[
                      styles.photoActionText,
                      {
                        color:
                          colors.danger,
                      },
                    ]}
                  >
                    Remove
                  </Text>
                </Pressable>
              ) : null}

              {photoChanged ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Restore original photo"
                  disabled={saving}
                  hitSlop={Spacing.sm}
                  style={({ pressed }) => [
                    styles.photoActionButton,
                    {
                      opacity: pressed
                        ? 0.55
                        : 1,
                    },
                  ]}
                  onPress={
                    handleRestorePhoto
                  }
                >
                  <Text
                    style={[
                      styles.photoActionText,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    Restore
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.field}>
            <View
              style={
                styles.fieldHeader
              }
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Full name
              </Text>

              <Text
                style={[
                  styles.characterCount,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {name.length}/
                {MAXIMUM_NAME_LENGTH}
              </Text>
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor:
                    showNameError
                      ? colors.danger
                      : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={Icons.md}
                color={
                  showNameError
                    ? colors.danger
                    : colors.icon
                }
              />

              <TextInput
                accessibilityLabel="Full name"
                value={name}
                placeholder="Enter your full name"
                placeholderTextColor={
                  colors.placeholder
                }
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                autoComplete="name"
                maxLength={
                  MAXIMUM_NAME_LENGTH
                }
                returnKeyType="next"
                editable={!saving}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                onBlur={() => {
                  setNameTouched(true);
                }}
                onChangeText={setName}
              />

              {name.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear name"
                  disabled={saving}
                  hitSlop={Spacing.sm}
                  onPress={() => {
                    setName("");
                    setNameTouched(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={Icons.md}
                    color={
                      colors.placeholder
                    }
                  />
                </Pressable>
              ) : null}
            </View>

            {showNameError ? (
              <Text
                style={[
                  styles.errorText,
                  {
                    color:
                      colors.danger,
                  },
                ]}
              >
                {nameError}
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <View
              style={
                styles.fieldHeader
              }
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Username
              </Text>

              <Text
                style={[
                  styles.characterCount,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {username.length}/
                {MAXIMUM_USERNAME_LENGTH}
              </Text>
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor:
                    showUsernameError
                      ? colors.danger
                      : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="at"
                size={Icons.md}
                color={
                  showUsernameError
                    ? colors.danger
                    : colors.icon
                }
              />

              <TextInput
                accessibilityLabel="Username"
                value={username}
                placeholder="your_username"
                placeholderTextColor={
                  colors.placeholder
                }
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                autoComplete="username"
                maxLength={
                  MAXIMUM_USERNAME_LENGTH
                }
                returnKeyType="next"
                editable={!saving}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                onBlur={() => {
                  setUsernameTouched(
                    true
                  );
                }}
                onChangeText={
                  handleUsernameChange
                }
              />

              {username.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear username"
                  disabled={saving}
                  hitSlop={Spacing.sm}
                  onPress={() => {
                    setUsername("");
                    setUsernameTouched(
                      true
                    );
                  }}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={Icons.md}
                    color={
                      colors.placeholder
                    }
                  />
                </Pressable>
              ) : null}
            </View>

            {showUsernameError ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[
                  styles.errorText,
                  {
                    color:
                      colors.danger,
                  },
                ]}
              >
                {usernameError}
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                },
              ]}
            >
              Email
            </Text>

            <View
              style={[
                styles.inputContainer,
                styles.emailInputContainer,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor:
                    showEmailError
                      ? colors.danger
                      : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={Icons.md}
                color={
                  showEmailError
                    ? colors.danger
                    : colors.icon
                }
              />

              <TextInput
                accessibilityLabel="Email address"
                value={email}
                placeholder="you@example.com"
                placeholderTextColor={
                  colors.placeholder
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                maxLength={
                  MAXIMUM_EMAIL_LENGTH
                }
                returnKeyType="done"
                editable={!saving}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                  },
                ]}
                onBlur={() => {
                  setEmailTouched(true);
                }}
                onChangeText={setEmail}
                onSubmitEditing={() => {
                  void handleSave();
                }}
              />

              {email.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear email"
                  disabled={saving}
                  hitSlop={Spacing.sm}
                  onPress={() => {
                    setEmail("");
                    setEmailTouched(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={Icons.md}
                    color={
                      colors.placeholder
                    }
                  />
                </Pressable>
              ) : null}
            </View>

            {showEmailError ? (
              <Text
                style={[
                  styles.errorText,
                  {
                    color:
                      colors.danger,
                  },
                ]}
              >
                {emailError}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save profile changes"
            disabled={
              !isValid ||
              !hasChanges ||
              saving
            }
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor:
                  colors.primary,

                opacity:
                  !isValid ||
                  !hasChanges ||
                  saving
                    ? 0.4
                    : pressed
                    ? 0.75
                    : 1,
              },
            ]}
            onPress={() => {
              void handleSave();
            }}
          >
            {saving ? (
              <ActivityIndicator
                size="small"
                color={
                  colors.onPrimary
                }
              />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  {
                    color:
                      colors.onPrimary,
                  },
                ]}
              >
                Save Changes
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  navigationBar: {
    minHeight: 60,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    paddingHorizontal:
      Spacing.screen,
  },

  navigationButton: {
    width: 48,

    height: 42,

    alignItems: "center",

    justifyContent: "center",
  },

  navigationTitle: {
    ...Typography.headline,

    fontWeight: "800",

    textAlign: "center",
  },

  headerSaveButton: {
    width: 48,

    minHeight: 42,

    alignItems: "flex-end",

    justifyContent: "center",
  },

  headerSaveText: {
    ...Typography.caption,

    fontWeight: "800",
  },

  content: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.xl,

    paddingBottom:
      Spacing.xxxl,
  },

  photoSection: {
    flexDirection: "row",

    alignItems: "center",

    paddingBottom:
      Spacing.xl,

    marginBottom:
      Spacing.xl,
  },

  avatarButton: {
    position: "relative",

    flexShrink: 0,
  },

  avatar: {
    width: 88,

    height: 88,

    borderRadius:
      Radius.round,
  },

  avatarPlaceholder: {
    width: 88,

    height: 88,

    alignItems: "center",

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,
  },

  avatarInitial: {
    fontSize: 32,

    fontWeight: "800",
  },

  cameraButton: {
    position: "absolute",

    right: -2,

    bottom: -2,

    width: 30,

    height: 30,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderRadius:
      Radius.round,
  },

  photoActions: {
    flex: 1,

    alignItems: "flex-start",

    marginLeft:
      Spacing.lg,
  },

  photoActionButton: {
    minHeight: 34,

    justifyContent: "center",

    paddingHorizontal:
      Spacing.xs,
  },

  photoActionText: {
    ...Typography.caption,

    fontWeight: "700",
  },

  field: {
    marginBottom:
      Spacing.xl,
  },

  fieldHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginBottom:
      Spacing.sm,
  },

  label: {
    ...Typography.caption,

    fontWeight: "800",

    marginBottom:
      Spacing.sm,
  },

  characterCount: {
    ...Typography.small,

    fontWeight: "600",
  },

  inputContainer: {
    minHeight: 54,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderRadius:
      Radius.lg,

    paddingHorizontal:
      Spacing.md,
  },

  emailInputContainer: {
    marginTop: 0,
  },

  input: {
    flex: 1,

    minHeight: 52,

    ...Typography.body,

    marginHorizontal:
      Spacing.sm,

    paddingVertical: 0,
  },

  errorText: {
    ...Typography.small,

    fontWeight: "600",

    marginTop:
      Spacing.sm,
  },

  saveButton: {
    minHeight: 52,

    alignItems: "center",

    justifyContent: "center",

    borderRadius:
      Radius.lg,

    marginTop:
      Spacing.sm,
  },

  saveButtonText: {
    ...Typography.body,

    fontWeight: "800",
  },
});