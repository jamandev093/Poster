import React, {
  ForwardedRef,
  ReactElement,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  ViewToken,
} from "react-native";

import {
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native";

import {
  MonetizationPlacement,
} from "../ads";

import {
  FeedbackReason,
} from "../cards/feedback/feedbackReasons";

import FeedEntryRenderer from "./FeedEntryRenderer";
import MonetizationFeedbackController from "./MonetizationFeedbackController";

import useFeedback from "../../context/FeedbackContext";

import AdvertisingPreferenceService from "../../services/AdvertisingPreferenceService";
import MobileAdInteractionService from "../../services/MobileAdInteractionService";

import MonetizationAnalyticsService from "../../services/MonetizationAnalyticsService";
import MonetizationService from "../../services/MonetizationService";

import {
  Article,
} from "../../types/article";

import {
  FeedEntry,
} from "../../types/feedEntry";

import buildFeedEntries from "../../utils/buildFeedEntries";

interface ArticleActions {
  onPress: (
    article: Article
  ) => void;

  onBookmark: (
    article: Article
  ) => void;

  onShare: (
    article: Article
  ) => void;

  onWorthReading: (
    article: Article
  ) => void;

  onHelpful: (
    article: Article
  ) => void;

  onFeedback: (
    article: Article,
    reason: FeedbackReason
  ) => void;
}

interface MonetizationActions {
  onPromotionPress?: (
    promotionId: string
  ) => void;

  onSponsoredPress?: (
    campaignId: string
  ) => void;
}

interface MonetizedFeedProps
  extends Omit<
    FlatListProps<FeedEntry>,
    | "data"
    | "renderItem"
    | "keyExtractor"
    | "onViewableItemsChanged"
    | "viewabilityConfig"
  > {
  articles: Article[];

  placement:
    MonetizationPlacement;

  query?: string;

  topic?: string;

  articleActions:
    ArticleActions;

  monetizationActions?:
    MonetizationActions;
}

function recordEntryImpression(
  entry: FeedEntry
): void {
  void MobileAdInteractionService.recordImpression(
    entry
  );

  switch (entry.type) {
    case "poster_promotion":
      void MonetizationAnalyticsService.recordImpression(
        {
          itemId:
            entry.promotion.id,

          monetizationType:
            entry.promotion.type,

          placement:
            entry.promotion
              .placement,
        }
      );

      break;

    case "poster_affiliate":
      void MonetizationAnalyticsService.recordImpression(
        {
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
        }
      );

      break;

    case "direct_sponsorship":
      void MonetizationAnalyticsService.recordImpression(
        {
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
        }
      );

      break;

    case "google_native_ad":
      // Google impression events will
      // be managed by the Google SDK.
      break;

    case "article":
      break;

    default:
      break;
  }
}

function haveSameIds(
  first: readonly string[],
  second: readonly string[]
): boolean {
  if (
    first.length !==
    second.length
  ) {
    return false;
  }

  const secondIds =
    new Set(second);

  return first.every(
    (id) =>
      secondIds.has(id)
  );
}

function MonetizedFeedComponent(
  {
    articles,
    placement,
    query,
    topic,
    articleActions,
    monetizationActions,
    ...flatListProps
  }: MonetizedFeedProps,
  ref:
    ForwardedRef<
      FlatList<FeedEntry>
    >
): ReactElement {
  const { showError } =
    useFeedback();

  const isScreenFocused =
    useIsFocused();

  const hideRequestIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  const [
    hiddenItemIds,
    setHiddenItemIds,
  ] = useState<string[] | null>(
    null
  );

  const [
    taxonomyContextVersion,
    setTaxonomyContextVersion,
  ] = useState(0);

  /**
   * Exact FeedEntry IDs currently meeting the feed-level
   * viewability threshold.
   *
   * Sponsored video playback consumes this separately from
   * impression deduplication.
   */
  const [
    visibleEntryIds,
    setVisibleEntryIds,
  ] =
    useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const normalizedTopic =
      topic?.trim();

    if (!normalizedTopic) {
      return () => {
        active = false;
      };
    }

    void MonetizationService
      .warmTaxonomyContext(
        normalizedTopic
      )
      .then(() => {
        if (active) {
          /*
           * composeFeed() is synchronous.
           * Trigger one recomposition after
           * the async living-taxonomy cache
           * has been warmed.
           */
          setTaxonomyContextVersion(
            (currentVersion) =>
              currentVersion + 1
          );
        }
      });

    return () => {
      active = false;
    };
  }, [topic]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void AdvertisingPreferenceService
        .getHiddenItemIds()
        .then((itemIds) => {
          if (active) {
            setHiddenItemIds(
              itemIds
            );
          }
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const handleHideMonetizationItem =
    useCallback(
      async (
        itemId: string
      ) => {
        const normalizedItemId =
          itemId.trim();

        if (
          !normalizedItemId ||
          hideRequestIdsRef.current.has(
            normalizedItemId
          )
        ) {
          return;
        }

        hideRequestIdsRef.current.add(
          normalizedItemId
        );

        setHiddenItemIds(
          (currentItemIds) => {
            if (
              currentItemIds === null ||
              currentItemIds.includes(
                normalizedItemId
              )
            ) {
              return currentItemIds;
            }

            return [
              ...currentItemIds,
              normalizedItemId,
            ];
          }
        );

        try {
          await AdvertisingPreferenceService.hideItem(
            normalizedItemId
          );

          void MobileAdInteractionService.recordHideForItem({
            itemId:
              normalizedItemId,

            placement,
          });
        } catch {
          setHiddenItemIds(
            (currentItemIds) => {
              if (
                currentItemIds === null
              ) {
                return currentItemIds;
              }

              return currentItemIds.filter(
                (currentItemId) =>
                  currentItemId !==
                  normalizedItemId
              );
            }
          );

          showError(
            "Unable to hide item",
            "This commercial item could not be hidden. Please try again."
          );
        } finally {
          hideRequestIdsRef.current.delete(
            normalizedItemId
          );
        }
      },
      [placement, showError]
    );

  const entries =
    useMemo(() => {
      if (hiddenItemIds === null) {
        return buildFeedEntries({
          articles,
          placement,

          maximumMonetizedItems:
            0,
        });
      }

      return MonetizationService.composeFeed({
        articles,
        placement,
        query,
        topic,
        hiddenItemIds,
      });
    }, [
      articles,
      placement,
      query,
      topic,
      hiddenItemIds,
      taxonomyContextVersion,
    ]);

  /**
   * Preserve the existing monetization impression rule:
   *
   * - at least 60% visible;
   * - continuously visible for at least 1 second.
   *
   * The same resolved visibility is also used to determine
   * whether an advertising video is allowed to play.
   */
  const viewabilityConfig =
    useRef({
      itemVisiblePercentThreshold:
        60,

      minimumViewTime:
        1000,
    }).current;

  const recordedImpressionIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  const handleViewableItemsChanged =
    useRef(
      ({
        viewableItems,
        changed,
      }: {
        viewableItems:
          ViewToken<FeedEntry>[];

        changed:
          ViewToken<FeedEntry>[];
      }) => {
        const nextVisibleEntryIds =
          viewableItems
            .filter(
              (viewToken) =>
                Boolean(
                  viewToken.isViewable &&
                    viewToken.item
                )
            )
            .map(
              (viewToken) =>
                viewToken.item.id
            );

        setVisibleEntryIds(
          (
            currentVisibleEntryIds
          ) => {
            if (
              haveSameIds(
                currentVisibleEntryIds,
                nextVisibleEntryIds
              )
            ) {
              return currentVisibleEntryIds;
            }

            return nextVisibleEntryIds;
          }
        );

        changed.forEach(
          (viewToken) => {
            if (
              !viewToken.isViewable ||
              !viewToken.item
            ) {
              return;
            }

            const impressionId =
              viewToken.item.id;

            if (
              recordedImpressionIdsRef
                .current
                .has(impressionId)
            ) {
              return;
            }

            recordedImpressionIdsRef
              .current
              .add(impressionId);

            recordEntryImpression(
              viewToken.item
            );
          }
        );
      }
    ).current;

  const visibleEntryIdSet =
    useMemo(
      () =>
        new Set(
          visibleEntryIds
        ),
      [
        visibleEntryIds,
      ]
    );

  return (
    <MonetizationFeedbackController>
      {(openReport) => {
        const renderItem:
          ListRenderItem<FeedEntry> =
          ({ item }) => {
            const openPromotionReport =
              () => {
                if (
                  item.type !==
                    "poster_promotion" &&
                  item.type !==
                    "poster_affiliate"
                ) {
                  return;
                }

                const promotion =
                  item.promotion;

                openReport({
                  itemId:
                    promotion.id,

                  title:
                    "Tell us about this promotion",

                  onSubmit: (
                    reason
                  ) => {
                    void MonetizationAnalyticsService.recordReport(
                      {
                        itemId:
                          promotion.id,

                        monetizationType:
                          promotion.type,

                        placement:
                          promotion.placement,

                        advertiserName:
                          promotion.type ===
                          "poster_affiliate"
                            ? promotion.partnerName
                            : undefined,

                        reportReason:
                          reason.id,
                      }
                    );
                  },
                });
              };

            const openSponsoredReport =
              () => {
                if (
                  item.type !==
                  "direct_sponsorship"
                ) {
                  return;
                }

                const campaign =
                  item.campaign;

                openReport({
                  itemId:
                    campaign.id,

                  title:
                    "Tell us about this sponsored content",

                  onSubmit: (
                    reason
                  ) => {
                    void MonetizationAnalyticsService.recordReport(
                      {
                        itemId:
                          campaign.id,

                        monetizationType:
                          campaign.type,

                        placement:
                          campaign.placement,

                        campaignId:
                          campaign.campaignId,

                        advertiserName:
                          campaign.advertiserName,

                        reportReason:
                          reason.id,
                      }
                    );
                  },
                });
              };

            return (
              <FeedEntryRenderer
                entry={
                  item
                }

                /**
                 * Video playback is allowed only when:
                 *
                 * - this exact FeedEntry meets the list's
                 *   viewability threshold; and
                 * - this navigation screen/tab is focused.
                 *
                 * AdMedia additionally checks active media-card
                 * visibility and foreground AppState.
                 */
                isFeedVisible={
                  isScreenFocused &&
                  visibleEntryIdSet.has(
                    item.id
                  )
                }

                onArticlePress={
                  articleActions.onPress
                }
                onArticleBookmark={
                  articleActions.onBookmark
                }
                onArticleShare={
                  articleActions.onShare
                }
                onArticleWorthReading={
                  articleActions.onWorthReading
                }
                onArticleHelpful={
                  articleActions.onHelpful
                }
                onArticleFeedback={
                  articleActions.onFeedback
                }
                onPromotionPress={
                  monetizationActions
                    ?.onPromotionPress
                }
                onPromotionReport={
                  openPromotionReport
                }
                onSponsoredPress={
                  monetizationActions
                    ?.onSponsoredPress
                }
                onSponsoredReport={
                  openSponsoredReport
                }
                onMonetizationHide={
                  handleHideMonetizationItem
                }
              />
            );
          };

        return (
          <FlatList
            {...flatListProps}
            ref={
              ref
            }
            data={
              entries
            }
            keyExtractor={(
              item
            ) =>
              item.id
            }
            renderItem={
              renderItem
            }
            extraData={
              visibleEntryIds
            }
            viewabilityConfig={
              viewabilityConfig
            }
            onViewableItemsChanged={
              handleViewableItemsChanged
            }
          />
        );
      }}
    </MonetizationFeedbackController>
  );
}

const MonetizedFeed =
  forwardRef<
    FlatList<FeedEntry>,
    MonetizedFeedProps
  >(
    MonetizedFeedComponent
  );

MonetizedFeed.displayName =
  "MonetizedFeed";

export default MonetizedFeed;
