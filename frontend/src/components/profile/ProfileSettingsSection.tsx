import React, {
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

interface ProfileSettingsSectionProps {
  darkMode: boolean;

  onToggleDarkMode: (
    enabled: boolean
  ) => void;

  onBookmarksPress: () => void;

  onPrivacyAdvertisingPress:
    () => void;

  onLogoutPress: () => void;

  onDeleteAccountPress:
    () => void;
}

interface CompactToggleProps {
  value: boolean;

  accessibilityLabel: string;

  onValueChange: (
    value: boolean
  ) => void;
}

interface SettingsRowProps {
  icon:
    | "weather-night"
    | "bookmark-outline"
    | "shield-outline"
    | "logout"
    | "delete-outline";

  title: string;

  destructive?: boolean;

  warning?: boolean;

  toggleValue?: boolean;

  toggleAccessibilityLabel?: string;

  onToggleChange?: (
    value: boolean
  ) => void;

  onPress?: () => void;
}

function CompactToggle({
  value,
  accessibilityLabel,
  onValueChange,
}: CompactToggleProps) {
  const { colors } = useTheme();

  const [
    localValue,
    setLocalValue,
  ] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handlePress = () => {
    const nextValue =
      !localValue;

    setLocalValue(
      nextValue
    );

    onValueChange(
      nextValue
    );
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={
        accessibilityLabel
      }
      accessibilityState={{
        checked: localValue,
      }}
      hitSlop={Spacing.sm}
      style={styles.togglePressable}
      onPress={handlePress}
    >
      <View
        style={[
          styles.toggleTrack,
          {
            backgroundColor:
              localValue
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
                  translateX:
                    localValue
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

function SettingsRow({
  icon,
  title,
  destructive = false,
  warning = false,
  toggleValue,
  toggleAccessibilityLabel,
  onToggleChange,
  onPress,
}: SettingsRowProps) {
  const { colors } = useTheme();

  const titleColor = destructive
    ? colors.danger
    : warning
    ? colors.warning
    : colors.text;

  const hasToggle =
    typeof toggleValue ===
      "boolean" &&
    typeof onToggleChange ===
      "function";

  const content = (
    <>
      <MaterialCommunityIcons
        name={icon}
        size={Icons.md}
        color={titleColor}
      />

      <Text
        style={[
          styles.rowTitle,
          {
            color: titleColor,
          },
        ]}
      >
        {title}
      </Text>

      {hasToggle ? (
        <CompactToggle
          value={toggleValue}
          accessibilityLabel={
            toggleAccessibilityLabel ??
            title
          }
          onValueChange={
            onToggleChange
          }
        />
      ) : (
        <MaterialCommunityIcons
          name="chevron-right"
          size={Icons.md}
          color={colors.placeholder}
        />
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.row,
          {
            borderBottomColor:
              colors.border,

            opacity: pressed
              ? 0.55
              : 1,
          },
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      {content}
    </View>
  );
}

export default function ProfileSettingsSection({
  darkMode,
  onToggleDarkMode,
  onBookmarksPress,
  onPrivacyAdvertisingPress,
  onLogoutPress,
  onDeleteAccountPress,
}: ProfileSettingsSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.text,
          },
        ]}
      >
        Preferences
      </Text>

      <View style={styles.section}>
        <SettingsRow
          icon="weather-night"
          title="Dark Mode"
          toggleValue={darkMode}
          toggleAccessibilityLabel="Toggle dark mode"
          onToggleChange={
            onToggleDarkMode
          }
        />

        <SettingsRow
          icon="bookmark-outline"
          title="Bookmarked Articles"
          onPress={
            onBookmarksPress
          }
        />

        <SettingsRow
          icon="shield-outline"
          title="Privacy & Advertising"
          onPress={
            onPrivacyAdvertisingPress
          }
        />
      </View>

      <Text
        style={[
          styles.sectionTitle,
          styles.accountTitle,
          {
            color: colors.text,
          },
        ]}
      >
        Account
      </Text>

      <View style={styles.section}>
        <SettingsRow
          icon="logout"
          title="Log Out"
          warning
          onPress={
            onLogoutPress
          }
        />

        <SettingsRow
          icon="delete-outline"
          title="Delete Account"
          destructive
          onPress={
            onDeleteAccountPress
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom:
      Spacing.xxl,
  },

  sectionTitle: {
    ...Typography.headline,

    fontWeight: "800",

    marginBottom:
      Spacing.sm,
  },

  accountTitle: {
    marginTop:
      Spacing.xl,
  },

  section: {
    width: "100%",
  },

  row: {
    minHeight: 58,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  rowTitle: {
    ...Typography.body,

    flex: 1,

    fontWeight: "600",

    marginLeft:
      Spacing.md,

    marginRight:
      Spacing.md,
  },

  togglePressable: {
    width: 46,

    height: 30,

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
});
