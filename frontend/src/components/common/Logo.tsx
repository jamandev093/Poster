import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import useTheme from "../../theme/useTheme";
import {
  Spacing,
  Typography,
} from "../../theme";

interface LogoProps {
  inverse?: boolean;
  compact?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Logo({
  inverse = false,
  compact = false,
  containerStyle,
  textStyle,
}: LogoProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="header"
      style={[
        styles.container,
        containerStyle,
      ]}
    >
      <Text
        accessibilityLabel="Poster"
        style={[
          styles.logo,
          compact && styles.compact,
          {
            color: inverse
              ? colors.background
              : colors.text,
          },
          textStyle,
        ]}
      >
        POSTER
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },

  logo: {
    ...Typography.title,

    fontSize: 48,

    fontWeight: "900",

    letterSpacing: Spacing.xs,
  },

  compact: {
    fontSize: 32,
  },
});