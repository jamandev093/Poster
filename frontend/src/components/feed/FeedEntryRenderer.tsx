import React, {
  useCallback,
} from "react";

import {
  Linking,
} from "react-native";

import {
  DirectSponsoredCard,
  GoogleNativeAdCard,
  PosterPromotionCard,
} from "../ads";

import FeedCard from "../cards/FeedCard";

import {
  FeedbackReason,
} from "../cards/feedback/feedbackReasons";

import useFeedback from "../../context/FeedbackContext";

import MobileAdInteractionService from "../../services/MobileAdInteractionService";
import MonetizationAnalyticsService from "../../services/MonetizationAnalyticsService";

import {
  Article,
} from "../../types/article";

import {
  FeedEntry,
} from "../../types/feedEntry";

interface FeedEntryRendererProps {
  entry:
    FeedEntry;

  /**
   * True only while this exact feed entry satisfies
   * MonetizedFeed's visibility requirements and its
   * navigation screen/tab is focused.
   *
   * Used by every Poster-controlled video format:
   *
   * - Poster Promotion
   * - Affiliate
   * - Direct Sponsorship
   *
   * Organic article cards ignore this value.
   */
  isFeedVisible?:
    boolean;

  onArticlePress: (
    article: Article
  ) => void;

  onArticleBookmark: (
    article: Article
  ) => void;

  onArticleShare: (
    article: Article
  ) => void;

  onArticleWorthReading: (
    article: Article
  ) => void;

  onArticleHelpful: (
    article: Article
  ) => void;

  onArticleFeedback: (
    article: Article,
    reason: FeedbackReason
  ) => void;

  onPromotionPress?: (
    promotionId: string
  ) => void;

  onPromotionReport?: (
    promotionId: string
  ) => void;

  onSponsoredPress?: (
    campaignId: string
  ) => void;

  onSponsoredReport?: (
    campaignId: string
  ) => void;

  onMonetizationHide?: (
    itemId: string
  ) => void | Promise<void>;
}

function isSupportedWebUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(
        value.trim()
      );

    return (
      url.protocol ===
        "https:" ||
      url.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

export default function FeedEntryRenderer({
  entry,
  isFeedVisible = true,
  onArticlePress,
  onArticleBookmark,
  onArticleShare,
  onArticleWorthReading,
  onArticleHelpful,
  onArticleFeedback,
  onPromotionPress,
  onPromotionReport,
  onSponsoredPress,
  onSponsoredReport,
  onMonetizationHide,
}: FeedEntryRendererProps) {
  const {
    showError,
  } =
    useFeedback();

  const openExternalUrl =
    useCallback(
      async (
        destinationUrl:
          string
      ): Promise<boolean> => {
        const normalizedUrl =
          destinationUrl.trim();

        if (
          !isSupportedWebUrl(
            normalizedUrl
          )
        ) {
          showError(
            "Link unavailable",
            "This destination link is invalid or unavailable."
          );

          return false;
        }

        try {
          const supported =
            await Linking.canOpenURL(
              normalizedUrl
            );

          if (!supported) {
            showError(
              "Link unavailable",
              "This destination cannot be opened on your device."
            );

            return false;
          }

          await Linking.openURL(
            normalizedUrl
          );

          return true;
        } catch {
          showError(
            "Unable to open link",
            "Poster could not open this external destination."
          );

          return false;
        }
      },
      [
        showError,
      ]
    );

  switch (
    entry.type
  ) {
    case "article":
      return (
        <FeedCard
          article={
            entry.article
          }
          onPress={() => {
            onArticlePress(
              entry.article
            );
          }}
          onBookmark={() => {
            onArticleBookmark(
              entry.article
            );
          }}
          onShare={() => {
            onArticleShare(
              entry.article
            );
          }}
          onWorthReading={() => {
            onArticleWorthReading(
              entry.article
            );
          }}
          onHelpful={() => {
            onArticleHelpful(
              entry.article
            );
          }}
          onFeedback={(
            reason:
              FeedbackReason
          ) => {
            onArticleFeedback(
              entry.article,
              reason
            );
          }}
        />
      );

    case "poster_promotion": {
      const handlePress =
        async (
          destinationUrl:
            string
        ) => {
          const opened =
            await openExternalUrl(
              destinationUrl
            );

          if (!opened) {
            return;
          }

          onPromotionPress?.(
            entry.promotion.id
          );


          void MobileAdInteractionService.recordClick(
            entry
          );
void MonetizationAnalyticsService
            .recordClick({
              itemId:
                entry.promotion.id,

              monetizationType:
                entry.promotion.type,

              placement:
                entry.promotion
                  .placement,
            })
            .catch(() => {
              // Analytics failure must never
              // affect user navigation.
            });
        };

      const handleReport =
        () => {
          onPromotionReport?.(
            entry.promotion.id
          );
        };

      return (
        <PosterPromotionCard
          promotion={
            entry.promotion
          }

          /*
           * Poster Promotion can use:
           *
           * - standard image
           * - standard video
           * - sliding creative
           *
           * Video playback therefore uses the same
           * feed-visibility control as every other
           * Poster-controlled commercial type.
           */
          isFeedVisible={
            isFeedVisible
          }

          onPress={(
            destinationUrl
          ) => {
            void handlePress(
              destinationUrl
            );
          }}
          onReport={
            handleReport
          }
          onHide={
            onMonetizationHide
          }
        />
      );
    }

    case "poster_affiliate": {
      const handlePress =
        async (
          destinationUrl:
            string
        ) => {
          const opened =
            await openExternalUrl(
              destinationUrl
            );

          if (!opened) {
            return;
          }

          onPromotionPress?.(
            entry.promotion.id
          );


          void MobileAdInteractionService.recordClick(
            entry
          );
void MonetizationAnalyticsService
            .recordClick({
              itemId:
                entry.promotion.id,

              monetizationType:
                entry.promotion.type,

              placement:
                entry.promotion
                  .placement,

              advertiserName:
                entry.promotion
                  .partnerName,
            })
            .catch(() => {
              // Analytics failure must never
              // affect user navigation.
            });
        };

      const handleReport =
        () => {
          onPromotionReport?.(
            entry.promotion.id
          );
        };

      return (
        <PosterPromotionCard
          promotion={
            entry.promotion
          }

          /*
           * Affiliate can use exactly the same
           * creative-format capability as:
           *
           * - Poster Promotion
           * - Direct Sponsorship
           */
          isFeedVisible={
            isFeedVisible
          }

          onPress={(
            destinationUrl
          ) => {
            void handlePress(
              destinationUrl
            );
          }}
          onReport={
            handleReport
          }
          onHide={
            onMonetizationHide
          }
        />
      );
    }

    case "direct_sponsorship": {
      const handlePress =
        async (
          destinationUrl:
            string
        ) => {
          const opened =
            await openExternalUrl(
              destinationUrl
            );

          if (!opened) {
            return;
          }

          onSponsoredPress?.(
            entry.campaign
              .campaignId
          );


          void MobileAdInteractionService.recordClick(
            entry
          );
void MonetizationAnalyticsService
            .recordClick({
              itemId:
                entry.campaign.id,

              monetizationType:
                entry.campaign.type,

              placement:
                entry.campaign
                  .placement,

              campaignId:
                entry.campaign
                  .campaignId,

              advertiserName:
                entry.campaign
                  .advertiserName,
            })
            .catch(() => {
              // Analytics failure must never
              // affect user navigation.
            });
        };

      const handleReport =
        () => {
          onSponsoredReport?.(
            entry.campaign
              .campaignId
          );
        };

      return (
        <DirectSponsoredCard
          campaign={
            entry.campaign
          }

          isFeedVisible={
            isFeedVisible
          }

          onPress={(
            destinationUrl
          ) => {
            void handlePress(
              destinationUrl
            );
          }}
          onReport={
            handleReport
          }
          onHide={
            onMonetizationHide
          }
        />
      );
    }

    case "google_native_ad":
      return (
        <GoogleNativeAdCard
          ad={
            entry.ad
          }
        />
      );

    default: {
      const exhaustiveEntry:
        never =
        entry;

      return exhaustiveEntry;
    }
  }
}
