import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  listMobilePosterPromotionDeliverySources,
} from "../src/domains/monetization/mobile-poster-promotion-delivery.repository.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001701";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001702";

const ROW = {
  campaign_id:
    CAMPAIGN_ID,

  campaign_name:
    "Poster Knowledge",

  placements: [
    "home",
    "search",
  ],

  scheduled_start_date:
    "2026-08-01",

  scheduled_end_date:
    "2026-08-31",

  headline:
    "Discover more with Poster",

  body:
    "Explore a Poster-curated knowledge collection.",

  call_to_action:
    "Explore",

  destination_url:
    "https://getpostar.com/collections/knowledge",

  disclosure:
    "Promoted by Poster",

  media_asset_id:
    ASSET_ID,

  media_type:
    "image",

  media_file_name:
    "poster-knowledge.webp",

  media_mime_type:
    "image/webp",

  media_size_bytes:
    "1048576",
};

function createExecutor(
  rows:
    readonly unknown[]
) {
  const calls:
    {
      text:
        string;

      values:
        readonly unknown[];
    }[] =
      [];

  const executor = {
    query:
      async (
        text:
          string,
        values:
          readonly unknown[] =
            []
      ) => {
        calls.push({
          text,
          values,
        });

        return {
          rows: [
            ...rows,
          ],

          rowCount:
            rows.length,

          command:
            "SELECT",

          oid:
            0,

          fields:
            [],
        };
      },
  } as unknown as
    DatabaseQueryExecutor;

  return {
    executor,
    calls,
  };
}

describe(
  "Mobile Poster Promotion delivery repository",
  () => {
    it(
      "lists only authoritative active ready Poster Promotion media",
      async () => {
        const mocks =
          createExecutor([
            ROW,
          ]);

        const result =
          await listMobilePosterPromotionDeliverySources(
            {
              placement:
                "home",

              limit:
                5,
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual([
          {
            campaignId:
              CAMPAIGN_ID,

            campaignName:
              "Poster Knowledge",

            placements: [
              "home",
              "search",
            ],

            scheduledStartDate:
              "2026-08-01",

            scheduledEndDate:
              "2026-08-31",

            headline:
              "Discover more with Poster",

            body:
              "Explore a Poster-curated knowledge collection.",

            callToAction:
              "Explore",

            destinationUrl:
              "https://getpostar.com/collections/knowledge",

            disclosure:
              "Promoted by Poster",

            assetId:
              ASSET_ID,

            mediaType:
              "image",

            mediaFileName:
              "poster-knowledge.webp",

            mediaMimeType:
              "image/webp",

            mediaSizeBytes:
              1048576,
          },
        ]);

        const call =
          mocks.calls[0];

        expect(
          call
        ).toBeDefined();

        expect(
          call?.values
        ).toEqual([
          "home",
          5,
        ]);

        expect(
          call?.text
        ).toContain(
          "campaign.campaign_type ="
        );

        expect(
          call?.text
        ).toContain(
          "'poster_promotion'"
        );

        expect(
          call?.text
        ).toContain(
          "campaign.delivery_eligible ="
        );

        expect(
          call?.text
        ).toContain(
          "campaign.status ="
        );

        expect(
          call?.text
        ).toContain(
          "INNER JOIN app.media_assets"
        );

        expect(
          call?.text
        ).toContain(
          "media_asset.status ="
        );

        expect(
          call?.text
        ).toContain(
          "'ready'"
        );

        expect(
          call?.text
        ).not.toContain(
          "storage_bucket"
        );

        expect(
          call?.text
        ).not.toContain(
          "storage_object_key"
        );
      }
    );

    it(
      "clamps the delivery limit before querying",
      async () => {
        const mocks =
          createExecutor(
            []
          );

        await listMobilePosterPromotionDeliverySources(
          {
            placement:
              "trending",

            limit:
              999,
          },
          mocks.executor
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          "trending",
          20,
        ]);
      }
    );
  }
);