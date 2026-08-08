import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  SectionList,
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

import useFeedback from "../../context/FeedbackContext";

import {
  getAllInterestCategories,
  InterestCategoryDefinition,
} from "../../data/interests";

import {
  RootStackParamList,
} from "../../navigation/AppNavigator";

import InterestCatalogService, {
  InterestCatalogTopic,
} from "../../services/InterestCatalogService";
import ProfileService from "../../services/ProfileService";
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
  "ManageInterests"
>;

interface TopicRow {
  topics: InterestCatalogTopic[];
}

interface DisplaySection {
  id: string;
  title: string;
  data: TopicRow[];
}

const SEARCH_RESULT_LIMIT = 80;

  function normalizeText(
  value?: string
): string {
  return (
    value
      ?.trim()
      .replace(/\s+/g, " ")
      .toLowerCase() ?? ""
  );
}

function createTopicRows(
  topics: InterestCatalogTopic[]
): TopicRow[] {
  const rows: TopicRow[] = [];

  for (
    let index = 0;
    index < topics.length;
    index += 2
  ) {
    rows.push({
      topics: topics.slice(
        index,
        index + 2
      ),
    });
  }

  return rows;
}

function matchesTopicSearch(
  topic: InterestCatalogTopic,
  query: string,
  categoryName: string,
  domainName: string
): boolean {
  const normalizedQuery =
    normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    topic.name,
    topic.description,
    categoryName,
    domainName,
    ...(topic.aliases ?? []),
    ...(topic.searchKeywords ?? []),
  ];

  return searchableValues.some(
    (value) =>
      normalizeText(value).includes(
        normalizedQuery
      )
  );
}

function createSortedValues(
  values: readonly string[]
): string[] {
  return [...values]
    .map((value) =>
      value.trim()
    )
    .filter(Boolean)
    .sort((first, second) =>
      first.localeCompare(
        second,
        undefined,
        {
          sensitivity: "base",
        }
      )
    );
}

function resolveStoredInterest(
  value: string,
  topics: readonly InterestCatalogTopic[]
): InterestCatalogTopic | undefined {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return undefined;
  }

  return topics.find(
    (topic) => {
      if (
        normalizeText(
          topic.id
        ) ===
          normalizedValue ||
        normalizeText(
          topic.slug
        ) ===
          normalizedValue ||
        normalizeText(
          topic.name
        ) ===
          normalizedValue
      ) {
        return true;
      }

      return topic.aliases.some(
        (alias) =>
          normalizeText(
            alias
          ) ===
          normalizedValue
      );
    }
  );
}

function getTopicContext(
  topic: InterestCatalogTopic,
  topicById: ReadonlyMap<
    string,
    InterestCatalogTopic
  >
): {
  categoryName: string;
  domainName: string;
} {
  let categoryName =
    topic.categoryName ?? "";

  let domainName =
    topic.domainName ?? "";

  if (
    categoryName &&
    domainName
  ) {
    return {
      categoryName,
      domainName,
    };
  }

  for (
    const parentTopicId of
      topic.parentTopicIds
  ) {
    const parentTopic =
      topicById.get(
        parentTopicId
      );

    if (!parentTopic) {
      continue;
    }

    categoryName =
      categoryName ||
      parentTopic
        .categoryName ||
      "";

    domainName =
      domainName ||
      parentTopic
        .domainName ||
      "";

    if (
      categoryName &&
      domainName
    ) {
      break;
    }
  }

  return {
    categoryName,
    domainName,
  };
}

interface TopicRowItemProps {
  topics: InterestCatalogTopic[];
  firstSelected: boolean;
  secondSelected: boolean;
  surfaceColor: string;
  cardColor: string;
  borderColor: string;
  primaryColor: string;
  textColor: string;
  onToggleTopic: (
    topicId: string
  ) => void;
}

const TopicRowItem = memo(
  function TopicRowItem({
    topics,
    firstSelected,
    secondSelected,
    surfaceColor,
    cardColor,
    borderColor,
    primaryColor,
    textColor,
    onToggleTopic,
  }: TopicRowItemProps) {
    return (
      <View style={styles.topicRow}>
        {topics.map(
          (topic, index) => {
            const selected =
              index === 0
                ? firstSelected
                : secondSelected;

            return (
              <Pressable
                key={topic.id}
                accessibilityRole="checkbox"
                accessibilityLabel={
                  topic.name
                }
                accessibilityState={{
                  checked: selected,
                }}
                style={({ pressed }) => [
                  styles.topicChip,
                  {
                    backgroundColor:
                      selected
                        ? surfaceColor
                        : cardColor,

                    borderColor:
                      selected
                        ? primaryColor
                        : borderColor,

                    opacity: pressed
                      ? 0.62
                      : 1,
                  },
                ]}
                onPress={() => {
                  onToggleTopic(
                    topic.id
                  );
                }}
              >
                {selected ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={Icons.sm}
                    color={
                      primaryColor
                    }
                  />
                ) : null}

                <Text
                  numberOfLines={2}
                  style={[
                    styles.topicText,
                    {
                      color: selected
                        ? primaryColor
                        : textColor,
                    },
                  ]}
                >
                  {topic.name}
                </Text>
              </Pressable>
            );
          }
        )}

        {topics.length === 1 ? (
          <View
            style={
              styles.topicPlaceholder
            }
          />
        ) : null}
      </View>
    );
  }
);

export default function ManageInterestsScreen({
  navigation,
}: Props) {
  const { colors } = useTheme();

  const {
    showError,
    showSuccess,
  } = useFeedback();

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
    originalSelectedNames,
    setOriginalSelectedNames,
  ] = useState<string[]>([]);

  const [
    catalogTopics,
    setCatalogTopics,
  ] = useState<InterestCatalogTopic[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const categories =
    useMemo(
      () =>
        getAllInterestCategories(),
      []
    );

  const topicById =
    useMemo(() => {
      return new Map(
        catalogTopics.map(
          (topic) => [
            topic.id,
            topic,
          ]
        )
      );
    }, [catalogTopics]);

  const categoryIdByName =
    useMemo(() => {
      return new Map(
        categories.map(
          (category) => [
            normalizeText(
              category.name
            ),
            category.id,
          ]
        )
      );
    }, [categories]);

  const topicRowsByCategoryId =
    useMemo(() => {
      const topicsByCategory =
        new Map<
          string,
          InterestCatalogTopic[]
        >();

      catalogTopics.forEach(
        (topic) => {
          const {
            categoryName,
          } = getTopicContext(
            topic,
            topicById
          );

          const categoryId =
            categoryIdByName.get(
              normalizeText(
                categoryName
              )
            );

          if (!categoryId) {
            return;
          }

          const currentTopics =
            topicsByCategory.get(
              categoryId
            );

          if (currentTopics) {
            currentTopics.push(
              topic
            );

            return;
          }

          topicsByCategory.set(
            categoryId,
            [topic]
          );
        }
      );

      return new Map(
        Array.from(
          topicsByCategory.entries()
        ).map(
          ([
            categoryId,
            topics,
          ]) => [
            categoryId,
            createTopicRows(
              topics
            ),
          ]
        )
      );
    }, [
      catalogTopics,
      categoryIdByName,
      topicById,
    ]);

  const ungroupedTopicRows =
    useMemo(() => {
      const topics =
        catalogTopics.filter(
          (topic) => {
            const {
              categoryName,
            } = getTopicContext(
              topic,
              topicById
            );

            return !categoryIdByName.has(
              normalizeText(
                categoryName
              )
            );
          }
        );

      return createTopicRows(
        topics
      );
    }, [
      catalogTopics,
      categoryIdByName,
      topicById,
    ]);

  const loadInterests =
    useCallback(async () => {
      setLoading(true);

      try {
        const [
          storedInterests,
          catalog,
        ] = await Promise.all([
          PreferenceService.getInterests(),
          InterestCatalogService.getCatalog(),
        ]);

        const resolvedIds:
          string[] = [];

        const unresolvedNames:
          string[] = [];

        const resolvedDisplayValues:
          string[] = [];

        storedInterests.forEach(
          (storedInterest) => {
            const topic =
              resolveStoredInterest(
                storedInterest,
                catalog.topics
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

                resolvedDisplayValues.push(
                  topic.name
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

              resolvedDisplayValues.push(
                cleanName
              );
            }
          }
        );

        setCatalogTopics(
          catalog.topics
        );

        setSelectedTopicIds(
          resolvedIds
        );

        setLegacyInterestNames(
          unresolvedNames
        );

        setOriginalSelectedNames(
          createSortedValues(
            resolvedDisplayValues
          )
        );
      } catch {
        showError(
          "Interests unavailable",
          "Your saved interests could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }, [showError]);

  useEffect(() => {
    void loadInterests();
  }, [loadInterests]);

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

  const selectedTopicIdSet =
    useMemo(
      () =>
        new Set(
          selectedTopicIds
        ),
      [selectedTopicIds]
    );

  const selectedNames =
    useMemo(() => {
      return [
        ...selectedTopics.map(
          (topic) =>
            topic.name
        ),
        ...legacyInterestNames,
      ];
    }, [
      legacyInterestNames,
      selectedTopics,
    ]);

  const totalSelected =
    selectedNames.length;

  const normalizedSearch =
    normalizeText(search);

  const sections =
    useMemo<DisplaySection[]>(() => {
      if (normalizedSearch) {
        const results =
          catalogTopics
            .filter((topic) => {
              const {
                categoryName,
                domainName,
              } = getTopicContext(
                topic,
                topicById
              );

              return matchesTopicSearch(
                topic,
                normalizedSearch,
                categoryName,
                domainName
              );
            })
            .slice(
              0,
              SEARCH_RESULT_LIMIT
            );

        if (
          results.length === 0
        ) {
          return [];
        }

        return [
          {
            id: "search-results",
            title: "Search results",
            data:
              createTopicRows(
                results
              ),
          },
        ];
      }

      const categorySections =
        categories.flatMap(
          (
            category:
              InterestCategoryDefinition
          ) => {
            const topicRows =
              topicRowsByCategoryId.get(
                category.id
              );

            if (
              !topicRows ||
              topicRows.length === 0
            ) {
              return [];
            }

            return [
              {
                id:
                  category.id,

                title:
                  category.name,

                data:
                  topicRows,
              },
            ];
          }
        );

      if (
        ungroupedTopicRows.length >
        0
      ) {
        categorySections.push({
          id:
            "evolving-topics",

          title:
            "Emerging topics",

          data:
            ungroupedTopicRows,
        });
      }

      return categorySections;
    }, [
      catalogTopics,
      categories,
      normalizedSearch,
      topicById,
      topicRowsByCategoryId,
      ungroupedTopicRows,
    ]);

  const hasChanges =
    useMemo(() => {
      const currentValues =
        createSortedValues(
          selectedNames
        );

      return (
        JSON.stringify(
          originalSelectedNames
        ) !==
        JSON.stringify(
          currentValues
        )
      );
    }, [
      originalSelectedNames,
      selectedTopicIds,
      selectedNames,
    ]);

  const toggleTopic =
    useCallback(
      (topicId: string) => {
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
      []
    );

  const removeLegacyInterest =
    useCallback(
      (interestName: string) => {
        setLegacyInterestNames(
          (currentNames) =>
            currentNames.filter(
              (currentName) =>
                currentName !==
                interestName
            )
        );
      },
      []
    );

  const clearAll =
    useCallback(() => {
      if (
        totalSelected === 0
      ) {
        return;
      }

      Alert.alert(
        "Clear all interests?",
        "All selected topics will be removed.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: () => {
              setSelectedTopicIds(
                []
              );

              setLegacyInterestNames(
                []
              );
            },
          },
        ]
      );
    }, [totalSelected]);

  const saveChanges =
    useCallback(async () => {
      if (
        !hasChanges ||
        saving
      ) {
        return;
      }

      setSaving(true);

      try {
        const selectedTopicIdsToSync = [
          ...selectedTopicIds,
        ];

        await PreferenceService.saveInterests(
          selectedNames
        );

        try {
          await ProfileService.updateSelectedInterests(
            selectedTopicIdsToSync
          );
        } catch {
          // Preserve the local account-interest save when Backend sync is unavailable.
          // The next successful authenticated save can reconcile Backend state.
        }

        showSuccess(
          "Interests updated",
          "Your interests were saved."
        );

        navigation.goBack();
      } catch {
        showError(
          "Interests not saved",
          "Your selections could not be saved."
        );
      } finally {
        setSaving(false);
      }
    }, [
      hasChanges,
      navigation,
      saving,
      selectedNames,
      showError,
      showSuccess,
    ]);

  const leaveScreen =
    useCallback(() => {
      if (saving) {
        return;
      }

      if (!hasChanges) {
        navigation.goBack();

        return;
      }

      Alert.alert(
        "Discard changes?",
        "Your unsaved selections will be lost.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    }, [
      hasChanges,
      navigation,
      saving,
    ]);

  const renderTopicRow =
    useCallback(
      ({
        item,
      }: {
        item: TopicRow;
      }) => (
        <TopicRowItem
          topics={
            item.topics
          }
          firstSelected={
            selectedTopicIdSet.has(
              item.topics[0]?.id ??
                ""
            )
          }
          secondSelected={
            selectedTopicIdSet.has(
              item.topics[1]?.id ??
                ""
            )
          }
          surfaceColor={
            colors.surface
          }
          cardColor={
            colors.card
          }
          borderColor={
            colors.border
          }
          primaryColor={
            colors.primary
          }
          textColor={
            colors.text
          }
          onToggleTopic={
            toggleTopic
          }
        />
      ),
      [
        colors.border,
        colors.card,
        colors.primary,
        colors.surface,
        colors.text,
        selectedTopicIdSet,
        toggleTopic,
      ]
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
      <View
        style={[
          styles.navigationBar,
          {
            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.navigationButton,
            {
              opacity: pressed
                ? 0.55
                : 1,
            },
          ]}
          onPress={leaveScreen}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={Icons.md}
            color={colors.icon}
          />
        </Pressable>

        <Text
          style={[
            styles.navigationTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Manage Interests
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear all interests"
          disabled={
            totalSelected === 0
          }
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.clearButton,
            {
              opacity:
                totalSelected === 0
                  ? 0.3
                  : pressed
                  ? 0.55
                  : 1,
            },
          ]}
          onPress={clearAll}
        >
          <Text
            style={[
              styles.clearText,
              {
                color: colors.danger,
              },
            ]}
          >
            Clear
          </Text>
        </Pressable>
      </View>

      <View
        style={
          styles.topContent
        }
      >
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

        <View
          style={
            styles.selectionHeader
          }
        >
          <Text
            style={[
              styles.selectionCount,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {totalSelected} selected
          </Text>

          {hasChanges ? (
            <Text
              style={[
                styles.unsavedText,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              Unsaved
            </Text>
          ) : null}
        </View>

        {selectedNames.length >
        0 ? (
          <ScrollView
            style={
              styles.selectedScroll
            }
            contentContainerStyle={
              styles.selectedChips
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
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(
          row,
          index
        ) =>
          `${row.topics
            .map(
              (topic) =>
                topic.id
            )
            .join("-")}-${index}`
        }
        showsVerticalScrollIndicator={
          false
        }
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.listContent
        }
        renderSectionHeader={({
          section,
        }) => (
          <View
            style={[
              styles.sectionHeader,
              {
                backgroundColor:
                  colors.background,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              {section.title}
            </Text>
          </View>
        )}
        renderItem={
          renderTopicRow
        }
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
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={16}
        windowSize={7}
        removeClippedSubviews
      />

      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              colors.background,

            borderTopColor:
              colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save interests"
          disabled={
            !hasChanges ||
            saving
          }
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor:
                colors.primary,

              opacity:
                !hasChanges ||
                saving
                  ? 0.4
                  : pressed
                  ? 0.75
                  : 1,
            },
          ]}
          onPress={() => {
            void saveChanges();
          }}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={
                colors.onPrimary
              }
            />
          ) : (
            <Text
              style={[
                styles.saveText,
                {
                  color:
                    colors.onPrimary,
                },
              ]}
            >
              Save
              {totalSelected > 0
                ? ` (${totalSelected})`
                : ""}
            </Text>
          )}
        </Pressable>
      </View>
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

  navigationBar: {
    minHeight: 60,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    paddingHorizontal:
      Spacing.screen,
  },

  navigationButton: {
    width: 44,

    height: 44,

    alignItems: "flex-start",

    justifyContent: "center",
  },

  navigationTitle: {
    ...Typography.headline,

    fontWeight: "800",
  },

  clearButton: {
    width: 44,

    minHeight: 44,

    alignItems: "flex-end",

    justifyContent: "center",
  },

  clearText: {
    ...Typography.small,

    fontWeight: "700",
  },

  topContent: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
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
  },

  searchInput: {
    flex: 1,

    minHeight: 48,

    ...Typography.body,

    marginHorizontal:
      Spacing.sm,

    paddingVertical: 0,
  },

  selectionHeader: {
    minHeight: 38,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginTop:
      Spacing.sm,
  },

  selectionCount: {
    ...Typography.small,

    fontWeight: "700",
  },

  unsavedText: {
    ...Typography.small,

    fontWeight: "700",
  },

  selectedScroll: {
    maxHeight: 180,

    marginTop:
      Spacing.xs,

    marginBottom:
      Spacing.sm,
  },

  selectedChips: {
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

  listContent: {
    paddingHorizontal:
      Spacing.screen,

    paddingBottom: 110,
  },

  sectionHeader: {
    paddingTop:
      Spacing.lg,

    paddingBottom:
      Spacing.sm,
  },

  sectionTitle: {
    ...Typography.body,

    fontWeight: "800",
  },

  topicRow: {
    flexDirection: "row",

    marginHorizontal:
      -Spacing.xs,

    marginBottom:
      Spacing.sm,
  },

  topicChip: {
    flex: 1,

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

    marginHorizontal:
      Spacing.xs,
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

  topicPlaceholder: {
    flex: 1,

    marginHorizontal:
      Spacing.xs,
  },

  footer: {
    position: "absolute",

    left: 0,

    right: 0,

    bottom: 0,

    borderTopWidth:
      StyleSheet.hairlineWidth,

    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.sm,

    paddingBottom:
      Spacing.lg,
  },

  saveButton: {
    minHeight: 50,

    alignItems: "center",

    justifyContent: "center",

    borderRadius:
      Radius.lg,
  },

  saveText: {
    ...Typography.body,

    fontWeight: "800",
  },
});