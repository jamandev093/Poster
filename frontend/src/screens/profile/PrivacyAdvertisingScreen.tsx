import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
  useNavigation,
} from "@react-navigation/native";

import AdvertisingPreferenceService from "../../services/AdvertisingPreferenceService";
import GoogleMobileAdsService from "../../services/GoogleMobileAdsService";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

interface CompactToggleProps {
  value: boolean;

  disabled?: boolean;

  accessibilityLabel: string;

  onValueChange: (
    value: boolean
  ) => void;
}

interface InformationRowProps {
  title: string;

  description: string;

  isLast?: boolean;
}

function CompactToggle({
  value,
  disabled = false,
  accessibilityLabel,
  onValueChange,
}: CompactToggleProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={
        accessibilityLabel
      }
      accessibilityState={{
        checked: value,
        disabled,
      }}
      disabled={disabled}
      hitSlop={Spacing.sm}
      style={[
        styles.togglePressable,
        {
          opacity: disabled
            ? 0.5
            : 1,
        },
      ]}
      onPress={() => {
        onValueChange(!value);
      }}
    >
      <View
        style={[
          styles.toggleTrack,
          {
            backgroundColor: value
              ? colors.primary
              : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.toggleThumb,
            {
              backgroundColor:
                colors.card,

              transform: [
                {
                  translateX: value
                    ? 20
                    : 2,
                },
              ],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

function InformationRow({
  title,
  description,
  isLast = false,
}: InformationRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.informationRow,
        {
          borderBottomColor:
            colors.border,

          borderBottomWidth: isLast
            ? 0
            : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Text
        style={[
          styles.informationTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.informationDescription,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {description}
      </Text>
    </View>
  );
}

export default function PrivacyAdvertisingScreen() {
  const navigation =
    useNavigation();

  const { colors } = useTheme();

  const [
    personalizedAdsEnabled,
    setPersonalizedAdsEnabled,
  ] = useState(false);

  const [
    hiddenItemCount,
    setHiddenItemCount,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    restoringHiddenItems,
    setRestoringHiddenItems,
  ] = useState(false);

  const [
    managingGooglePrivacy,
    setManagingGooglePrivacy,
  ] = useState(false);

  const preferenceRequestRef =
    useRef(false);

  const restoreRequestRef =
    useRef(false);

  const googlePrivacyRequestRef =
    useRef(false);

  const loadPreferences =
    useCallback(async () => {
      setLoading(true);

      try {
        const [
          personalizedAds,
          hiddenItemIds,
        ] = await Promise.all([
          AdvertisingPreferenceService.getPersonalizedAdsEnabled(),
          AdvertisingPreferenceService.getHiddenItemIds(),
        ]);

        setPersonalizedAdsEnabled(
          personalizedAds
        );

        setHiddenItemCount(
          hiddenItemIds.length
        );
      } catch {
        Alert.alert(
          "Preferences unavailable",
          "Your advertising preferences could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const handlePersonalizedAdsChange =
    useCallback(
      async (
        enabled: boolean
      ) => {
        if (
          preferenceRequestRef.current
        ) {
          return;
        }

        preferenceRequestRef.current =
          true;

        const previousValue =
          personalizedAdsEnabled;

        setPersonalizedAdsEnabled(
          enabled
        );

        setSaving(true);

        try {
          await AdvertisingPreferenceService.setPersonalizedAdsEnabled(
            enabled
          );
        } catch {
          setPersonalizedAdsEnabled(
            previousValue
          );

          Alert.alert(
            "Preference not saved",
            "Your advertising preference could not be saved."
          );
        } finally {
          setSaving(false);

          preferenceRequestRef.current =
            false;
        }
      },
      [
        personalizedAdsEnabled,
      ]
    );

  const handleGooglePrivacyOptions =
    useCallback(async () => {
      if (
        googlePrivacyRequestRef.current
      ) {
        return;
      }

      googlePrivacyRequestRef.current =
        true;

      setManagingGooglePrivacy(
        true
      );

      try {
        await GoogleMobileAdsService.showPrivacyOptions();
      } catch {
        Alert.alert(
          "Google privacy options unavailable",
          "Google advertising privacy choices are not available right now."
        );
      } finally {
        setManagingGooglePrivacy(
          false
        );

        googlePrivacyRequestRef.current =
          false;
      }
    }, []);

  const restoreHiddenItems =
    useCallback(async () => {
      if (
        restoreRequestRef.current
      ) {
        return;
      }

      restoreRequestRef.current =
        true;

      setRestoringHiddenItems(
        true
      );

      try {
        await AdvertisingPreferenceService.clearHiddenItems();

        setHiddenItemCount(0);

        Alert.alert(
          "Hidden items restored",
          "Previously hidden commercial content may appear again."
        );
      } catch {
        Alert.alert(
          "Unable to restore",
          "Your hidden-content preferences could not be updated."
        );
      } finally {
        setRestoringHiddenItems(
          false
        );

        restoreRequestRef.current =
          false;
      }
    }, []);

  const handleClearHiddenItems =
    useCallback(() => {
      if (
        restoreRequestRef.current ||
        restoringHiddenItems
      ) {
        return;
      }

      if (
        hiddenItemCount === 0
      ) {
        Alert.alert(
          "No hidden items",
          "You have not hidden any commercial content."
        );

        return;
      }

      Alert.alert(
        "Restore hidden items?",
        "Previously hidden commercial content may appear again.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Restore",
            onPress: () => {
              void restoreHiddenItems();
            },
          },
        ]
      );
    }, [
      hiddenItemCount,
      restoreHiddenItems,
      restoringHiddenItems,
    ]);

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
          numberOfLines={1}
          style={[
            styles.navigationTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Privacy & Advertising
        </Text>

        <View
          style={
            styles.headerPlaceholder
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
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
          Advertising
        </Text>

        <View
          style={
            styles.settingsSection
          }
        >
          <View
            style={[
              styles.settingRow,
              {
                borderBottomColor:
                  colors.border,
              },
            ]}
          >
            <View
              style={
                styles.settingText
              }
            >
              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Personalized ads
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Use your selected interests to improve commercial relevance.
              </Text>
            </View>

            <CompactToggle
              value={
                personalizedAdsEnabled
              }
              disabled={saving}
              accessibilityLabel="Toggle personalized ads"
              onValueChange={
                handlePersonalizedAdsChange
              }
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Google ad privacy choices"
            accessibilityState={{
              disabled:
                managingGooglePrivacy,
            }}
            disabled={
              managingGooglePrivacy
            }
            style={({ pressed }) => [
              styles.settingRow,
              {
                opacity:
                  managingGooglePrivacy
                    ? 0.5
                    : pressed
                    ? 0.55
                    : 1,
              },
            ]}
            onPress={
              handleGooglePrivacyOptions
            }
          >
            <View
              style={
                styles.settingText
              }
            >
              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Google ad privacy choices
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                Manage Google advertising privacy choices when available.
              </Text>
            </View>

            {managingGooglePrivacy ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <MaterialCommunityIcons
                name="chevron-right"
                size={Icons.md}
                color={
                  colors.placeholder
                }
              />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restore hidden commercial content"
            accessibilityState={{
              disabled:
                restoringHiddenItems,
            }}
            disabled={
              restoringHiddenItems
            }
            style={({ pressed }) => [
              styles.settingRow,
              styles.lastSettingRow,
              {
                opacity:
                  restoringHiddenItems
                    ? 0.5
                    : pressed
                    ? 0.55
                    : 1,
              },
            ]}
            onPress={
              handleClearHiddenItems
            }
          >
            <View
              style={
                styles.settingText
              }
            >
              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Hidden items
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {hiddenItemCount === 0
                  ? "No commercial items are hidden."
                  : `${hiddenItemCount} ${
                      hiddenItemCount === 1
                        ? "item"
                        : "items"
                    } hidden.`}
              </Text>
            </View>

            {restoringHiddenItems ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <MaterialCommunityIcons
                name="chevron-right"
                size={Icons.md}
                color={
                  colors.placeholder
                }
              />
            )}
          </Pressable>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            styles.commercialTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Commercial content
        </Text>

        <View
          style={
            styles.informationSection
          }
        >
          <InformationRow
            title="Poster promotions"
            description="Poster may show its own products, features or services."
          />

          <InformationRow
            title="Affiliate links"
            description="Poster may earn a commission from eligible purchases or actions."
          />

          <InformationRow
            title="Sponsored content"
            description="Advertisers may pay for clearly labeled commercial placement."
          />

          <InformationRow
            title="Google ads"
            description="Google advertising is currently disabled."
            isLast
          />
        </View>

      </ScrollView>
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

  backButton: {
    width: 44,

    height: 44,

    alignItems: "flex-start",

    justifyContent: "center",
  },

  navigationTitle: {
    ...Typography.headline,

    flex: 1,

    fontWeight: "800",

    textAlign: "center",

    marginHorizontal:
      Spacing.sm,
  },

  headerPlaceholder: {
    width: 44,
  },

  content: {
    paddingHorizontal:
      Spacing.screen,

    paddingTop:
      Spacing.xl,

    paddingBottom:
      Spacing.xxxl,
  },

  sectionTitle: {
    ...Typography.headline,

    fontWeight: "800",

    marginBottom:
      Spacing.sm,
  },

  commercialTitle: {
    marginTop:
      Spacing.xxl,
  },

  settingsSection: {
    width: "100%",
  },

  settingRow: {
    minHeight: 72,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    paddingVertical:
      Spacing.md,
  },

  lastSettingRow: {
    borderBottomWidth: 0,
  },

  settingText: {
    flex: 1,

    minWidth: 0,

    marginRight:
      Spacing.lg,
  },

  settingTitle: {
    ...Typography.body,

    fontWeight: "700",
  },

  settingDescription: {
    ...Typography.small,

    lineHeight: 18,

    marginTop:
      Spacing.xs,
  },

  togglePressable: {
    width: 46,

    height: 30,

    alignItems: "center",

    justifyContent: "center",
  },

  toggleTrack: {
    width: 44,

    height: 26,

    justifyContent: "center",

    borderRadius:
      Radius.round,
  },

  toggleThumb: {
    width: 22,

    height: 22,

    borderRadius:
      Radius.round,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.12,

    shadowRadius: 2,

    elevation: 2,
  },

  informationSection: {
    width: "100%",
  },

  informationRow: {
    paddingVertical:
      Spacing.md,

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  informationTitle: {
    ...Typography.body,

    fontWeight: "700",
  },

  informationDescription: {
    ...Typography.small,

    lineHeight: 19,

    marginTop:
      Spacing.xs,
  },

});