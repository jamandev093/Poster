import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

import useTheme from "../../theme/useTheme";
import {
  Radius,
  Spacing,
  Typography,
} from "../../theme";

type Props = {
  title: string;
};

export default function TrendingTopicChip({
  title,
}: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        styles.chip,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: colors.text,
          },
        ]}
      >
        🔥 {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,

    paddingVertical: Spacing.md,

    marginRight: Spacing.sm,

    borderRadius: Radius.lg,

    borderWidth: StyleSheet.hairlineWidth,
  },

  text: {
    ...Typography.caption,

    fontWeight: "600",
  },
});
