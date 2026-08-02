import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import useTheme from "../../../theme/useTheme";
import {
  Radius,
  Spacing,
  Typography,
} from "../../../theme";

import {
  feedbackReasons,
  FeedbackReason,
} from "./feedbackReasons";

import FeedbackReasonItem from "./FeedbackReasonItem";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (
    reason: FeedbackReason
  ) => void;
};

export default function FeedbackBottomSheet({
  visible,
  onClose,
  onSelect,
}: Props) {
  const { colors } = useTheme();

  const selectionLockedRef =
    useRef(false);

  useEffect(() => {
    if (visible) {
      selectionLockedRef.current =
        false;
    }
  }, [visible]);

  const handleSelect =
    useCallback(
      (
        reason: FeedbackReason
      ) => {
        if (
          selectionLockedRef.current
        ) {
          return;
        }

        selectionLockedRef.current =
          true;

        onClose();
        onSelect(reason);
      },
      [
        onClose,
        onSelect,
      ]
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close report options"
        style={[
          styles.overlay,
          {
            backgroundColor:
              colors.overlay,
          },
        ]}
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          accessible={false}
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor:
                colors.card,

              borderTopColor:
                colors.border,
            },
          ]}
        >
          <View
            accessible={false}
            style={[
              styles.handle,
              {
                backgroundColor:
                  colors.placeholder,
              },
            ]}
          />

          <View
            style={[
              styles.header,
              {
                borderBottomColor:
                  colors.border,
              },
            ]}
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
              Report this article
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
              Your feedback is anonymous and helps improve article quality on Poster.
            </Text>
          </View>

          <FlatList
            data={feedbackReasons}
            keyExtractor={(
              item
            ) => item.id}
            bounces={false}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.list
            }
            renderItem={({
              item,
            }) => (
              <FeedbackReasonItem
                reason={item}
                onPress={
                  handleSelect
                }
              />
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    justifyContent:
      "flex-end",
  },

  sheet: {
    borderTopLeftRadius:
      Radius.xl,

    borderTopRightRadius:
      Radius.xl,

    borderTopWidth:
      StyleSheet.hairlineWidth,

    maxHeight: "75%",

    overflow: "hidden",

    paddingTop:
      Spacing.md,

    paddingBottom:
      Spacing.xxl,
  },

  handle: {
    width: 46,

    height: 5,

    borderRadius:
      Radius.round,

    alignSelf: "center",

    marginBottom:
      Spacing.lg,
  },

  header: {
    paddingHorizontal:
      Spacing.xl,

    paddingBottom:
      Spacing.lg,

    marginBottom:
      Spacing.xs,

    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  title: {
    ...Typography.headline,

    fontWeight: "700",

    letterSpacing: -0.2,
  },

  subtitle: {
    ...Typography.body,

    marginTop:
      Spacing.xs,

    lineHeight: 22,
  },

  list: {
    paddingBottom:
      Spacing.lg,
  },
});