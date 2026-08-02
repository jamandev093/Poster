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
  View,
  ViewStyle,
} from "react-native";
import {
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import useTheme from "../../theme/useTheme";
import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";

type SocialProvider =
  | "google"
  | "apple"
  | "github"
  | "microsoft";

type SocialIconName =
  React.ComponentProps<
    typeof MaterialCommunityIcons
  >["name"];

interface SocialButtonProps {
  provider?: SocialProvider;
  onPress?: () =>
    void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ProviderConfig {
  icon: SocialIconName;
  label: string;
}

const PROVIDER_CONFIG: Record<
  SocialProvider,
  ProviderConfig
> = {
  google: {
    icon: "google",
    label: "Continue with Google",
  },

  apple: {
    icon: "apple",
    label: "Continue with Apple",
  },

  github: {
    icon: "github",
    label: "Continue with GitHub",
  },

  microsoft: {
    icon: "microsoft",
    label: "Continue with Microsoft",
  },
};

export default function SocialButton({
  provider = "google",
  onPress,
  disabled = false,
  loading = false,
  style,
}: SocialButtonProps) {
  const { colors } = useTheme();

  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const config =
    PROVIDER_CONFIG[provider];

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

  const renderProviderIcon = () => {
    if (provider === "google") {
      return (
        <FontAwesome
          name="google"
          size={24}
          color={colors.icon}
        />
      );
    }

    if (provider === "apple") {
      return (
        <FontAwesome
          name="apple"
          size={28}
          color={colors.icon}
        />
      );
    }

    return (
      <MaterialCommunityIcons
        name={config.icon}
        size={Icons.lg}
        color={colors.icon}
      />
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={config.label}
      accessibilityState={{
        disabled: unavailable,
        busy: loading,
      }}
      disabled={unavailable}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{
        color: colors.border,
      }}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor:
              colors.card,

            borderColor:
              colors.border,

            opacity:
              unavailable
                ? 0.55
                : 1,

            transform: [
              {
                scale,
              },
            ],
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
          />
        ) : (
          <>
            <View
              style={
                styles.iconContainer
              }
            >
              {renderProviderIcon()}
            </View>

            <Text
              style={[
                styles.text,
                {
                  color: colors.text,
                },
              ]}
            >
              {config.label}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,

    borderRadius:
      Radius.lg,

    borderWidth: 1,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal:
      Spacing.lg,
  },

  iconContainer: {
    marginRight:
      Spacing.md,
  },

  text: {
    ...Typography.body,

    fontWeight: "600",
  },
});