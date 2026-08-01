import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  AudienceInsightTopicRecord,
  ReadAudienceInsightTopicsInput,
} from "./audience-insights.types.js";

interface AudienceInsightTopicDatabaseRow
  extends QueryResultRow {
  topic_id: string;

  topic_slug: string;

  topic_name: string;

  parent_topic_id:
    string |
    null;

  total_registered_users: string;

  total_interested_users: string;

  previous_interested_users: string;

  active_interested_users: string;

  campaign_eligible_users: string;
}

function parseCount(
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

function mapAudienceInsightTopicRow(
  row:
    AudienceInsightTopicDatabaseRow
): AudienceInsightTopicRecord {
  return {
    topicId:
      row.topic_id,

    topicSlug:
      row.topic_slug,

    topicName:
      row.topic_name,

    parentTopicId:
      row.parent_topic_id,

    totalRegisteredUsers:
      parseCount(
        row.total_registered_users,
        "total-registered-user"
      ),

    totalInterestedUsers:
      parseCount(
        row.total_interested_users,
        "total-interested-user"
      ),

    previousInterestedUsers:
      parseCount(
        row.previous_interested_users,
        "previous-interested-user"
      ),

    activeInterestedUsers:
      parseCount(
        row.active_interested_users,
        "active-interested-user"
      ),

    campaignEligibleUsers:
      parseCount(
        row.campaign_eligible_users,
        "campaign-eligible-user"
      ),
  };
}

/**
 * Reads aggregate topic audiences only.
 *
 * previousInterestedUsers represents the audience that existed
 * at the beginning of the current comparison window.
 *
 * No individual-user identifier or interest row is returned.
 */
export async function readAudienceInsightTopics(
  input:
    ReadAudienceInsightTopicsInput,
  executor?:
    DatabaseQueryExecutor
): Promise<AudienceInsightTopicRecord[]> {
  const result =
    await executeDatabaseQuery<
      AudienceInsightTopicDatabaseRow
    >(
      `
        WITH registered_users AS (
          SELECT
            COUNT(*)::text
              AS total_registered_users
          FROM app.users
          WHERE deleted_at IS NULL
        ),

        active_users AS (
          SELECT DISTINCT
            sessions.user_id
          FROM app.user_sessions
            AS sessions
          INNER JOIN app.users
            AS users
            ON users.id =
              sessions.user_id
          WHERE
            users.deleted_at IS NULL
            AND sessions.last_seen_at >= $1
            AND sessions.last_seen_at <= $2
            AND sessions.revoked_at IS NULL
            AND sessions.expires_at > $2
        )

        SELECT
          topics.id
            AS topic_id,

          topics.slug
            AS topic_slug,

          topics.name
            AS topic_name,

          topics.parent_topic_id,

          registered_users.total_registered_users,

          COUNT(
            DISTINCT interests.user_id
          ) FILTER (
            WHERE
              interests.status = 'active'
              AND users.deleted_at IS NULL
          )::text
            AS total_interested_users,

          COUNT(
            DISTINCT interests.user_id
          ) FILTER (
            WHERE
              users.deleted_at IS NULL
              AND interests.declared_at <= $1
              AND (
                interests.removed_at IS NULL
                OR interests.removed_at > $1
              )
          )::text
            AS previous_interested_users,

          COUNT(
            DISTINCT interests.user_id
          ) FILTER (
            WHERE
              interests.status = 'active'
              AND users.deleted_at IS NULL
              AND active_users.user_id IS NOT NULL
          )::text
            AS active_interested_users,

          COUNT(
            DISTINCT interests.user_id
          ) FILTER (
            WHERE
              interests.status = 'active'
              AND users.deleted_at IS NULL
              AND interests.campaign_targeting_allowed = true
          )::text
            AS campaign_eligible_users

        FROM app.taxonomy_topics
          AS topics

        CROSS JOIN registered_users

        LEFT JOIN app.user_declared_interests
          AS interests
          ON interests.topic_id =
            topics.id

        LEFT JOIN app.users
          AS users
          ON users.id =
            interests.user_id

        LEFT JOIN active_users
          ON active_users.user_id =
            interests.user_id

        WHERE
          topics.status = 'active'

        GROUP BY
          topics.id,
          topics.slug,
          topics.name,
          topics.parent_topic_id,
          topics.sort_order,
          registered_users.total_registered_users

        ORDER BY
          topics.sort_order ASC,
          topics.name ASC,
          topics.id ASC
      `,
      [
        input.activeSince,
        input.observedAt,
      ],
      executor
    );

  return result.rows.map(
    mapAudienceInsightTopicRow
  );
}