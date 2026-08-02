import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import useTheme from "../../theme/useTheme";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";

interface SearchBarProps {
  value: string;

  onChangeText: (
    text: string
  ) => void;

  placeholder?: string;

  onSubmit?: () => void;

  onClear?: () => void;

  onFocus?: () => void;

  onBlur?: () => void;

  onFilterPress?: () => void;

  showFilter?: boolean;

  autoFocus?: boolean;
}

const SearchBar = forwardRef<
  TextInput,
  SearchBarProps
>(function SearchBar(
  {
    value,
    onChangeText,
    placeholder =
      "Search articles, topics, publishers...",
    onSubmit,
    onClear,
    onFocus,
    onBlur,
    onFilterPress,
    showFilter = true,
    autoFocus = false,
  },
  forwardedRef
) {
  const { colors } = useTheme();

  const inputRef =
    useRef<TextInput>(null);

  useImperativeHandle(
    forwardedRef,
    () =>
      inputRef.current as TextInput
  );

  const hasValue =
    value.trim().length > 0;

  const handleSearchPress = () => {
    if (hasValue) {
      onSubmit?.();

      return;
    }

    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChangeText("");

    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
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
        accessibilityLabel={
          hasValue
            ? "Submit search"
            : "Focus search"
        }
        hitSlop={Spacing.sm}
        style={({ pressed }) => [
          styles.searchButton,
          {
            opacity: pressed
              ? 0.55
              : 1,
          },
        ]}
        onPress={
          handleSearchPress
        }
      >
        <MaterialCommunityIcons
          accessible={false}
          name="magnify"
          size={Icons.lg}
          color={colors.placeholder}
        />
      </Pressable>

      <TextInput
        ref={inputRef}
        accessibilityLabel="Search articles, topics, and publishers"
        value={value}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={
          colors.placeholder
        }
        selectionColor={
          colors.primary
        }
        style={[
          styles.input,
          {
            color: colors.text,
          },
        ]}
        onChangeText={
          onChangeText
        }
        onSubmitEditing={() => {
          onSubmit?.();
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      {hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.iconButton,
            {
              opacity: pressed
                ? 0.55
                : 1,
            },
          ]}
          onPress={
            handleClear
          }
        >
          <MaterialCommunityIcons
            accessible={false}
            name="close-circle"
            size={Icons.lg}
            color={
              colors.placeholder
            }
          />
        </Pressable>
      ) : null}

      {showFilter &&
      onFilterPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open search filters"
          hitSlop={Spacing.sm}
          style={({ pressed }) => [
            styles.iconButton,
            styles.filterButton,
            {
              opacity: pressed
                ? 0.55
                : 1,
            },
          ]}
          onPress={
            onFilterPress
          }
        >
          <MaterialCommunityIcons
            accessible={false}
            name="tune-variant"
            size={Icons.lg}
            color={
              colors.placeholder
            }
          />
        </Pressable>
      ) : null}
    </View>
  );
});

export default SearchBar;

const styles =
  StyleSheet.create({
    container: {
      minHeight: 54,

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal:
        Spacing.lg,

      borderRadius:
        Radius.lg,

      borderWidth:
        StyleSheet.hairlineWidth,
    },

    searchButton: {
      justifyContent:
        "center",

      alignItems:
        "center",
    },

    input: {
      flex: 1,

      minHeight: 52,

      marginLeft:
        Spacing.md,

      ...Typography.body,
    },

    iconButton: {
      width: 36,

      height: 36,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    filterButton: {
      marginLeft:
        Spacing.xs,
    },
  });