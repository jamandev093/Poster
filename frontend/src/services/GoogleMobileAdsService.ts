import mobileAds, {
  AdsConsent,
  NativeAd,
  NativeMediaAspectRatio,
  TestIds,
} from "react-native-google-mobile-ads";

import type {
  GoogleNativeAdPlaceholder,
  MonetizationPlacement,
} from "../components/ads";

import AdvertisingPreferenceService from "./AdvertisingPreferenceService";

declare const process: {
  env?: {
    EXPO_PUBLIC_GOOGLE_NATIVE_AD_UNIT_HOME?:
      string;

    EXPO_PUBLIC_GOOGLE_NATIVE_AD_UNIT_SEARCH?:
      string;

    EXPO_PUBLIC_GOOGLE_NATIVE_AD_UNIT_TRENDING?:
      string;
  };
};

let initializationPromise:
  Promise<boolean> |
  null = null;

async function ensureConsentAllowsAds():
  Promise<boolean> {
  try {
    const consentInfo =
      await AdsConsent
        .gatherConsent();

    return consentInfo.canRequestAds;
  } catch {
    /*
     * If refreshing UMP fails, use the last known
     * UMP state rather than manufacturing consent.
     */
    try {
      const consentInfo =
        await AdsConsent
          .getConsentInfo();

      return consentInfo.canRequestAds;
    } catch {
      return false;
    }
  }
}

async function ensureInitialized():
  Promise<boolean> {
  const canRequestAds =
    await ensureConsentAllowsAds();

  if (!canRequestAds) {
    return false;
  }

  if (!initializationPromise) {
    initializationPromise =
      mobileAds()
        .initialize()
        .then(() => true)
        .catch(() => {
          initializationPromise =
            null;

          return false;
        });
  }

  return await initializationPromise;
}

async function shouldRequestNonPersonalizedAds():
  Promise<boolean> {
  const posterPersonalizationEnabled =
    await AdvertisingPreferenceService
      .getPersonalizedAdsEnabled();

  if (!posterPersonalizationEnabled) {
    return true;
  }

  try {
    const gdprApplies =
      await AdsConsent
        .getGdprApplies();

    if (!gdprApplies) {
      return false;
    }

    const choices =
      await AdsConsent
        .getUserChoices();

    return !(
      choices.storeAndAccessInformationOnDevice &&
      choices.createAPersonalisedAdsProfile &&
      choices.selectPersonalisedAds
    );
  } catch {
    /*
     * Consent uncertainty degrades conservatively.
     */
    return true;
  }
}

function resolveConfiguredAdUnitId(
  placement:
    MonetizationPlacement
): string | undefined {
  let value:
    string |
    undefined;

  switch (placement) {
    case "home":
      value =
        process.env
          ?.EXPO_PUBLIC_GOOGLE_NATIVE_AD_UNIT_HOME;
      break;

    case "search":
      value =
        process.env
          ?.EXPO_PUBLIC_GOOGLE_NATIVE_AD_UNIT_SEARCH;
      break;

    case "trending":
      value =
        process.env
          ?.EXPO_PUBLIC_GOOGLE_NATIVE_AD_UNIT_TRENDING;
      break;
  }

  const normalized =
    value?.trim();

  return normalized ||
    undefined;
}

function resolveAdUnitId(
  ad:
    GoogleNativeAdPlaceholder
): string | null {
  if (__DEV__) {
    return TestIds.NATIVE;
  }

  const configured =
    ad.adUnitId?.trim();

  return configured ||
    null;
}

export default class GoogleMobileAdsService {
  static createCandidate(
    placement:
      MonetizationPlacement,
    adUnitId?:
      string
  ): GoogleNativeAdPlaceholder {
    return {
      id:
        `google-native-${placement}`,

      type:
        "google_native_ad",

      placement,

      adUnitId: adUnitId ?? resolveConfiguredAdUnitId(placement),

      status:
        "idle",
    };
  }

  static async loadNativeAd(
    ad:
      GoogleNativeAdPlaceholder
  ): Promise<
    NativeAd |
    null
  > {
    const adUnitId =
      resolveAdUnitId(
        ad
      );

    if (!adUnitId) {
      return null;
    }

    const initialized =
      await ensureInitialized();

    if (!initialized) {
      return null;
    }

    const requestNonPersonalizedAdsOnly =
      await shouldRequestNonPersonalizedAds();

    return await NativeAd
      .createForAdRequest(
        adUnitId,
        {
          aspectRatio:
            NativeMediaAspectRatio
              .LANDSCAPE,

          startVideoMuted:
            true,

          requestNonPersonalizedAdsOnly,
        }
      );
  }

  static async showPrivacyOptions():
    Promise<void> {
    await AdsConsent
      .showPrivacyOptionsForm();
  }
}