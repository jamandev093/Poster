import React, {
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
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

type IconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

interface InputProps
  extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;

  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;

  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function Input({
  label,
  error,
  helperText,

  leftIcon,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,

  containerStyle,
  inputContainerStyle,
  labelStyle,
  style,

  editable = true,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityState,

  ...props
}: InputProps) {
  const { colors } = useTheme();

  const [focused, setFocused] =
    useState(false);

  useEffect(() => {
    if (
      editable ||
      !focused
    ) {
      return;
    }

    setFocused(false);
  }, [
    editable,
    focused,
  ]);

  const handleFocus: TextInputProps["onFocus"] = (
    event
  ) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps["onBlur"] = (
    event
  ) => {
    setFocused(false);
    onBlur?.(event);
  };

  const supportingText =
    error || helperText;

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View
      style={[
        styles.container,
        containerStyle,
      ]}
    >
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor:
              colors.surface,

            borderColor,

            opacity: editable
              ? 1
              : 0.6,
          },
          inputContainerStyle,
        ]}
      >
        {leftIcon ? (
          <MaterialCommunityIcons
            accessible={false}
            name={leftIcon}
            size={Icons.md}
            color={
              focused
                ? colors.primary
                : colors.icon
            }
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...props}
          accessibilityLabel={
            accessibilityLabel ??
            label ??
            props.placeholder
          }
          accessibilityState={{
            ...accessibilityState,

            disabled:
              !editable ||
              Boolean(
                accessibilityState
                  ?.disabled
              ),
          }}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={
            colors.placeholder
          }
          selectionColor={
            colors.primary
          }
          cursorColor={colors.primary}
          style={[
            styles.input,
            {
              color: colors.text,
            },
            style,
          ]}
        />

        {rightIcon ? (
          onRightIconPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                rightIconAccessibilityLabel ??
                `${label ?? "Input"} action`
              }
              accessibilityState={{
                disabled:
                  !editable,
              }}
              hitSlop={Spacing.sm}
              disabled={!editable}
              style={({ pressed }) => [
                styles.rightIconButton,
                {
                  opacity: pressed
                    ? 0.55
                    : 1,
                },
              ]}
              onPress={
                onRightIconPress
              }
            >
              <MaterialCommunityIcons
                accessible={false}
                name={rightIcon}
                size={Icons.md}
                color={colors.icon}
              />
            </Pressable>
          ) : (
            <View
              pointerEvents="none"
              style={
                styles.rightIconButton
              }
            >
              <MaterialCommunityIcons
                accessible={false}
                name={rightIcon}
                size={Icons.md}
                color={colors.icon}
              />
            </View>
          )
        ) : null}
      </View>

      {supportingText ? (
        <Text
          accessibilityLiveRegion={
            error ? "polite" : "none"
          }
          style={[
            styles.supportingText,
            {
              color: error
                ? colors.danger
                : colors.textSecondary,
            },
          ]}
        >
          {supportingText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  label: {
    ...Typography.caption,

    fontWeight: "700",

    marginBottom:
      Spacing.sm,
  },

  inputContainer: {
    minHeight: 56,

    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderRadius:
      Radius.lg,

    paddingHorizontal:
      Spacing.lg,
  },

  leftIcon: {
    marginRight:
      Spacing.md,
  },

  input: {
    flex: 1,

    minHeight: 54,

    paddingVertical:
      Spacing.md,

    ...Typography.body,
  },

  rightIconButton: {
    minWidth: 40,

    minHeight: 44,

    justifyContent: "center",

    alignItems: "flex-end",

    marginLeft:
      Spacing.sm,
  },

  supportingText: {
    ...Typography.small,

    lineHeight: 18,

    marginTop:
      Spacing.sm,

    paddingHorizontal:
      Spacing.xs,
  },
});