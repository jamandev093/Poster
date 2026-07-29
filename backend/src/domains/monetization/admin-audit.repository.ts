import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  JsonObject,
} from "./commercial.types.js";

export interface CreateAdminAuditEntryInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: JsonObject;
  occurredAt: Date;
}

export async function createAdminAuditEntry(
  input: CreateAdminAuditEntryInput,
  executor: DatabaseQueryExecutor
): Promise<void> {
  await executeDatabaseQuery(
    `
      INSERT INTO app.admin_audit_entries (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        occurred_at
      )
      VALUES (
        $1::uuid,
        $2,
        $3,
        $4::uuid,
        $5::jsonb,
        $6
      )
    `,
    [
      input.actorUserId,
      input.action.trim(),
      input.entityType.trim(),
      input.entityId,
      input.metadata,
      input.occurredAt,
    ],
    executor
  );
}
