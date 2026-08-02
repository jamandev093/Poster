import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  useFocusEffect,
  useScrollToTop,
} from "@react-navigation/native";

import {
  FeedItem,
} from "../../components/cards/feedCard.types";
import {
  FeedbackReason,
} from "../../components/cards/feedback/feedbackReasons";
import EmptyState from "../../components/common/EmptyState";
import MonetizedFeed from "../../components/feed/MonetizedFeed";

import useFeedback from "../../context/FeedbackContext";

import {
  getFeaturedInterestCategories,
  getSearchableInterestTopics,
} from "../../data/interests";
import { mockFeed } from "../../data/mockFeed";

import BookmarkService from "../../services/BookmarkService";
import FeedbackService from "../../services/FeedbackService";
import InteractionService from "../../services/InteractionService";
import InterestCatalogService, {
  InterestCatalogTopic,
} from "../../services/InterestCatalogService";
import ScreenRefreshService from "../../services/ScreenRefreshService";
import ShareService from "../../services/ShareService";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

import {
  Article,
} from "../../types/article";
import {
  FeedEntry,
} from "../../types/feedEntry";

import applyArticleInteractionState from "../../utils/applyArticleInteractionState";

interface TrendingTopicOption {
  id: string;

  label: string;

  matchingTerms: readonly string[];
}

const EVOLVING_TRENDING_TOPIC_LIMIT =
  6;

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function createUniqueValues(
  values: readonly string[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach((value) => {
    const cleanedValue =
      value
        .trim()
        .replace(/\s+/g, " ");

    if (!cleanedValue) {
      return;
    }

    const comparisonKey =
      cleanedValue.toLowerCase();

    if (
      seen.has(
        comparisonKey
      )
    ) {
      return;
    }

    seen.add(
      comparisonKey
    );

    result.push(
      cleanedValue
    );
  });

  return result;
}

function matchesTopic(
  article: FeedItem,
  topic:
    TrendingTopicOption
): boolean {
  if (topic.id === "all") {
    return true;
  }

  const searchableText =
    normalizeText(
      [
        article.title,
        article.category,
        article.publisher,
      ].join(" ")
    );

  return topic.matchingTerms.some(
    (term) => {
      const normalizedTerm =
        normalizeText(term);

      return (
        normalizedTerm.length >
          0 &&
        searchableText.includes(
          normalizedTerm
        )
      );
    }
  );
}

export default function TrendingScreen() {
  const { colors } = useTheme();

  const {
    showError,
    showInfo,
    showSuccess,
  } = useFeedback();

  const listRef =
    useRef<FlatList<FeedEntry>>(null);

  const refreshRequestRef =
    useRef(false);

  const loadMoreRequestRef =
    useRef(false);

  const completedInitialFocusRef =
    useRef(false);

  useScrollToTop(listRef);

  const [articles, setArticles] =
    useState<FeedItem[]>(mockFeed);

  const [
    evolvingTopics,
    setEvolvingTopics,
  ] = useState<
    InterestCatalogTopic[]
  >([]);

  const [
    selectedTopicId,
    setSelectedTopicId,
  ] = useState("all");

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const searchableTopics =
    useMemo(
      () =>
        getSearchableInterestTopics(),
      []
    );

  const featuredCategories =
    useMemo(
      () =>
        getFeaturedInterestCategories()
          .slice(0, 9),
      []
    );

  const canonicalTopicById =
    useMemo(() => {
      return new Map(
        searchableTopics.map(
          (topic) => [
            topic.id,
            topic,
          ]
        )
      );
    }, [searchableTopics]);

  const topEvolvingTopics =
    useMemo(() => {
      return [
        ...evolvingTopics,
      ]
        .sort(
          (
            first,
            second
          ) => {
            if (
              second.promotionScore !==
              first.promotionScore
            ) {
              return (
                second.promotionScore -
                first.promotionScore
              );
            }

            return first.name.localeCompare(
              second.name,
              undefined,
              {
                sensitivity:
                  "base",
              }
            );
          }
        )
        .slice(
          0,
          EVOLVING_TRENDING_TOPIC_LIMIT
        );
    }, [evolvingTopics]);

  const topicOptions =
    useMemo<
      TrendingTopicOption[]
    >(() => {
      const taxonomyOptions =
        featuredCategories.map(
          (category) => {
            const categoryTopics =
              searchableTopics.filter(
                (topic) =>
                  topic.categoryId ===
                  category.id
              );

            const evolvingCategoryTopics =
              topEvolvingTopics.filter(
                (topic) => {
                  if (
                    normalizeText(
                      topic.categoryName ??
                        ""
                    ) ===
                    normalizeText(
                      category.name
                    )
                  ) {
                    return true;
                  }

                  return topic.parentTopicIds.some(
                    (parentTopicId) =>
                      canonicalTopicById.get(
                        parentTopicId
                      )?.categoryId ===
                      category.id
                  );
                }
              );

            return {
              id:
                category.id,

              label:
                category.name,

              matchingTerms:
                createUniqueValues([
                  category.name,

                  ...categoryTopics.flatMap(
                    (topic) => [
                      topic.name,

                      ...(topic.aliases ??
                        []),

                      ...(topic.searchKeywords ??
                        []),
                    ]
                  ),

                  ...evolvingCategoryTopics.flatMap(
                    (topic) => [
                      topic.name,

                      ...topic.aliases,

                      ...topic.searchKeywords,
                    ]
                  ),
                ]),
            };
          }
        );

      const evolvingOptions =
        topEvolvingTopics.map(
          (topic) => {
            const parentTopics =
              topic.parentTopicIds.flatMap(
                (parentTopicId) => {
                  const parentTopic =
                    canonicalTopicById.get(
                      parentTopicId
                    );

                  return parentTopic
                    ? [parentTopic]
                    : [];
                }
              );

            return {
              id:
                topic.id,

              label:
                topic.name,

              matchingTerms:
                createUniqueValues([
                  topic.name,

                  ...topic.aliases,

                  ...topic.searchKeywords,

                  topic.categoryName ??
                    "",

                  topic.domainName ??
                    "",

                  ...parentTopics.flatMap(
                    (parentTopic) => [
                      parentTopic.name,

                      ...(parentTopic.aliases ??
                        []),

                      ...(parentTopic.searchKeywords ??
                        []),
                    ]
                  ),
                ]),
            };
          }
        );

      return [
        {
          id: "all",

          label: "All",

          matchingTerms: [],
        },

        ...taxonomyOptions,

        ...evolvingOptions,
      ];
    }, [
      canonicalTopicById,
      featuredCategories,
      searchableTopics,
      topEvolvingTopics,
    ]);

  const selectedTopic =
    useMemo(() => {
      return (
        topicOptions.find(
          (topic) =>
            topic.id ===
            selectedTopicId
        ) ??
        topicOptions[0]
      );
    }, [
      selectedTopicId,
      topicOptions,
    ]);

  useEffect(() => {
    const selectedStillExists =
      topicOptions.some(
        (topic) =>
          topic.id ===
          selectedTopicId
      );

    if (!selectedStillExists) {
      setSelectedTopicId(
        "all"
      );
    }
  }, [
    selectedTopicId,
    topicOptions,
  ]);

  const visibleArticles =
    useMemo(() => {
      if (!selectedTopic) {
        return articles;
      }

      return articles.filter(
        (article) =>
          matchesTopic(
            article,
            selectedTopic
          )
      );
    }, [
      articles,
      selectedTopic,
    ]);

  const monetizationTopic =
    useMemo(() => {
      if (
        !selectedTopic ||
        selectedTopic.id ===
          "all"
      ) {
        return undefined;
      }

      return selectedTopic.label;
    }, [selectedTopic]);


  const synchronizeTrendingTaxonomy =
    useCallback(async () => {
      try {
        const catalog =
          await InterestCatalogService
            .getCatalog();

        setEvolvingTopics(
          catalog.evolvingTopics
        );
      } catch {
        /*
         * Trending must remain usable
         * even if the local evolving
         * taxonomy registry cannot be
         * read. Canonical taxonomy
         * options remain available.
         */
        setEvolvingTopics([]);
      }
    }, []);

  const getInteractionState =
    useCallback(async () => {
      const [
        bookmarkedIds,
        interactionState,
      ] = await Promise.all([
        BookmarkService.getBookmarkedIds(),
        InteractionService.getState(),
      ]);

      return {
        bookmarkedIds,

        recommendedIds:
          interactionState.recommendedIds,

        helpfulIds:
          interactionState.helpfulIds,
      };
    }, []);

  const synchronizeInteractionState =
    useCallback(async () => {
      try {
        const interactionState =
          await getInteractionState();

        await synchronizeTrendingTaxonomy();

        setArticles(
          (currentArticles) =>
            applyArticleInteractionState(
              currentArticles,
              interactionState
            )
        );
      } catch {
        showError(
          "Interactions unavailable",
          "Poster could not synchronize your saved article activity."
        );
      }
    }, [
      getInteractionState,
      showError,
    ]);
  const loadInitial =
    useCallback(async () => {
      const loadingStartedAt =
        Date.now();

      const minimumLoadingDuration =
        1000;

      setInitialLoading(true);

      try {
        // TODO:
        // GET /trending

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        const interactionState =
          await getInteractionState();

        await synchronizeTrendingTaxonomy();

        setArticles(
          applyArticleInteractionState(
            mockFeed,
            interactionState
          )
        );

        ScreenRefreshService.markRefreshed(
          "trending"
        );
      } catch {
        showError(
          "Trending unavailable",
          "Poster could not prepare trending stories.",
          {
            label: "Retry",

            onPress: () => {
              void loadInitial();
            },
          }
        );
      } finally {
        const elapsedTime =
          Date.now() -
          loadingStartedAt;

        const remainingTime =
          Math.max(
            0,
            minimumLoadingDuration -
              elapsedTime
          );

        if (remainingTime > 0) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                remainingTime
              )
          );
        }

        setInitialLoading(false);
      }
    }, [
      getInteractionState,
      showError,
      synchronizeTrendingTaxonomy,
    ]);

  const refreshScreen =
    useCallback(async () => {
      if (
        refreshRequestRef.current
      ) {
        return;
      }

      refreshRequestRef.current =
        true;

      setRefreshing(true);

      try {
        // TODO:
        // GET /trending

        await new Promise((resolve) =>
          setTimeout(resolve, 800)
        );

        const interactionState =
          await getInteractionState();

        setArticles(
          applyArticleInteractionState(
            mockFeed,
            interactionState
          )
        );

        ScreenRefreshService.markRefreshed(
          "trending"
        );

        showSuccess(
          "Trending refreshed",
          "The latest popular stories are ready."
        );
      } catch {
        showError(
          "Refresh failed",
          "Poster could not update Trending.",
          {
            label: "Retry",

            onPress: () => {
              void refreshScreen();
            },
          }
        );
      } finally {
        refreshRequestRef.current =
          false;

        setRefreshing(false);
      }
    }, [
      getInteractionState,
      showError,
      showSuccess,
      synchronizeTrendingTaxonomy,
    ]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useFocusEffect(
    useCallback(() => {
      if (initialLoading) {
        return;
      }

      if (
        completedInitialFocusRef.current
      ) {
        void synchronizeInteractionState();

        void synchronizeTrendingTaxonomy();
      } else {
        completedInitialFocusRef.current =
          true;
      }
    }, [
      initialLoading,
      synchronizeInteractionState,
      synchronizeTrendingTaxonomy,
    ])
  );

  const handleLoadMore =
    useCallback(async () => {
      if (
        loadMoreRequestRef.current
      ) {
        return;
      }

      loadMoreRequestRef.current =
        true;

      const loadingStartedAt =
        Date.now();

      const minimumLoadingDuration =
        1000;

      setLoadingMore(true);

      try {
        // TODO:
        // GET /trending?cursor=...
        //
        // Mock data contains one page.
        // Do not append mockFeed again.

        await new Promise((resolve) =>
          setTimeout(resolve, 400)
        );
      } catch {
        showError(
          "More trends unavailable",
          "Poster could not load additional trending stories."
        );
      } finally {
        const elapsedTime =
          Date.now() -
          loadingStartedAt;

        const remainingTime =
          Math.max(
            0,
            minimumLoadingDuration -
              elapsedTime
          );

        if (remainingTime > 0) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                remainingTime
              )
          );
        }

        setLoadingMore(false);

        loadMoreRequestRef.current =
          false;
      }
    }, [showError]);

  const handleOpenArticle =
    useCallback(
      async (article: Article) => {
        try {
          const supported =
            await Linking.canOpenURL(
              article.originalUrl
            );

          if (!supported) {
            showError(
              "Link unavailable",
              "This publisher link cannot be opened on your device."
            );

            return;
          }

          await Linking.openURL(
            article.originalUrl
          );
        } catch {
          showError(
            "Unable to open article",
            "Poster could not open the original publisher."
          );
        }
      },
      [showError]
    );

  const handleBookmark =
    useCallback(
      async (article: Article) => {
        const currentArticle =
          articles.find(
            (item) =>
              item.id === article.id
          );

        const previousBookmarked =
          currentArticle?.bookmarked ??
          false;

        const optimisticBookmarked =
          !previousBookmarked;

        setArticles(
          (currentArticles) =>
            currentArticles.map(
              (currentArticle) =>
                currentArticle.id ===
                article.id
                  ? {
                      ...currentArticle,

                      bookmarked:
                        optimisticBookmarked,
                    }
                  : currentArticle
            )
        );

        try {
          const result =
            await BookmarkService.toggle(
              article
            );

          setArticles(
            (currentArticles) =>
              currentArticles.map(
                (currentArticle) =>
                  currentArticle.id ===
                  article.id
                    ? {
                        ...currentArticle,

                        bookmarked:
                          result.bookmarked,
                      }
                    : currentArticle
              )
          );

          showSuccess(
            result.bookmarked
              ? "Article saved"
              : "Article removed",
            result.bookmarked
              ? "This story was added to Bookmarked Articles."
              : "This story was removed from Bookmarked Articles."
          );
        } catch {
          setArticles(
            (currentArticles) =>
              currentArticles.map(
                (currentArticle) =>
                  currentArticle.id ===
                  article.id
                    ? {
                        ...currentArticle,

                        bookmarked:
                          previousBookmarked,
                      }
                    : currentArticle
              )
          );

          showError(
            "Bookmark not updated",
            "Poster could not save this change."
          );
        }
      },
      [
        articles,
        showError,
        showSuccess,
      ]
    );

  const handleShare =
    useCallback(
      async (article: Article) => {
        try {
          await ShareService.article(
            article.title,
            article.originalUrl
          );
        } catch {
          showError(
            "Unable to share",
            "Poster could not open the sharing options."
          );
        }
      },
      [showError]
    );


  const handleWorthReading =
    useCallback(
      async (article: Article) => {
        setArticles(
          (currentArticles) =>
            currentArticles.map(
              (currentArticle) =>
                currentArticle.id ===
                article.id
                  ? {
                      ...currentArticle,

                      recommended: true,
                    }
                  : currentArticle
            )
        );

        try {
          await InteractionService.worthReading(
            article.id
          );

          showInfo(
            "Recommendation recorded",
            "Poster will use this signal to improve Trending."
          );
        } catch {
          setArticles(
            (currentArticles) =>
              currentArticles.map(
                (currentArticle) =>
                  currentArticle.id ===
                    article.id
                    ? {
                        ...currentArticle,

                        recommended: false,
                      }
                    : currentArticle
              )
          );

          showError(
            "Feedback not saved",
            "Poster could not record your recommendation."
          );
        }
      },
      [
        showError,
        showInfo,
      ]
    );
  const handleHelpful =
    useCallback(
      async (article: Article) => {
        setArticles(
          (currentArticles) =>
            currentArticles.map(
              (currentArticle) =>
                currentArticle.id ===
                article.id
                  ? {
                      ...currentArticle,

                      helpful: true,
                    }
                  : currentArticle
            )
        );

        try {
          await InteractionService.helpful(
            article.id
          );

          showInfo(
            "Marked as helpful",
            "Thanks for helping Poster improve trending discovery."
          );
        } catch {
          setArticles(
            (currentArticles) =>
              currentArticles.map(
                (currentArticle) =>
                  currentArticle.id ===
                    article.id
                    ? {
                        ...currentArticle,

                        helpful: false,
                      }
                    : currentArticle
              )
          );

          showError(
            "Feedback not saved",
            "Poster could not record that this article was helpful."
          );
        }
      },
      [
        showError,
        showInfo,
      ]
    );
  const handleArticleFeedback =
    useCallback(
      async (
        article: Article,
        reason: FeedbackReason
      ) => {
        try {
          await FeedbackService.submit(
            article.id,
            reason.id
          );

          showSuccess(
            "Feedback received",
            "Poster will use your response to improve Trending."
          );
        } catch {
          showError(
            "Feedback not submitted",
            "Poster could not save your response."
          );
        }
      },
      [
        showError,
        showSuccess,
      ]
    );

  const articleActions =
    useMemo(
      () => ({
        onPress: (
          article: Article
        ) => {
          void handleOpenArticle(
            article
          );
        },

        onBookmark: (
          article: Article
        ) => {
          void handleBookmark(
            article
          );
        },

        onShare: (
          article: Article
        ) => {
          void handleShare(
            article
          );
        },

        onWorthReading: (
          article: Article
        ) => {
          void handleWorthReading(
            article
          );
        },

        onHelpful: (
          article: Article
        ) => {
          void handleHelpful(
            article
          );
        },

        onFeedback: (
          article: Article,
          reason: FeedbackReason
        ) => {
          void handleArticleFeedback(
            article,
            reason
          );
        },
      }),
      [
        handleArticleFeedback,
        handleBookmark,
        handleHelpful,
        handleOpenArticle,
        handleShare,
        handleWorthReading,
      ]
    );

  const renderHeader =
    useCallback(() => {
      const selectedLabel =
        selectedTopic?.label ??
        "All";

      return (
        <>
          <View style={styles.header}>
            <View
              style={
                styles.titleRow
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor:
                      colors.card,

                    borderColor:
                      colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="fire"
                  size={Icons.lg}
                  color={colors.primary}
                />
              </View>

              <View
                style={
                  styles.titleContent
                }
              >
                <Text
                  style={[
                    styles.title,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Trending
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Popular stories gaining attention now
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Trending Topics
          </Text>

          <ScrollView
            horizontal
            bounces={false}
            alwaysBounceHorizontal={
              false
            }
            overScrollMode="never"
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.chips
            }
          >
            {topicOptions.map(
              (topic) => {
                const selected =
                  selectedTopicId ===
                  topic.id;

                return (
                  <Pressable
                    key={topic.id}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                    }}
                    accessibilityLabel={`Show ${topic.label} trending stories`}
                    style={({
                      pressed,
                    }) => [
                      styles.topicChip,

                      {
                        backgroundColor:
                          selected
                            ? colors.primary
                            : colors.card,

                        borderColor:
                          selected
                            ? colors.primary
                            : colors.border,

                        opacity: pressed
                          ? 0.65
                          : 1,
                      },
                    ]}
                    onPress={() => {
                      setSelectedTopicId(
                        topic.id
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.topicText,

                        {
                          color: selected
                            ? colors.onPrimary
                            : colors.text,
                        },
                      ]}
                    >
                      {topic.label}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          <View
            style={
              styles.resultsHeader
            }
          >
            <Text
              style={[
                styles.resultsTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {selectedTopicId ===
              "all"
                ? "Trending Now"
                : `${selectedLabel} Trends`}
            </Text>

            <Text
              style={[
                styles.resultsSubtitle,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {visibleArticles.length}{" "}
              {visibleArticles.length === 1
                ? "story"
                : "stories"}{" "}
              currently gaining attention
            </Text>
          </View>
        </>
      );
    }, [
      colors.border,
      colors.card,
      colors.onPrimary,
      colors.primary,
      colors.text,
      colors.textSecondary,
      selectedTopic,
      selectedTopicId,
      topicOptions,
      visibleArticles.length,
    ]);

  const renderFooter =
    useCallback(() => {
      return (
        <View style={styles.footer}>
          <ActivityIndicator
            animating={loadingMore}
            size="small"
            color={colors.primary}
            style={{
              opacity:
                loadingMore
                  ? 1
                  : 0,
            }}
          />
        </View>
      );
    }, [
      colors.primary,
      loadingMore,
    ]);

  const renderEmpty =
    useCallback(() => {
      return (
        <EmptyState
          variant="trending"
          actionLabel="Show All Trends"
          onAction={() => {
            setSelectedTopicId(
              "all"
            );
          }}
        />
      );
    }, []);

  if (initialLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Finding trending stories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      <MonetizedFeed
        ref={listRef}
        placement="trending"
        topic={monetizationTopic}
        articles={visibleArticles}
        articleActions={
          articleActions
        }
        ListHeaderComponent={
          renderHeader
        }
        ListFooterComponent={
          renderFooter
        }
        ListEmptyComponent={
          renderEmpty
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              refreshScreen
            }
            tintColor={
              colors.primary
            }
            colors={[
              colors.primary,
            ]}
          />
        }
        onEndReached={
          handleLoadMore
        }
        onEndReachedThreshold={0.6}
        bounces={false}
        alwaysBounceVertical={
          false
        }
        overScrollMode="never"
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.content,

          visibleArticles.length === 0 &&
            styles.emptyContent,
        ]}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={8}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingBottom:
      Spacing.xxxl * 3,
  },

  emptyContent: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.lg,

    paddingBottom:
      Spacing.md,
  },

  titleRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  iconContainer: {
    width: 46,

    height: 46,

    alignItems: "center",

    justifyContent: "center",

    borderRadius:
      Radius.md,

    borderWidth:
      StyleSheet.hairlineWidth,

    marginRight:
      Spacing.md,
  },

  titleContent: {
    flex: 1,
  },

  title: {
    ...Typography.title,
  },

  subtitle: {
    ...Typography.body,

    marginTop:
      Spacing.xs,
  },

  sectionTitle: {
    ...Typography.headline,

    fontWeight: "800",

    paddingHorizontal:
      Spacing.screen,

    marginTop:
      Spacing.md,

    marginBottom:
      Spacing.md,
  },

  chips: {
    paddingHorizontal:
      Spacing.screen,

    paddingBottom:
      Spacing.lg,
  },

  topicChip: {
    minHeight: 40,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.lg,

    marginRight:
      Spacing.sm,

    borderRadius:
      Radius.round,

    borderWidth:
      StyleSheet.hairlineWidth,
  },

  topicText: {
    ...Typography.caption,

    fontWeight: "700",
  },

  resultsHeader: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.md,

    paddingBottom:
      Spacing.lg,
  },

  resultsTitle: {
    ...Typography.headline,

    fontWeight: "800",
  },

  resultsSubtitle: {
    ...Typography.small,

    marginTop:
      Spacing.xs,
  },

  footer: {
    height:
      Spacing.xxxl,

    alignItems: "center",

    justifyContent: "center",
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.xl,
  },

  loadingText: {
    ...Typography.body,

    textAlign: "center",

    marginTop:
      Spacing.lg,
  },
});