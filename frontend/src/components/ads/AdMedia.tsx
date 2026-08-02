import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type {
  AppStateStatus,
  ListRenderItem,
  ViewToken,
} from "react-native";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useEvent,
} from "expo";

import {
  useVideoPlayer,
  VideoView,
} from "expo-video";

import {
  MonetizationMediaItem,
  MonetizationMediaType,
} from "./ad.types";

import useTheme from "../../theme/useTheme";

import {
  Icons,
  Radius,
  Spacing,
  Typography,
} from "../../theme";

/**
 * A sliding media item becomes active when at least
 * 70% of the card is visible for a short period.
 *
 * This prevents a video from continuing to play when
 * the user has moved to another sliding card.
 */
const GALLERY_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold:
    70,

  minimumViewTime:
    120,
} as const;

interface AdMediaProps {
  /**
   * Controlled by MonetizedFeed.
   *
   * True only while this complete sponsored feed entry
   * satisfies the parent feed visibility requirements.
   *
   * Video playback additionally requires:
   * - active video card;
   * - foreground app state.
   */
  isFeedVisible?:
    boolean;

  mediaType?:
    MonetizationMediaType;

  imageUrl?: string;

  videoUrl?: string;

  thumbnailUrl?: string;

  mediaItems?:
    readonly MonetizationMediaItem[];

  accessibilityLabel?: string;

  onMediaPress?: (
    mediaItem:
      MonetizationMediaItem
  ) => void;
}

function resolveMediaType({
  mediaType,
  videoUrl,
}: {
  mediaType?:
    MonetizationMediaType;

  videoUrl?: string;
}): MonetizationMediaType {
  if (mediaType) {
    return mediaType;
  }

  if (
    videoUrl?.trim()
  ) {
    return "video";
  }

  return "image";
}

interface MediaUnavailableProps {
  type:
    MonetizationMediaType;
}

function MediaUnavailable({
  type,
}: MediaUnavailableProps) {
  const { colors } =
    useTheme();

  return (
    <View
      style={
        styles.mediaUnavailable
      }
    >
      <MaterialCommunityIcons
        name={
          type === "video"
            ? "video-outline"
            : "image-outline"
        }
        size={
          Icons.xl
        }
        color={
          colors.placeholder
        }
      />

      <Text
        style={[
          styles.galleryPlaceholderText,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {type === "video"
          ? "Video unavailable"
          : "Media unavailable"}
      </Text>
    </View>
  );
}

interface ImageMediaProps {
  imageUrl:
    string;

  accessibilityLabel:
    string;
}

function ImageMedia({
  imageUrl,
  accessibilityLabel,
}: ImageMediaProps) {
  const { colors } =
    useTheme();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    failed,
    setFailed,
  ] =
    useState(false);

  if (failed) {
    return (
      <MediaUnavailable
        type="image"
      />
    );
  }

  return (
    <>
      <Image
        accessibilityLabel={
          accessibilityLabel
        }
        source={{
          uri:
            imageUrl,
        }}
        resizeMode="cover"
        style={
          styles.fillMedia
        }
        onLoadStart={() => {
          setLoading(
            true
          );
        }}
        onLoadEnd={() => {
          setLoading(
            false
          );
        }}
        onError={() => {
          setLoading(
            false
          );

          setFailed(
            true
          );
        }}
      />

      {loading ? (
        <View
          style={[
            styles.loadingOverlay,
            {
              backgroundColor:
                colors.surface,
            },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={
              colors.primary
            }
          />
        </View>
      ) : null}
    </>
  );
}

interface VideoMediaProps {
  videoUrl:
    string;

  thumbnailUrl?:
    string;

  accessibilityLabel:
    string;

  /**
   * Final resolved playback permission.
   *
   * For sliding media:
   * feed visible + this card active.
   *
   * For standard media:
   * feed visible.
   *
   * App foreground state is enforced internally.
   */
  shouldPlay:
    boolean;
}

function VideoMedia({
  videoUrl,
  thumbnailUrl,
  accessibilityLabel,
  shouldPlay,
}: VideoMediaProps) {
  const { colors } =
    useTheme();

  const [
    firstFrameRendered,
    setFirstFrameRendered,
  ] =
    useState(false);

  const player =
    useVideoPlayer(
      videoUrl,
      (
        videoPlayer
      ) => {
        /**
         * Locked advertising video behavior:
         *
         * - muted by default;
         * - loops while active;
         * - no native playback controls;
         * - playback controlled by visibility.
         */
        videoPlayer.muted =
          true;

        videoPlayer.loop =
          true;
      }
    );

  const {
    status,
  } =
    useEvent(
      player,
      "statusChange",
      {
        status:
          player.status,
      }
    );

  /**
   * Playback is permitted only when:
   *
   * 1. parent feed says this ad is visible;
   * 2. this is the active video media card;
   * 3. the app is in the foreground.
   *
   * AppState protection also ensures videos pause when
   * the application becomes inactive/backgrounded.
   */
  useEffect(
    () => {
      const syncPlayback = (
        appState:
          AppStateStatus
      ) => {
        if (
          shouldPlay &&
          appState ===
            "active"
        ) {
          player.play();

          return;
        }

        player.pause();
      };

      syncPlayback(
        AppState.currentState
      );

      const subscription =
        AppState.addEventListener(
          "change",
          syncPlayback
        );

      return () => {
        subscription.remove();

        player.pause();
      };
    },
    [
      player,
      shouldPlay,
    ]
  );

  const failed =
    status ===
    "error";

  if (failed) {
    return (
      <MediaUnavailable
        type="video"
      />
    );
  }

  return (
    <>
      <VideoView
        accessibilityLabel={
          accessibilityLabel
        }
        player={
          player
        }
        style={
          styles.fillMedia
        }
        contentFit="cover"
        nativeControls={
          false
        }
        onFirstFrameRender={() => {
          setFirstFrameRendered(
            true
          );
        }}
      />

      {thumbnailUrl &&
      !firstFrameRendered ? (
        <Image
          accessibilityLabel=""
          importantForAccessibility="no"
          source={{
            uri:
              thumbnailUrl,
          }}
          resizeMode="cover"
          style={[
            styles.fillMedia,
            styles.posterOverlay,
          ]}
        />
      ) : null}

      {!firstFrameRendered ? (
        <View
          style={[
            styles.loadingOverlay,
            {
              backgroundColor:
                thumbnailUrl
                  ? "transparent"
                  : colors.surface,
            },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={
              colors.primary
            }
          />
        </View>
      ) : null}
    </>
  );
}

interface SingleMediaProps {
  mediaType?:
    MonetizationMediaType;

  imageUrl?:
    string;

  videoUrl?:
    string;

  thumbnailUrl?:
    string;

  accessibilityLabel:
    string;

  shouldPlay:
    boolean;
}

function SingleMedia({
  mediaType,
  imageUrl,
  videoUrl,
  thumbnailUrl,
  accessibilityLabel,
  shouldPlay,
}: SingleMediaProps) {
  const { colors } =
    useTheme();

  const resolvedType =
    resolveMediaType({
      mediaType,
      videoUrl,
    });

  const validImageUrl =
    imageUrl?.trim() ??
    "";

  const validVideoUrl =
    videoUrl?.trim() ??
    "";

  return (
    <View
      style={[
        styles.singleContainer,
        {
          backgroundColor:
            colors.surface,
        },
      ]}
    >
      {resolvedType ===
      "video" ? (
        validVideoUrl ? (
          <VideoMedia
            videoUrl={
              validVideoUrl
            }
            thumbnailUrl={
              thumbnailUrl
            }
            accessibilityLabel={
              accessibilityLabel
            }
            shouldPlay={
              shouldPlay
            }
          />
        ) : (
          <MediaUnavailable
            type="video"
          />
        )
      ) : validImageUrl ? (
        <ImageMedia
          imageUrl={
            validImageUrl
          }
          accessibilityLabel={
            accessibilityLabel
          }
        />
      ) : (
        <MediaUnavailable
          type="image"
        />
      )}
    </View>
  );
}

interface GalleryMediaItemProps {
  item:
    MonetizationMediaItem;

  width:
    number;

  isActive:
    boolean;

  onPress?: () => void;
}

function GalleryMediaItem({
  item,
  width,
  isActive,
  onPress,
}: GalleryMediaItemProps) {
  const { colors } =
    useTheme();

  const resolvedType =
    resolveMediaType({
      mediaType:
        item.mediaType,

      videoUrl:
        item.videoUrl,
    });

  const validImageUrl =
    item.imageUrl?.trim() ??
    "";

  const validVideoUrl =
    item.videoUrl?.trim() ??
    "";

  const accessibilityLabel =
    item.accessibilityLabel ??
    item.title ??
    "Sponsored media";

  const content = (
    <View
      style={[
        styles.galleryCard,
        {
          width,

          backgroundColor:
            colors.card,

          borderColor:
            colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.galleryImageContainer,
          {
            backgroundColor:
              colors.surface,
          },
        ]}
      >
        {resolvedType ===
        "video" ? (
          validVideoUrl ? (
            <VideoMedia
              videoUrl={
                validVideoUrl
              }
              thumbnailUrl={
                item.thumbnailUrl
              }
              accessibilityLabel={
                accessibilityLabel
              }
              shouldPlay={
                isActive
              }
            />
          ) : (
            <MediaUnavailable
              type="video"
            />
          )
        ) : validImageUrl ? (
          <ImageMedia
            imageUrl={
              validImageUrl
            }
            accessibilityLabel={
              accessibilityLabel
            }
          />
        ) : (
          <MediaUnavailable
            type="image"
          />
        )}
      </View>

      {item.title ? (
        <Text
          numberOfLines={2}
          style={[
            styles.galleryTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          {
            item.title
          }
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        item.accessibilityLabel ??
        item.title ??
        "Open sponsored item"
      }
      style={({
        pressed,
      }) => ({
        opacity:
          pressed
            ? 0.78
            : 1,
      })}
      onPress={
        onPress
      }
    >
      {content}
    </Pressable>
  );
}

function isValidGalleryItem(
  item:
    MonetizationMediaItem
): boolean {
  if (
    !item.id.trim()
  ) {
    return false;
  }

  const resolvedType =
    resolveMediaType({
      mediaType:
        item.mediaType,

      videoUrl:
        item.videoUrl,
    });

  if (
    resolvedType ===
    "video"
  ) {
    return Boolean(
      item.videoUrl?.trim()
    );
  }

  return Boolean(
    item.imageUrl?.trim()
  );
}

export default function AdMedia({
  isFeedVisible = true,
  mediaType,
  imageUrl,
  videoUrl,
  thumbnailUrl,
  mediaItems,
  accessibilityLabel =
    "Advertisement media",
  onMediaPress,
}: AdMediaProps) {
  const { colors } =
    useTheme();

  const {
    width:
      screenWidth,
  } =
    useWindowDimensions();

  const validMediaItems =
    useMemo(
      () =>
        (
          mediaItems ??
          []
        ).filter(
          isValidGalleryItem
        ),
      [
        mediaItems,
      ]
    );

  /**
   * The first sliding card is initially active.
   *
   * Current locked sponsored-ad structure:
   *
   * Card 1 → video
   * Card 2 → image
   * Card 3 → image
   *
   * A viewability callback subsequently updates the active
   * item when the user swipes between cards.
   */
  const [
    activeGalleryItemId,
    setActiveGalleryItemId,
  ] =
    useState<
      string |
      null
    >(
      () =>
        validMediaItems[
          0
        ]?.id ??
        null
    );

  /**
   * Protect against stale active state if the supplied gallery
   * changes while this component remains mounted.
   *
   * No effect/state synchronization is required here.
   */
  const resolvedActiveGalleryItemId =
    activeGalleryItemId &&
    validMediaItems.some(
      (item) =>
        item.id ===
        activeGalleryItemId
    )
      ? activeGalleryItemId
      : validMediaItems[
          0
        ]?.id ??
        null;

  const galleryItemWidth =
    Math.min(
      Math.max(
        screenWidth *
          0.72,
        250
      ),
      320
    );

  const handleViewableItemsChanged =
    useCallback(
      ({
        viewableItems,
      }: {
        viewableItems:
          ViewToken[];
      }) => {
        const activeToken =
          viewableItems.find(
            (
              token
            ) =>
              token.isViewable
          );

        const activeItem =
          activeToken?.item as
            | MonetizationMediaItem
            | undefined;

        setActiveGalleryItemId(
          activeItem?.id ??
          null
        );
      },
      []
    );

  const renderGalleryItem:
    ListRenderItem<
      MonetizationMediaItem
    > =
    useCallback(
      ({
        item,
      }) => (
        <GalleryMediaItem
          item={
            item
          }
          width={
            galleryItemWidth
          }

          /**
           * Sliding video playback requires BOTH:
           *
           * - whole sponsored feed entry visible;
           * - this exact media card active.
           */
          isActive={
            isFeedVisible &&
            resolvedActiveGalleryItemId ===
              item.id
          }

          onPress={
            onMediaPress
              ? () => {
                  onMediaPress(
                    item
                  );
                }
              : undefined
          }
        />
      ),
      [
        galleryItemWidth,
        isFeedVisible,
        onMediaPress,
        resolvedActiveGalleryItemId,
      ]
    );

  if (
    validMediaItems.length >
    0
  ) {
    return (
      <FlatList
        horizontal
        data={
          validMediaItems
        }
        keyExtractor={(
          item
        ) =>
          item.id
        }
        renderItem={
          renderGalleryItem
        }

        /**
         * FlatList is a PureComponent.
         *
         * These values live outside the data array and therefore
         * must participate in re-rendering when playback permission
         * changes.
         */
        extraData={{
          activeGalleryItemId:
            resolvedActiveGalleryItemId,

          isFeedVisible,
        }}

        onViewableItemsChanged={
          handleViewableItemsChanged
        }

        viewabilityConfig={
          GALLERY_VIEWABILITY_CONFIG
        }

        showsHorizontalScrollIndicator={
          false
        }

        keyboardShouldPersistTaps="handled"

        contentContainerStyle={
          styles.galleryContent
        }

        ItemSeparatorComponent={() => (
          <View
            style={
              styles.gallerySeparator
            }
          />
        )}
      />
    );
  }

  const resolvedSingleType =
    resolveMediaType({
      mediaType,
      videoUrl,
    });

  const hasSingleMedia =
    resolvedSingleType ===
    "video"
      ? Boolean(
          videoUrl?.trim()
        )
      : Boolean(
          imageUrl?.trim()
        );

  if (
    hasSingleMedia
  ) {
    return (
      <SingleMedia
        mediaType={
          resolvedSingleType
        }
        imageUrl={
          imageUrl
        }
        videoUrl={
          videoUrl
        }
        thumbnailUrl={
          thumbnailUrl
        }
        accessibilityLabel={
          accessibilityLabel
        }

        /**
         * Standard 16:9 video only plays while its complete
         * sponsored feed entry is visible.
         */
        shouldPlay={
          isFeedVisible
        }
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="image-outline"
        size={
          Icons.hero
        }
        color={
          colors.placeholder
        }
      />

      <Text
        style={[
          styles.placeholderText,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        Media unavailable
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    singleContainer: {
      width:
        "100%",

      /**
       * FINALIZED STANDARD AD FRAME.
       *
       * Do not change.
       */
      aspectRatio:
        16 / 9,

      overflow:
        "hidden",
    },

    fillMedia: {
      width:
        "100%",

      height:
        "100%",
    },

    posterOverlay: {
      ...StyleSheet.absoluteFillObject,
    },

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    mediaUnavailable: {
      flex:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal:
        Spacing.md,
    },

    placeholder: {
      width:
        "100%",

      aspectRatio:
        16 / 9,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      paddingHorizontal:
        Spacing.lg,
    },

    placeholderText: {
      ...Typography.small,

      marginTop:
        Spacing.sm,
    },

    galleryContent: {
      paddingHorizontal:
        Spacing.screen,
    },

    gallerySeparator: {
      width:
        Spacing.md,
    },

    galleryCard: {
      overflow:
        "hidden",

      borderWidth:
        StyleSheet.hairlineWidth,

      borderRadius:
        Radius.lg,
    },

    galleryImageContainer: {
      width:
        "100%",

      /**
       * FINALIZED SLIDING SPONSORED-CARD MEDIA FRAME.
       *
       * Do not change.
       */
      aspectRatio:
        1,

      overflow:
        "hidden",
    },

    galleryPlaceholderText: {
      ...Typography.small,

      textAlign:
        "center",

      marginTop:
        Spacing.sm,
    },

    galleryTitle: {
      ...Typography.body,

      minHeight:
        58,

      fontWeight:
        "700",

      paddingHorizontal:
        Spacing.md,

      paddingVertical:
        Spacing.md,
    },
  });