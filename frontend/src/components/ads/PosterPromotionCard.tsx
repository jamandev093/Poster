import React, {
  useCallback,
} from "react";

import {
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AdActions from "./AdActions";
import AdCallToAction from "./AdCallToAction";
import AdCardShell from "./AdCardShell";
import AdDisclosure from "./AdDisclosure";
import AdMedia from "./AdMedia";

import {
  MonetizationMediaItem,
  PosterAffiliatePromotion,
  PosterPromotion,
} from "./ad.types";

import useTheme from "../../theme/useTheme";

import {
  Spacing,
  Typography,
} from "../../theme";

interface PosterPromotionCardProps {
  promotion:
    | PosterPromotion
    | PosterAffiliatePromotion;

  /**
   * Controls video playback only.
   *
   * The parent feed will eventually pass its resolved
   * visibility state here exactly as it already does
   * for Direct Sponsorship.
   *
   * Default true preserves current image-only and
   * existing rendering behavior during migration.
   */
  isFeedVisible?:
    boolean;

  onPress?: (
    destinationUrl: string
  ) => void;

  onReport?: () => void;

  onHide?: (
    itemId: string
  ) => void | Promise<void>;
}

export default function PosterPromotionCard({
  promotion,
  isFeedVisible = true,
  onPress,
  onReport,
  onHide,
}: PosterPromotionCardProps) {
  const { colors } =
    useTheme();

  const isAffiliate =
    promotion.type ===
    "poster_affiliate";

  const defaultDestinationUrl =
    isAffiliate &&
    promotion.trackingUrl
      ? promotion.trackingUrl
      : promotion.destinationUrl;

  const openUrl =
    useCallback(
      async (
        destinationUrl: string
      ) => {
        try {
          const supported =
            await Linking.canOpenURL(
              destinationUrl
            );

          if (supported) {
            await Linking.openURL(
              destinationUrl
            );
          }
        } catch {
          // TODO:
          // Route through shared user feedback.
        }
      },
      []
    );

  const handleOpen =
    useCallback(
      async (
        destinationUrl: string
      ) => {
        if (onPress) {
          onPress(
            destinationUrl
          );

          return;
        }

        await openUrl(
          destinationUrl
        );
      },
      [
        onPress,
        openUrl,
      ]
    );

  const handleMediaPress =
    useCallback(
      (
        mediaItem:
          MonetizationMediaItem
      ) => {
        const destinationUrl =
          mediaItem.destinationUrl ??
          defaultDestinationUrl;

        void handleOpen(
          destinationUrl
        );
      },
      [
        defaultDestinationUrl,
        handleOpen,
      ]
    );

  const sourceName =
    isAffiliate
      ? promotion.partnerName
      : promotion.sourceName;

  return (
    <AdCardShell>
      <View
        style={
          styles.header
        }
      >
        <AdDisclosure
          type={
            isAffiliate
              ? "affiliate"
              : "poster"
          }
        />

        <View
          style={
            styles.sourceContainer
          }
        >
          <Text
            numberOfLines={1}
            style={[
              styles.sourceName,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {sourceName}
          </Text>

          <Text
            numberOfLines={1}
            style={[
              styles.sourceDomain,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {
              promotion.destinationUrl
            }
          </Text>
        </View>
      </View>

      {/*
       * IMPORTANT:
       *
       * Poster Promotion and Affiliate now forward the
       * exact same generic creative fields as Direct
       * Sponsorship.
       *
       * Therefore commercial type no longer determines
       * creative format.
       *
       * Supported:
       *
       * Standard image  -> 16:9
       * Standard video  -> 16:9
       * Sliding         -> existing 1:1 cards
       */}
      <AdMedia
        isFeedVisible={
          isFeedVisible
        }
        mediaType={
          promotion.mediaType
        }
        imageUrl={
          promotion.imageUrl
        }
        videoUrl={
          promotion.videoUrl
        }
        thumbnailUrl={
          promotion.thumbnailUrl
        }
        mediaItems={
          promotion.mediaItems
        }
        accessibilityLabel={
          promotion.title
        }
        onMediaPress={
          handleMediaPress
        }
      />

      <View
        style={
          styles.content
        }
      >
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            {
              color:
                colors.text,
            },
          ]}
        >
          {
            promotion.title
          }
        </Text>

        {promotion.description ? (
          <Text
            style={[
              styles.description,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {
              promotion.description
            }
          </Text>
        ) : null}
      </View>

      <AdActions
        itemId={
          promotion.id
        }
        title={
          promotion.title
        }
        destinationUrl={
          defaultDestinationUrl
        }
        onReport={
          onReport
        }
        onHide={
          onHide
        }
      />

      <AdCallToAction
        label={
          promotion.callToAction
        }
        accessibilityLabel={`${promotion.callToAction}: ${promotion.title}`}
        onPress={() => {
          void handleOpen(
            defaultDestinationUrl
          );
        }}
      />
    </AdCardShell>
  );
}

const styles =
  StyleSheet.create({
    header: {
      paddingHorizontal:
        Spacing.screen,

      paddingBottom:
        Spacing.md,
    },

    sourceContainer: {
      marginTop:
        Spacing.md,
    },

    sourceName: {
      ...Typography.body,

      fontWeight:
        "800",
    },

    sourceDomain: {
      ...Typography.small,

      marginTop:
        Spacing.xs,
    },

    content: {
      paddingHorizontal:
        Spacing.screen,

      paddingTop:
        Spacing.lg,
    },

    title: {
      ...Typography.headline,

      fontWeight:
        "800",
    },

    description: {
      ...Typography.body,

      marginTop:
        Spacing.sm,
    },
  });
