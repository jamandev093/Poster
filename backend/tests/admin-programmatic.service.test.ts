import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminProgrammaticService,
  ProgrammaticError,
  type AdminProgrammaticServiceDependencies,
} from "../src/application/monetization/index.js";

import type {
  ProgrammaticProviderRecord,
  ProgrammaticSlotMappingRecord,
} from "../src/domains/monetization/index.js";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const PROVIDER_ID =
  "00000000-0000-4000-8000-000000001701";

const MAPPING_ID =
  "00000000-0000-4000-8000-000000001702";

const NOW =
  new Date(
    "2026-08-02T14:30:00.000Z"
  );

const PROVIDER:
  ProgrammaticProviderRecord = {
  id:
    PROVIDER_ID,

  providerKey:
    "google_ad_manager",

  displayName:
    "Google Ad Manager",

  status:
    "disabled",

  healthStatus:
    "unknown",

  notes:
    null,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

const SLOT_MAPPING:
  ProgrammaticSlotMappingRecord = {
  id:
    MAPPING_ID,

  providerId:
    PROVIDER_ID,

  screen:
    "home",

  placement:
    "home_sponsored_card",

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

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

function createDependencies() {
  const executor =
    {} as never;

  const listProviders =
    vi.fn<
      AdminProgrammaticServiceDependencies[
        "listProviders"
      ]
    >()
      .mockResolvedValue([
        PROVIDER,
      ]);

  const listSlotMappings =
    vi.fn<
      AdminProgrammaticServiceDependencies[
        "listSlotMappings"
      ]
    >()
      .mockResolvedValue([
        SLOT_MAPPING,
      ]);

  const createProvider =
    vi.fn<
      AdminProgrammaticServiceDependencies[
        "createProvider"
      ]
    >()
      .mockResolvedValue(
        PROVIDER
      );

  const createSlotMapping =
    vi.fn<
      AdminProgrammaticServiceDependencies[
        "createSlotMapping"
      ]
    >()
      .mockResolvedValue(
        SLOT_MAPPING
      );

  const createAuditEntry =
    vi.fn<
      AdminProgrammaticServiceDependencies[
        "createAuditEntry"
      ]
    >()
      .mockResolvedValue();

  const runTransaction:
    AdminProgrammaticServiceDependencies[
      "runTransaction"
    ] =
    async operation =>
      await operation(
        executor
      );

  const createId =
    vi.fn(
      () =>
        PROVIDER_ID
    );

  const dependencies = {
    listProviders,
    listSlotMappings,
    createProvider,
    createSlotMapping,
    createAuditEntry,
    runTransaction,
    createId,
    now:
      () =>
        NOW,
  } satisfies
    AdminProgrammaticServiceDependencies;

  return {
    dependencies,
    listProviders,
    listSlotMappings,
    createProvider,
    createSlotMapping,
    createAuditEntry,
  };
}

describe(
  "Admin Programmatic application service",
  () => {
    it(
      "returns providers and slot mappings",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminProgrammaticService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.list()
        ).resolves.toEqual({
          providers: [
            PROVIDER,
          ],

          slotMappings: [
            SLOT_MAPPING,
          ],
        });
      }
    );

    it(
      "creates a provider and audit entry transactionally",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminProgrammaticService({
            dependencies:
              mocks.dependencies,
          });

        const provider =
          await service.createProvider({
            actorUserId:
              ADMIN_ID,

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
          });

        expect(
          provider
        ).toEqual(
          PROVIDER
        );

        expect(
          mocks.createProvider
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id:
              PROVIDER_ID,

            providerKey:
              "google_ad_manager",

            displayName:
              "Google Ad Manager",

            createdAt:
              NOW,
          }),
          expect.anything()
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            actorUserId:
              ADMIN_ID,

            action:
              "monetization.programmatic.provider_created",

            entityType:
              "programmatic_provider",

            entityId:
              PROVIDER_ID,
          }),
          expect.anything()
        );
      }
    );

    it(
      "rejects invalid providers before repository writes",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminProgrammaticService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.createProvider({
            actorUserId:
              ADMIN_ID,

            providerKey:
              "Bad Provider!",

            displayName:
              "A",

            status:
              "enabled",

            healthStatus:
              "healthy",

            notes:
              null,
          })
        ).rejects.toBeInstanceOf(
          ProgrammaticError
        );

        expect(
          mocks.createProvider
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "creates a locked slot mapping and audit entry transactionally",
      async () => {
        const mocks =
          createDependencies();

        mocks.dependencies.createId =
          vi.fn(
            () =>
              MAPPING_ID
          );

        const service =
          createAdminProgrammaticService({
            dependencies:
              mocks.dependencies,
          });

        const mapping =
          await service.createSlotMapping({
            actorUserId:
              ADMIN_ID,

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
          });

        expect(
          mapping
        ).toEqual(
          SLOT_MAPPING
        );

        expect(
          mocks.createSlotMapping
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id:
              MAPPING_ID,

            providerId:
              PROVIDER_ID,

            placement:
              "home_sponsored_card",

            frame:
              "full_width_sponsored_card",

            createdAt:
              NOW,
          }),
          expect.anything()
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            actorUserId:
              ADMIN_ID,

            action:
              "monetization.programmatic.slot_mapping_created",

            entityType:
              "programmatic_slot_mapping",

            entityId:
              MAPPING_ID,
          }),
          expect.anything()
        );
      }
    );

    it(
      "rejects blocked ad formats before repository writes",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminProgrammaticService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.createSlotMapping({
            actorUserId:
              ADMIN_ID,

            providerId:
              PROVIDER_ID,

            screen:
              "home",

            placement:
              "floating_banner_overlay",

            frame:
              "banner" as never,

            status:
              "enabled",

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
          })
        ).rejects.toBeInstanceOf(
          ProgrammaticError
        );

        expect(
          mocks.createSlotMapping
        ).not.toHaveBeenCalled();
      }
    );
  }
);