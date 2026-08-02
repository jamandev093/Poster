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

interface AdCallToActionProps {
  label: string;

  onPress: () => void;

  accessibilityLabel?: string;

  secondaryLabel?: string;

  onSecondaryPress?: () => void;
}

export default function AdCallToAction({
  label,
  onPress,
  accessibilityLabel,
  secondaryLabel,
  onSecondaryPress,
}: AdCallToActionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ?? label
        }
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor:
              colors.primary,

            opacity: pressed
              ? 0.78
              : 1,
          },
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.primaryText,
            {
              color: "#FFFFFF",
            },
          ]}
        >
          {label}
        </Text>

        <MaterialCommunityIcons
          name="arrow-top-right"
          size={Icons.md}
          color="#FFFFFF"
        />
      </Pressable>

      {secondaryLabel &&
      onSecondaryPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            secondaryLabel
          }
          style={({ pressed }) => [
            styles.secondaryButton,
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
          onPress={onSecondaryPress}
        >
          <Text
            style={[
              styles.secondaryText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.lg,
  },

  primaryButton: {
    minHeight: 46,

    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.lg,

    borderRadius:
      Radius.round,
  },

  primaryText: {
    ...Typography.button,

    fontWeight: "800",

    marginRight:
      Spacing.sm,
  },

  secondaryButton: {
    minHeight: 46,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.lg,

    marginLeft:
      Spacing.sm,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,
  },

  secondaryText: {
    ...Typography.caption,

    fontWeight: "700",
  },
});