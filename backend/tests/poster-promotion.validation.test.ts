import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normalizePosterPromotionCreative,
  validatePosterPromotionCreative,
  validatePosterPromotionMediaReference,
} from "../src/domains/monetization/poster-promotion.validation.js";

import {
  POSTER_PROMOTION_DISCLOSURE,
} from "../src/domains/monetization/poster-promotion.types.js";

import type {
  PosterPromotionCreative,
} from "../src/domains/monetization/poster-promotion.types.js";

const VALID_MEDIA = {
  assetId:
    "00000000-0000-4000-8000-000000001501",

  type:
    "image" as const,

  fileName:
    "poster-career-discovery.webp",

  mimeType:
    "image/webp",

  sizeBytes:
    1024,
};

const VALID_CREATIVE:
  PosterPromotionCreative = {
  purpose:
    "Promote an authoritative Poster discovery collection.",

  headline:
    "Discover career knowledge",

  body:
    "Explore a Poster-curated collection for professional learning and career development.",

  callToAction:
    "Explore",

  destinationUrl:
    "https://getpostar.com/collections/career-growth",

  disclosure:
    POSTER_PROMOTION_DISCLOSURE,

  media:
    VALID_MEDIA,
};

describe(
  "Poster Promotion validation",
  () => {
    it(
      "accepts a valid scheduled creative package",
      () => {
        expect(
          validatePosterPromotionCreative(
            VALID_CREATIVE,
            "schedule"
          )
        ).toEqual(
          []
        );
      }
    );

    it(
      "allows a draft without media but requires persisted media before scheduling",
      () => {
        const creative = {
          ...VALID_CREATIVE,

          media:
            null,
        };

        expect(
          validatePosterPromotionCreative(
            creative,
            "draft"
          )
        ).toEqual(
          []
        );

        expect(
          validatePosterPromotionCreative(
            creative,
            "schedule"
          )
        ).toContainEqual({
          path:
            "media",

          message:
            "A persisted Poster Promotion image or video is required before scheduling.",
        });
      }
    );

    it(
      "rejects unsupported media formats and oversized media",
      () => {
        expect(
          validatePosterPromotionMediaReference(
            {
              ...VALID_MEDIA,

              mimeType:
                "image/gif",

              sizeBytes:
                11 * 1024 * 1024,
            },
            "schedule"
          )
        ).toEqual(
          expect.arrayContaining([
            {
              path:
                "media.mimeType",

              message:
                "Poster Promotion images must use JPG, PNG, or WebP.",
            },

            {
              path:
                "media.sizeBytes",

              message:
                "Poster Promotion images must not exceed 10 MB.",
            },
          ])
        );
      }
    );

    it(
      "rejects invalid creative text, destination URL, and disclosure",
      () => {
        const issues =
          validatePosterPromotionCreative(
            {
              ...VALID_CREATIVE,

              purpose:
                "short",

              headline:
                "x",

              body:
                "short",

              callToAction:
                "",

              destinationUrl:
                "javascript:alert(1)",

              disclosure:
                "Recommended by Poster" as
                  typeof POSTER_PROMOTION_DISCLOSURE,
            },
            "schedule"
          );

        expect(
          issues.map(
            issue =>
              issue.path
          )
        ).toEqual(
          expect.arrayContaining([
            "purpose",
            "headline",
            "body",
            "callToAction",
            "destinationUrl",
            "disclosure",
          ])
        );
      }
    );

    it(
      "normalizes authoritative creative input",
      () => {
        expect(
          normalizePosterPromotionCreative({
            campaignId:
              "00000000-0000-4000-8000-000000001401",

            purpose:
              "  Promote an authoritative Poster collection.  ",

            headline:
              "  Discover knowledge  ",

            body:
              "  Explore a carefully selected Poster knowledge collection.  ",

            callToAction:
              "  Explore  ",

            destinationUrl:
              "  https://getpostar.com/collections/knowledge  ",

            media: {
              ...VALID_MEDIA,

              fileName:
                "  creative.webp  ",

              mimeType:
                "IMAGE/WEBP",
            },
          })
        ).toEqual({
          purpose:
            "Promote an authoritative Poster collection.",

          headline:
            "Discover knowledge",

          body:
            "Explore a carefully selected Poster knowledge collection.",

          callToAction:
            "Explore",

          destinationUrl:
            "https://getpostar.com/collections/knowledge",

          disclosure:
            POSTER_PROMOTION_DISCLOSURE,

          media: {
            ...VALID_MEDIA,

            fileName:
              "creative.webp",

            mimeType:
              "image/webp",
          },
        });
      }
    );
  }
);