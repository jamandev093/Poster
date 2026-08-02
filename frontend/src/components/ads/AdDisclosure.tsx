import React from "react";
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

type AdDisclosureType =
  | "poster"
  | "affiliate"
  | "direct"
  | "google";

interface AdDisclosureProps {
  type: AdDisclosureType;

  advertiserName?: string;
}

function getDisclosureText(
  type: AdDisclosureType,
  advertiserName?: string
): string {
  switch (type) {
    case "poster":
      return "Promoted by Poster";

    case "affiliate":
      return "Affiliate by Poster · Poster may earn a commission";

    case "direct":
      return advertiserName
        ? `Sponsored by ${advertiserName}`
        : "Sponsored";

    case "google":
      return "Ad";

    default:
      return "Sponsored";
  }
}

function getDisclosureIcon(
  type: AdDisclosureType
):
  | "bullhorn-outline"
  | "link-variant"
  | "handshake-outline"
  | "advertisements" {
  switch (type) {
    case "poster":
      return "bullhorn-outline";

    case "affiliate":
      return "link-variant";

    case "direct":
      return "handshake-outline";

    case "google":
      return "advertisements";
  }
}

export default function AdDisclosure({
  type,
  advertiserName,
}: AdDisclosureProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="text"
      style={[
        styles.container,
        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={getDisclosureIcon(type)}
        size={Icons.sm}
        color={colors.primary}
      />

      <Text
        numberOfLines={2}
        style={[
          styles.text,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {getDisclosureText(
          type,
          advertiserName
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    maxWidth: "100%",

    paddingHorizontal:
      Spacing.sm,

    paddingVertical:
      Spacing.xs,

    borderRadius:
      Radius.round,

    borderWidth:
      StyleSheet.hairlineWidth,
  },

  text: {
    flexShrink: 1,

    ...Typography.small,

    fontWeight: "700",

    marginLeft:
      Spacing.xs,
  },
});