import {
  closeDatabasePool,
  executeDatabaseQuery,
  runDatabaseTransaction,
} from "../database/index.js";

interface ActivatedUserRow {
  id: string;
  email: string;
  status: string;
}

async function main(): Promise<void> {
  const nodeEnvironment =
    process.env.NODE_ENV ??
    "development";

  if (nodeEnvironment === "production") {
    throw new Error(
      "The first-Admin bootstrap script cannot run in production."
    );
  }

  const email =
    process.argv[2]
      ?.trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      "Usage: npx tsx src/scripts/bootstrap-first-admin.ts <email>"
    );
  }

  const result =
    await runDatabaseTransaction(
      async (client) => {
        const activated =
          await executeDatabaseQuery<
            ActivatedUserRow
          >(
            `
              UPDATE app.users
              SET
                status = 'active',
                email_verified_at =
                  COALESCE(
                    email_verified_at,
                    CURRENT_TIMESTAMP
                  ),
                failed_login_attempts = 0,
                locked_until = NULL
              WHERE
                email = $1
                AND deleted_at IS NULL
                AND status IN (
                  'pending_verification',
                  'active'
                )
              RETURNING
                id,
                email,
                status
            `,
            [email],
            client
          );

        const user =
          activated.rows[0];

        if (!user) {
          throw new Error(
            `No pending or active local account exists for ${email}.`
          );
        }

        await executeDatabaseQuery(
          `
            UPDATE app.email_verification_tokens
            SET
              invalidated_at =
                COALESCE(
                  invalidated_at,
                  CURRENT_TIMESTAMP
                )
            WHERE
              user_id = $1::uuid
              AND purpose = 'signup'
              AND consumed_at IS NULL
              AND invalidated_at IS NULL
          `,
          [user.id],
          client
        );

        await executeDatabaseQuery(
          `
            INSERT INTO app.platform_role_assignments (
              user_id,
              role,
              status,
              granted_by_user_id
            )
            VALUES (
              $1::uuid,
              'super_admin',
              'active',
              NULL
            )
            ON CONFLICT (
              user_id,
              role
            )
            WHERE
              status = 'active'
              AND revoked_at IS NULL
            DO NOTHING
          `,
          [user.id],
          client
        );

        return user;
      }
    );

  process.stdout.write(
    [
      "Local first Admin bootstrap completed.",
      `Email: ${result.email}`,
      `Status: ${result.status}`,
      "Role: super_admin",
      "",
    ].join("\n")
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${
        error instanceof Error
          ? error.message
          : "Local first Admin bootstrap failed."
      }\n`
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
