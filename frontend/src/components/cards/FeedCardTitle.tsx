import React from "react";
import {
  StyleSheet,
  Text,
} from "react-native";

import useTheme from "../../theme/useTheme";
import {
  Spacing,
  Typography,
} from "../../theme";

type Props = {
  title: string;
};

export default function FeedCardTitle({
  title,
}: Props) {
  const { colors } = useTheme();

  return (
    <Text
      accessibilityRole="header"
      numberOfLines={3}
      ellipsizeMode="tail"
      style={[
        styles.title,
        {
          color: colors.text,
        },
      ]}
    >
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    ...Typography.headline,

    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.lg,

    paddingBottom:
      Spacing.md,

    fontWeight: "800",

    lineHeight: 29,

    letterSpacing: -0.25,

    includeFontPadding: false,
  },
});