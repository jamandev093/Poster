import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";

import useTheme from "../../theme/useTheme";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
};

const PRESS_LOCK_DURATION_MS = 300;

export default function FeedCardContainer({
  children,
  onPress,
}: Props) {
  const { colors } = useTheme();

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
    };
  }, []);

  const handlePress =
    useCallback(() => {
      if (
        !onPress ||
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

  return (
    <Pressable
      accessibilityRole={
        onPress
          ? "button"
          : undefined
      }
      accessibilityLabel={
        onPress
          ? "Open article"
          : undefined
      }
      disabled={!onPress}
      android_ripple={
        onPress
          ? {
              color: colors.border,
              borderless: false,
            }
          : undefined
      }
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor:
            colors.card,

          borderBottomColor:
            colors.border,

          opacity:
            Platform.OS === "ios" &&
            pressed &&
            onPress
              ? 0.97
              : 1,
        },
      ]}
      onPress={handlePress}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    overflow: "hidden",
  },
});