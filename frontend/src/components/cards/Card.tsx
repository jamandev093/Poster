import React from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import useTheme from "../../theme/useTheme";
import {
  Radius,
  Shadows,
  Spacing,
} from "../../theme";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Card({
  children,
  style,
}: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",

    padding: Spacing.xl,

    borderWidth: StyleSheet.hairlineWidth,

    borderRadius: Radius.xl,

    ...Shadows.sm,
  },
});