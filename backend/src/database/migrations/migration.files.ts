import {
  createHash,
} from "node:crypto";

import {
  readdir,
  readFile,
} from "node:fs/promises";

import {
  resolve,
} from "node:path";

import type {
  DatabaseMigration,
} from "./migration.types.js";

const MIGRATION_FILENAME_PATTERN =
  /^(\d{4,})_([a-z0-9][a-z0-9_]*)\.sql$/;

function createChecksum(
  content: string
): string {
  return createHash(
    "sha256"
  )
    .update(
      content,
      "utf8"
    )
    .digest(
      "hex"
    );
}

export async function loadDatabaseMigrations(
  migrationsDirectory: string
): Promise<DatabaseMigration[]> {
  const directoryEntries =
    await readdir(
      migrationsDirectory,
      {
        withFileTypes: true,
      }
    );

  const filenames =
    directoryEntries
      .filter(
        (
          entry
        ) =>
          entry.isFile() &&
          MIGRATION_FILENAME_PATTERN.test(
            entry.name
          )
      )
      .map(
        (
          entry
        ) =>
          entry.name
      )
      .sort(
        (
          first,
          second
        ) =>
          first.localeCompare(
            second
          )
      );

  const migrations:
    DatabaseMigration[] = [];

  const usedVersions =
    new Set<string>();

  for (
    const filename
    of filenames
  ) {
    const match =
      MIGRATION_FILENAME_PATTERN.exec(
        filename
      );

    if (!match) {
      continue;
    }

    const version =
      match[1]!;

    if (
      usedVersions.has(
        version
      )
    ) {
      throw new Error(
        `Duplicate migration version ${version}.`
      );
    }

    usedVersions.add(
      version
    );

    const absolutePath =
      resolve(
        migrationsDirectory,
        filename
      );

    const sql =
      await readFile(
        absolutePath,
        "utf8"
      );

    if (
      sql.trim().length ===
      0
    ) {
      throw new Error(
        `Migration ${filename} is empty.`
      );
    }

    migrations.push({
      version,
      filename,
      absolutePath,
      checksum:
        createChecksum(
          sql
        ),
      sql,
    });
  }

  return migrations;
}
