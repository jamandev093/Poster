import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import useTheme from "../../theme/useTheme";
import {
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "../../theme";

interface PrimaryButtonProps {
  title: string;
  onPress?: () =>
    void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const { colors } = useTheme();

  const scale =
    useRef(
      new Animated.Value(1)
    ).current;

  const pressLockRef =
    useRef(false);

  const unavailable =
    disabled ||
    loading ||
    !onPress;

  useEffect(() => {
    if (!unavailable) {
      return;
    }

    scale.stopAnimation();
    scale.setValue(1);

    pressLockRef.current =
      false;
  }, [
    scale,
    unavailable,
  ]);

  const handlePress =
    useCallback(async () => {
      if (
        unavailable ||
        pressLockRef.current ||
        !onPress
      ) {
        return;
      }

      pressLockRef.current =
        true;

      try {
        await onPress();
      } finally {
        setTimeout(() => {
          pressLockRef.current =
            false;
        }, 0);
      }
    }, [
      onPress,
      unavailable,
    ]);

  const handlePressIn = () => {
    if (unavailable) {
      return;
    }

    Animated.spring(scale, {
      toValue: 0.98,
      speed: 35,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 35,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: unavailable,
        busy: loading,
      }}
      disabled={unavailable}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.button,
          Shadows.sm,
          {
            backgroundColor: colors.primary,
            opacity: unavailable ? 0.55 : 1,
            transform: [{ scale }],
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.onPrimary}
          />
        ) : (
          <Text
            style={[
              styles.text,
              {
                color: colors.onPrimary,
              },
            ]}
          >
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,

    borderRadius: Radius.lg,

    paddingHorizontal: Spacing.lg,

    justifyContent: "center",

    alignItems: "center",
  },

  text: {
    ...Typography.body,

    fontWeight: "700",

    letterSpacing: 0.3,
  },
});