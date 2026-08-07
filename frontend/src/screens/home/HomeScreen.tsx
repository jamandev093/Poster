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
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

import BookmarkService from "../../services/BookmarkService";
import FeedbackService from "../../services/FeedbackService";
import InteractionService from "../../services/InteractionService";
import MobileDiscoveryService, {
  MobileDiscoveryFeedResponse,
  MobileDiscoveryRefreshMode,
} from "../../services/MobileDiscoveryService";
import RecommendationRankingService from "../../services/RecommendationRankingService";
import ScreenRefreshService from "../../services/ScreenRefreshService";
import ShareService from "../../services/ShareService";

import {
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

const HOME_FEED_PAGE_SIZE =
  20;

const MINIMUM_INITIAL_LOADING_DURATION_MS =
  1000;

const MINIMUM_LOAD_MORE_DURATION_MS =
  1000;

const MINIMUM_REFRESH_AFTER_SECONDS =
  30;

interface ArticleInteractionState {
  bookmarkedIds:
    readonly string[];

  recommendedIds:
    readonly string[];

  helpfulIds:
    readonly string[];
}

interface RefreshOptions {
  silent?: boolean;
}

function mergeFeedItems(
  currentItems:
    readonly FeedItem[],
  incomingItems:
    readonly FeedItem[]
): FeedItem[] {
  const byId =
    new Map<
      string,
      FeedItem
    >();

  currentItems.forEach(
    (item) => {
      byId.set(
        item.id,
        item
      );
    }
  );

  incomingItems.forEach(
    (item) => {
      byId.set(
        item.id,
        item
      );
    }
  );

  return Array.from(
    byId.values()
  );
}

function normalizeRefreshAfterSeconds(
  value: number
): number {
  if (
    !Number.isFinite(value) ||
    value < MINIMUM_REFRESH_AFTER_SECONDS
  ) {
    return MINIMUM_REFRESH_AFTER_SECONDS;
  }

  return Math.trunc(
    value
  );
}

function delay(
  milliseconds: number
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();

  const {
    showError,
    showInfo,
    showSuccess,
  } = useFeedback();

  const listRef =
    useRef<FlatList<FeedEntry>>(null);

  useScrollToTop(listRef);

  const [articles, setArticles] =
    useState<FeedItem[]>([]);

  const articlesRef =
    useRef<FeedItem[]>([]);

  const nextCursorRef =
    useRef<string | null>(
      null
    );

  const refreshAfterSecondsRef =
    useRef(
      90
    );

  const hasMoreRef =
    useRef(
      false
    );

  const refreshingRef =
    useRef(
      false
    );

  const loadingMoreRef =
    useRef(
      false
    );

  const initialLoadingRef =
    useRef(
      true
    );

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(false);

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const greeting = useMemo(() => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    }

    if (hour < 17) {
      return "Good Afternoon";
    }

    if (hour < 21) {
      return "Good Evening";
    }

    return "Welcome Back";
  }, []);

  const today = useMemo(() => {
    return new Date().toLocaleDateString(
      undefined,
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    );
  }, []);

  useEffect(() => {
    articlesRef.current =
      articles;
  }, [articles]);

  useEffect(() => {
    initialLoadingRef.current =
      initialLoading;
  }, [initialLoading]);

  const getInteractionState =
    useCallback(async (): Promise<ArticleInteractionState> => {
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

  const buildPersonalizedArticles =
    useCallback(
      async (
        sourceArticles:
          FeedItem[],
        interactionState:
          ArticleInteractionState
      ): Promise<FeedItem[]> => {
        const synchronizedArticles =
          applyArticleInteractionState(
            sourceArticles,
            interactionState
          );

        try {
          return await RecommendationRankingService
            .buildRankedFeed(
              synchronizedArticles,
              {
                recommendedIds:
                  interactionState
                    .recommendedIds,

                helpfulIds:
                  interactionState
                    .helpfulIds,
              }
            );
        } catch {
          /*
           * Personalization must degrade
           * safely. A taxonomy/ranking
           * failure must never prevent
           * Home from showing stories.
           */
          return synchronizedArticles;
        }
      },
      []
    );

  const applyDiscoveryResponse =
    useCallback(
      async (
        response:
          MobileDiscoveryFeedResponse,
        refreshMode:
          MobileDiscoveryRefreshMode
      ) => {
        const interactionState =
          await getInteractionState();

        const discoveryArticles =
          MobileDiscoveryService
            .mapToArticles(
              response,
              interactionState
            );

        const nextSourceArticles =
          refreshMode === "older"
            ? mergeFeedItems(
                articlesRef.current,
                discoveryArticles
              )
            : discoveryArticles;

        const personalizedArticles =
          await buildPersonalizedArticles(
            nextSourceArticles,
            interactionState
          );

        setArticles(
          personalizedArticles
        );

        nextCursorRef.current =
          response.pagination.nextCursor;

        hasMoreRef.current =
          response.pagination.hasMore;

        setHasMore(
          response.pagination.hasMore
        );

        refreshAfterSecondsRef.current =
          normalizeRefreshAfterSeconds(
            response.pagination.refreshAfterSeconds
          );

        ScreenRefreshService.markRefreshed(
          "home"
        );
      },
      [
        buildPersonalizedArticles,
        getInteractionState,
      ]
    );

  const loadHomeFeed =
    useCallback(
      async (
        input: {
          refreshMode:
            MobileDiscoveryRefreshMode;

          cursor?:
            | string
            | null;
        }
      ) => {
        const response =
          await MobileDiscoveryService
            .getHomeFeed({
              limit:
                HOME_FEED_PAGE_SIZE,

              cursor:
                input.cursor ??
                null,

              refreshMode:
                input.refreshMode,
            });

        await applyDiscoveryResponse(
          response,
          input.refreshMode
        );
      },
      [
        applyDiscoveryResponse,
      ]
    );

  const synchronizeInteractionState =
    useCallback(async () => {
      try {
        const interactionState =
          await getInteractionState();

        const personalizedArticles =
          await buildPersonalizedArticles(
            articlesRef.current,
            interactionState
          );

        setArticles(
          personalizedArticles
        );
      } catch {
        showError(
          "Interactions unavailable",
          "Poster could not synchronize your saved article activity."
        );
      }
    }, [
      buildPersonalizedArticles,
      getInteractionState,
      showError,
    ]);

  const refreshScreen =
    useCallback(
      async (
        options:
          RefreshOptions =
          {}
      ) => {
        if (
          refreshingRef.current
        ) {
          return;
        }

        refreshingRef.current =
          true;

        setRefreshing(true);

        try {
          await loadHomeFeed({
            refreshMode:
              "refresh",
          });

          if (!options.silent) {
            showSuccess(
              "Feed refreshed",
              "Your latest stories are ready."
            );
          }
        } catch {
          if (!options.silent) {
            showError(
              "Refresh failed",
              "Poster could not update your Home feed.",
              {
                label: "Retry",

                onPress: () => {
                  void refreshScreen();
                },
              }
            );
          }
        } finally {
          refreshingRef.current =
            false;

          setRefreshing(false);
        }
      },
      [
        loadHomeFeed,
        showError,
        showSuccess,
      ]
    );

  const loadInitial =
    useCallback(async () => {
      const loadingStartedAt =
        Date.now();

      setInitialLoading(true);
      initialLoadingRef.current =
        true;

      try {
        await loadHomeFeed({
          refreshMode:
            "initial",
        });
      } catch {
        showError(
          "Home feed unavailable",
          "Poster could not prepare your stories.",
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
            MINIMUM_INITIAL_LOADING_DURATION_MS -
              elapsedTime
          );

        if (remainingTime > 0) {
          await delay(
            remainingTime
          );
        }

        initialLoadingRef.current =
          false;

        setInitialLoading(false);
      }
    }, [
      loadHomeFeed,
      showError,
    ]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    let active =
      true;

    let timeoutId:
      | ReturnType<typeof setTimeout>
      | null =
      null;

    const scheduleRefresh = () => {
      const delayMs =
        refreshAfterSecondsRef.current *
        1000;

      timeoutId =
        setTimeout(
          () => {
            if (!active) {
              return;
            }

            const canRefresh =
              !initialLoadingRef.current &&
              !refreshingRef.current &&
              !loadingMoreRef.current;

            const refreshOperation =
              canRefresh
                ? refreshScreen({
                    silent:
                      true,
                  })
                : Promise.resolve();

            void refreshOperation.finally(
              () => {
                if (active) {
                  scheduleRefresh();
                }
              }
            );
          },
          delayMs
        );
    };

    scheduleRefresh();

    return () => {
      active =
        false;

      if (timeoutId) {
        clearTimeout(
          timeoutId
        );
      }
    };
  }, [refreshScreen]);

  useFocusEffect(
    useCallback(() => {
      void synchronizeInteractionState();
    }, [synchronizeInteractionState])
  );

  const handleLoadMore =
    useCallback(async () => {
      if (
        loadingMoreRef.current ||
        !hasMoreRef.current ||
        !nextCursorRef.current
      ) {
        return;
      }

      const loadingStartedAt =
        Date.now();

      loadingMoreRef.current =
        true;

      setLoadingMore(true);

      try {
        await loadHomeFeed({
          refreshMode:
            "older",

          cursor:
            nextCursorRef.current,
        });
      } catch {
        showError(
          "More stories unavailable",
          "Poster could not load additional stories."
        );
      } finally {
        const elapsedTime =
          Date.now() -
          loadingStartedAt;

        const remainingTime =
          Math.max(
            0,
            MINIMUM_LOAD_MORE_DURATION_MS -
              elapsedTime
          );

        if (remainingTime > 0) {
          await delay(
            remainingTime
          );
        }

        loadingMoreRef.current =
          false;

        setLoadingMore(false);
      }
    }, [
      loadHomeFeed,
      showError,
    ]);

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
              (item) =>
                item.id === article.id
                  ? {
                      ...item,

                      bookmarked:
                        optimisticBookmarked,
                    }
                  : item
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
                (item) =>
                  item.id === article.id
                    ? {
                        ...item,

                        bookmarked:
                          result.bookmarked,
                      }
                    : item
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
                (item) =>
                  item.id === article.id
                    ? {
                        ...item,

                        bookmarked:
                          previousBookmarked,
                      }
                    : item
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
              (item) =>
                item.id === article.id
                  ? {
                      ...item,

                      recommended: true,
                    }
                  : item
            )
        );

        try {
          await InteractionService.worthReading(
            article.id
          );

          showInfo(
            "Recommendation recorded",
            "Poster will use this signal to improve your feed."
          );
        } catch {
          setArticles(
            (currentArticles) =>
              currentArticles.map(
                (item) =>
                  item.id === article.id
                    ? {
                        ...item,

                        recommended: false,
                      }
                    : item
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
              (item) =>
                item.id === article.id
                  ? {
                      ...item,

                      helpful: true,
                    }
                  : item
            )
        );

        try {
          await InteractionService.helpful(
            article.id
          );

          showInfo(
            "Marked as helpful",
            "Thanks for helping Poster improve recommendations."
          );
        } catch {
          setArticles(
            (currentArticles) =>
              currentArticles.map(
                (item) =>
                  item.id === article.id
                    ? {
                        ...item,

                        helpful: false,
                      }
                    : item
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
            "Poster will use your response to improve this feed."
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
      return (
        <View
          style={[
            styles.header,
            {
              backgroundColor:
                colors.background,
            },
          ]}
        >
          <Text
            style={[
              styles.greeting,
              {
                color: colors.text,
              },
            ]}
          >
            {greeting}
          </Text>

          <Text
            style={[
              styles.date,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {today}
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Latest Stories
          </Text>
        </View>
      );
    }, [
      colors.background,
      colors.text,
      colors.textSecondary,
      greeting,
      today,
    ]);

  const renderFooter =
    useCallback(() => {
      return (
        <View style={styles.footer}>
          <ActivityIndicator
            animating={
              loadingMore &&
              hasMore
            }
            size="small"
            color={colors.primary}
            style={{
              opacity:
                loadingMore &&
                hasMore
                  ? 1
                  : 0,
            }}
          />
        </View>
      );
    }, [
      colors.primary,
      hasMore,
      loadingMore,
    ]);

  const renderEmpty =
    useCallback(() => {
      return (
        <EmptyState
          variant="content"
          actionLabel="Refresh"
          onAction={() => {
            void refreshScreen();
          }}
        />
      );
    }, [refreshScreen]);

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
            Loading today&apos;s stories...
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
        placement="home"
        articles={articles}
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
            onRefresh={() => {
              void refreshScreen();
            }}
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
        showsVerticalScrollIndicator={
          false
        }
        bounces={false}
        alwaysBounceVertical={
          false
        }
        overScrollMode="never"
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={8}
        contentContainerStyle={
          styles.content
        }
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

  header: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.lg,

    paddingBottom:
      Spacing.md,
  },

  greeting: {
    ...Typography.title,
  },

  date: {
    ...Typography.caption,

    marginTop:
      Spacing.xs,
  },

  sectionTitle: {
    ...Typography.headline,

    fontWeight: "800",

    marginTop:
      Spacing.xxl,

    marginBottom:
      Spacing.md,
  },

  footer: {
    height:
      Spacing.xxxl,

    alignItems: "center",

    justifyContent: "center",
  },

  loadingContainer: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

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
