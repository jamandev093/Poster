import type {
  AccountSelectedInterest,
  AccountSelectedInterestsRepository,
  AccountSelectedInterestsSnapshot,
  GetAccountSelectedInterestsInput,
  ReplaceAccountSelectedInterestsInput,
} from "./account-selected-interests.types.js";

interface QueryResult<Row> {
  rows:
    Row[];
}

export interface QueryableDatabase {
  query<Row = unknown>(
    sql:
      string,
    values?:
      readonly unknown[]
  ): Promise<QueryResult<Row>>;
}

interface SelectedInterestRow {
  topic_id:
    string;

  topic_slug:
    string;

  topic_name:
    string;

  personalization_allowed:
    boolean;

  campaign_targeting_allowed:
    boolean;

  declared_at:
    Date | string | null;

  consent_updated_at:
    Date | string | null;
}

interface ResolvedTopicRow {
  topic_id:
    string;

  topic_slug:
    string;

  topic_name:
    string;
}

function toIsoString(
  value:
    Date | string | null
): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function mapSelectedInterestRow(
  row:
    SelectedInterestRow
): AccountSelectedInterest {
  return {
    topicId:
      row.topic_id,

    topicSlug:
      row.topic_slug,

    topicName:
      row.topic_name,

    personalizationAllowed:
      row.personalization_allowed,

    campaignTargetingAllowed:
      row.campaign_targeting_allowed,

    selectedAt:
      toIsoString(
        row.declared_at
      ),

    consentUpdatedAt:
      toIsoString(
        row.consent_updated_at
      ),
  };
}

function snapshotFromRows(
  userId:
    string,
  rows:
    SelectedInterestRow[]
): AccountSelectedInterestsSnapshot {
  const interests =
    rows.map(
      mapSelectedInterestRow
    );

  return {
    userId,

    selectedInterests:
      interests.map(
        (interest) =>
          interest.topicSlug
      ),

    interests,

    updatedAt:
      new Date().toISOString(),
  };
}

function buildTopicLookup(
  rows:
    readonly ResolvedTopicRow[]
): Map<string, ResolvedTopicRow> {
  const lookup =
    new Map<string, ResolvedTopicRow>();

  rows.forEach((row) => {
    lookup.set(
      row.topic_id.toLowerCase(),
      row
    );

    lookup.set(
      row.topic_slug.toLowerCase(),
      row
    );
  });

  return lookup;
}

function orderedUniqueTopicIds(
  topics:
    readonly ResolvedTopicRow[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  topics.forEach((topic) => {
    if (
      seen.has(
        topic.topic_id
      )
    ) {
      return;
    }

    seen.add(
      topic.topic_id
    );

    result.push(
      topic.topic_id
    );
  });

  return result;
}

export class PostgresAccountSelectedInterestsRepository
implements AccountSelectedInterestsRepository {
  constructor(
    private readonly database:
      QueryableDatabase
  ) {}

  async getSelectedInterests(
    input:
      GetAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot> {
    const result =
      await this.database.query<SelectedInterestRow>(
        `
          SELECT
            topics.id::text AS topic_id,
            topics.slug AS topic_slug,
            topics.name AS topic_name,
            interests.personalization_allowed,
            interests.campaign_targeting_allowed,
            interests.declared_at,
            interests.consent_updated_at
          FROM app.user_declared_interests interests
          INNER JOIN app.taxonomy_topics topics
            ON topics.id = interests.topic_id
          WHERE interests.user_id = $1
            AND interests.status = 'active'
            AND topics.status = 'active'
          ORDER BY
            interests.declared_at DESC,
            topics.name ASC
        `,
        [
          input.userId,
        ]
      );

    return snapshotFromRows(
      input.userId,
      result.rows
    );
  }

  private async resolveTopics(
    selectedInterests:
      readonly string[]
  ): Promise<ResolvedTopicRow[]> {
    if (
      selectedInterests.length ===
      0
    ) {
      return [];
    }

    const result =
      await this.database.query<ResolvedTopicRow>(
        `
          SELECT
            id::text AS topic_id,
            slug AS topic_slug,
            name AS topic_name
          FROM app.taxonomy_topics
          WHERE status = 'active'
            AND (
              id::text = ANY($1::text[])
              OR lower(slug) = ANY($1::text[])
            )
        `,
        [
          selectedInterests,
        ]
      );

    const lookup =
      buildTopicLookup(
        result.rows
      );

    const unresolved =
      selectedInterests.filter(
        (interest) =>
          !lookup.has(
            interest.toLowerCase()
          )
      );

    if (
      unresolved.length >
      0
    ) {
      throw new Error(
        `Unknown interest topic: ${unresolved[0]}`
      );
    }

    return selectedInterests.map(
      (interest) =>
        lookup.get(
          interest.toLowerCase()
        )
    ).filter(
      (
        topic
      ): topic is ResolvedTopicRow =>
        topic !== undefined
    );
  }

  async replaceSelectedInterests(
    input:
      ReplaceAccountSelectedInterestsInput
  ): Promise<AccountSelectedInterestsSnapshot> {
    const resolvedTopics =
      await this.resolveTopics(
        input.selectedInterests
      );

    const topicIds =
      orderedUniqueTopicIds(
        resolvedTopics
      );

    if (
      topicIds.length ===
      0
    ) {
      await this.database.query(
        `
          UPDATE app.user_declared_interests
          SET
            status = 'removed',
            personalization_allowed = false,
            campaign_targeting_allowed = false,
            removed_at = CURRENT_TIMESTAMP,
            consent_updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
            AND status = 'active'
        `,
        [
          input.userId,
        ]
      );

      return this.getSelectedInterests({
        userId:
          input.userId,
      });
    }

    await this.database.query(
      `
        UPDATE app.user_declared_interests
        SET
          status = 'removed',
          personalization_allowed = false,
          campaign_targeting_allowed = false,
          removed_at = CURRENT_TIMESTAMP,
          consent_updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND status = 'active'
          AND NOT (topic_id = ANY($2::uuid[]))
      `,
      [
        input.userId,
        topicIds,
      ]
    );

    for (
      const topicId of topicIds
    ) {
      await this.database.query(
        `
          INSERT INTO app.user_declared_interests (
            user_id,
            topic_id,
            status,
            personalization_allowed,
            campaign_targeting_allowed,
            declared_at,
            consent_updated_at,
            removed_at
          )
          VALUES (
            $1,
            $2,
            'active',
            true,
            false,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            NULL
          )
          ON CONFLICT (
            user_id,
            topic_id
          )
          DO UPDATE
          SET
            status = 'active',
            personalization_allowed = true,
            campaign_targeting_allowed = false,
            removed_at = NULL,
            consent_updated_at = CURRENT_TIMESTAMP
        `,
        [
          input.userId,
          topicId,
        ]
      );
    }

    return this.getSelectedInterests({
      userId:
        input.userId,
    });
  }
}

export function createPostgresAccountSelectedInterestsRepository(
  database:
    QueryableDatabase
): AccountSelectedInterestsRepository {
  return new PostgresAccountSelectedInterestsRepository(
    database
  );
}
