import {
  randomUUID,
} from "node:crypto";

import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  createAdminAuditEntry,
  createProgrammaticProvider,
  createProgrammaticSlotMapping,
  listProgrammaticProviders,
  listProgrammaticSlotMappings,
  validateProgrammaticProviderDraft,
  validateProgrammaticSlotMappingDraft,
  type CreateProgrammaticProviderInput,
  type CreateProgrammaticSlotMappingInput,
  type JsonObject,
  type ProgrammaticProviderDraftInput,
  type ProgrammaticProviderRecord,
  type ProgrammaticSlotMappingDraftInput,
  type ProgrammaticSlotMappingRecord,
} from "../../domains/monetization/index.js";

import {
  ProgrammaticError,
} from "./programmatic.errors.js";

export interface AdminProgrammaticOverview {
  providers:
    ProgrammaticProviderRecord[];

  slotMappings:
    ProgrammaticSlotMappingRecord[];
}

export interface CreateAdminProgrammaticProviderInput
  extends ProgrammaticProviderDraftInput {
  actorUserId:
    string;
}

export interface CreateAdminProgrammaticSlotMappingInput
  extends ProgrammaticSlotMappingDraftInput {
  actorUserId:
    string;
}

export interface AdminProgrammaticService {
  list:
    () => Promise<
      AdminProgrammaticOverview
    >;

  createProvider:
    (
      input:
        CreateAdminProgrammaticProviderInput
    ) => Promise<
      ProgrammaticProviderRecord
    >;

  createSlotMapping:
    (
      input:
        CreateAdminProgrammaticSlotMappingInput
    ) => Promise<
      ProgrammaticSlotMappingRecord
    >;
}

export interface AdminProgrammaticServiceDependencies {
  listProviders:
    typeof listProgrammaticProviders;

  listSlotMappings:
    typeof listProgrammaticSlotMappings;

  createProvider:
    typeof createProgrammaticProvider;

  createSlotMapping:
    typeof createProgrammaticSlotMapping;

  createAuditEntry:
    typeof createAdminAuditEntry;

  runTransaction:
    typeof runDatabaseTransaction;

  createId:
    () => string;

  now:
    () => Date;
}

export interface CreateAdminProgrammaticServiceOptions {
  dependencies?:
    Partial<
      AdminProgrammaticServiceDependencies
    >;
}

function normalizeProviderDraft(
  input:
    ProgrammaticProviderDraftInput
): ProgrammaticProviderDraftInput {
  return {
    providerKey:
      input.providerKey.trim(),

    displayName:
      input.displayName.trim(),

    status:
      input.status,

    healthStatus:
      input.healthStatus,

    notes:
      input.notes?.trim() ??
      null,
  };
}

function normalizeSlotMappingDraft(
  input:
    ProgrammaticSlotMappingDraftInput
): ProgrammaticSlotMappingDraftInput {
  return {
    providerId:
      input.providerId,

    screen:
      input.screen,

    placement:
      input.placement.trim(),

    frame:
      input.frame,

    status:
      input.status,

    safetyRules:
      input.safetyRules,

    regionRules:
      input.regionRules,

    deviceRules:
      input.deviceRules,

    frequencyRules:
      input.frequencyRules,

    fallbackRules:
      input.fallbackRules,
  };
}

function validateProviderOrThrow(
  input:
    ProgrammaticProviderDraftInput
): ProgrammaticProviderDraftInput {
  const normalized =
    normalizeProviderDraft(
      input
    );

  const issues =
    validateProgrammaticProviderDraft(
      normalized
    );

  if (
    issues.length > 0
  ) {
    throw new ProgrammaticError(
      "PROGRAMMATIC_PROVIDER_INVALID",
      "The programmatic provider is invalid.",
      issues
    );
  }

  return normalized;
}

function validateSlotMappingOrThrow(
  input:
    ProgrammaticSlotMappingDraftInput
): ProgrammaticSlotMappingDraftInput {
  const normalized =
    normalizeSlotMappingDraft(
      input
    );

  const issues =
    validateProgrammaticSlotMappingDraft(
      normalized
    );

  if (
    issues.length > 0
  ) {
    throw new ProgrammaticError(
      "PROGRAMMATIC_SLOT_MAPPING_INVALID",
      "The programmatic slot mapping is invalid.",
      issues
    );
  }

  return normalized;
}

export function createAdminProgrammaticService(
  options:
    CreateAdminProgrammaticServiceOptions =
    {}
): AdminProgrammaticService {
  const dependencies:
    AdminProgrammaticServiceDependencies = {
    listProviders:
      listProgrammaticProviders,

    listSlotMappings:
      listProgrammaticSlotMappings,

    createProvider:
      createProgrammaticProvider,

    createSlotMapping:
      createProgrammaticSlotMapping,

    createAuditEntry:
      createAdminAuditEntry,

    runTransaction:
      runDatabaseTransaction,

    createId:
      randomUUID,

    now:
      () =>
        new Date(),

    ...options.dependencies,
  };

  return {
    async list() {
      const [
        providers,
        slotMappings,
      ] =
        await Promise.all([
          dependencies.listProviders(),
          dependencies.listSlotMappings(),
        ]);

      return {
        providers,
        slotMappings,
      };
    },

    async createProvider(
      input
    ) {
      const normalized =
        validateProviderOrThrow(
          input
        );

      return await dependencies
        .runTransaction(
          async executor => {
            const providerInput:
              CreateProgrammaticProviderInput = {
              ...normalized,

              id:
                dependencies.createId(),

              createdAt:
                dependencies.now(),
            };

            const provider =
              await dependencies
                .createProvider(
                  providerInput,
                  executor
                );

            await dependencies
              .createAuditEntry(
                {
                  actorUserId:
                    input.actorUserId,

                  action:
                    "monetization.programmatic.provider_created",

                  entityType:
                    "programmatic_provider",

                  entityId:
                    provider.id,

                  metadata: {
                    providerKey:
                      provider.providerKey,

                    displayName:
                      provider.displayName,

                    status:
                      provider.status,

                    healthStatus:
                      provider.healthStatus,
                  } satisfies JsonObject,

                  occurredAt:
                    dependencies.now(),
                },
                executor
              );

            return provider;
          }
        );
    },

    async createSlotMapping(
      input
    ) {
      const normalized =
        validateSlotMappingOrThrow(
          input
        );

      return await dependencies
        .runTransaction(
          async executor => {
            const mappingInput:
              CreateProgrammaticSlotMappingInput = {
              ...normalized,

              id:
                dependencies.createId(),

              createdAt:
                dependencies.now(),
            };

            const mapping =
              await dependencies
                .createSlotMapping(
                  mappingInput,
                  executor
                );

            await dependencies
              .createAuditEntry(
                {
                  actorUserId:
                    input.actorUserId,

                  action:
                    "monetization.programmatic.slot_mapping_created",

                  entityType:
                    "programmatic_slot_mapping",

                  entityId:
                    mapping.id,

                  metadata: {
                    providerId:
                      mapping.providerId,

                    screen:
                      mapping.screen,

                    placement:
                      mapping.placement,

                    frame:
                      mapping.frame,

                    status:
                      mapping.status,
                  } satisfies JsonObject,

                  occurredAt:
                    dependencies.now(),
                },
                executor
              );

            return mapping;
          }
        );
    },
  };
}