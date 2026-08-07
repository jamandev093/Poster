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
  ScrollView,
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

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import useFeedback from "../../context/FeedbackContext";

import useTheme from "../../theme/useTheme";
import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";

import Logo from "../../components/common/Logo";
import Card from "../../components/cards/Card";
import Input from "../../components/forms/Input";
import PrimaryButton from "../../components/buttons/PrimaryButton";

import AuthService from "../../services/AuthService";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "ResetPasswordConfirm"
>;

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_CODE_REGEX =
  /^\d{6}$/;

const PASSWORD_MINIMUM_LENGTH =
  12;

export default function ResetPasswordConfirmScreen({
  navigation,
  route,
}: Props) {
  const { colors } = useTheme();

  const {
    showError,
  } = useFeedback();

  const submitRequestRef =
    useRef(false);

  const routeEmail =
    route.params?.email
      ?.trim()
      .toLowerCase() ?? "";

  const [email, setEmail] =
    useState(routeEmail);

  const [code, setCode] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordVisible, setPasswordVisible] =
    useState(false);

  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const normalizedEmail =
    email.trim().toLowerCase();

  const normalizedCode =
    code.trim();

  const isValidEmail =
    useMemo(() => {
      return EMAIL_REGEX.test(
        normalizedEmail
      );
    }, [normalizedEmail]);

  const isValidCode =
    useMemo(() => {
      return RESET_CODE_REGEX.test(
        normalizedCode
      );
    }, [normalizedCode]);

  const passwordIsValid =
    password.length >= PASSWORD_MINIMUM_LENGTH;

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword;

  const canSubmit =
    isValidEmail &&
    isValidCode &&
    passwordIsValid &&
    passwordsMatch &&
    !submitting;

  const handleSubmit =
    useCallback(async () => {
      if (
        submitRequestRef.current
      ) {
        return;
      }

      if (!canSubmit) {
        return;
      }

      submitRequestRef.current =
        true;

      setSubmitting(true);

      try {
        await AuthService.confirmPasswordReset({
          email:
            normalizedEmail,

          code:
            normalizedCode,

          password,
        });

        setSuccess(true);
      } catch (error) {
        showError(
          "Password reset failed",
          error instanceof Error
            ? error.message
            : "Poster could not reset your password. Please check the code and try again."
        );
      } finally {
        submitRequestRef.current =
          false;

        setSubmitting(false);
      }
    }, [
      canSubmit,
      normalizedCode,
      normalizedEmail,
      password,
      showError,
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
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.screen
          }
        >
          <View
            style={
              styles.topBar
            }
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={Spacing.sm}
              style={[
                styles.backButton,
                {
                  borderColor:
                    colors.border,
                },
              ]}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={Icons.md}
                color={colors.text}
              />
            </Pressable>

            <Logo compact />
          </View>

          <View
            style={
              styles.header
            }
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor:
                    colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="lock-reset"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text
              style={[
                styles.eyebrow,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              PASSWORD RESET
            </Text>

            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Set a new password
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Enter the six-digit reset code
              from your email and choose a
              new password.
            </Text>
          </View>

          <Card style={styles.card}>
            {!success ? (
              <>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Reset details
                </Text>

                <Text
                  style={[
                    styles.cardDescription,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Use the same email address
                  where you received the reset
                  code.
                </Text>

                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  leftIcon="email-outline"
                  value={email}
                  editable={!submitting}
                  onChangeText={setEmail}
                />

                {!!email &&
                  !isValidEmail && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[
                        styles.validation,
                        {
                          color:
                            colors.warning,
                        },
                      ]}
                    >
                      Enter a valid email
                      address.
                    </Text>
                  )}

                <View
                  style={
                    styles.inputGap
                  }
                />

                <Input
                  label="Reset code"
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={6}
                  leftIcon="numeric"
                  value={code}
                  editable={!submitting}
                  onChangeText={(value) => {
                    setCode(
                      value.replace(
                        /\D/g,
                        ""
                      )
                    );
                  }}
                />

                {!!code &&
                  !isValidCode && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[
                        styles.validation,
                        {
                          color:
                            colors.warning,
                        },
                      ]}
                    >
                      Enter the six-digit
                      reset code.
                    </Text>
                  )}

                <View
                  style={
                    styles.inputGap
                  }
                />

                <Input
                  label="New password"
                  placeholder="Create new password"
                  leftIcon="lock-outline"
                  rightIcon={
                    passwordVisible
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  rightIconAccessibilityLabel={
                    passwordVisible
                      ? "Hide password"
                      : "Show password"
                  }
                  secureTextEntry={
                    !passwordVisible
                  }
                  textContentType="newPassword"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={password}
                  editable={!submitting}
                  onRightIconPress={() => {
                    setPasswordVisible(
                      (current) =>
                        !current
                    );
                  }}
                  onChangeText={setPassword}
                />

                {!!password &&
                  !passwordIsValid && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[
                        styles.validation,
                        {
                          color:
                            colors.warning,
                        },
                      ]}
                    >
                      Password must contain at
                      least 12 characters.
                    </Text>
                  )}

                <View
                  style={
                    styles.inputGap
                  }
                />

                <Input
                  label="Confirm password"
                  placeholder="Re-enter new password"
                  leftIcon="lock-check-outline"
                  rightIcon={
                    confirmPasswordVisible
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  rightIconAccessibilityLabel={
                    confirmPasswordVisible
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  secureTextEntry={
                    !confirmPasswordVisible
                  }
                  textContentType="newPassword"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  value={confirmPassword}
                  editable={!submitting}
                  onRightIconPress={() => {
                    setConfirmPasswordVisible(
                      (current) =>
                        !current
                    );
                  }}
                  onSubmitEditing={() => {
                    void handleSubmit();
                  }}
                  onChangeText={setConfirmPassword}
                />

                {!!confirmPassword &&
                  !passwordsMatch && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[
                        styles.validation,
                        {
                          color:
                            colors.warning,
                        },
                      ]}
                    >
                      Passwords must match.
                    </Text>
                  )}

                <View
                  style={
                    styles.buttonGap
                  }
                />

                <PrimaryButton
                  title="Reset Password"
                  loading={
                    submitting
                  }
                  disabled={
                    !canSubmit
                  }
                  onPress={
                    handleSubmit
                  }
                />
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.successIcon,
                    {
                      backgroundColor:
                        colors.success,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={34}
                    color="#FFFFFF"
                  />
                </View>

                <Text
                  style={[
                    styles.successTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Password Updated
                </Text>

                <Text
                  style={[
                    styles.successText,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Your Poster password has
                  been updated. Sign in again
                  with your new password.
                </Text>

                <View
                  style={
                    styles.buttonGap
                  }
                />

                <PrimaryButton
                  title="Back To Login"
                  onPress={() =>
                    navigation.replace(
                      "Login"
                    )
                  }
                />
              </>
            )}
          </Card>

          <View
            style={[
              styles.tipCard,
              {
                backgroundColor:
                  colors.surface,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={Icons.md}
              color={colors.primary}
            />

            <Text
              style={[
                styles.tipText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              For security, password reset
              automatically clears existing
              login sessions.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:
      1,
  },

  flex: {
    flex:
      1,
  },

  screen: {
    flexGrow:
      1,
    paddingHorizontal:
      Spacing.screen,
    paddingTop:
      Spacing.lg,
    paddingBottom:
      Spacing.xxxl,
  },

  topBar: {
    flexDirection:
      "row",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    marginBottom:
      Spacing.xl,
  },

  backButton: {
    width:
      42,
    height:
      42,
    borderWidth:
      StyleSheet.hairlineWidth,
    borderRadius:
      Radius.md,
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  header: {
    alignItems:
      "center",
    marginBottom:
      Spacing.xxl,
  },

  iconContainer: {
    width:
      68,
    height:
      68,
    borderWidth:
      StyleSheet.hairlineWidth,
    borderRadius:
      Radius.round,
    justifyContent:
      "center",
    alignItems:
      "center",
    marginBottom:
      Spacing.lg,
  },

  eyebrow: {
    ...Typography.small,
    fontWeight:
      "800",
    letterSpacing:
      1,
    marginTop:
      Spacing.lg,
  },

  title: {
    ...Typography.title,
    textAlign:
      "center",
    marginTop:
      Spacing.sm,
  },

  subtitle: {
    ...Typography.body,
    textAlign:
      "center",
    lineHeight:
      24,
    marginTop:
      Spacing.md,
    paddingHorizontal:
      Spacing.sm,
  },

  card: {
    paddingVertical:
      Spacing.xxl,
  },

  cardTitle: {
    ...Typography.headline,
    fontWeight:
      "800",
  },

  cardDescription: {
    ...Typography.small,
    lineHeight:
      20,
    marginTop:
      Spacing.xs,
    marginBottom:
      Spacing.xl,
  },

  validation: {
    ...Typography.small,
    fontWeight:
      "600",
    marginTop:
      Spacing.sm,
  },

  inputGap: {
    height:
      Spacing.lg,
  },

  buttonGap: {
    height:
      Spacing.xl,
  },

  successIcon: {
    width:
      72,
    height:
      72,
    borderRadius:
      Radius.round,
    justifyContent:
      "center",
    alignItems:
      "center",
    alignSelf:
      "center",
    marginBottom:
      Spacing.lg,
  },

  successTitle: {
    ...Typography.headline,
    fontWeight:
      "800",
    textAlign:
      "center",
  },

  successText: {
    ...Typography.body,
    textAlign:
      "center",
    lineHeight:
      24,
    marginTop:
      Spacing.md,
  },

  tipCard: {
    flexDirection:
      "row",
    alignItems:
      "flex-start",
    borderWidth:
      StyleSheet.hairlineWidth,
    borderRadius:
      Radius.lg,
    padding:
      Spacing.lg,
    marginTop:
      Spacing.lg,
  },

  tipText: {
    ...Typography.small,
    flex:
      1,
    lineHeight:
      20,
    marginLeft:
      Spacing.sm,
  },
});
