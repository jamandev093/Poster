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

import { mockFeed } from "../../data/mockFeed";

import BookmarkService from "../../services/BookmarkService";
import FeedbackService from "../../services/FeedbackService";
import InteractionService from "../../services/InteractionService";
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
    useState<FeedItem[]>(mockFeed);

  const articlesRef =
    useRef<FeedItem[]>(mockFeed);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
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

  const buildPersonalizedArticles =
    useCallback(
      async (
        sourceArticles:
          FeedItem[],
        interactionState: {
          bookmarkedIds:
            readonly string[];

          recommendedIds:
            readonly string[];

          helpfulIds:
            readonly string[];
        }
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
    useCallback(async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);

      try {
        // TODO:
        // GET /home

        await new Promise((resolve) =>
          setTimeout(resolve, 800)
        );

        const interactionState =
          await getInteractionState();

        const personalizedArticles =
          await buildPersonalizedArticles(
            mockFeed,
            interactionState
          );

        setArticles(
          personalizedArticles
        );

        ScreenRefreshService.markRefreshed(
          "home"
        );

        showSuccess(
          "Feed refreshed",
          "Your latest stories are ready."
        );
      } catch {
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
      } finally {
        setRefreshing(false);
      }
    }, [
      buildPersonalizedArticles,
      getInteractionState,
      refreshing,
      showError,
      showSuccess,
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
        // GET /home

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        const interactionState =
          await getInteractionState();

        const personalizedArticles =
          await buildPersonalizedArticles(
            mockFeed,
            interactionState
          );

        setArticles(
          personalizedArticles
        );

        ScreenRefreshService.markRefreshed(
          "home"
        );
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
      buildPersonalizedArticles,
      getInteractionState,
      showError,
    ]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);


  useFocusEffect(
    useCallback(() => {
      void synchronizeInteractionState();
    }, [synchronizeInteractionState])
  );


  const handleLoadMore =
    useCallback(async () => {
      if (loadingMore) {
        return;
      }

      const loadingStartedAt =
        Date.now();

      const minimumLoadingDuration =
        1000;

      setLoadingMore(true);

      try {
        // TODO:
        // GET /home?cursor=...
        //
        // Replace this delay with the
        // backend pagination request.

        await new Promise((resolve) =>
          setTimeout(resolve, 400)
        );
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
      }
    }, [
      loadingMore,
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