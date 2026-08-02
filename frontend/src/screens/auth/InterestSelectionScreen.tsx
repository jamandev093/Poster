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
  ListRenderItem,
  Pressable,
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
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import EmptyState from "../../components/common/EmptyState";
import PrimaryButton from "../../components/buttons/PrimaryButton";

import useFeedback from "../../context/FeedbackContext";

import {
  getOnboardingInterestTopics,
} from "../../data/interests";

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import InterestCatalogService, {
  InterestCatalogTopic,
} from "../../services/InterestCatalogService";
import PreferenceService from "../../services/PreferenceService";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "InterestSelection"
>;

const MINIMUM_INTERESTS = 3;
const ONBOARDING_TOPIC_LIMIT = 40;
const SEARCH_RESULT_LIMIT = 80;

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function matchesSearch(
  topic: InterestCatalogTopic,
  query: string
): boolean {
  const normalizedQuery =
    normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    topic.name,
    topic.description,
    ...(topic.aliases ?? []),
    ...(topic.searchKeywords ?? []),
    topic.categoryName,
    topic.domainName,
  ].filter(
    (value): value is string =>
      Boolean(value)
  );

  return searchableValues.some(
    (value) =>
      normalizeText(value).includes(
        normalizedQuery
      )
  );
}

function resolveCatalogTopic(
  topics: readonly InterestCatalogTopic[],
  value: string
): InterestCatalogTopic | undefined {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return undefined;
  }

  return topics.find(
    (topic) => {
      if (
        normalizeText(topic.id) ===
          normalizedValue ||
        normalizeText(topic.slug) ===
          normalizedValue ||
        normalizeText(topic.name) ===
          normalizedValue
      ) {
        return true;
      }

      return topic.aliases.some(
        (alias) =>
          normalizeText(alias) ===
          normalizedValue
      );
    }
  );
}

function buildOnboardingTopics(
  topics: readonly InterestCatalogTopic[]
): InterestCatalogTopic[] {
  const topicById =
    new Map(
      topics.map(
        (topic) => [
          topic.id,
          topic,
        ]
      )
    );

  const curatedCanonical =
    getOnboardingInterestTopics(
      ONBOARDING_TOPIC_LIMIT
    ).flatMap(
      (topic) => {
        const catalogTopic =
          topicById.get(topic.id);

        return catalogTopic
          ? [catalogTopic]
          : [];
      }
    );

  const evolvingTopics =
    topics
      .filter(
        (topic) =>
          topic.kind === "evolving" &&
          topic.selectable
      )
      .sort(
        (first, second) =>
          second.promotionScore -
          first.promotionScore
      );

  const evolvingSlotCount =
    Math.min(
      8,
      evolvingTopics.length,
      ONBOARDING_TOPIC_LIMIT
    );

  const canonicalLimit =
    ONBOARDING_TOPIC_LIMIT -
    evolvingSlotCount;

  const selectedIds =
    new Set(
      curatedCanonical.map(
        (topic) =>
          topic.id
      )
    );

  const fallbackCanonical =
    topics.filter(
      (topic) =>
        topic.kind === "canonical" &&
        topic.selectable &&
        !selectedIds.has(topic.id)
    );

  return [
    ...curatedCanonical,
    ...fallbackCanonical,
  ]
    .slice(
      0,
      canonicalLimit
    )
    .concat(
      evolvingTopics.slice(
        0,
        evolvingSlotCount
      )
    );
}

export default function InterestSelectionScreen({
  navigation,
}: Props) {
  const { colors } = useTheme();

  const {
    showError,
    showWarning,
  } = useFeedback();

  const saveRequestRef =
    useRef(false);

  const [search, setSearch] =
    useState("");

  const [
    selectedTopicIds,
    setSelectedTopicIds,
  ] = useState<string[]>([]);

  const [
    legacyInterestNames,
    setLegacyInterestNames,
  ] = useState<string[]>([]);

  const [
    loadingPreferences,
    setLoadingPreferences,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    searchableTopics,
    setSearchableTopics,
  ] = useState<
    InterestCatalogTopic[]
  >([]);

  const [
    onboardingTopics,
    setOnboardingTopics,
  ] = useState<
    InterestCatalogTopic[]
  >([]);

  const topicById =
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

  const normalizedSearch =
    normalizeText(search);

  const visibleTopics =
    useMemo(() => {
      if (!normalizedSearch) {
        return onboardingTopics;
      }

      return searchableTopics
        .filter((topic) =>
          matchesSearch(
            topic,
            normalizedSearch
          )
        )
        .slice(
          0,
          SEARCH_RESULT_LIMIT
        );
    }, [
      normalizedSearch,
      onboardingTopics,
      searchableTopics,
    ]);

  const selectedTopics =
    useMemo(() => {
      return selectedTopicIds.flatMap(
        (topicId) => {
          const topic =
            topicById.get(topicId);

          return topic
            ? [topic]
            : [];
        }
      );
    }, [
      selectedTopicIds,
      topicById,
    ]);

  const totalSelected =
    selectedTopicIds.length +
    legacyInterestNames.length;

  const remainingRequired =
    Math.max(
      MINIMUM_INTERESTS -
        totalSelected,
      0
    );

  const canContinue =
    totalSelected >=
    MINIMUM_INTERESTS;

  useEffect(() => {
    let mounted = true;

    const loadExistingInterests =
      async () => {
        const loadingStartedAt =
          Date.now();

        const minimumLoadingDuration =
          1000;

        try {
          const [
            storedInterests,
            catalog,
          ] = await Promise.all([
            PreferenceService.getInterests(),
            InterestCatalogService.getCatalog(),
          ]);

          if (!mounted) {
            return;
          }

          setSearchableTopics(
            catalog.topics
          );

          setOnboardingTopics(
            buildOnboardingTopics(
              catalog.topics
            )
          );

          const resolvedIds:
            string[] = [];

          const unresolvedNames:
            string[] = [];

          storedInterests.forEach(
            (storedInterest) => {
              const topic =
                resolveCatalogTopic(
                  catalog.topics,
                  storedInterest
                );

              if (topic) {
                if (
                  !resolvedIds.includes(
                    topic.id
                  )
                ) {
                  resolvedIds.push(
                    topic.id
                  );
                }

                return;
              }

              const cleanName =
                storedInterest.trim();

              if (
                cleanName &&
                !unresolvedNames.some(
                  (currentName) =>
                    normalizeText(
                      currentName
                    ) ===
                    normalizeText(
                      cleanName
                    )
                )
              ) {
                unresolvedNames.push(
                  cleanName
                );
              }
            }
          );

          setSelectedTopicIds(
            resolvedIds
          );

          setLegacyInterestNames(
            unresolvedNames
          );
        } catch {
          if (mounted) {
            showError(
              "Interests unavailable",
              "Poster could not load your saved interests."
            );
          }
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

          if (mounted) {
            setLoadingPreferences(
              false
            );
          }
        }
      };

    void loadExistingInterests();

    return () => {
      mounted = false;
    };
  }, [showError]);

  const toggleTopic =
    useCallback(
      (topicId: string) => {
        if (saving) {
          return;
        }

        setSelectedTopicIds(
          (currentIds) => {
            if (
              currentIds.includes(
                topicId
              )
            ) {
              return currentIds.filter(
                (currentId) =>
                  currentId !==
                  topicId
              );
            }

            return [
              ...currentIds,
              topicId,
            ];
          }
        );
      },
      [saving]
    );

  const removeLegacyInterest =
    useCallback(
      (interestName: string) => {
        if (saving) {
          return;
        }

        setLegacyInterestNames(
          (currentNames) =>
            currentNames.filter(
              (currentName) =>
                currentName !==
                interestName
            )
        );
      },
      [saving]
    );

  const clearSelection =
    useCallback(() => {
      if (saving) {
        return;
      }

      setSelectedTopicIds([]);
      setLegacyInterestNames([]);
    }, [saving]);

  const handleContinue =
    useCallback(async () => {
      if (
        saveRequestRef.current
      ) {
        return;
      }

      if (!canContinue) {
        showWarning(
          "Choose more interests",
          `Select at least ${MINIMUM_INTERESTS} topics to continue.`
        );

        return;
      }

      saveRequestRef.current =
        true;

      const namesToSave = [
        ...selectedTopics.map(
          (topic) =>
            topic.name
        ),
        ...legacyInterestNames,
      ];

      setSaving(true);

      try {
        await PreferenceService.saveInterests(
          namesToSave
        );

        navigation.replace(
          "OnboardingComplete"
        );
      } catch {
        showError(
          "Interests not saved",
          "Poster could not save your selected topics."
        );
      } finally {
        saveRequestRef.current =
          false;

        setSaving(false);
      }
    }, [
      canContinue,
      legacyInterestNames,
      navigation,
      selectedTopics,
      showError,
      showWarning,
    ]);

  const renderTopic:
    ListRenderItem<
      InterestCatalogTopic
    > = useCallback(
      ({ item }) => {
        const selected =
          selectedTopicIds.includes(
            item.id
          );

        return (
          <View
            style={
              styles.topicColumn
            }
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={
                item.name
              }
              accessibilityState={{
                checked: selected,
              }}
              style={({ pressed }) => [
                styles.topicChip,
                {
                  backgroundColor:
                    selected
                      ? colors.surface
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
                toggleTopic(item.id);
              }}
            >
              {selected ? (
                <MaterialCommunityIcons
                  name="check"
                  size={Icons.sm}
                  color={colors.primary}
                />
              ) : null}

              <Text
                numberOfLines={2}
                style={[
                  styles.topicText,
                  {
                    color: selected
                      ? colors.primary
                      : colors.text,
                  },
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          </View>
        );
      },
      [
        colors.border,
        colors.card,
        colors.primary,
        colors.surface,
        colors.text,
        selectedTopicIds,
        toggleTopic,
      ]
    );

  if (loadingPreferences) {
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

        <Text
          style={[
            styles.loadingText,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Loading interests...
        </Text>
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
      <View
        style={
          styles.topContent
        }
      >
        <View
          style={
            styles.navigationRow
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            disabled={saving}
            hitSlop={Spacing.sm}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor:
                  colors.surface,

                borderColor:
                  colors.border,

                opacity: pressed
                  ? 0.62
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
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Choose interests
          </Text>

          <View
            style={
              styles.headerPlaceholder
            }
          />
        </View>

        <Text
          style={[
            styles.instruction,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Select at least{" "}
          {MINIMUM_INTERESTS} topics
        </Text>

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
            accessibilityLabel="Search interest topics"
            value={search}
            placeholder="Search topics"
            placeholderTextColor={
              colors.placeholder
            }
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            editable={!saving}
            style={[
              styles.searchInput,
              {
                color: colors.text,
              },
            ]}
            onChangeText={setSearch}
          />

          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear topic search"
              disabled={saving}
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

        <View
          style={
            styles.selectionRow
          }
        >
          <Text
            style={[
              styles.selectionText,
              {
                color: canContinue
                  ? colors.success
                  : colors.textSecondary,
              },
            ]}
          >
            {canContinue
              ? `${totalSelected} selected`
              : `${totalSelected} of ${MINIMUM_INTERESTS} selected`}
          </Text>

          {totalSelected > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all selected topics"
              disabled={saving}
              hitSlop={Spacing.sm}
              onPress={
                clearSelection
              }
            >
              <Text
                style={[
                  styles.clearText,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                Clear
              </Text>
            </Pressable>
          ) : null}
        </View>

        {totalSelected > 0 ? (
          <ScrollView
            style={
              styles.selectedScroll
            }
            contentContainerStyle={
              styles.selectedSection
            }
            nestedScrollEnabled
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            {selectedTopics.map(
              (topic) => (
                <Pressable
                  key={topic.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${topic.name}`}
                  style={[
                    styles.selectedChip,
                    {
                      backgroundColor:
                        colors.surface,

                      borderColor:
                        colors.border,
                    },
                  ]}
                  onPress={() => {
                    toggleTopic(
                      topic.id
                    );
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectedChipText,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {topic.name}
                  </Text>

                  <MaterialCommunityIcons
                    name="close"
                    size={Icons.sm}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              )
            )}

            {legacyInterestNames.map(
              (interestName) => (
                <Pressable
                  key={`legacy-${interestName}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${interestName}`}
                  style={[
                    styles.selectedChip,
                    {
                      backgroundColor:
                        colors.surface,

                      borderColor:
                        colors.border,
                    },
                  ]}
                  onPress={() => {
                    removeLegacyInterest(
                      interestName
                    );
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectedChipText,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    {interestName}
                  </Text>

                  <MaterialCommunityIcons
                    name="close"
                    size={Icons.sm}
                    color={
                      colors.textSecondary
                    }
                  />
                </Pressable>
              )
            )}
          </ScrollView>
        ) : null}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
              },
            ]}
          >
            {normalizedSearch
              ? "Search results"
              : "Popular topics"}
          </Text>

          <Text
            style={[
              styles.resultCount,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {visibleTopics.length}
          </Text>
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={visibleTopics}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderTopic}
        numColumns={2}
        ListEmptyComponent={
          <EmptyState
            variant="interests"
            title="No topics found"
            description="Try another search."
            actionLabel="Clear Search"
            onAction={() => {
              setSearch("");
            }}
          />
        }
        columnWrapperStyle={
          visibleTopics.length > 1
            ? styles.columnWrapper
            : undefined
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={18}
        maxToRenderPerBatch={18}
        windowSize={8}
      />

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor:
              colors.background,

            borderTopColor:
              colors.border,
          },
        ]}
      >
        <View
          style={
            styles.bottomStatus
          }
        >
          <Text
            style={[
              styles.bottomStatusText,
              {
                color: canContinue
                  ? colors.success
                  : colors.text,
              },
            ]}
          >
            {canContinue
              ? `${totalSelected} selected`
              : `${remainingRequired} more required`}
          </Text>
        </View>

        <View
          style={
            styles.buttonContainer
          }
        >
          <PrimaryButton
            title={`Continue (${totalSelected})`}
            loading={saving}
            disabled={
              !canContinue ||
              saving
            }
            onPress={
              handleContinue
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  list: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.screen,
  },

  loadingText: {
    ...Typography.body,

    marginTop:
      Spacing.md,
  },

  topContent: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.md,
  },

  listContent: {
    flexGrow: 1,

    paddingHorizontal:
      Spacing.screen,

    paddingBottom: 120,
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

    alignItems: "center",

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.md,
  },

  headerTitle: {
    ...Typography.headline,

    fontWeight: "800",

    textAlign: "center",
  },

  headerPlaceholder: {
    width: 42,
  },

  instruction: {
    ...Typography.body,

    textAlign: "center",

    marginTop:
      Spacing.md,
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

  selectionRow: {
    minHeight: 40,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginTop:
      Spacing.md,
  },

  selectionText: {
    ...Typography.small,

    fontWeight: "700",
  },

  clearText: {
    ...Typography.small,

    fontWeight: "800",
  },

  selectedScroll: {
    maxHeight: 180,

    marginTop:
      Spacing.sm,
  },

  selectedSection: {
    flexDirection: "row",

    flexWrap: "wrap",
  },

  selectedChip: {
    maxWidth: "100%",

    minHeight: 36,

    flexDirection: "row",

    alignItems: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,

    paddingHorizontal:
      Spacing.md,

    marginRight:
      Spacing.sm,

    marginBottom:
      Spacing.sm,
  },

  selectedChipText: {
    ...Typography.small,

    maxWidth: 210,

    fontWeight: "700",

    marginRight:
      Spacing.xs,
  },

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginTop:
      Spacing.lg,

    marginBottom:
      Spacing.md,
  },

  sectionTitle: {
    ...Typography.headline,

    fontWeight: "800",
  },

  resultCount: {
    ...Typography.small,

    fontWeight: "700",
  },

  columnWrapper: {
    marginHorizontal:
      -Spacing.xs,
  },

  topicColumn: {
    flex: 1,

    paddingHorizontal:
      Spacing.xs,

    marginBottom:
      Spacing.sm,
  },

  topicChip: {
    minHeight: 44,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderRadius:
      Radius.round,

    paddingHorizontal:
      Spacing.md,

    paddingVertical:
      Spacing.sm,
  },

  topicText: {
    ...Typography.caption,

    flexShrink: 1,

    fontWeight: "700",

    lineHeight: 18,

    textAlign: "center",

    marginLeft:
      Spacing.xs,
  },

  bottomBar: {
    position: "absolute",

    left: 0,

    right: 0,

    bottom: 0,

    minHeight: 82,

    flexDirection: "row",

    alignItems: "center",

    borderTopWidth:
      StyleSheet.hairlineWidth,

    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.sm,

    paddingBottom:
      Spacing.lg,
  },

  bottomStatus: {
    flex: 1,

    marginRight:
      Spacing.md,
  },

  bottomStatusText: {
    ...Typography.caption,

    fontWeight: "800",
  },

  buttonContainer: {
    width: 190,

    flexShrink: 0,
  },
});
