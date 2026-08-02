import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import useTheme from "../../theme/useTheme";
import {
  Spacing,
  Typography,
} from "../../theme";

interface DividerProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Divider({
  label = "OR",
  style,
}: DividerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        style,
      ]}
    >
      <View
        style={[
          styles.line,
          {
            backgroundColor:
              colors.border,
          },
        ]}
      />

      <Text
        style={[
          styles.text,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.line,
          {
            backgroundColor:
              colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",

    alignItems: "center",
  },

  line: {
    flex: 1,

    height: StyleSheet.hairlineWidth,
  },

  text: {
    ...Typography.caption,

    fontWeight: "600",

    marginHorizontal:
      Spacing.lg,
  },
});