import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import useTheme from "../../theme/useTheme";

import {
  Icons,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "../../theme";

export type MonetizationFeedbackReasonId =
  | "not_relevant"
  | "seen_too_often"
  | "misleading"
  | "inappropriate"
  | "broken_destination"
  | "other";

export interface MonetizationFeedbackReason {
  id:
    MonetizationFeedbackReasonId;

  label: string;

  description: string;

  icon:
    | "target-account"
    | "repeat"
    | "alert-decagram-outline"
    | "shield-alert-outline"
    | "link-variant-off"
    | "dots-horizontal-circle-outline";
}

export const MONETIZATION_FEEDBACK_REASONS:
  MonetizationFeedbackReason[] = [
    {
      id: "not_relevant",
      label: "Not relevant to me",
      description:
        "This promotion does not match my interests.",
      icon: "target-account",
    },
    {
      id: "seen_too_often",
      label: "I see this too often",
      description:
        "Reduce how frequently this promotion appears.",
      icon: "repeat",
    },
    {
      id: "misleading",
      label: "Misleading or inaccurate",
      description:
        "The promotion may contain confusing or unsupported claims.",
      icon:
        "alert-decagram-outline",
    },
    {
      id: "inappropriate",
      label: "Inappropriate content",
      description:
        "The content may be unsafe, offensive or unsuitable.",
      icon:
        "shield-alert-outline",
    },
    {
      id: "broken_destination",
      label: "Broken or unsafe destination",
      description:
        "The link does not work or the destination appears unsafe.",
      icon:
        "link-variant-off",
    },
    {
      id: "other",
      label: "Something else",
      description:
        "Report another issue with this promotion.",
      icon:
        "dots-horizontal-circle-outline",
    },
  ];

interface MonetizationFeedbackSheetProps {
  visible: boolean;

  title?: string;

  onClose: () => void;

  onSelectReason: (
    reason:
      MonetizationFeedbackReason
  ) => void;
}

export default function MonetizationFeedbackSheet({
  visible,
  title =
    "Tell us about this promotion",
  onClose,
  onSelectReason,
}: MonetizationFeedbackSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor:
              colors.overlay,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close promotion feedback"
          style={
            StyleSheet.absoluteFill
          }
          onPress={onClose}
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            Shadows.xl,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                backgroundColor:
                  colors.border,
              },
            ]}
          />

          <View
            style={styles.header}
          >
            <View
              style={styles.headerText}
            >
              <Text
                style={[
                  styles.title,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {title}
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
                Your feedback helps Poster improve commercial content quality.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={Spacing.sm}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor:
                    colors.surface,

                  borderColor:
                    colors.border,

                  opacity: pressed
                    ? 0.6
                    : 1,
                },
              ]}
              onPress={onClose}
            >
              <MaterialCommunityIcons
                name="close"
                size={Icons.md}
                color={colors.icon}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            bounces={false}
            contentContainerStyle={
              styles.reasons
            }
          >
            {MONETIZATION_FEEDBACK_REASONS.map(
              (reason) => (
                <Pressable
                  key={reason.id}
                  accessibilityRole="button"
                  accessibilityLabel={
                    reason.label
                  }
                  style={({ pressed }) => [
                    styles.reasonRow,
                    {
                      backgroundColor:
                        colors.surface,

                      borderColor:
                        colors.border,

                      opacity: pressed
                        ? 0.65
                        : 1,
                    },
                  ]}
                  onPress={() =>
                    onSelectReason(
                      reason
                    )
                  }
                >
                  <View
                    style={[
                      styles.reasonIcon,
                      {
                        backgroundColor:
                          colors.card,

                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={reason.icon}
                      size={Icons.md}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.reasonContent
                    }
                  >
                    <Text
                      style={[
                        styles.reasonLabel,
                        {
                          color:
                            colors.text,
                        },
                      ]}
                    >
                      {reason.label}
                    </Text>

                    <Text
                      style={[
                        styles.reasonDescription,
                        {
                          color:
                            colors.textSecondary,
                        },
                      ]}
                    >
                      {
                        reason.description
                      }
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={Icons.md}
                    color={
                      colors.placeholder
                    }
                  />
                </Pressable>
              )
            )}
          </ScrollView>

          <Text
            style={[
              styles.footerNote,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            Reporting does not automatically remove content. Poster may review it for policy and quality issues.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    justifyContent: "flex-end",
  },

  sheet: {
    width: "100%",

    maxHeight: "86%",

    borderTopWidth:
      StyleSheet.hairlineWidth,

    borderTopLeftRadius:
      Radius.xxl,

    borderTopRightRadius:
      Radius.xxl,

    paddingTop:
      Spacing.sm,

    paddingBottom:
      Spacing.xl,
  },

  handle: {
    width: 42,

    height: 4,

    alignSelf: "center",

    borderRadius:
      Radius.round,

    marginBottom:
      Spacing.md,
  },

  header: {
    flexDirection: "row",

    alignItems: "flex-start",

    paddingHorizontal:
      Spacing.screen,

    paddingBottom:
      Spacing.lg,
  },

  headerText: {
    flex: 1,

    paddingRight:
      Spacing.md,
  },

  title: {
    ...Typography.headline,

    fontWeight: "800",
  },

  subtitle: {
    ...Typography.small,

    marginTop:
      Spacing.xs,

    lineHeight: 19,
  },

  closeButton: {
    width: 40,

    height: 40,

    alignItems: "center",

    justifyContent: "center",

    borderRadius:
      Radius.round,

    borderWidth:
      StyleSheet.hairlineWidth,
  },

  reasons: {
    paddingHorizontal:
      Spacing.screen,

    paddingBottom:
      Spacing.md,
  },

  reasonRow: {
    minHeight: 78,

    flexDirection: "row",

    alignItems: "center",

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.lg,

    padding:
      Spacing.md,

    marginBottom:
      Spacing.sm,
  },

  reasonIcon: {
    width: 44,

    height: 44,

    alignItems: "center",

    justifyContent: "center",

    borderRadius:
      Radius.md,

    borderWidth:
      StyleSheet.hairlineWidth,
  },

  reasonContent: {
    flex: 1,

    marginHorizontal:
      Spacing.md,
  },

  reasonLabel: {
    ...Typography.body,

    fontWeight: "800",
  },

  reasonDescription: {
    ...Typography.small,

    lineHeight: 18,

    marginTop:
      Spacing.xs,
  },

  footerNote: {
    ...Typography.small,

    lineHeight: 18,

    textAlign: "center",

    paddingHorizontal:
      Spacing.xl,
  },
});