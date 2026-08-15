import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import useTheme from "../../theme/useTheme";
import {
  Animations,
  Icons,
  Spacing,
  Typography,
} from "../../theme";

type Props = {
  image: string;
};

export default function FeedCardMedia({
  image,
}: Props) {
  const { colors } = useTheme();

  const [loading, setLoading] =
    useState(true);

  const [failed, setFailed] =
    useState(false);

  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  const normalizedImage =
    image.trim();

  useEffect(() => {
    opacity.stopAnimation();
    opacity.setValue(0);

    if (!normalizedImage) {
      setLoading(false);
      setFailed(true);

      return;
    }

    setLoading(true);
    setFailed(false);

    return () => {
      opacity.stopAnimation();
    };
  }, [
    normalizedImage,
    opacity,
  ]);

  useEffect(() => {
    return () => {
      opacity.stopAnimation();
    };
  }, [opacity]);

  const handleLoaded =
    useCallback(() => {
      setLoading(false);

      opacity.stopAnimation();

      Animated.timing(opacity, {
        toValue: 1,
        duration: Animations.fast,
        useNativeDriver: true,
      }).start();
    }, [opacity]);

  const handleError =
    useCallback(() => {
      opacity.stopAnimation();

      setLoading(false);
      setFailed(true);
    }, [opacity]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.skeleton,
        },
      ]}
    >
      {failed ? (
        <View
          style={[
            styles.failed,
            {
              backgroundColor:
                colors.skeleton,
            },
          ]}
        >
          <View
            style={[
              styles.failedIconContainer,
              {
                backgroundColor:
                  colors.surface,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              accessible={false}
              name="image-off-outline"
              size={Icons.xl}
              color={
                colors.placeholder
              }
            />
          </View>

          <Text
            style={[
              styles.failedTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Image unavailable
          </Text>

          <Text
            style={[
              styles.failedText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            The publisher&apos;s image could
            not be loaded.
          </Text>
        </View>
      ) : (
        <>
          <Animated.Image
            key={normalizedImage}
            accessible={false}
            source={{
              uri: normalizedImage,
            }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            onLoad={handleLoaded}
            onError={handleError}
            style={[
              styles.image,
              {
                opacity,
              },
            ]}
          />

          {loading ? (
            <View
              style={[
                styles.placeholder,
                {
                  backgroundColor:
                    colors.skeleton,
                },
              ]}
            >
              <ActivityIndicator
                size="small"
                color={
                  colors.placeholder
                }
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",

    aspectRatio: 16 / 9,

    overflow: "hidden",
  },

  image: {
    width: "100%",

    height: "100%",
  },

  placeholder: {
    ...StyleSheet.absoluteFill,

    justifyContent: "center",

    alignItems: "center",

    zIndex: 1,
  },

  failed: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal:
      Spacing.xl,
  },

  failedIconContainer: {
    width: 54,

    height: 54,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius: 27,

    justifyContent: "center",

    alignItems: "center",
  },

  failedTitle: {
    ...Typography.caption,

    fontWeight: "800",

    textAlign: "center",

    marginTop:
      Spacing.md,
  },

  failedText: {
    ...Typography.small,

    textAlign: "center",

    marginTop:
      Spacing.xs,
  },
});