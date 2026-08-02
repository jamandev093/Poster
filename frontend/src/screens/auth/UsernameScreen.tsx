import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import Input from "../../components/forms/Input";
import PrimaryButton from "../../components/buttons/PrimaryButton";

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import ProfileService from "../../services/ProfileService";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Username"
>;

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

const USERNAME_PATTERN =
  /^[a-z0-9][a-z0-9_]{2,19}$/;

const MINIMUM_USERNAME_LENGTH = 3;
const MAXIMUM_USERNAME_LENGTH = 20;

type UsernameState =
  | "neutral"
  | "valid"
  | "invalid";

export default function UsernameScreen({
  navigation,
}: Props) {
  const { colors } = useTheme();

  const submitRequestRef =
    useRef(false);

  const [username, setUsername] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const cleanUsername =
    username
      .trim()
      .toLowerCase();

  const isReserved =
    RESERVED_USERNAMES.includes(
      cleanUsername
    );

  const isValid =
    USERNAME_PATTERN.test(
      cleanUsername
    ) &&
    !isReserved;

  const validationState =
    useMemo<UsernameState>(() => {
      if (!cleanUsername) {
        return "neutral";
      }

      return isValid
        ? "valid"
        : "invalid";
    }, [
      cleanUsername,
      isValid,
    ]);

  const statusMessage =
    useMemo(() => {
      if (!cleanUsername) {
        return "Enter a username";
      }

      if (
        cleanUsername.length <
        MINIMUM_USERNAME_LENGTH
      ) {
        return "Username is too short";
      }

      if (
        cleanUsername.length >
        MAXIMUM_USERNAME_LENGTH
      ) {
        return "Username is too long";
      }

      if (
        !/^[a-z0-9_]+$/.test(
          cleanUsername
        )
      ) {
        return "Use lowercase letters, numbers and underscores";
      }

      if (
        !/^[a-z0-9]/.test(
          cleanUsername
        )
      ) {
        return "Username must start with a letter or number";
      }

      if (isReserved) {
        return "This username is unavailable";
      }

      return "Username is available";
    }, [
      cleanUsername,
      isReserved,
    ]);

  const statusColor =
    validationState === "valid"
      ? colors.success
      : validationState ===
          "invalid"
      ? colors.danger
      : colors.textSecondary;

  const borderColor =
    validationState === "valid"
      ? colors.success
      : validationState ===
          "invalid"
      ? colors.danger
      : colors.border;

  const handleUsernameChange =
    useCallback(
      (value: string) => {
        const sanitizedValue =
          value
            .toLowerCase()
            .replace(/\s/g, "")
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

        setFormError(null);
      },
      []
    );

  const handleContinue =
    useCallback(async () => {
      if (
        submitRequestRef.current
      ) {
        return;
      }

      if (!isValid) {
        setFormError(
          "Choose an available username before continuing."
        );

        return;
      }

      submitRequestRef.current =
        true;

      setSubmitting(true);
      setFormError(null);

      try {
        // TODO:
        // Confirm availability through
        // AuthService when the backend
        // username endpoint exists.

        const currentProfile =
          await ProfileService.getProfile();

        await ProfileService.saveProfile({
          ...currentProfile,

          username:
            cleanUsername,
        });

        navigation.replace(
          "InterestSelection"
        );
      } catch {
        setFormError(
          "We couldn't save your username. Please try again."
        );
      } finally {
        submitRequestRef.current =
          false;

        setSubmitting(false);
      }
    }, [
      cleanUsername,
      isValid,
      navigation,
    ]);

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
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.content}>
          <View
            style={
              styles.navigationRow
            }
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              disabled={submitting}
              hitSlop={Spacing.sm}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor:
                    colors.border,

                  opacity: pressed
                    ? 0.62
                    : 1,
                },
              ]}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={Icons.md}
                color={colors.icon}
              />
            </Pressable>

            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Create username
            </Text>

            <View
              style={
                styles.headerPlaceholder
              }
            />
          </View>

          <View
            style={[
              styles.previewContainer,
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
                styles.previewLabel,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Your profile address
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.previewUsername,
                {
                  color: colors.text,
                },
              ]}
            >
              @
              {cleanUsername ||
                "username"}
            </Text>
          </View>

          <View style={styles.inputArea}>
            <Input
              label="Username"
              placeholder="your_username"
              leftIcon="at"
              value={username}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              textContentType="username"
              returnKeyType="done"
              editable={!submitting}
              onSubmitEditing={
                handleContinue
              }
              onChangeText={
                handleUsernameChange
              }
            />

            <View
              accessibilityLiveRegion="polite"
              style={[
                styles.statusContainer,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  validationState ===
                  "valid"
                    ? "check-circle"
                    : validationState ===
                      "invalid"
                    ? "alert-circle-outline"
                    : "information-outline"
                }
                size={Icons.sm}
                color={statusColor}
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.statusText,
                  {
                    color:
                      statusColor,
                  },
                ]}
              >
                {statusMessage}
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
                {cleanUsername.length}/
                {MAXIMUM_USERNAME_LENGTH}
              </Text>
            </View>

            {formError ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[
                  styles.formError,
                  {
                    color:
                      colors.danger,
                  },
                ]}
              >
                {formError}
              </Text>
            ) : null}
          </View>

          <View
            style={
              styles.buttonContainer
            }
          >
            <PrimaryButton
              title="Continue"
              loading={submitting}
              disabled={!isValid}
              onPress={
                handleContinue
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  content: {
    flex: 1,

    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.md,

    paddingBottom:
      Spacing.xl,
  },

  navigationRow: {
    minHeight: 46,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  backButton: {
    width: 42,

    height: 42,

    alignItems: "center",

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.md,
  },

  headerTitle: {
    ...Typography.headline,

    fontWeight: "800",

    textAlign: "center",
  },

  headerPlaceholder: {
    width: 42,
  },

  previewContainer: {
    minHeight: 88,

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.lg,

    paddingHorizontal:
      Spacing.lg,

    marginTop:
      Spacing.xxxl,
  },

  previewLabel: {
    ...Typography.small,
  },

  previewUsername: {
    ...Typography.title,

    fontSize: 28,

    lineHeight: 34,

    fontWeight: "800",

    marginTop:
      Spacing.xs,
  },

  inputArea: {
    marginTop:
      Spacing.xxl,
  },

  statusContainer: {
    minHeight: 46,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderRadius:
      Radius.md,

    paddingHorizontal:
      Spacing.md,

    marginTop:
      Spacing.sm,
  },

  statusText: {
    ...Typography.small,

    flex: 1,

    fontWeight: "700",

    marginHorizontal:
      Spacing.sm,
  },

  characterCount: {
    ...Typography.small,

    fontWeight: "700",
  },

  formError: {
    ...Typography.small,

    fontWeight: "600",

    marginTop:
      Spacing.sm,
  },

  buttonContainer: {
    marginTop: "auto",
  },
});