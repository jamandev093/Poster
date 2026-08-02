import React from "react";
import {
  ActivityIndicator,
  Image,
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

interface ProfileHeaderProps {
  name: string;
  email: string;
  username?: string;
  imageUri?: string | null;
  saving?: boolean;
  onPressPhoto: () => void;
  onPressEdit?: () => void;
}

export default function ProfileHeader({
  name,
  email,
  username,
  imageUri,
  saving = false,
  onPressPhoto,
  onPressEdit,
}: ProfileHeaderProps) {
  const { colors } = useTheme();

  const normalizedName =
    name.trim() || "Poster User";

  const normalizedEmail =
    email.trim() ||
    "No email available";

  const normalizedUsername =
    username
      ?.trim()
      .replace(/^@+/, "")
      .toLowerCase() ?? "";

  const initial =
    normalizedName
      .charAt(0)
      .toUpperCase() || "P";

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor:
            colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change profile picture"
        disabled={saving}
        style={({ pressed }) => [
          styles.photoButton,
          {
            opacity: saving
              ? 0.65
              : pressed
              ? 0.75
              : 1,
          },
        ]}
        onPress={onPressPhoto}
      >
        {imageUri ? (
          <Image
            source={{
              uri: imageUri,
            }}
            resizeMode="cover"
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              {
                backgroundColor:
                  colors.surface,

                borderColor:
                  colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarInitial,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              {initial}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.cameraButton,
            {
              backgroundColor:
                colors.background,

              borderColor:
                colors.border,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />
          ) : (
            <MaterialCommunityIcons
              name="camera-outline"
              size={Icons.sm}
              color={colors.primary}
            />
          )}
        </View>
      </Pressable>

      <View style={styles.details}>
        <Text
          numberOfLines={1}
          style={[
            styles.name,
            {
              color: colors.text,
            },
          ]}
        >
          {normalizedName}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.email,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          {normalizedUsername
            ? `@${normalizedUsername} \u00B7 ${normalizedEmail}`
            : normalizedEmail}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        disabled={
          !onPressEdit || saving
        }
        hitSlop={Spacing.sm}
        style={({ pressed }) => [
          styles.editButton,
          {
            opacity:
              !onPressEdit || saving
                ? 0.4
                : pressed
                ? 0.55
                : 1,
          },
        ]}
        onPress={onPressEdit}
      >
        <Text
          style={[
            styles.editText,
            {
              color:
                colors.primary,
            },
          ]}
        >
          Edit
        </Text>

        <MaterialCommunityIcons
          name="chevron-right"
          size={Icons.md}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 112,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    paddingBottom:
      Spacing.xl,

    marginBottom:
      Spacing.xl,
  },

  photoButton: {
    position: "relative",

    flexShrink: 0,
  },

  avatar: {
    width: 76,

    height: 76,

    borderRadius:
      Radius.round,
  },

  avatarPlaceholder: {
    width: 76,

    height: 76,

    alignItems: "center",

    justifyContent: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.round,
  },

  avatarInitial: {
    fontSize: 28,

    fontWeight: "800",
  },

  cameraButton: {
    position: "absolute",

    right: -2,

    bottom: -2,

    width: 28,

    height: 28,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderRadius:
      Radius.round,
  },

  details: {
    flex: 1,

    minWidth: 0,

    marginLeft:
      Spacing.lg,

    marginRight:
      Spacing.md,
  },

  name: {
    ...Typography.headline,

    fontWeight: "800",
  },

  email: {
    ...Typography.body,

    marginTop:
      Spacing.xs,
  },

  editButton: {
    minHeight: 40,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingLeft:
      Spacing.sm,

    flexShrink: 0,
  },

  editText: {
    ...Typography.caption,

    fontWeight: "800",

    marginRight: 2,
  },
});