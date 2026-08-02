import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import FeedbackToast, {
  FeedbackToastAction,
  FeedbackType,
} from "../components/common/FeedbackToast";

interface ShowFeedbackOptions {
  type: FeedbackType;

  title: string;

  message?: string;

  action?: FeedbackToastAction;

  duration?: number;
}

interface FeedbackContextValue {
  showFeedback: (
    options: ShowFeedbackOptions
  ) => void;

  showSuccess: (
    title: string,
    message?: string
  ) => void;

  showError: (
    title: string,
    message?: string,
    action?: FeedbackToastAction
  ) => void;

  showWarning: (
    title: string,
    message?: string
  ) => void;

  showInfo: (
    title: string,
    message?: string
  ) => void;

  dismissFeedback: () => void;
}

interface ActiveFeedback {
  id: number;

  type: FeedbackType;

  title: string;

  message?: string;

  action?: FeedbackToastAction;
}

interface FeedbackProviderProps {
  children: ReactNode;
}

const DEFAULT_DURATION = 1000;

const FeedbackContext =
  createContext<
    FeedbackContextValue | undefined
  >(undefined);

export function FeedbackProvider({
  children,
}: FeedbackProviderProps) {
  const [
    activeFeedback,
    setActiveFeedback,
  ] = useState<
    ActiveFeedback | null
  >(null);

  const dismissTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const clearDismissTimer =
    useCallback(() => {
      if (!dismissTimer.current) {
        return;
      }

      clearTimeout(
        dismissTimer.current
      );

      dismissTimer.current = null;
    }, []);

  const dismissFeedback =
    useCallback(() => {
      clearDismissTimer();

      setActiveFeedback(null);
    }, [clearDismissTimer]);

  const showFeedback =
    useCallback(
      ({
        type,
        title,
        message,
        action,
        duration =
          DEFAULT_DURATION,
      }: ShowFeedbackOptions) => {
        clearDismissTimer();

        const nextFeedback: ActiveFeedback =
          {
            id: Date.now(),

            type,

            title,

            message,

            action,
          };

        setActiveFeedback(
          nextFeedback
        );

        if (duration <= 0) {
          return;
        }

        dismissTimer.current =
          setTimeout(() => {
            setActiveFeedback(
              (currentFeedback) => {
                if (
                  currentFeedback?.id !==
                  nextFeedback.id
                ) {
                  return currentFeedback;
                }

                return null;
              }
            );

            dismissTimer.current =
              null;
          }, duration);
      },
      [clearDismissTimer]
    );

  const showSuccess =
    useCallback(
      (
        title: string,
        message?: string
      ) => {
        showFeedback({
          type: "success",

          title,

          message,
        });
      },
      [showFeedback]
    );

  const showError =
    useCallback(
      (
        title: string,
        message?: string,
        action?: FeedbackToastAction
      ) => {
        showFeedback({
          type: "error",

          title,

          message,

          action,

          duration: action
            ? 4000
            : DEFAULT_DURATION,
        });
      },
      [showFeedback]
    );

  const showWarning =
    useCallback(
      (
        title: string,
        message?: string
      ) => {
        showFeedback({
          type: "warning",

          title,

          message,
        });
      },
      [showFeedback]
    );

  const showInfo =
    useCallback(
      (
        title: string,
        message?: string
      ) => {
        showFeedback({
          type: "info",

          title,

          message,
        });
      },
      [showFeedback]
    );

  const value =
    useMemo<FeedbackContextValue>(
      () => ({
        showFeedback,

        showSuccess,

        showError,

        showWarning,

        showInfo,

        dismissFeedback,
      }),
      [
        dismissFeedback,
        showError,
        showFeedback,
        showInfo,
        showSuccess,
        showWarning,
      ]
    );

  return (
    <FeedbackContext.Provider
      value={value}
    >
      {children}

      <FeedbackToast
        visible={
          activeFeedback !== null
        }
        type={
          activeFeedback?.type ??
          "info"
        }
        title={
          activeFeedback?.title ??
          ""
        }
        message={
          activeFeedback?.message
        }
        action={
          activeFeedback?.action
        }
        onDismiss={
          dismissFeedback
        }
      />
    </FeedbackContext.Provider>
  );
}

export default function useFeedback(): FeedbackContextValue {
  const context =
    useContext(
      FeedbackContext
    );

  if (!context) {
    throw new Error(
      "useFeedback must be used within FeedbackProvider"
    );
  }

  return context;
}