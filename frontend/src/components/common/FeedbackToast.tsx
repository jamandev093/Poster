import React, {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import useTheme from "../../theme/useTheme";

import {
  Icons,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "../../theme";

export type FeedbackType =
  | "success"
  | "error"
  | "warning"
  | "info";

export interface FeedbackToastAction {
  label: string;

  onPress: () => void;
}

interface FeedbackToastProps {
  visible: boolean;

  type: FeedbackType;

  title: string;

  message?: string;

  action?: FeedbackToastAction;

  onDismiss: () => void;
}

function getIcon(
  type: FeedbackType
):
  | "check-circle-outline"
  | "alert-circle-outline"
  | "alert-outline"
  | "information-outline" {
  switch (type) {
    case "success":
      return "check-circle-outline";

    case "error":
      return "alert-circle-outline";

    case "warning":
      return "alert-outline";

    case "info":
      return "information-outline";
  }
}

export default function FeedbackToast({
  visible,
  type,
  title,
  message,
  action,
  onDismiss,
}: FeedbackToastProps) {
  const { colors } = useTheme();

  const translateY =
    useRef(
      new Animated.Value(-24)
    ).current;

  const opacity =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(
        translateY,
        {
          toValue: visible
            ? 0
            : -24,

          duration: visible
            ? 220
            : 160,

          useNativeDriver: true,
        }
      ),

      Animated.timing(
        opacity,
        {
          toValue: visible
            ? 1
            : 0,

          duration: visible
            ? 220
            : 140,

          useNativeDriver: true,
        }
      ),
    ]).start();
  }, [
    opacity,
    translateY,
    visible,
  ]);

  const accentColor =
    type === "success"
      ? colors.success
      : type === "error"
      ? colors.danger
      : type === "warning"
      ? colors.warning
      : colors.primary;

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        Shadows.lg,
        {
          backgroundColor:
            colors.card,

          borderColor:
            colors.border,

          borderLeftColor:
            accentColor,

          opacity,

          transform: [
            {
              translateY,
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              colors.surface,

            borderColor:
              accentColor,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={getIcon(type)}
          size={Icons.md}
          color={accentColor}
        />
      </View>

      <View style={styles.copy}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        {message ? (
          <Text
            numberOfLines={3}
            style={[
              styles.message,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {message}
          </Text>
        ) : null}

        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              action.label
            }
            hitSlop={Spacing.sm}
            style={({ pressed }) => [
              styles.actionButton,
              {
                opacity: pressed
                  ? 0.58
                  : 1,
              },
            ]}
            onPress={
              action.onPress
            }
          >
            <Text
              style={[
                styles.actionText,
                {
                  color:
                    accentColor,
                },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss message"
        hitSlop={Spacing.sm}
        style={({ pressed }) => [
          styles.closeButton,
          {
            opacity: pressed
              ? 0.5
              : 1,
          },
        ]}
        onPress={onDismiss}
      >
        <MaterialCommunityIcons
          name="close"
          size={Icons.md}
          color={colors.placeholder}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",

    top: Spacing.xl,

    left: Spacing.screen,

    right: Spacing.screen,

    zIndex: 1000,

    minHeight: 74,

    flexDirection: "row",

    alignItems: "flex-start",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderLeftWidth: 4,

    borderRadius:
      Radius.lg,

    padding:
      Spacing.md,
  },

  iconContainer: {
    width: 40,

    height: 40,

    alignItems: "center",

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,

    flexShrink: 0,
  },

  copy: {
    flex: 1,

    minWidth: 0,

    marginLeft:
      Spacing.md,

    paddingRight:
      Spacing.sm,
  },

  title: {
    ...Typography.body,

    fontWeight: "800",
  },

  message: {
    ...Typography.small,

    lineHeight: 18,

    marginTop:
      Spacing.xs,
  },

  actionButton: {
    alignSelf: "flex-start",

    marginTop:
      Spacing.sm,
  },

  actionText: {
    ...Typography.caption,

    fontWeight: "800",
  },

  closeButton: {
    width: 32,

    height: 32,

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,
  },
});