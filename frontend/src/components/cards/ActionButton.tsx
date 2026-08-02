import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Animated,
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

type Props = {
  icon:
    keyof typeof MaterialCommunityIcons.glyphMap;

  label: string;

  accessibilityLabel?: string;

  onPress: () => void;

  danger?: boolean;

  active?: boolean;

  activeColor?: string;
};

const PRESS_LOCK_DURATION_MS = 300;

export default function ActionButton({
  icon,
  label,
  accessibilityLabel,
  onPress,
  danger = false,
  active = false,
  activeColor,
}: Props) {
  const { colors } = useTheme();

  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const pressLockRef =
    useRef(false);

  const unlockTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  useEffect(() => {
    return () => {
      if (
        unlockTimerRef.current
      ) {
        clearTimeout(
          unlockTimerRef.current
        );
      }

      scale.stopAnimation();
    };
  }, [scale]);

  const animateIn =
    useCallback(() => {
      scale.stopAnimation();

      Animated.spring(scale, {
        toValue: 0.94,
        useNativeDriver: true,
        speed: 35,
        bounciness: 6,
      }).start();
    }, [scale]);

  const animateOut =
    useCallback(() => {
      scale.stopAnimation();

      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 35,
        bounciness: 8,
      }).start();
    }, [scale]);

  const handlePress =
    useCallback(() => {
      if (
        pressLockRef.current
      ) {
        return;
      }

      pressLockRef.current =
        true;

      try {
        onPress();
      } finally {
        if (
          unlockTimerRef.current
        ) {
          clearTimeout(
            unlockTimerRef.current
          );
        }

        unlockTimerRef.current =
          setTimeout(() => {
            pressLockRef.current =
              false;

            unlockTimerRef.current =
              null;
          }, PRESS_LOCK_DURATION_MS);
      }
    }, [onPress]);

  const tint = danger
    ? colors.danger
    : active
    ? activeColor ??
      colors.primary
    : colors.icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        label
      }
      accessibilityState={{
        selected: active,
      }}
      onPressIn={animateIn}
      onPressOut={animateOut}
      onPress={handlePress}
      android_ripple={{
        color: colors.border,
        borderless: false,
      }}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.button,
          {
            borderRadius:
              Radius.md,

            transform: [
              {
                scale,
              },
            ],
          },
        ]}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons
            accessible={false}
            name={icon}
            size={Icons.md}
            color={tint}
          />

          <Text
            numberOfLines={1}
            style={[
              styles.label,
              {
                color: tint,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,

    borderRadius:
      Radius.md,

    overflow: "hidden",
  },

  button: {
    minHeight: 48,

    justifyContent: "center",

    alignItems: "center",
  },

  content: {
    justifyContent: "center",

    alignItems: "center",

    paddingVertical: 2,
  },

  label: {
    ...Typography.small,

    marginTop:
      Spacing.xs,

    textAlign: "center",
  },
});