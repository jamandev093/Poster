import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
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

type MaterialIconName =
  React.ComponentProps<
    typeof MaterialCommunityIcons
  >["name"];

interface ProfileMenuItemProps {
  title: string;
  icon: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ProfileMenuItem({
  title,
  icon,
  description,
  badge,
  disabled = false,
  onPress,
  style,
}: ProfileMenuItemProps) {
  const { colors } = useTheme();

  const iconName =
    icon as MaterialIconName;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      android_ripple={{
        color: colors.border,
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor:
            colors.card,
          borderColor:
            colors.border,
          opacity: disabled
            ? 0.55
            : pressed
              ? 0.78
              : 1,
        },
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor:
                colors.surface,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={Icons.md}
            color={
              disabled
                ? colors.placeholder
                : colors.primary
            }
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            {title}
          </Text>

          {description ? (
            <Text
              numberOfLines={2}
              style={[
                styles.description,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {badge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}

        <MaterialCommunityIcons
          name="chevron-right"
          size={Icons.md}
          color={
            disabled
              ? colors.placeholder
              : colors.icon
          }
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 68,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.lg,

    paddingHorizontal:
      Spacing.lg,

    paddingVertical:
      Spacing.md,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginBottom:
      Spacing.md,
  },

  left: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    paddingRight:
      Spacing.md,
  },

  iconContainer: {
    width: 42,

    height: 42,

    borderRadius:
      Radius.md,

    justifyContent: "center",

    alignItems: "center",

    marginRight:
      Spacing.md,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    ...Typography.body,

    fontWeight: "700",
  },

  description: {
    ...Typography.small,

    lineHeight: 18,

    marginTop:
      Spacing.xs,
  },

  right: {
    flexDirection: "row",

    alignItems: "center",
  },

  badge: {
    borderRadius:
      Radius.round,

    paddingHorizontal:
      Spacing.sm,

    paddingVertical:
      Spacing.xs,

    marginRight:
      Spacing.sm,
  },

  badgeText: {
    ...Typography.small,

    fontWeight: "600",
  },
});