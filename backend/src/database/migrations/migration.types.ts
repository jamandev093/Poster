export type MigrationCommand =
  | "apply"
  | "status";

export interface DatabaseMigration {
  version: string;
  filename: string;
  absolutePath: string;
  checksum: string;
  sql: string;
}

export interface AppliedDatabaseMigration {
  version: string;
  filename: string;
  checksum: string;
  appliedAt: Date;
  executionMilliseconds: number;
}

export interface MigrationRunSummary {
  command: MigrationCommand;
  availableCount: number;
  appliedCount: number;
  pendingCount: number;
  newlyAppliedCount: number;
}