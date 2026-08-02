import React, {
  useMemo,
} from "react";
import {
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
  publisher: string;
  website: string;
  publishedAt: string;
  addedAt: string;
  verified?: boolean;
  sponsored?: boolean;
};

export default function FeedCardHeader({
  publisher,
  website,
  publishedAt,
  addedAt,
  verified = false,
  sponsored = false,
}: Props) {
  const { colors } = useTheme();

  const normalizedWebsite =
    website.trim();

  const timeLabel =
    useMemo(() => {
      const parts:
        string[] = [];

      const normalizedPublishedAt =
        publishedAt.trim();

      const normalizedAddedAt =
        addedAt.trim();

      if (normalizedPublishedAt) {
        parts.push(
          `Published ${normalizedPublishedAt}`
        );
      }

      if (normalizedAddedAt) {
        parts.push(
          `Added ${normalizedAddedAt}`
        );
      }

      return parts.join(" · ");
    }, [
      addedAt,
      publishedAt,
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.publisherGroup}>
          <Text
            numberOfLines={1}
            style={[
              styles.publisher,
              {
                color: colors.text,
              },
            ]}
          >
            {publisher}
          </Text>

          {verified ? (
            <MaterialCommunityIcons
              accessible={false}
              name="check-decagram"
              size={Icons.sm}
              color={colors.primary}
              style={styles.verifiedIcon}
            />
          ) : null}

          {normalizedWebsite ? (
            <Text
              numberOfLines={1}
              style={[
                styles.website,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {normalizedWebsite}
            </Text>
          ) : null}
        </View>

        {sponsored ? (
          <View
            style={[
              styles.sponsoredBadge,
              {
                backgroundColor:
                  colors.sponsored,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sponsoredText,
                {
                  color:
                    colors.warning,
                },
              ]}
            >
              Sponsored
            </Text>
          </View>
        ) : null}
      </View>

      {timeLabel ? (
        <Text
          numberOfLines={1}
          style={[
            styles.time,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          {timeLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.lg,

    paddingBottom:
      Spacing.sm,
  },

  topRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  publisherGroup: {
    flex: 1,

    minWidth: 0,

    flexDirection: "row",

    alignItems: "center",
  },

  publisher: {
    ...Typography.caption,

    maxWidth: "42%",

    fontWeight: "800",

    letterSpacing: 0.1,
  },

  verifiedIcon: {
    marginLeft:
      Spacing.xs,

    flexShrink: 0,
  },

  website: {
    ...Typography.caption,

    flex: 1,

    minWidth: 0,

    marginLeft:
      Spacing.sm,
  },

  sponsoredBadge: {
    minHeight: 28,

    justifyContent: "center",

    alignItems: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,

    paddingHorizontal:
      Spacing.sm,

    marginLeft:
      Spacing.sm,

    flexShrink: 0,
  },

  sponsoredText: {
    ...Typography.small,

    fontSize: 11,

    lineHeight: 15,

    fontWeight: "800",

    letterSpacing: 0.2,
  },

  time: {
    ...Typography.caption,

    marginTop:
      Spacing.xs,
  },
});