import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  ListRenderItem,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useScrollToTop,
} from "@react-navigation/native";

import FeedCard from "../../components/cards/FeedCard";
import {
  FeedItem,
} from "../../components/cards/feedCard.types";
import {
  FeedbackReason,
} from "../../components/cards/feedback/feedbackReasons";

import useFeedback from "../../context/FeedbackContext";

import BookmarkService from "../../services/BookmarkService";
import FeedbackService from "../../services/FeedbackService";
import InteractionService from "../../services/InteractionService";
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

import applyArticleInteractionState from "../../utils/applyArticleInteractionState";

export default function BookmarksScreen() {
  const navigation =
    useNavigation();

  const { colors } = useTheme();

  const {
    showError,
    showInfo,
    showSuccess,
  } = useFeedback();

  const listRef =
    useRef<FlatList<FeedItem>>(null);

  const hasLoadedOnceRef =
    useRef(false);

  const loadingRequestRef =
    useRef(false);

  const dataVersionRef =
    useRef(0);

  useScrollToTop(listRef);

  const [search, setSearch] =
    useState("");

  const [articles, setArticles] =
    useState<FeedItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadBookmarks =
    useCallback(async () => {
      if (
        loadingRequestRef.current
      ) {
        return;
      }

      loadingRequestRef.current =
        true;

      const requestVersion =
        dataVersionRef.current;

      const shouldShowInitialLoading =
        !hasLoadedOnceRef.current;

      const loadingStartedAt =
        Date.now();

      const minimumLoadingDuration =
        1000;

      if (
        shouldShowInitialLoading
      ) {
        setLoading(true);
      }

      try {
        const [
          savedArticles,
          interactionState,
        ] = await Promise.all([
          BookmarkService.getBookmarkedArticles(),
          InteractionService.getState(),
        ]);

        const nextArticles =
          applyArticleInteractionState(
            savedArticles,
            {
              bookmarkedIds:
                savedArticles.map(
                  (article) =>
                    article.id
                ),

              recommendedIds:
                interactionState.recommendedIds,

              helpfulIds:
                interactionState.helpfulIds,
            }
          );

        if (
          requestVersion ===
          dataVersionRef.current
        ) {
          setArticles(
            nextArticles
          );
        }
      } catch {
        if (
          shouldShowInitialLoading &&
          requestVersion ===
            dataVersionRef.current
        ) {
          setArticles([]);
        }

        showError(
          "Bookmarks unavailable",
          "Poster could not load your saved articles."
        );
      } finally {
        if (
          shouldShowInitialLoading
        ) {
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

          hasLoadedOnceRef.current =
            true;

          setLoading(false);
        }

        loadingRequestRef.current =
          false;
      }
    }, [showError]);

  useFocusEffect(
    useCallback(() => {
      void loadBookmarks();
    }, [loadBookmarks])
  );

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filteredArticles =
    useMemo(() => {
      if (!normalizedSearch) {
        return articles;
      }

      return articles.filter(
        (article) =>
          [
            article.title,
            article.publisher,
            article.category,
          ]
            .join(" ")
            .toLowerCase()
            .includes(
              normalizedSearch
            )
      );
    }, [
      articles,
      normalizedSearch,
    ]);

  const openArticle =
    useCallback(
      async (
        article: Article
      ) => {
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

  const removeBookmark =
    useCallback(
      async (
        article: FeedItem
      ) => {
        const removedIndex =
          articles.findIndex(
            (currentArticle) =>
              currentArticle.id ===
              article.id
          );

        if (removedIndex < 0) {
          return;
        }

        dataVersionRef.current += 1;

        setArticles(
          (currentArticles) =>
            currentArticles.filter(
              (currentArticle) =>
                currentArticle.id !==
                article.id
            )
        );

        try {
          await BookmarkService.remove(
            article.id
          );

          showSuccess(
            "Article removed",
            "This story was removed from Bookmarked Articles."
          );
        } catch {
          setArticles(
            (currentArticles) => {
              const alreadyRestored =
                currentArticles.some(
                  (currentArticle) =>
                    currentArticle.id ===
                    article.id
                );

              if (alreadyRestored) {
                return currentArticles;
              }

              const restoredArticles = [
                ...currentArticles,
              ];

              const restoreIndex =
                Math.min(
                  removedIndex,
                  restoredArticles.length
                );

              restoredArticles.splice(
                restoreIndex,
                0,
                article
              );

              return restoredArticles;
            }
          );

          showError(
            "Bookmark not removed",
            "Poster could not remove this saved article."
          );
        }
      },
      [
        articles,
        showError,
        showSuccess,
      ]
    );

  const handleWorthReading =
    useCallback(
      async (
        article: FeedItem
      ) => {
        if (article.recommended) {
          return;
        }

        dataVersionRef.current += 1;

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
            "Poster will use this signal to improve your feed."
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
      async (
        article: FeedItem
      ) => {
        if (article.helpful) {
          return;
        }

        dataVersionRef.current += 1;

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
            "Thanks for helping Poster improve recommendations."
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

  const handleShare =
    useCallback(
      async (
        article: FeedItem
      ) => {
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

  const handleArticleFeedback =
    useCallback(
      async (
        article: FeedItem,
        reason: FeedbackReason
      ) => {
        try {
          await FeedbackService.submit(
            article.id,
            reason.id
          );

          showSuccess(
            "Feedback received",
            "Poster will use your response to improve saved recommendations."
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

  const renderArticle:
    ListRenderItem<FeedItem> =
    useCallback(
      ({ item }) => (
        <FeedCard
          article={{
            ...item,
            bookmarked: true,
          }}
          onPress={() => {
            void openArticle(item);
          }}
          onBookmark={() => {
            void removeBookmark(item);
          }}
          onShare={() => {
            void handleShare(item);
          }}
          onWorthReading={() => {
            void handleWorthReading(
              item
            );
          }}
          onHelpful={() => {
            void handleHelpful(
              item
            );
          }}
          onFeedback={(reason) => {
            void handleArticleFeedback(
              item,
              reason
            );
          }}
        />
      ),
      [
        handleArticleFeedback,
        handleHelpful,
        handleShare,
        handleWorthReading,
        openArticle,
        removeBookmark,
      ]
    );

  const hasBookmarks =
    articles.length > 0;

  const header = (
    <View style={styles.header}>
      <View style={styles.navigationRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed
                ? 0.55
                : 1,
            },
          ]}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={Icons.md}
            color={colors.icon}
          />
        </Pressable>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Bookmarks
        </Text>

        <View
          style={
            styles.headerPlaceholder
          }
        />
      </View>

      {hasBookmarks ? (
        <>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor:
                  colors.surface,

                borderColor:
                  normalizedSearch
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={Icons.md}
              color={
                normalizedSearch
                  ? colors.primary
                  : colors.icon
              }
            />

            <TextInput
              accessibilityLabel="Search bookmarked articles"
              value={search}
              placeholder="Search bookmarks"
              placeholderTextColor={
                colors.placeholder
              }
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                },
              ]}
              onChangeText={
                setSearch
              }
            />

            {search.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={Spacing.sm}
                onPress={() => {
                  setSearch("");
                }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={Icons.md}
                  color={
                    colors.placeholder
                  }
                />
              </Pressable>
            ) : null}
          </View>

          <Text
            style={[
              styles.count,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {filteredArticles.length}{" "}
            {filteredArticles.length === 1
              ? "article"
              : "articles"}
          </Text>
        </>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
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
      <FlatList
        ref={listRef}
        data={filteredArticles}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderArticle}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,

          filteredArticles.length ===
            0 &&
            styles.emptyContent,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={
                normalizedSearch
                  ? "magnify"
                  : "bookmark-outline"
              }
              size={Icons.xxl}
              color={
                colors.textSecondary
              }
            />

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {normalizedSearch
                ? "No results"
                : "No bookmarks yet"}
            </Text>

            <Text
              style={[
                styles.emptyDescription,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              {normalizedSearch
                ? "Try another search."
                : "Saved articles will appear here."}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                normalizedSearch
                  ? "Clear search"
                  : "Go back"
              }
              hitSlop={Spacing.sm}
              style={({ pressed }) => [
                styles.emptyAction,
                {
                  opacity: pressed
                    ? 0.55
                    : 1,
                },
              ]}
              onPress={() => {
                if (
                  normalizedSearch
                ) {
                  setSearch("");

                  return;
                }

                navigation.goBack();
              }}
            >
              <Text
                style={[
                  styles.emptyActionText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                {normalizedSearch
                  ? "Clear Search"
                  : "Go Back"}
              </Text>
            </Pressable>
          </View>
        }
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  content: {
    paddingBottom:
      Spacing.xxxl * 2,
  },

  emptyContent: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.md,

    paddingBottom:
      Spacing.md,
  },

  navigationRow: {
    minHeight: 46,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  backButton: {
    width: 42,

    height: 42,

    alignItems: "flex-start",

    justifyContent: "center",
  },

  title: {
    ...Typography.headline,

    fontWeight: "800",

    textAlign: "center",
  },

  headerPlaceholder: {
    width: 42,
  },

  searchContainer: {
    minHeight: 50,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderRadius:
      Radius.lg,

    paddingHorizontal:
      Spacing.md,

    marginTop:
      Spacing.lg,
  },

  searchInput: {
    flex: 1,

    minHeight: 48,

    ...Typography.body,

    marginHorizontal:
      Spacing.sm,

    paddingVertical: 0,
  },

  count: {
    ...Typography.small,

    fontWeight: "600",

    marginTop:
      Spacing.sm,
  },

  emptyState: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.xxl,

    paddingVertical:
      Spacing.xxxl,
  },

  emptyTitle: {
    ...Typography.headline,

    fontWeight: "800",

    textAlign: "center",

    marginTop:
      Spacing.lg,
  },

  emptyDescription: {
    ...Typography.body,

    textAlign: "center",

    marginTop:
      Spacing.sm,
  },

  emptyAction: {
    minHeight: 40,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.lg,

    marginTop:
      Spacing.lg,
  },

  emptyActionText: {
    ...Typography.caption,

    fontWeight: "800",
  },
});