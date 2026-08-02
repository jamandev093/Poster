import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  JsonObject,
} from "./commercial.types.js";

import type {
  CreateProgrammaticProviderInput,
  CreateProgrammaticSlotMappingInput,
  ProgrammaticApprovedFrame,
  ProgrammaticApprovedScreen,
  ProgrammaticMappingStatus,
  ProgrammaticProviderHealthStatus,
  ProgrammaticProviderRecord,
  ProgrammaticProviderStatus,
  ProgrammaticSlotMappingRecord,
} from "./programmatic.types.js";

interface ProgrammaticProviderDatabaseRow
  extends QueryResultRow {
  id:
    string;

  provider_key:
    string;

  display_name:
    string;

  status:
    ProgrammaticProviderStatus;

  health_status:
    ProgrammaticProviderHealthStatus;

  notes:
    string | null;

  created_at:
    Date;

  updated_at:
    Date;

  row_version:
    string;
}

interface ProgrammaticSlotMappingDatabaseRow
  extends QueryResultRow {
  id:
    string;

  provider_id:
    string;

  screen:
    ProgrammaticApprovedScreen;

  placement:
    string;

  frame:
    ProgrammaticApprovedFrame;

  status:
    ProgrammaticMappingStatus;

  safety_rules:
    JsonObject;

  region_rules:
    JsonObject;

  device_rules:
    JsonObject;

  frequency_rules:
    JsonObject;

  fallback_rules:
    JsonObject;

  created_at:
    Date;

  updated_at:
    Date;

  row_version:
    string;
}

const PROVIDER_COLUMNS = `
  id,
  provider_key,
  display_name,
  status,
  health_status,
  notes,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

const SLOT_MAPPING_COLUMNS = `
  id,
  provider_id,
  screen,
  placement,
  frame,
  status,
  safety_rules,
  region_rules,
  device_rules,
  frequency_rules,
  fallback_rules,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapProviderRow(
  row:
    ProgrammaticProviderDatabaseRow
): ProgrammaticProviderRecord {
  return {
    id:
      row.id,

    providerKey:
      row.provider_key,

    displayName:
      row.display_name,

    status:
      row.status,

    healthStatus:
      row.health_status,

    notes:
      row.notes,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

function mapSlotMappingRow(
  row:
    ProgrammaticSlotMappingDatabaseRow
): ProgrammaticSlotMappingRecord {
  return {
    id:
      row.id,

    providerId:
      row.provider_id,

    screen:
      row.screen,

    placement:
      row.placement,

    frame:
      row.frame,

    status:
      row.status,

    safetyRules:
      row.safety_rules,

    regionRules:
      row.region_rules,

    deviceRules:
      row.device_rules,

    frequencyRules:
      row.frequency_rules,

    fallbackRules:
      row.fallback_rules,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

export async function listProgrammaticProviders(
  executor?:
    DatabaseQueryExecutor
): Promise<
  ProgrammaticProviderRecord[]
> {
  const result =
    await executeDatabaseQuery<
      ProgrammaticProviderDatabaseRow
    >(
      `
        SELECT
          ${PROVIDER_COLUMNS}
        FROM app.programmatic_providers
        ORDER BY display_name ASC
      `,
      [],
      executor
    );

  return result.rows.map(
    mapProviderRow
  );
}

export async function createProgrammaticProvider(
  input:
    CreateProgrammaticProviderInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  ProgrammaticProviderRecord
> {
  const result =
    await executeDatabaseQuery<
      ProgrammaticProviderDatabaseRow
    >(
      `
        INSERT INTO app.programmatic_providers (
          id,
          provider_key,
          display_name,
          status,
          health_status,
          notes,
          created_at,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $7
        )
        RETURNING
          ${PROVIDER_COLUMNS}
      `,
      [
        input.id,
        input.providerKey.trim(),
        input.displayName.trim(),
        input.status,
        input.healthStatus,
        input.notes?.trim() ??
          null,
        input.createdAt,
      ],
      executor
    );

  const row =
    result.rows[0];

  if (
    !row
  ) {
    throw new Error(
      "Programmatic provider was not returned after creation."
    );
  }

  return mapProviderRow(
    row
  );
}

export async function listProgrammaticSlotMappings(
  executor?:
    DatabaseQueryExecutor
): Promise<
  ProgrammaticSlotMappingRecord[]
> {
  const result =
    await executeDatabaseQuery<
      ProgrammaticSlotMappingDatabaseRow
    >(
      `
        SELECT
          ${SLOT_MAPPING_COLUMNS}
        FROM app.programmatic_slot_mappings
        ORDER BY screen ASC, placement ASC
      `,
      [],
      executor
    );

  return result.rows.map(
    mapSlotMappingRow
  );
}

export async function createProgrammaticSlotMapping(
  input:
    CreateProgrammaticSlotMappingInput,
  executor:
    DatabaseQueryExecutor
): Promise<
  ProgrammaticSlotMappingRecord
> {
  const result =
    await executeDatabaseQuery<
      ProgrammaticSlotMappingDatabaseRow
    >(
      `
        INSERT INTO app.programmatic_slot_mappings (
          id,
          provider_id,
          screen,
          placement,
          frame,
          status,
          safety_rules,
          region_rules,
          device_rules,
          frequency_rules,
          fallback_rules,
          created_at,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4,
          $5,
          $6,
          $7::jsonb,
          $8::jsonb,
          $9::jsonb,
          $10::jsonb,
          $11::jsonb,
          $12,
          $12
        )
        RETURNING
          ${SLOT_MAPPING_COLUMNS}
      `,
      [
        input.id,
        input.providerId,
        input.screen,
        input.placement.trim(),
        input.frame,
        input.status,
        input.safetyRules,
        input.regionRules,
        input.deviceRules,
        input.frequencyRules,
        input.fallbackRules,
        input.createdAt,
      ],
      executor
    );

  const row =
    result.rows[0];

  if (
    !row
  ) {
    throw new Error(
      "Programmatic slot mapping was not returned after creation."
    );
  }

  return mapSlotMappingRow(
    row
  );
}