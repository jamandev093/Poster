import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import AdCardShell from "./AdCardShell";
import AdDisclosure from "./AdDisclosure";

import {
  GoogleNativeAdPlaceholder,
} from "./ad.types";

import useTheme from "../../theme/useTheme";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";

interface GoogleNativeAdCardProps {
  ad:
    GoogleNativeAdPlaceholder;
}

export default function GoogleNativeAdCard({
  ad,
}: GoogleNativeAdCardProps) {
  const { colors } = useTheme();

  if (
    ad.status === "no_fill" ||
    ad.status === "failed"
  ) {
    return null;
  }

  return (
    <AdCardShell>
      <View style={styles.header}>
        <AdDisclosure
          type="google"
        />

        <Text
          style={[
            styles.providerText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Google advertising placeholder
        </Text>
      </View>

      <View
        style={[
          styles.placeholder,
          {
            backgroundColor:
              colors.surface,

            borderColor:
              colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={
            ad.status === "loading"
              ? "progress-clock"
              : "advertisements"
          }
          size={Icons.hero}
          color={colors.primary}
        />

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {ad.status === "loading"
            ? "Loading Google ad"
            : "Google native ad"}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          This placeholder will later be replaced by assets supplied through the Google Mobile Ads SDK.
        </Text>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            UI placeholder · {ad.placement}
          </Text>
        </View>
      </View>
    </AdCardShell>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal:
      Spacing.screen,

    paddingBottom:
      Spacing.md,
  },

  providerText: {
    ...Typography.small,

    marginTop:
      Spacing.md,
  },

  placeholder: {
    minHeight: 260,

    alignItems: "center",

    justifyContent: "center",

    marginHorizontal:
      Spacing.screen,

    paddingHorizontal:
      Spacing.xl,

    paddingVertical:
      Spacing.xxl,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.lg,
  },

  title: {
    ...Typography.headline,

    fontWeight: "800",

    textAlign: "center",

    marginTop:
      Spacing.lg,
  },

  description: {
    ...Typography.body,

    textAlign: "center",

    marginTop:
      Spacing.sm,
  },

  statusBadge: {
    paddingHorizontal:
      Spacing.md,

    paddingVertical:
      Spacing.sm,

    marginTop:
      Spacing.lg,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,
  },

  statusText: {
    ...Typography.small,

    fontWeight: "700",
  },
});