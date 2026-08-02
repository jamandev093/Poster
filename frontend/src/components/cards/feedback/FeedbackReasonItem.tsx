import React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import useTheme from "../../../theme/useTheme";
import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../../theme";

import { FeedbackReason } from "./feedbackReasons";

type Props = {
  reason: FeedbackReason;
  onPress: (reason: FeedbackReason) => void;
};

export default function FeedbackReasonItem({
  reason,
  onPress,
}: Props) {
  const { colors } = useTheme();

  const scale = React.useRef(
    new Animated.Value(1)
  ).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 35,
      bounciness: 6,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress(reason)}
      onPressIn={pressIn}
      onPressOut={pressOut}
      android_ripple={{
        color: colors.border,
      }}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.container,
          {
            borderBottomColor: colors.border,
            transform: [{ scale }],
          },
        ]}
      >
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
            {reason.title}
          </Text>

          {reason.description ? (
            <Text
              numberOfLines={2}
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {reason.description}
            </Text>
          ) : null}
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={Icons.md}
          color={colors.placeholder}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    overflow: "hidden",
    borderRadius: Radius.md,
  },

  container: {
    minHeight: 60,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  textContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },

  title: {
    ...Typography.body,
    fontWeight: "600",
  },

  description: {
    marginTop: 3,
    ...Typography.small,
    lineHeight: 18,
  },
});
