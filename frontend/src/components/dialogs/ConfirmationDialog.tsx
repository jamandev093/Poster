import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "../../theme";
import useTheme from "../../theme/useTheme";

interface ConfirmationDialogProps {
  visible: boolean;

  title: string;

  message: string;

  confirmLabel: string;

  cancelLabel?: string;

  destructive?: boolean;

  loading?: boolean;

  onCancel: () =>
    void | Promise<void>;

  onConfirm: () =>
    void | Promise<void>;
}

export default function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const { colors } = useTheme();

  const actionLockRef =
    useRef(false);

  useEffect(() => {
    actionLockRef.current =
      false;
  }, [visible]);

  const handleCancel =
    useCallback(async () => {
      if (
        loading ||
        actionLockRef.current
      ) {
        return;
      }

      actionLockRef.current =
        true;

      try {
        await onCancel();
      } finally {
        actionLockRef.current =
          false;
      }
    }, [
      loading,
      onCancel,
    ]);

  const handleConfirm =
    useCallback(async () => {
      if (
        loading ||
        actionLockRef.current
      ) {
        return;
      }

      actionLockRef.current =
        true;

      try {
        await onConfirm();
      } finally {
        actionLockRef.current =
          false;
      }
    }, [
      loading,
      onConfirm,
    ]);

  const confirmColor =
    destructive
      ? colors.danger
      : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        void handleCancel();
      }}
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
          accessibilityLabel="Close confirmation"
          accessibilityState={{
            disabled: loading,
          }}
          disabled={loading}
          style={
            StyleSheet.absoluteFill
          }
          onPress={() => {
            void handleCancel();
          }}
        />

        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.dialog,
            Shadows.lg,
            {
              backgroundColor:
                colors.card,

              borderColor:
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
            {title}
          </Text>

          <Text
            style={[
              styles.message,
              {
                color:
                  colors.textSecondary,
              },
            ]}
          >
            {message}
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                cancelLabel
              }
              accessibilityState={{
                disabled: loading,
              }}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                {
                  borderColor:
                    colors.border,

                  opacity:
                    loading
                      ? 0.45
                      : pressed
                      ? 0.6
                      : 1,
                },
              ]}
              onPress={() => {
                void handleCancel();
              }}
            >
              <Text
                style={[
                  styles.cancelText,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {cancelLabel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                confirmLabel
              }
              accessibilityState={{
                disabled: loading,
                busy: loading,
              }}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor:
                    confirmColor,

                  opacity:
                    loading
                      ? 0.55
                      : pressed
                      ? 0.75
                      : 1,
                },
              ]}
              onPress={() => {
                void handleConfirm();
              }}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    colors.onPrimary
                  }
                />
              ) : (
                <Text
                  style={[
                    styles.confirmText,
                    {
                      color:
                        colors.onPrimary,
                    },
                  ]}
                >
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal:
      Spacing.xl,
  },

  dialog: {
    width: "100%",

    maxWidth: 380,

    borderWidth:
      StyleSheet.hairlineWidth,

    borderRadius:
      Radius.lg,

    padding:
      Spacing.xl,
  },

  title: {
    ...Typography.headline,

    fontWeight: "800",
  },

  message: {
    ...Typography.body,

    lineHeight: 22,

    marginTop:
      Spacing.sm,
  },

  actions: {
    flexDirection: "row",

    marginTop:
      Spacing.xl,
  },

  button: {
    flex: 1,

    minHeight: 48,

    alignItems: "center",

    justifyContent: "center",

    borderRadius:
      Radius.md,

    paddingHorizontal:
      Spacing.md,
  },

  cancelButton: {
    borderWidth: 1,

    marginRight:
      Spacing.sm,
  },

  confirmButton: {
    marginLeft:
      Spacing.sm,
  },

  cancelText: {
    ...Typography.caption,

    fontWeight: "700",

    textAlign: "center",
  },

  confirmText: {
    ...Typography.caption,

    fontWeight: "800",

    textAlign: "center",
  },
});