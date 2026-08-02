import {
  MonetizationPlacement,
} from "../components/ads";

export interface PlacementMonetizationConfig {
  enabled: boolean;

  organicItemsBeforeFirstMonetized:
    number;

  organicItemsBetweenMonetized:
    number;

  maximumMonetizedItems:
    number;
}

export interface MonetizationConfiguration {
  posterPromotionsEnabled:
    boolean;

  affiliatePromotionsEnabled:
    boolean;

  directSponsorshipsEnabled:
    boolean;

  googleAdsEnabled:
    boolean;

  placements: Record<
    MonetizationPlacement,
    PlacementMonetizationConfig
  >;
}

export const MONETIZATION_CONFIG: MonetizationConfiguration =
  {
    posterPromotionsEnabled: true,

    affiliatePromotionsEnabled: true,

    directSponsorshipsEnabled: true,

    // Google stays disabled until:
    // - Production development build exists
    // - Consent management is implemented
    // - Google Mobile Ads SDK is installed
    // - Test advertisements are validated
    googleAdsEnabled: false,

    placements: {
      home: {
        enabled: true,

        organicItemsBeforeFirstMonetized:
          6,

        organicItemsBetweenMonetized:
          6,

        maximumMonetizedItems:
          2,
      },

      search: {
        enabled: true,

        organicItemsBeforeFirstMonetized:
          6,

        organicItemsBetweenMonetized:
          8,

        maximumMonetizedItems:
          1,
      },

      trending: {
        enabled: true,

        organicItemsBeforeFirstMonetized:
          6,

        organicItemsBetweenMonetized:
          8,

        maximumMonetizedItems:
          1,
      },
    },
  };

export function isMonetizationPlacementEnabled(
  placement: MonetizationPlacement
): boolean {
  return (
    MONETIZATION_CONFIG
      .placements[placement]
      .enabled
  );
}