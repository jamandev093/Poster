import React, {
  useEffect,
  useState,
} from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";

import GoogleMobileAdsService from "../../services/GoogleMobileAdsService";

import useTheme from "../../theme/useTheme";

import {
  Radius,
  Spacing,
  Typography,
} from "../../theme";

import AdCardShell from "./AdCardShell";
import AdDisclosure from "./AdDisclosure";

import type {
  GoogleNativeAdPlaceholder,
} from "./ad.types";

interface GoogleNativeAdCardProps {
  ad:
    GoogleNativeAdPlaceholder;
}

export default function GoogleNativeAdCard({
  ad,
}: GoogleNativeAdCardProps) {
  const {
    colors,
  } =
    useTheme();

  const [
    nativeAd,
    setNativeAd,
  ] =
    useState<
      NativeAd |
      null
    >(null);

  useEffect(
    () => {
      let disposed =
        false;

      let loadedAd:
        NativeAd |
        null = null;

      setNativeAd(
        null
      );

      void GoogleMobileAdsService
        .loadNativeAd(
          ad
        )
        .then(
          (
            resolvedAd
          ) => {
            if (!resolvedAd) {
              return;
            }

            if (disposed) {
              resolvedAd.destroy();
              return;
            }

            loadedAd =
              resolvedAd;

            setNativeAd(
              resolvedAd
            );
          }
        )
        .catch(
          () => {
            if (!disposed) {
              setNativeAd(
                null
              );
            }
          }
        );

      return () => {
        disposed =
          true;

        if (loadedAd) {
          loadedAd.destroy();
        }
      };
    },
    [
      ad.adUnitId,
      ad.id,
      ad.placement,
      ad.status,
    ]
  );

  if (!nativeAd) {
    return null;
  }

  const advertiser =
    nativeAd.advertiser
      ?.trim();

  const body =
    nativeAd.body
      .trim();

  const callToAction =
    nativeAd.callToAction
      .trim();

  return (
    <AdCardShell>
      <NativeAdView
        nativeAd={
          nativeAd
        }
        style={
          styles.nativeAd
        }
      >
        <View
          style={
            styles.header
          }
        >
          <AdDisclosure
            type="google"
          />

          {advertiser ? (
            <NativeAsset
              assetType={NativeAssetType.ADVERTISER}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.advertiser,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {advertiser}
              </Text>
            </NativeAsset>
          ) : null}
        </View>

        <NativeMediaView
          resizeMode="cover"
          style={[
            styles.media,
            {
              backgroundColor:
                colors.surface,
            },
          ]}
        />

        <View
          style={
            styles.content
          }
        >
          <NativeAsset
            assetType={NativeAssetType.HEADLINE}
          >
            <Text
              accessibilityRole="header"
              style={[
                styles.headline,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {nativeAd.headline}
            </Text>
          </NativeAsset>

          {body ? (
            <NativeAsset
              assetType={NativeAssetType.BODY}
            >
              <Text
                style={[
                  styles.body,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >
                {body}
              </Text>
            </NativeAsset>
          ) : null}

          {callToAction ? (
            <NativeAsset
              assetType={NativeAssetType.CALL_TO_ACTION}
            >
              <View
                accessibilityRole="button"
                style={[
                  styles.callToAction,
                  {
                    borderColor:
                      colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.callToActionText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  {callToAction}
                </Text>
              </View>
            </NativeAsset>
          ) : null}
        </View>
      </NativeAdView>
    </AdCardShell>
  );
}

const styles =
  StyleSheet.create({
    nativeAd: {
      width:
        "100%",
    },

    header: {
      paddingHorizontal:
        Spacing.screen,

      paddingBottom:
        Spacing.md,
    },

    advertiser: {
      ...Typography.small,

      marginTop:
        Spacing.sm,

      fontWeight:
        "700",
    },

    media: {
      width:
        "100%",

      minHeight:
        180,
    },

    content: {
      paddingHorizontal:
        Spacing.screen,

      paddingTop:
        Spacing.lg,

      paddingBottom:
        Spacing.lg,
    },

    headline: {
      ...Typography.headline,

      fontWeight:
        "800",
    },

    body: {
      ...Typography.body,

      marginTop:
        Spacing.sm,
    },

    callToAction: {
      alignSelf:
        "flex-start",

      marginTop:
        Spacing.lg,

      paddingHorizontal:
        Spacing.lg,

      paddingVertical:
        Spacing.sm,

      borderWidth:
        1,

      borderRadius:
        Radius.round,
    },

    callToActionText: {
      ...Typography.body,

      fontWeight:
        "800",
    },
  });