import React, {
  useMemo,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

interface InterestManagerProps {
  interests: string[];

  onAdd: (
    interest: string
  ) => void;

  onRemove: (
    interest: string
  ) => void;

  onManagePress: () => void;
}

const VISIBLE_INTEREST_COUNT = 4;

export default function InterestManager({
  interests,
  onRemove,
  onManagePress,
}: InterestManagerProps) {
  const { colors } = useTheme();

  const visibleInterests =
    useMemo(
      () =>
        interests.slice(
          0,
          VISIBLE_INTEREST_COUNT
        ),
      [interests]
    );

  const hiddenInterestCount =
    Math.max(
      interests.length -
        VISIBLE_INTEREST_COUNT,
      0
    );

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Your Interests
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage interests"
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.manageButton,
            {
              opacity: pressed
                ? 0.55
                : 1,
            },
          ]}
          onPress={onManagePress}
        >
          <Text
            style={[
              styles.manageText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            Manage
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={Icons.md}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {visibleInterests.length >
      0 ? (
        <View
          style={
            styles.interestList
          }
        >
          {visibleInterests.map(
            (interest) => (
              <Pressable
                key={interest}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${interest}`}
                style={({ pressed }) => [
                  styles.interestChip,
                  {
                    backgroundColor:
                      colors.surface,

                    borderColor:
                      colors.border,

                    opacity: pressed
                      ? 0.58
                      : 1,
                  },
                ]}
                onPress={() => {
                  onRemove(interest);
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.interestText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {interest}
                </Text>

                <MaterialCommunityIcons
                  name="close"
                  size={Icons.sm}
                  color={
                    colors.textSecondary
                  }
                />
              </Pressable>
            )
          )}

          {hiddenInterestCount >
          0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Manage ${hiddenInterestCount} more interests`}
              style={({ pressed }) => [
                styles.moreChip,
                {
                  borderColor:
                    colors.border,

                  opacity: pressed
                    ? 0.58
                    : 1,
                },
              ]}
              onPress={
                onManagePress
              }
            >
              <Text
                style={[
                  styles.moreText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                +{hiddenInterestCount} more
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add interests"
          style={({ pressed }) => [
            styles.emptyButton,
            {
              borderColor:
                colors.border,

              opacity: pressed
                ? 0.58
                : 1,
            },
          ]}
          onPress={onManagePress}
        >
          <Text
            style={[
              styles.emptyText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Add interests
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={Icons.md}
            color={colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth:
      StyleSheet.hairlineWidth,

    paddingBottom:
      Spacing.xl,

    marginBottom:
      Spacing.xl,
  },

  header: {
    minHeight: 40,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginBottom:
      Spacing.md,
  },

  title: {
    ...Typography.headline,

    fontWeight: "800",
  },

  manageButton: {
    minHeight: 38,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingLeft:
      Spacing.sm,
  },

  manageText: {
    ...Typography.caption,

    fontWeight: "800",

    marginRight: 2,
  },

  interestList: {
    flexDirection: "row",

    flexWrap: "wrap",
  },

  interestChip: {
    maxWidth: "100%",

    minHeight: 38,

    flexDirection: "row",

    alignItems: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,

    paddingHorizontal:
      Spacing.md,

    marginRight:
      Spacing.sm,

    marginBottom:
      Spacing.sm,
  },

  interestText: {
    ...Typography.caption,

    maxWidth: 210,

    fontWeight: "700",

    marginRight:
      Spacing.xs,
  },

  moreChip: {
    minHeight: 38,

    alignItems: "center",

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,

    paddingHorizontal:
      Spacing.md,

    marginRight:
      Spacing.sm,

    marginBottom:
      Spacing.sm,
  },

  moreText: {
    ...Typography.caption,

    fontWeight: "800",
  },

  emptyButton: {
    minHeight: 48,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  emptyText: {
    ...Typography.body,
  },
});