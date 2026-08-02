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
  TextInput,
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
import SearchBar from "../../components/forms/SearchBar";

import useFeedback from "../../context/FeedbackContext";

import {
  getFeaturedInterestCategories,
  getSearchableInterestTopics,
} from "../../data/interests";
import { mockFeed } from "../../data/mockFeed";
import {
  trendingSearches,
} from "../../data/mockSearch";

import BookmarkService from "../../services/BookmarkService";
import FeedbackService from "../../services/FeedbackService";
import InteractionService from "../../services/InteractionService";
import ScreenRefreshService from "../../services/ScreenRefreshService";
import SearchHistoryService from "../../services/SearchHistoryService";
import SearchService, {
  type SearchTaxonomyPlan,
} from "../../services/SearchService";
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

type SearchMode =
  | "discover"
  | "typing"
  | "results"
  | "related";

interface RankedArticle {
  article: FeedItem;
  score: number;
}

interface SearchFilterOption {
  id: string;

  label: string;

  topicNames: readonly string[];
}

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

function calculateSearchScore(
  article: FeedItem,
  query: string
): number {
  const normalizedQuery =
    normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const title =
    normalizeText(article.title);

  const publisher =
    normalizeText(article.publisher);

  const category =
    normalizeText(article.category);

  const sourceText = [
    title,
    publisher,
    category,
  ].join(" ");

  const queryTokens =
    normalizedQuery
      .split(/\s+/)
      .filter(Boolean);

  let score = 0;

  if (title === normalizedQuery) {
    score += 120;
  }

  if (
    title.startsWith(
      normalizedQuery
    )
  ) {
    score += 90;
  } else if (
    title.includes(
      normalizedQuery
    )
  ) {
    score += 70;
  }

  if (
    publisher === normalizedQuery
  ) {
    score += 80;
  } else if (
    publisher.includes(
      normalizedQuery
    )
  ) {
    score += 50;
  }

  if (
    category === normalizedQuery
  ) {
    score += 60;
  } else if (
    category.includes(
      normalizedQuery
    )
  ) {
    score += 40;
  }

  const matchedTokens =
    queryTokens.filter(
      (token) =>
        sourceText.includes(token)
    ).length;

  score += matchedTokens * 18;

  if (
    queryTokens.length > 1 &&
    matchedTokens ===
      queryTokens.length
  ) {
    score += 35;
  }

  return score;
}


function calculateExpandedSearchScore(
  article: FeedItem,
  query: string,
  expandedTerms: readonly string[]
): number {
  const primaryScore =
    calculateSearchScore(
      article,
      query
    );

  const normalizedQuery =
    normalizeText(query);

  const expansionScore =
    expandedTerms.reduce(
      (highestScore, term) => {
        if (
          normalizeText(term) ===
          normalizedQuery
        ) {
          return highestScore;
        }

        return Math.max(
          highestScore,
          calculateSearchScore(
            article,
            term
          )
        );
      },
      0
    );

  return (
    primaryScore +
    Math.round(
      expansionScore * 0.35
    )
  );
}

function matchesFilter(
  article: FeedItem,
  filter: SearchFilterOption
): boolean {
  if (filter.id === "all") {
    return true;
  }

  const articleText =
    normalizeText(
      [
        article.title,
        article.category,
        article.publisher,
      ].join(" ")
    );

  const filterTerms = [
    filter.label,
    ...filter.topicNames,
  ];

  return filterTerms.some(
    (term) => {
      const normalizedTerm =
        normalizeText(term);

      return (
        normalizedTerm.length >
          0 &&
        articleText.includes(
          normalizedTerm
        )
      );
    }
  );
}

export default function SearchScreen() {
  const { colors } = useTheme();

  const {
    showError,
    showInfo,
    showSuccess,
  } = useFeedback();

  const listRef =
    useRef<FlatList<FeedEntry>>(null);

  const searchInputRef =
    useRef<TextInput>(null);

  const refreshRequestRef =
    useRef(false);

  const loadMoreRequestRef =
    useRef(false);

  const completedInitialFocusRef =
    useRef(false);

  const suggestionRequestRef =
    useRef(0);

  const searchCommitRequestRef =
    useRef(0);

  const committedSearchPlanRef =
    useRef<SearchTaxonomyPlan | null>(
      null
    );

  const searchSessionIdRef =
    useRef(
      `search-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`
    );

  useScrollToTop(listRef);

  const [search, setSearch] =
    useState("");

  const [
    submittedSearch,
    setSubmittedSearch,
  ] = useState("");

  const [
    selectedFilterId,
    setSelectedFilterId,
  ] = useState("all");

  const [
    savedRecentSearches,
    setSavedRecentSearches,
  ] = useState<string[]>([]);

  const [isFocused, setIsFocused] =
    useState(false);

  const [
    taxonomySuggestions,
    setTaxonomySuggestions,
  ] = useState<string[]>([]);

  const [
    previewCanSearch,
    setPreviewCanSearch,
  ] = useState(false);

  const [
    committedSearchPlan,
    setCommittedSearchPlan,
  ] =
    useState<SearchTaxonomyPlan | null>(
      null
    );

  const [articles, setArticles] =
    useState<FeedItem[]>(mockFeed);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const searchableTaxonomyTopics =
    useMemo(
      () =>
        getSearchableInterestTopics(),
      []
    );

  const featuredTaxonomyCategories =
    useMemo(
      () =>
        getFeaturedInterestCategories()
          .slice(0, 7),
      []
    );

  const searchFilterOptions =
    useMemo<SearchFilterOption[]>(
      () => {
        const categoryFilters =
          featuredTaxonomyCategories.map(
            (category) => {
              const categoryTopics =
                searchableTaxonomyTopics.filter(
                  (topic) =>
                    topic.categoryId ===
                    category.id
                );

              return {
                id:
                  category.id,

                label:
                  category.name,

                topicNames:
                  createUniqueValues(
                    categoryTopics.flatMap(
                      (topic) => [
                        topic.name,
                        ...(topic.aliases ??
                          []),
                      ]
                    )
                  ),
              };
            }
          );

        return [
          {
            id: "all",
            label: "All",
            topicNames: [],
          },
          ...categoryFilters,
        ];
      },
      [
        featuredTaxonomyCategories,
        searchableTaxonomyTopics,
      ]
    );

  const selectedFilter =
    useMemo(() => {
      return (
        searchFilterOptions.find(
          (filter) =>
            filter.id ===
            selectedFilterId
        ) ??
        searchFilterOptions[0]
      );
    }, [
      searchFilterOptions,
      selectedFilterId,
    ]);

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

  const loadSearchHistory =
    useCallback(async () => {
      try {
        const history =
          await SearchHistoryService.getHistory();

        setSavedRecentSearches(
          history
        );
      } catch {
        showError(
          "Search history unavailable",
          "Poster could not load your recent searches."
        );
      }
    }, [showError]);

  const saveSearchQuery =
    useCallback(
      async (value: string) => {
        const normalizedValue =
          value.trim();

        if (!normalizedValue) {
          return;
        }

        try {
          const nextHistory =
            await SearchHistoryService.add(
              normalizedValue
            );

          setSavedRecentSearches(
            nextHistory
          );
        } catch {
          showError(
            "Search history not saved",
            "Your search worked, but Poster could not save it to recent searches."
          );
        }
      },
      [showError]
    );

  const loadInitial =
    useCallback(async () => {
      const loadingStartedAt =
        Date.now();

      const minimumLoadingDuration =
        1000;

      setInitialLoading(true);

      try {
        // TODO:
        // GET /search/discover

        await new Promise((resolve) =>
          setTimeout(resolve, 450)
        );

        const [
          bookmarkedIds,
          interactionState,
          searchHistory,
        ] = await Promise.all([
          BookmarkService.getBookmarkedIds(),
          InteractionService.getState(),
          SearchHistoryService.getHistory(),
        ]);

        setArticles(
          applyArticleInteractionState(
            mockFeed,
            {
              bookmarkedIds,

              recommendedIds:
                interactionState.recommendedIds,

              helpfulIds:
                interactionState.helpfulIds,
            }
          )
        );

        setSavedRecentSearches(
          searchHistory
        );

        ScreenRefreshService.markRefreshed(
          "search"
        );
      } catch {
        showError(
          "Search unavailable",
          "Poster could not prepare discovery content.",
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
    }, [showError]);

  const resetSearchToDiscover =
    useCallback(() => {
      suggestionRequestRef.current +=
        1;

      searchCommitRequestRef.current +=
        1;

      committedSearchPlanRef.current =
        null;

      setCommittedSearchPlan(null);

      setTaxonomySuggestions([]);

      setPreviewCanSearch(false);

      setSearch("");

      setSubmittedSearch("");

      setSelectedFilterId("all");

      setIsFocused(false);

      searchInputRef.current?.blur();
    }, []);

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

      resetSearchToDiscover();

      listRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      });

      try {
        // TODO:
        // GET /search/discover

        await new Promise((resolve) =>
          setTimeout(resolve, 800)
        );

        const [
          bookmarkedIds,
          interactionState,
          searchHistory,
        ] = await Promise.all([
          BookmarkService.getBookmarkedIds(),
          InteractionService.getState(),
          SearchHistoryService.getHistory(),
        ]);

        setArticles(
          applyArticleInteractionState(
            mockFeed,
            {
              bookmarkedIds,

              recommendedIds:
                interactionState.recommendedIds,

              helpfulIds:
                interactionState.helpfulIds,
            }
          )
        );

        setSavedRecentSearches(
          searchHistory
        );

        ScreenRefreshService.markRefreshed(
          "search"
        );

        showSuccess(
          "Discovery refreshed",
          "Search and discovery content are up to date."
        );
      } catch {
        showError(
          "Refresh failed",
          "Poster could not update Search.",
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
      resetSearchToDiscover,
      showError,
      showSuccess,
    ]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useFocusEffect(
    useCallback(() => {
      if (initialLoading) {
        return undefined;
      }

      if (
        completedInitialFocusRef.current
      ) {
        void synchronizeInteractionState();
        void loadSearchHistory();
      } else {
        completedInitialFocusRef.current =
          true;
      }

      const focusTimer =
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);

      return () => {
        clearTimeout(
          focusTimer
        );
      };
    }, [
      initialLoading,
      loadSearchHistory,
      synchronizeInteractionState,
    ])
  );

  const normalizedTypedSearch =
    normalizeText(search);

  const normalizedSubmittedSearch =
    normalizeText(
      submittedSearch
    );

  useEffect(() => {
    const requestId =
      suggestionRequestRef.current +
      1;

    suggestionRequestRef.current =
      requestId;

    if (
      !normalizedTypedSearch ||
      !isFocused
    ) {
      setTaxonomySuggestions([]);

      setPreviewCanSearch(false);

      return undefined;
    }

    setPreviewCanSearch(false);

    const previewTimer =
      setTimeout(() => {
        void SearchService.preview(
          search,
          {
            suggestionLimit: 8,
          }
        )
          .then((preview) => {
            if (
              suggestionRequestRef.current !==
              requestId
            ) {
              return;
            }

            setPreviewCanSearch(
              preview.plan.canSearch
            );

            setTaxonomySuggestions(
              preview.plan.canSearch
                ? preview.suggestions.map(
                    (suggestion) =>
                      suggestion.label
                  )
                : []
            );
          })
          .catch(() => {
            if (
              suggestionRequestRef.current !==
              requestId
            ) {
              return;
            }

            setTaxonomySuggestions([]);

            setPreviewCanSearch(false);
          });
      }, 120);

    return () => {
      clearTimeout(
        previewTimer
      );
    };
  }, [
    isFocused,
    normalizedTypedSearch,
    search,
  ]);

  const suggestions =
    useMemo(() => {
      if (
        !normalizedTypedSearch ||
        !isFocused ||
        !previewCanSearch
      ) {
        return [];
      }

      const values:
        string[] = [
          ...taxonomySuggestions,
        ];

      trendingSearches.forEach(
        (value) => {
          if (
            normalizeText(
              value
            ).includes(
              normalizedTypedSearch
            )
          ) {
            values.push(value);
          }
        }
      );

      savedRecentSearches.forEach(
        (value) => {
          if (
            normalizeText(
              value
            ).includes(
              normalizedTypedSearch
            )
          ) {
            values.push(value);
          }
        }
      );

      searchFilterOptions
        .filter(
          (filter) =>
            filter.id !== "all"
        )
        .forEach((filter) => {
          if (
            normalizeText(
              filter.label
            ).includes(
              normalizedTypedSearch
            )
          ) {
            values.push(
              filter.label
            );
          }
        });

      articles.forEach(
        (article) => {
          [
            article.title,
            article.publisher,
            article.category,
          ].forEach((value) => {
            if (
              normalizeText(
                value
              ).includes(
                normalizedTypedSearch
              )
            ) {
              values.push(value);
            }
          });
        }
      );

      return createUniqueValues(
        values
      ).slice(0, 8);
    }, [
      articles,
      isFocused,
      normalizedTypedSearch,
      previewCanSearch,
      savedRecentSearches,
      searchFilterOptions,
      taxonomySuggestions,
    ]);

  const filteredByCategory =
    useMemo(() => {
      if (!selectedFilter) {
        return articles;
      }

      return articles.filter(
        (article) =>
          matchesFilter(
            article,
            selectedFilter
          )
      );
    }, [
      articles,
      selectedFilter,
    ]);

  const rankedArticles =
    useMemo<RankedArticle[]>(() => {
      if (
        !normalizedSubmittedSearch
      ) {
        return [];
      }

      return filteredByCategory
        .map((article) => ({
          article,

          score:
            calculateExpandedSearchScore(
              article,
              submittedSearch,
              committedSearchPlan
                ?.expandedSearchTerms ??
                []
            ),
        }))
        .filter(
          (item) =>
            item.score > 0
        )
        .sort(
          (first, second) =>
            second.score -
            first.score
        );
    }, [
      committedSearchPlan,
      filteredByCategory,
      normalizedSubmittedSearch,
      submittedSearch,
    ]);

  const topResults =
    useMemo(() => {
      return rankedArticles
        .filter(
          (item) =>
            item.score >= 55
        )
        .map(
          (item) =>
            item.article
        );
    }, [rankedArticles]);

  const relatedResults =
    useMemo(() => {
      const rankedRelated =
        rankedArticles
          .filter(
            (item) =>
              item.score < 55
          )
          .map(
            (item) =>
              item.article
          );

      if (
        rankedRelated.length > 0
      ) {
        return rankedRelated;
      }

      if (
        topResults.length > 0
      ) {
        return [];
      }

      return filteredByCategory.slice(
        0,
        6
      );
    }, [
      filteredByCategory,
      rankedArticles,
      topResults.length,
    ]);

  const searchMode =
    useMemo<SearchMode>(() => {
      if (
        normalizedTypedSearch &&
        isFocused &&
        normalizedSubmittedSearch !==
          normalizedTypedSearch
      ) {
        return "typing";
      }

      if (
        !normalizedSubmittedSearch
      ) {
        return "discover";
      }

      if (
        topResults.length > 0
      ) {
        return "results";
      }

      return "related";
    }, [
      isFocused,
      normalizedSubmittedSearch,
      normalizedTypedSearch,
      topResults.length,
    ]);

  const visibleArticles =
    useMemo(() => {
      if (
        searchMode === "results"
      ) {
        return [
          ...topResults,
          ...relatedResults,
        ];
      }

      if (
        searchMode === "related"
      ) {
        return relatedResults;
      }

      return filteredByCategory;
    }, [
      filteredByCategory,
      relatedResults,
      searchMode,
      topResults,
    ]);

  const monetizationQuery =
    useMemo(() => {
      if (
        searchMode === "discover" ||
        searchMode === "typing"
      ) {
        return undefined;
      }

      return (
        submittedSearch.trim() ||
        undefined
      );
    }, [
      searchMode,
      submittedSearch,
    ]);

  const monetizationTopic =
    useMemo(() => {
      if (
        selectedFilter &&
        selectedFilter.id !== "all"
      ) {
        return selectedFilter.label;
      }

      return committedSearchPlan
        ?.primaryTopicName;
    }, [
      committedSearchPlan,
      selectedFilter,
    ]);

  const commitSearchQuery =
    useCallback(
      async (value: string) => {
        const trimmedValue =
          value
            .trim()
            .replace(/\s+/g, " ");

        if (!trimmedValue) {
          committedSearchPlanRef.current =
            null;

          setCommittedSearchPlan(null);

          setSubmittedSearch("");

          return;
        }

        const requestId =
          searchCommitRequestRef.current +
          1;

        searchCommitRequestRef.current =
          requestId;

        setIsFocused(false);

        searchInputRef.current?.blur();

        try {
          const plan =
            await SearchService.commit(
              trimmedValue,
              {
                sessionId:
                  searchSessionIdRef
                    .current,
              }
            );

          if (
            searchCommitRequestRef.current !==
            requestId
          ) {
            return;
          }

          if (
            !SearchService.isSearchAllowed(
              plan
            )
          ) {
            committedSearchPlanRef.current =
              null;

            setCommittedSearchPlan(
              null
            );

            setSearch("");

            setSubmittedSearch("");

            showInfo(
              "Search unavailable",
              "This topic is not available for discovery on Poster."
            );

            return;
          }

          committedSearchPlanRef.current =
            plan;

          setCommittedSearchPlan(plan);

          setSearch(trimmedValue);

          setSubmittedSearch(
            trimmedValue
          );

          void saveSearchQuery(
            trimmedValue
          );
        } catch {
          if (
            searchCommitRequestRef.current !==
            requestId
          ) {
            return;
          }

          showError(
            "Search unavailable",
            "Poster could not prepare this search. Please try again."
          );
        }
      },
      [
        saveSearchQuery,
        showError,
        showInfo,
      ]
    );

  const handleSubmitSearch =
    useCallback(() => {
      void commitSearchQuery(
        search
      );
    }, [
      commitSearchQuery,
      search,
    ]);

  const handleSelectSearch =
    useCallback(
      (value: string) => {
        void commitSearchQuery(
          value
        );
      },
      [commitSearchQuery]
    );

  const handleClearSearch =
    useCallback(() => {
      suggestionRequestRef.current +=
        1;

      searchCommitRequestRef.current +=
        1;

      committedSearchPlanRef.current =
        null;

      setCommittedSearchPlan(null);

      setTaxonomySuggestions([]);

      setPreviewCanSearch(false);

      setSearch("");

      setSubmittedSearch("");

      setIsFocused(false);

      searchInputRef.current?.blur();
    }, []);

  const handleRemoveRecentSearch =
    useCallback(
      async (value: string) => {
        try {
          const nextHistory =
            await SearchHistoryService.remove(
              value
            );

          setSavedRecentSearches(
            nextHistory
          );

          showInfo(
            "Recent search removed",
            `"${value}" was removed from your history.`
          );
        } catch {
          showError(
            "Search not removed",
            "Poster could not update your search history."
          );
        }
      },
      [
        showError,
        showInfo,
      ]
    );

  const handleClearSearchHistory =
    useCallback(async () => {
      if (
        savedRecentSearches.length ===
        0
      ) {
        return;
      }

      try {
        await SearchHistoryService.clear();

        setSavedRecentSearches([]);

        showSuccess(
          "Search history cleared",
          "Your recent searches were removed."
        );
      } catch {
        showError(
          "History not cleared",
          "Poster could not clear your recent searches."
        );
      }
    }, [
      savedRecentSearches.length,
      showError,
      showSuccess,
    ]);

  const handleFilterSelect =
    useCallback(
      (
        filter:
          SearchFilterOption
      ) => {
        setSelectedFilterId(
          filter.id
        );

        if (
          filter.id !== "all" &&
          !search.trim()
        ) {
          void commitSearchQuery(
            filter.label
          );
        }
      },
      [
        commitSearchQuery,
        search,
      ]
    );

  const handleFilterToggle =
    useCallback(() => {
      const firstTopicFilter =
        searchFilterOptions[1];

      setSelectedFilterId(
        selectedFilterId === "all"
          ? firstTopicFilter?.id ??
              "all"
          : "all"
      );
    }, [
      searchFilterOptions,
      selectedFilterId,
    ]);

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
        if (
          committedSearchPlanRef.current
        ) {
          committedSearchPlanRef.current =
            SearchService.continueSearch(
              committedSearchPlanRef.current
            );
        }

        // TODO:
        // GET /search?cursor=...
        //
        // Mock data contains one page.
        // Do not append mockFeed again.

        await new Promise((resolve) =>
          setTimeout(resolve, 400)
        );
      } catch {
        showError(
          "More results unavailable",
          "Poster could not load additional search results."
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
            "Poster will use this signal to improve discovery."
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
            "Thanks for helping Poster improve discovery."
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
            "Poster could not record that this result was helpful."
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
            "Poster will use your response to improve Search."
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

  const renderSearchChip =
    useCallback(
      (
        value: string,
        icon:
          | "fire"
          | "history"
          | "magnify"
      ) => {
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`Search for ${value}`}
            style={({ pressed }) => [
              styles.searchChip,
              {
                backgroundColor:
                  colors.card,

                borderColor:
                  colors.border,

                opacity: pressed
                  ? 0.62
                  : 1,
              },
            ]}
            onPress={() =>
              handleSelectSearch(value)
            }
          >
            <MaterialCommunityIcons
              name={icon}
              size={Icons.sm}
              color={colors.primary}
            />

            <Text
              numberOfLines={1}
              style={[
                styles.searchChipText,
                {
                  color: colors.text,
                },
              ]}
            >
              {value}
            </Text>
          </Pressable>
        );
      },
      [
        colors.border,
        colors.card,
        colors.primary,
        colors.text,
        handleSelectSearch,
      ]
    );

  const renderRecentSearchChip =
    useCallback(
      (value: string) => {
        return (
          <View
            key={value}
            style={[
              styles.recentSearchChip,
              {
                backgroundColor:
                  colors.card,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Search again for ${value}`}
              style={({ pressed }) => [
                styles.recentSearchMain,
                {
                  opacity: pressed
                    ? 0.62
                    : 1,
                },
              ]}
              onPress={() =>
                handleSelectSearch(value)
              }
            >
              <MaterialCommunityIcons
                name="history"
                size={Icons.sm}
                color={colors.primary}
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.recentSearchText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {value}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${value} from recent searches`}
              hitSlop={Spacing.xs}
              style={({ pressed }) => [
                styles.removeHistoryButton,
                {
                  opacity: pressed
                    ? 0.5
                    : 1,
                },
              ]}
              onPress={() => {
                void handleRemoveRecentSearch(
                  value
                );
              }}
            >
              <MaterialCommunityIcons
                name="close"
                size={Icons.sm}
                color={
                  colors.placeholder
                }
              />
            </Pressable>
          </View>
        );
      },
      [
        colors.border,
        colors.card,
        colors.placeholder,
        colors.primary,
        colors.text,
        handleRemoveRecentSearch,
        handleSelectSearch,
      ]
    );

  const renderHeader =
    useCallback(() => {
      return (
        <>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Search
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
              Discover articles, topics and publishers
            </Text>
          </View>

          <View
            style={
              styles.searchContainer
            }
          >
            <SearchBar
              ref={searchInputRef}
              value={search}
              onChangeText={(value) => {
                setSearch(value);

                if (!value.trim()) {
                  committedSearchPlanRef.current =
                    null;

                  setCommittedSearchPlan(
                    null
                  );

                  setSubmittedSearch("");
                }
              }}
              onSubmit={
                handleSubmitSearch
              }
              onClear={
                handleClearSearch
              }
              onFocus={() =>
                setIsFocused(true)
              }
              onBlur={() =>
                setIsFocused(false)
              }
              onFilterPress={
                handleFilterToggle
              }
            />
          </View>

          {searchMode === "typing" &&
          suggestions.length > 0 ? (
            <View
              style={[
                styles.suggestionsContainer,
                {
                  backgroundColor:
                    colors.card,

                  borderColor:
                    colors.border,
                },
              ]}
            >
              {suggestions.map(
                (suggestion) => (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${suggestion}`}
                    style={({
                      pressed,
                    }) => [
                      styles.suggestionRow,
                      {
                        opacity: pressed
                          ? 0.58
                          : 1,
                      },
                    ]}
                    onPress={() =>
                      handleSelectSearch(
                        suggestion
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="magnify"
                      size={Icons.md}
                      color={
                        colors.placeholder
                      }
                    />

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.suggestionText,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {suggestion}
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          ) : null}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Explore Topics
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
              styles.horizontal
            }
          >
            {searchFilterOptions.map(
              (filter) => {
                const selected =
                  selectedFilterId ===
                  filter.id;

                return (
                  <Pressable
                    key={filter.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${filter.label}`}
                    accessibilityState={{
                      selected,
                    }}
                    style={({
                      pressed,
                    }) => [
                      styles.filterChip,
                      {
                        borderColor:
                          selected
                            ? colors.primary
                            : colors.border,

                        backgroundColor:
                          selected
                            ? colors.primary
                            : colors.card,

                        opacity: pressed
                          ? 0.68
                          : 1,
                      },
                    ]}
                    onPress={() =>
                      handleFilterSelect(
                        filter
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: selected
                            ? colors.onPrimary
                            : colors.text,
                        },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          {searchMode === "discover" ? (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Trending Searches
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
                  styles.horizontal
                }
              >
                {trendingSearches.map(
                  (item) =>
                    renderSearchChip(
                      item,
                      "fire"
                    )
                )}
              </ScrollView>

              {savedRecentSearches.length >
              0 ? (
                <>
                  <View
                    style={
                      styles.sectionHeader
                    }
                  >
                    <Text
                      style={[
                        styles.sectionHeaderTitle,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      Recent Searches
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear all recent searches"
                      style={({ pressed }) => [
                        styles.clearHistoryButton,
                        {
                          opacity: pressed
                            ? 0.58
                            : 1,
                        },
                      ]}
                      onPress={() => {
                        void handleClearSearchHistory();
                      }}
                    >
                      <Text
                        style={[
                          styles.clearHistoryText,
                          {
                            color:
                              colors.primary,
                          },
                        ]}
                      >
                        Clear All
                      </Text>
                    </Pressable>
                  </View>

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
                      styles.horizontal
                    }
                  >
                    {savedRecentSearches.map(
                      renderRecentSearchChip
                    )}
                  </ScrollView>
                </>
              ) : null}

              <View
                style={
                  styles.resultsHeader
                }
              >
                <Text
                  style={[
                    styles.resultsTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Discover
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
                  Explore stories across your interests
                </Text>
              </View>
            </>
          ) : null}

          {searchMode === "results" ? (
            <View
              style={
                styles.resultsHeader
              }
            >
              <Text
                style={[
                  styles.resultsTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Results for{" "}
                {`"${submittedSearch}"`}
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
                {topResults.length}{" "}
                {topResults.length === 1
                  ? "strong match"
                  : "strong matches"}

                {relatedResults.length > 0
                  ? ` | ${relatedResults.length} related`
                  : ""}
              </Text>
            </View>
          ) : null}

          {searchMode === "related" ? (
            <View
              style={[
                styles.relatedNotice,
                {
                  backgroundColor:
                    colors.card,

                  borderColor:
                    colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="compass-outline"
                size={Icons.lg}
                color={colors.primary}
              />

              <View
                style={
                  styles.relatedNoticeText
                }
              >
                <Text
                  style={[
                    styles.relatedTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  No exact results for{" "}
                  {`"${submittedSearch}"`}
                </Text>

                <Text
                  style={[
                    styles.relatedSubtitle,
                    {
                      color:
                        colors.textSecondary,
                    },
                  ]}
                >
                  Here are related stories you may find useful.
                </Text>
              </View>
            </View>
          ) : null}
        </>
      );
    }, [
      colors.border,
      colors.card,
      colors.onPrimary,
      colors.placeholder,
      colors.primary,
      colors.text,
      colors.textSecondary,
      handleClearSearch,
      handleClearSearchHistory,
      handleFilterSelect,
      handleFilterToggle,
      handleSelectSearch,
      handleSubmitSearch,
      relatedResults.length,
      renderRecentSearchChip,
      renderSearchChip,
      savedRecentSearches,
      search,
      searchFilterOptions,
      searchMode,
      selectedFilterId,
      submittedSearch,
      suggestions,
      topResults.length,
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
          variant="search"
          actionLabel="Clear Search"
          onAction={
            handleClearSearch
          }
        />
      );
    }, [handleClearSearch]);

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
            Preparing discovery...
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
        placement="search"
        query={monetizationQuery}
        topic={monetizationTopic}
        articles={visibleArticles}
        articleActions={
          articleActions
        }
        ListHeaderComponent={
          renderHeader()
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
        keyboardShouldPersistTaps="handled"
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
      Spacing.lg,
  },

  title: {
    ...Typography.title,
  },

  subtitle: {
    ...Typography.body,

    marginTop:
      Spacing.xs,
  },

  searchContainer: {
    paddingHorizontal:
      Spacing.screen,

    paddingBottom:
      Spacing.md,
  },

  suggestionsContainer: {
    marginHorizontal:
      Spacing.screen,

    marginBottom:
      Spacing.lg,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.lg,

    overflow: "hidden",
  },

  suggestionRow: {
    minHeight: 48,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal:
      Spacing.lg,
  },

  suggestionText: {
    flex: 1,

    ...Typography.body,

    marginLeft:
      Spacing.md,
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

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    paddingHorizontal:
      Spacing.screen,

    marginTop:
      Spacing.md,

    marginBottom:
      Spacing.md,
  },

  sectionHeaderTitle: {
    ...Typography.headline,

    fontWeight: "800",
  },

  clearHistoryButton: {
    minHeight: 36,

    justifyContent: "center",

    paddingHorizontal:
      Spacing.sm,
  },

  clearHistoryText: {
    ...Typography.caption,

    fontWeight: "800",
  },

  horizontal: {
    paddingHorizontal:
      Spacing.screen,

    paddingBottom:
      Spacing.lg,
  },

  filterChip: {
    minHeight: 40,

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

  filterText: {
    ...Typography.caption,

    fontWeight: "700",
  },

  searchChip: {
    minHeight: 42,

    maxWidth: 230,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal:
      Spacing.md,

    marginRight:
      Spacing.sm,

    borderRadius:
      Radius.round,

    borderWidth:
      StyleSheet.hairlineWidth,
  },

  searchChipText: {
    ...Typography.caption,

    fontWeight: "600",

    marginLeft:
      Spacing.sm,
  },

  recentSearchChip: {
    minHeight: 42,

    maxWidth: 260,

    flexDirection: "row",

    alignItems: "center",

    marginRight:
      Spacing.sm,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,

    overflow: "hidden",
  },

  recentSearchMain: {
    minHeight: 42,

    flexDirection: "row",

    alignItems: "center",

    paddingLeft:
      Spacing.md,

    paddingRight:
      Spacing.sm,
  },

  recentSearchText: {
    ...Typography.caption,

    fontWeight: "600",

    maxWidth: 180,

    marginLeft:
      Spacing.sm,
  },

  removeHistoryButton: {
    width: 38,

    height: 42,

    alignItems: "center",

    justifyContent: "center",
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

  relatedNotice: {
    flexDirection: "row",

    alignItems: "flex-start",

    marginHorizontal:
      Spacing.screen,

    marginTop:
      Spacing.md,

    marginBottom:
      Spacing.lg,

    padding:
      Spacing.lg,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.lg,
  },

  relatedNoticeText: {
    flex: 1,

    marginLeft:
      Spacing.md,
  },

  relatedTitle: {
    ...Typography.body,

    fontWeight: "800",
  },

  relatedSubtitle: {
    ...Typography.small,

    marginTop:
      Spacing.xs,
  },

  footer: {
    alignItems: "center",

    justifyContent: "center",

    paddingVertical:
      Spacing.xl,
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

    marginTop:
      Spacing.lg,
  },
});