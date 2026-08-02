import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  StyleSheet,
  View,
} from "react-native";

import ActionButton from "./ActionButton";

import useTheme from "../../theme/useTheme";
import {
  Spacing,
} from "../../theme";

type Props = {
  onWorthReading: () => void;

  onHelpful: () => void;

  onShare: () => void;

  onBookmark: () => void;

  onFeedback: () => void;

  initialRecommended?: boolean;

  initialHelpful?: boolean;

  initialBookmarked?: boolean;
};

export default function FeedCardActions({
  onWorthReading,
  onHelpful,
  onShare,
  onBookmark,
  onFeedback,
  initialRecommended = false,
  initialHelpful = false,
  initialBookmarked = false,
}: Props) {
  const { colors } = useTheme();

  const [
    recommended,
    setRecommended,
  ] = useState(
    initialRecommended
  );

  const [
    helpful,
    setHelpful,
  ] = useState(
    initialHelpful
  );

  const [
    bookmarked,
    setBookmarked,
  ] = useState(
    initialBookmarked
  );

  useEffect(() => {
    setRecommended(
      initialRecommended
    );
  }, [initialRecommended]);

  useEffect(() => {
    setHelpful(
      initialHelpful
    );
  }, [initialHelpful]);

  useEffect(() => {
    setBookmarked(
      initialBookmarked
    );
  }, [initialBookmarked]);

  const handleRecommendPress =
    useCallback(() => {
      if (recommended) {
        return;
      }

      setRecommended(true);

      onWorthReading();
    }, [
      onWorthReading,
      recommended,
    ]);

  const handleHelpfulPress =
    useCallback(() => {
      if (helpful) {
        return;
      }

      setHelpful(true);

      onHelpful();
    }, [
      helpful,
      onHelpful,
    ]);

  const handleBookmarkPress =
    useCallback(() => {
      setBookmarked(
        (current) => !current
      );

      onBookmark();
    }, [onBookmark]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.card,

          borderTopColor:
            colors.border,
        },
      ]}
    >
      <ActionButton
        icon={
          recommended
            ? "star"
            : "star-outline"
        }
        label="Recommend"
        accessibilityLabel={
          recommended
            ? "Article recommended"
            : "Recommend this article"
        }
        active={recommended}
        activeColor={
          colors.warning
        }
        onPress={
          handleRecommendPress
        }
      />

      <ActionButton
        icon={
          helpful
            ? "thumb-up"
            : "thumb-up-outline"
        }
        label="Helpful"
        accessibilityLabel={
          helpful
            ? "Article marked as helpful"
            : "Mark this article as helpful"
        }
        active={helpful}
        activeColor={
          colors.primary
        }
        onPress={
          handleHelpfulPress
        }
      />

      <ActionButton
        icon="share-variant-outline"
        label="Share"
        accessibilityLabel="Share this article"
        onPress={onShare}
      />

      <ActionButton
        icon={
          bookmarked
            ? "bookmark"
            : "bookmark-outline"
        }
        label="Save"
        accessibilityLabel={
          bookmarked
            ? "Remove this article from bookmarks"
            : "Save this article"
        }
        active={bookmarked}
        activeColor={
          colors.primary
        }
        onPress={
          handleBookmarkPress
        }
      />

      <ActionButton
        icon="alert-outline"
        label="Report"
        accessibilityLabel="Report this article"
        danger
        onPress={onFeedback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",

    minHeight: 72,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    borderTopWidth:
      StyleSheet.hairlineWidth,

    paddingHorizontal:
      Spacing.xs,

    paddingVertical:
      Spacing.sm,
  },
});