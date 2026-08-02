import React from "react";
import {
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
  Spacing,
  Typography,
} from "../../theme";

export type ErrorStateVariant =
  | "network"
  | "server"
  | "publisher"
  | "refresh"
  | "generic";

interface ErrorStateProps {
  variant?: ErrorStateVariant;

  title?: string;

  description?: string;

  actionLabel?: string;

  compact?: boolean;

  onRetry?: () => void;
}

function getDefaultContent(
  variant: ErrorStateVariant
): {
  icon:
    | "wifi-off"
    | "server-off"
    | "link-variant-off"
    | "refresh-circle"
    | "alert-circle-outline";

  title: string;

  description: string;
} {
  switch (variant) {
    case "network":
      return {
        icon: "wifi-off",

        title: "Connection unavailable",

        description:
          "Poster could not connect. Check your connection and try again.",
      };

    case "server":
      return {
        icon: "server-off",

        title: "Poster is temporarily unavailable",

        description:
          "The service could not complete this request. Please try again shortly.",
      };

    case "publisher":
      return {
        icon: "link-variant-off",

        title: "Publisher link unavailable",

        description:
          "Poster could not open the original publisher for this story.",
      };

    case "refresh":
      return {
        icon: "refresh-circle",

        title: "Content could not be refreshed",

        description:
          "Your existing content is still available. Try refreshing again.",
      };

    case "generic":
      return {
        icon: "alert-circle-outline",

        title: "Something went wrong",

        description:
          "Poster could not complete this action. Please try again.",
      };
  }
}

export default function ErrorState({
  variant = "generic",
  title,
  description,
  actionLabel = "Try Again",
  compact = false,
  onRetry,
}: ErrorStateProps) {
  const { colors } = useTheme();

  const defaults =
    getDefaultContent(variant);

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,

        compact &&
          styles.compactContainer,
      ]}
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
          name={defaults.icon}
          size={
            compact
              ? Icons.xl
              : Icons.hero
          }
          color={colors.danger}
        />
      </View>

      <Text
        style={[
          styles.title,

          compact &&
            styles.compactTitle,

          {
            color: colors.text,
          },
        ]}
      >
        {title ?? defaults.title}
      </Text>

      <Text
        style={[
          styles.description,

          compact &&
            styles.compactDescription,

          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {description ??
          defaults.description}
      </Text>

      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            actionLabel
          }
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor:
                colors.primary,

              opacity: pressed
                ? 0.72
                : 1,
            },
          ]}
          onPress={onRetry}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={Icons.sm}
            color={colors.onPrimary}
          />

          <Text
            style={[
              styles.buttonText,
              {
                color:
                  colors.onPrimary,
              },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.xxl,

    paddingVertical:
      Spacing.xxxl * 2,
  },

  compactContainer: {
    flex: 0,

    paddingVertical:
      Spacing.xxl,
  },

  iconContainer: {
    width: 78,

    height: 78,

    alignItems: "center",

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,
  },

  title: {
    ...Typography.headline,

    fontWeight: "800",

    textAlign: "center",

    marginTop:
      Spacing.xl,
  },

  compactTitle: {
    ...Typography.body,

    fontWeight: "800",
  },

  description: {
    ...Typography.body,

    maxWidth: 330,

    lineHeight: 22,

    textAlign: "center",

    marginTop:
      Spacing.sm,
  },

  compactDescription: {
    ...Typography.small,

    lineHeight: 19,
  },

  button: {
    minHeight: 48,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.xl,

    marginTop:
      Spacing.xl,

    borderRadius:
      Radius.round,
  },

  buttonText: {
    ...Typography.caption,

    fontWeight: "800",

    marginLeft:
      Spacing.sm,
  },
});