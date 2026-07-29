import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  AdminUserMetricCounts,
  ReadAdminUserMetricsInput,
} from "./admin-metrics.types.js";

interface AdminUserMetricsDatabaseRow
  extends QueryResultRow {
  total_users: string;

  daily_active_users: string;

  monthly_active_users: string;

  live_active_users: string;
}

function parseDatabaseCount(
  value: string,
  label: string
): number {
  if (
    !/^\d+$/.test(
      value
    )
  ) {
    throw new Error(
      `PostgreSQL returned an invalid ${label} count.`
    );
  }

  const count =
    Number(
      value
    );

  if (
    !Number.isSafeInteger(
      count
    ) ||
    count < 0
  ) {
    throw new Error(
      `PostgreSQL returned an unsafe ${label} count.`
    );
  }

  return count;
}

/**
 * Reads one authoritative user-metrics snapshot.
 *
 * Definitions:
 * - totalUsers: all non-soft-deleted Poster identities;
 * - dailyActiveUsers: distinct users seen during the rolling 24-hour window;
 * - monthlyActiveUsers: distinct users seen during the rolling 30-day window;
 * - liveActiveUsers: distinct users seen during the recent live window
 *   whose session is still unrevoked and unexpired.
 */
export async function readAdminUserMetrics(
  input:
    ReadAdminUserMetricsInput,
  executor?:
    DatabaseQueryExecutor
): Promise<
  AdminUserMetricCounts
> {
  const result =
    await executeDatabaseQuery<
      AdminUserMetricsDatabaseRow
    >(
      `
        SELECT
          (
            SELECT COUNT(*)::text
            FROM app.users
            WHERE deleted_at IS NULL
          ) AS total_users,

          COUNT(
            DISTINCT sessions.user_id
          ) FILTER (
            WHERE
              sessions.last_seen_at >= $1
              AND sessions.last_seen_at <= $4
          )::text
            AS daily_active_users,

          COUNT(
            DISTINCT sessions.user_id
          ) FILTER (
            WHERE
              sessions.last_seen_at >= $2
              AND sessions.last_seen_at <= $4
          )::text
            AS monthly_active_users,

          COUNT(
            DISTINCT sessions.user_id
          ) FILTER (
            WHERE
              sessions.last_seen_at >= $3
              AND sessions.last_seen_at <= $4
              AND sessions.revoked_at IS NULL
              AND sessions.expires_at > $4
          )::text
            AS live_active_users
        FROM app.user_sessions
          AS sessions
        INNER JOIN app.users
          AS users
          ON users.id = sessions.user_id
        WHERE users.deleted_at IS NULL
      `,
      [
        input.dailyActiveSince,
        input.monthlyActiveSince,
        input.liveActiveSince,
        input.observedAt,
      ],
      executor
    );

  const row =
    result.rows[0];

  if (
    !row
  ) {
    throw new Error(
      "PostgreSQL did not return the Admin user-metrics snapshot."
    );
  }

  return {
    totalUsers:
      parseDatabaseCount(
        row.total_users,
        "total-user"
      ),

    dailyActiveUsers:
      parseDatabaseCount(
        row.daily_active_users,
        "daily-active-user"
      ),

    monthlyActiveUsers:
      parseDatabaseCount(
        row.monthly_active_users,
        "monthly-active-user"
      ),

    liveActiveUsers:
      parseDatabaseCount(
        row.live_active_users,
        "live-active-user"
      ),
  };
}