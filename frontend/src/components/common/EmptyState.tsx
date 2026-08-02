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

export type EmptyStateVariant =
  | "content"
  | "search"
  | "bookmarks"
  | "interests"
  | "trending";

interface EmptyStateProps {
  variant?: EmptyStateVariant;

  icon?: React.ComponentProps<
    typeof MaterialCommunityIcons
  >["name"];

  title?: string;

  description?: string;

  actionLabel?: string;

  compact?: boolean;

  onAction?: () => void;
}

function getDefaultContent(
  variant: EmptyStateVariant
): {
  icon: React.ComponentProps<
    typeof MaterialCommunityIcons
  >["name"];

  title: string;

  description: string;
} {
  switch (variant) {
    case "search":
      return {
        icon: "magnify",
        title: "No useful results found",
        description:
          "Try another keyword, publisher, category or topic.",
      };

    case "bookmarks":
      return {
        icon: "bookmark-outline",
        title: "No bookmarked articles",
        description:
          "Save useful stories from Home, Search or Trending to find them here.",
      };

    case "interests":
      return {
        icon: "shape-outline",
        title: "No interests selected",
        description:
          "Choose topics to improve your personalized discovery feed.",
      };

    case "trending":
      return {
        icon: "trending-up",
        title: "No trending stories found",
        description:
          "There are no current stories for this topic. Try another category.",
      };

    case "content":
      return {
        icon: "newspaper-variant-outline",
        title: "Nothing to show",
        description:
          "Pull down to refresh and try again.",
      };
  }
}

export default function EmptyState({
  variant = "content",
  icon,
  title,
  description,
  actionLabel,
  compact = false,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  const defaults =
    getDefaultContent(variant);

  return (
    <View
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
          name={
            icon ??
            defaults.icon
          }
          size={
            compact
              ? Icons.xl
              : Icons.hero
          }
          color={colors.primary}
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

      {onAction &&
      actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            actionLabel
          }
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,

              opacity: pressed
                ? 0.65
                : 1,
            },
          ]}
          onPress={onAction}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color:
                  colors.primary,
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

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.xl,

    marginTop:
      Spacing.xl,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,
  },

  buttonText: {
    ...Typography.caption,

    fontWeight: "800",
  },
});