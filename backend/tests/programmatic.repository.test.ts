import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  createProgrammaticProvider,
  createProgrammaticSlotMapping,
  listProgrammaticProviders,
  listProgrammaticSlotMappings,
} from "../src/domains/monetization/programmatic.repository.js";

const PROVIDER_ID =
  "00000000-0000-4000-8000-000000001701";

const MAPPING_ID =
  "00000000-0000-4000-8000-000000001702";

const NOW =
  new Date(
    "2026-08-02T14:00:00.000Z"
  );

const PROVIDER_ROW = {
  id:
    PROVIDER_ID,

  provider_key:
    "google_ad_manager",

  display_name:
    "Google Ad Manager",

  status:
    "disabled" as const,

  health_status:
    "unknown" as const,

  notes:
    null,

  created_at:
    NOW,

  updated_at:
    NOW,

  row_version:
    "1",
};

const MAPPING_ROW = {
  id:
    MAPPING_ID,

  provider_id:
    PROVIDER_ID,

  screen:
    "home" as const,

  placement:
    "home_sponsored_card",

  frame:
    "full_width_sponsored_card" as const,

  status:
    "disabled" as const,

  safety_rules:
    {},

  region_rules:
    {},

  device_rules:
    {},

  frequency_rules:
    {},

  fallback_rules:
    {},

  created_at:
    NOW,

  updated_at:
    NOW,

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
    text:
      string;

    values:
      readonly unknown[];
  }[] =
    [];

  let callIndex =
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
            callIndex
          ] ??
          [];

        callIndex +=
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
  "Programmatic repository",
  () => {
    it(
      "lists providers",
      async () => {
        const mocks =
          createExecutor([
            [
              PROVIDER_ROW,
            ],
          ]);

        const result =
          await listProgrammaticProviders(
            mocks.executor
          );

        expect(
          result
        ).toEqual([
          expect.objectContaining({
            id:
              PROVIDER_ID,

            providerKey:
              "google_ad_manager",
          }),
        ]);

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "FROM app.programmatic_providers"
        );
      }
    );

    it(
      "creates a provider",
      async () => {
        const mocks =
          createExecutor([
            [
              PROVIDER_ROW,
            ],
          ]);

        const result =
          await createProgrammaticProvider(
            {
              id:
                PROVIDER_ID,

              providerKey:
                " google_ad_manager ",

              displayName:
                " Google Ad Manager ",

              status:
                "disabled",

              healthStatus:
                "unknown",

              notes:
                null,

              createdAt:
                NOW,
            },
            mocks.executor
          );

        expect(
          result.providerKey
        ).toBe(
          "google_ad_manager"
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "INSERT INTO app.programmatic_providers"
        );
      }
    );

    it(
      "lists slot mappings",
      async () => {
        const mocks =
          createExecutor([
            [
              MAPPING_ROW,
            ],
          ]);

        const result =
          await listProgrammaticSlotMappings(
            mocks.executor
          );

        expect(
          result
        ).toEqual([
          expect.objectContaining({
            id:
              MAPPING_ID,

            frame:
              "full_width_sponsored_card",
          }),
        ]);

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "FROM app.programmatic_slot_mappings"
        );
      }
    );

    it(
      "creates a locked slot mapping",
      async () => {
        const mocks =
          createExecutor([
            [
              MAPPING_ROW,
            ],
          ]);

        const result =
          await createProgrammaticSlotMapping(
            {
              id:
                MAPPING_ID,

              providerId:
                PROVIDER_ID,

              screen:
                "home",

              placement:
                " home_sponsored_card ",

              frame:
                "full_width_sponsored_card",

              status:
                "disabled",

              safetyRules:
                {},

              regionRules:
                {},

              deviceRules:
                {},

              frequencyRules:
                {},

              fallbackRules:
                {},

              createdAt:
                NOW,
            },
            mocks.executor
          );

        expect(
          result.placement
        ).toBe(
          "home_sponsored_card"
        );

        expect(
          mocks.calls[0]?.values
        ).toEqual([
          MAPPING_ID,
          PROVIDER_ID,
          "home",
          "home_sponsored_card",
          "full_width_sponsored_card",
          "disabled",
          {},
          {},
          {},
          {},
          {},
          NOW,
        ]);
      }
    );
  }
);