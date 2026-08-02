import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  createPosterPromotionCreative,
  findPosterPromotionCreativeByCampaignId,
  updatePosterPromotionCreative,
} from "../src/domains/monetization/poster-promotion.repository.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001401";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001501";

const CREATED_AT =
  new Date(
    "2026-08-02T06:00:00.000Z"
  );

const DATABASE_ROW = {
  campaign_id:
    CAMPAIGN_ID,

  purpose:
    "Promote a Poster-owned knowledge collection.",

  headline:
    "Discover career knowledge",

  body:
    "Explore a carefully selected Poster collection for professional learning.",

  call_to_action:
    "Explore",

  destination_url:
    "https://getpostar.com/collections/career-growth",

  disclosure:
    "Promoted by Poster" as const,

  media_asset_id:
    ASSET_ID,

  media_type:
    "image" as const,

  media_file_name:
    "career-growth.webp",

  media_mime_type:
    "image/webp",

  media_size_bytes:
    "2048",

  created_at:
    CREATED_AT,

  updated_at:
    CREATED_AT,

  row_version:
    "1",
};

function createExecutor(
  rowsByCall:
    readonly (
      readonly Record<
        string,
        unknown
      >[]
    )[]
) {
  const calls: {
    text: string;

    values:
      readonly unknown[];
  }[] =
    [];

  let index =
    0;

  const executor = {
    query:
      async (
        text:
          string,
        values?:
          readonly unknown[]
      ) => {
        calls.push({
          text,

          values:
            values ??
            [],
        });

        const rows =
          rowsByCall[
            index
          ] ??
          [];

        index +=
          1;

        return {
          command:
            "",

          rowCount:
            rows.length,

          oid:
            0,

          fields:
            [],

          rows:
            Array.from(
              rows
            ),
        };
      },
  } as unknown as
    DatabaseQueryExecutor;

  return {
    calls,
    executor,
  };
}

describe(
  "Poster Promotion repository",
  () => {
    it(
      "reads and maps an authoritative creative record",
      async () => {
        const mocks =
          createExecutor([
            [
              DATABASE_ROW,
            ],
          ]);

        const result =
          await findPosterPromotionCreativeByCampaignId(
            CAMPAIGN_ID,
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          campaignId:
            CAMPAIGN_ID,

          purpose:
            DATABASE_ROW.purpose,

          headline:
            DATABASE_ROW.headline,

          body:
            DATABASE_ROW.body,

          callToAction:
            DATABASE_ROW.call_to_action,

          destinationUrl:
            DATABASE_ROW.destination_url,

          disclosure:
            "Promoted by Poster",

          media: {
            assetId:
              ASSET_ID,

            type:
              "image",

            fileName:
              "career-growth.webp",

            mimeType:
              "image/webp",

            sizeBytes:
              2048,
          },

          createdAt:
            CREATED_AT,

          updatedAt:
            CREATED_AT,

          rowVersion:
            "1",
        });

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          CAMPAIGN_ID,
        ]);
      }
    );

    it(
      "creates a creative using parameterized normalized values",
      async () => {
        const mocks =
          createExecutor([
            [
              DATABASE_ROW,
            ],
          ]);

        const result =
          await createPosterPromotionCreative(
            {
              campaignId:
                CAMPAIGN_ID,

              purpose:
                `  ${DATABASE_ROW.purpose}  `,

              headline:
                `  ${DATABASE_ROW.headline}  `,

              body:
                `  ${DATABASE_ROW.body}  `,

              callToAction:
                "  Explore  ",

              destinationUrl:
                `  ${DATABASE_ROW.destination_url}  `,

              media: {
                assetId:
                  ASSET_ID,

                type:
                  "image",

                fileName:
                  "  career-growth.webp  ",

                mimeType:
                  "IMAGE/WEBP",

                sizeBytes:
                  2048,
              },
            },
            mocks.executor
          );

        expect(
          result?.campaignId
        ).toBe(
          CAMPAIGN_ID
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "INSERT INTO app.poster_promotion_creatives"
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          CAMPAIGN_ID,
          DATABASE_ROW.purpose,
          DATABASE_ROW.headline,
          DATABASE_ROW.body,
          "Explore",
          DATABASE_ROW.destination_url,
          "Promoted by Poster",
          ASSET_ID,
          "image",
          "career-growth.webp",
          "image/webp",
          2048,
        ]);
      }
    );

    it(
      "updates using optimistic concurrency",
      async () => {
        const updatedRow = {
          ...DATABASE_ROW,

          headline:
            "Updated Poster promotion",

          row_version:
            "2",
        };

        const mocks =
          createExecutor([
            [
              updatedRow,
            ],
          ]);

        const result =
          await updatePosterPromotionCreative(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              purpose:
                DATABASE_ROW.purpose,

              headline:
                updatedRow.headline,

              body:
                DATABASE_ROW.body,

              callToAction:
                "Explore",

              destinationUrl:
                DATABASE_ROW.destination_url,

              media: {
                assetId:
                  ASSET_ID,

                type:
                  "image",

                fileName:
                  "career-growth.webp",

                mimeType:
                  "image/webp",

                sizeBytes:
                  2048,
              },
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "updated",

          creative:
            expect.objectContaining({
              headline:
                updatedRow.headline,

              rowVersion:
                "2",
            }),
        });

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "AND row_version ="
        );

        expect(
          mocks.calls[0]?.values.slice(
            0,
            2
          )
        ).toEqual([
          CAMPAIGN_ID,
          "1",
        ]);
      }
    );

    it(
      "returns conflict with the current creative",
      async () => {
        const currentRow = {
          ...DATABASE_ROW,

          row_version:
            "3",
        };

        const mocks =
          createExecutor([
            [],
            [
              currentRow,
            ],
          ]);

        const result =
          await updatePosterPromotionCreative(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              purpose:
                DATABASE_ROW.purpose,

              headline:
                DATABASE_ROW.headline,

              body:
                DATABASE_ROW.body,

              callToAction:
                DATABASE_ROW.call_to_action,

              destinationUrl:
                DATABASE_ROW.destination_url,

              media:
                null,
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "conflict",

          current:
            expect.objectContaining({
              rowVersion:
                "3",
            }),
        });

        expect(
          mocks.calls
        ).toHaveLength(
          2
        );
      }
    );

    it(
      "returns not found when no current creative exists",
      async () => {
        const mocks =
          createExecutor([
            [],
            [],
          ]);

        const result =
          await updatePosterPromotionCreative(
            {
              campaignId:
                CAMPAIGN_ID,

              expectedRowVersion:
                "1",

              purpose:
                DATABASE_ROW.purpose,

              headline:
                DATABASE_ROW.headline,

              body:
                DATABASE_ROW.body,

              callToAction:
                DATABASE_ROW.call_to_action,

              destinationUrl:
                DATABASE_ROW.destination_url,

              media:
                null,
            },
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "not_found",
        });
      }
    );
  }
);