import type {
  QueryResultRow,
} from "pg";

import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  closeDatabasePool,
  runDatabaseTransaction,
} from "../src/database/index.js";

interface TransactionStateRow
  extends QueryResultRow {
  authenticated_user: string;

  isolation_level: string;

  read_only: string;
}

interface AdvisoryLockRow
  extends QueryResultRow {
  acquired: boolean;
}

describe(
  "Poster database transaction foundation",
  () => {
    afterAll(
      async () => {
        await closeDatabasePool();
      }
    );

    it(
      "executes work using the requested PostgreSQL transaction settings",
      async () => {
        const transactionState =
          await runDatabaseTransaction(
            async (
              client
            ) => {
              const result =
                await client.query<
                  TransactionStateRow
                >(
                  `
                    SELECT
                      current_user::text
                        AS authenticated_user,

                      current_setting(
                        'transaction_isolation'
                      )::text
                        AS isolation_level,

                      current_setting(
                        'transaction_read_only'
                      )::text
                        AS read_only
                  `
                );

              const row =
                result.rows[0];

              if (!row) {
                throw new Error(
                  "PostgreSQL returned no transaction-state row."
                );
              }

              return row;
            },
            {
              isolationLevel:
                "repeatable_read",

              readOnly:
                true,
            }
          );

        expect(
          transactionState
            .authenticated_user
        ).toBe(
          "poster_app"
        );

        expect(
          transactionState
            .isolation_level
        ).toBe(
          "repeatable read"
        );

        expect(
          transactionState
            .read_only
        ).toBe(
          "on"
        );
      }
    );

    it(
      "rolls back failed work and releases transaction-scoped advisory locks",
      async () => {
        const advisoryLockKey =
          700_000_000 +
          Math.floor(
            Math.random() *
            1_000_000
          );

        const expectedError =
          new Error(
            "Intentional transaction rollback test."
          );

        await expect(
          runDatabaseTransaction(
            async (
              client
            ) => {
              await client.query(
                `
                  SELECT
                    pg_advisory_xact_lock(
                      $1::integer
                    )
                `,
                [
                  advisoryLockKey,
                ]
              );

              throw expectedError;
            }
          )
        ).rejects.toBe(
          expectedError
        );

        const lockWasReleased =
          await runDatabaseTransaction(
            async (
              client
            ) => {
              const result =
                await client.query<
                  AdvisoryLockRow
                >(
                  `
                    SELECT
                      pg_try_advisory_xact_lock(
                        $1::integer
                      )
                        AS acquired
                  `,
                  [
                    advisoryLockKey,
                  ]
                );

              return (
                result.rows[0]
                  ?.acquired ??
                false
              );
            }
          );

        expect(
          lockWasReleased
        ).toBe(
          true
        );
      }
    );
  }
);