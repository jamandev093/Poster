import React, {
  useCallback,
  useRef,
} from "react";
import {
  Pressable,
  Share,
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
  Spacing,
  Typography,
} from "../../theme";

interface AdActionsProps {
  itemId: string;

  title: string;

  destinationUrl: string;

  onReport?: () => void;

  onHide?: (
    itemId: string
  ) => void | Promise<void>;

  onShare?: (
    itemId: string
  ) => void;
}

export default function AdActions({
  itemId,
  title,
  destinationUrl,
  onReport,
  onHide,
  onShare,
}: AdActionsProps) {
  const { colors } = useTheme();

  const hideRequestRef =
    useRef(false);

  const handleShare =
    useCallback(async () => {
      onShare?.(itemId);

      try {
        await Share.share({
          title,
          message:
            `${title}\n${destinationUrl}`,
          url: destinationUrl,
        });
      } catch {
        // Native share cancellation or
        // failure must not interrupt
        // the feed.
      }
    }, [
      destinationUrl,
      itemId,
      onShare,
      title,
    ]);

  const handleHide =
    useCallback(async () => {
      if (
        !onHide ||
        hideRequestRef.current
      ) {
        return;
      }

      hideRequestRef.current =
        true;

      try {
        await onHide(itemId);
      } finally {
        hideRequestRef.current =
          false;
      }
    }, [
      itemId,
      onHide,
    ]);

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor:
            colors.border,
        },
      ]}
    >
      <View
        style={styles.leftActions}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share sponsored item"
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.action,
            {
              opacity: pressed
                ? 0.58
                : 1,
            },
          ]}
          onPress={() => {
            void handleShare();
          }}
        >
          <MaterialCommunityIcons
            accessible={false}
            name="share-variant-outline"
            size={Icons.md}
            color={colors.icon}
          />

          <Text
            style={[
              styles.actionText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Share
          </Text>
        </Pressable>

        {onHide ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hide sponsored item"
            hitSlop={Spacing.sm}
            style={({ pressed }) => [
              styles.action,
              styles.hideAction,
              {
                opacity: pressed
                  ? 0.58
                  : 1,
              },
            ]}
            onPress={() => {
              void handleHide();
            }}
          >
            <MaterialCommunityIcons
              accessible={false}
              name="eye-off-outline"
              size={Icons.md}
              color={colors.icon}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Hide
            </Text>
          </Pressable>
        ) : null}
      </View>

      {onReport ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Report sponsored item"
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.reportAction,
            {
              opacity: pressed
                ? 0.58
                : 1,
            },
          ]}
          onPress={onReport}
        >
          <MaterialCommunityIcons
            accessible={false}
            name="dots-horizontal"
            size={Icons.lg}
            color={colors.icon}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginTop:
      Spacing.lg,

    marginHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.sm,

    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  leftActions: {
    flexDirection: "row",

    alignItems: "center",
  },

  action: {
    minHeight: 40,

    flexDirection: "row",

    alignItems: "center",
  },

  hideAction: {
    marginLeft:
      Spacing.xl,
  },

  actionText: {
    ...Typography.small,

    fontWeight: "700",

    marginLeft:
      Spacing.xs,
  },

  reportAction: {
    width: 40,

    height: 40,

    alignItems: "center",

    justifyContent: "center",
  },
});