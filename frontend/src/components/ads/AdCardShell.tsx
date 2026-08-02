import React, {
  ReactNode,
} from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import useTheme from "../../theme/useTheme";

import {
  Spacing,
} from "../../theme";

interface AdCardShellProps {
  children: ReactNode;

  onPress?: () => void;

  accessibilityLabel?: string;
}

export default function AdCardShell({
  children,
  onPress,
  accessibilityLabel,
}: AdCardShellProps) {
  const { colors } = useTheme();

  if (!onPress) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              colors.background,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel
      }
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor:
            colors.background,

          borderBottomColor:
            colors.border,

          opacity: pressed
            ? 0.92
            : 1,
        },
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",

    paddingTop:
      Spacing.lg,

    paddingBottom:
      Spacing.lg,

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },
});