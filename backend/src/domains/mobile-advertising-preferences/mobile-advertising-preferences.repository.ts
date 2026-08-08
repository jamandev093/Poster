import type {
  ClearMobileAdvertisingHiddenItemsInput,
  GetMobileAdvertisingPreferencesInput,
  HideMobileAdvertisingItemInput,
  MobileAdvertisingPreferences,
  MobileAdvertisingPreferencesRepository,
  ResetMobileAdvertisingPreferencesInput,
  SetPersonalizedAdsEnabledInput,
  UnhideMobileAdvertisingItemInput,
} from "./mobile-advertising-preferences.types.js";

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

interface MobileAdvertisingPreferencesRow {
  user_id:
    string;

  personalized_ads_enabled:
    boolean;

  hidden_monetization_item_ids:
    string[] | null;

  created_at:
    Date | string | null;

  updated_at:
    Date | string | null;
}

function requireSingleRow<Row>(
  result:
    QueryResult<Row>,
  message:
    string
): Row {
  const row =
    result.rows[0];

  if (row === undefined) {
    throw new Error(
      message
    );
  }

  return row;
}

function mapTimestamp(
  value:
    Date | string | null
): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function normalizeHiddenItemIds(
  value:
    string[] | null
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
            "string"
        )
        .map((item) =>
          item.trim()
        )
        .filter((item) =>
          item.length > 0
        )
    )
  );
}

function mapPreferencesRow(
  row:
    MobileAdvertisingPreferencesRow
): MobileAdvertisingPreferences {
  return {
    userId:
      row.user_id,

    personalizedAdsEnabled:
      row.personalized_ads_enabled,

    hiddenItemIds:
      normalizeHiddenItemIds(
        row.hidden_monetization_item_ids
      ),

    createdAt:
      mapTimestamp(
        row.created_at
      ),

    updatedAt:
      mapTimestamp(
        row.updated_at
      ),
  };
}

export class PostgresMobileAdvertisingPreferencesRepository
implements MobileAdvertisingPreferencesRepository {
  constructor(
    private readonly database:
      QueryableDatabase
  ) {}

  private async ensureDefaultPreferences(
    userId:
      string
  ): Promise<void> {
    await this.database.query(
      `
        INSERT INTO app.mobile_user_advertising_preferences (
          user_id,
          personalized_ads_enabled,
          hidden_monetization_item_ids
        )
        VALUES ($1, FALSE, ARRAY[]::TEXT[])
        ON CONFLICT (user_id) DO NOTHING
      `,
      [
        userId,
      ]
    );
  }

  private async getRequiredPreferences(
    userId:
      string
  ): Promise<MobileAdvertisingPreferences> {
    const result =
      await this.database.query<MobileAdvertisingPreferencesRow>(
        `
          SELECT
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids,
            created_at,
            updated_at
          FROM app.mobile_user_advertising_preferences
          WHERE user_id = $1
        `,
        [
          userId,
        ]
      );

    return mapPreferencesRow(
      requireSingleRow(
        result,
        "Mobile advertising preferences were not found after initialization."
      )
    );
  }

  async getPreferences(
    input:
      GetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences> {
    await this.ensureDefaultPreferences(
      input.userId
    );

    return this.getRequiredPreferences(
      input.userId
    );
  }

  async setPersonalizedAdsEnabled(
    input:
      SetPersonalizedAdsEnabledInput
  ): Promise<MobileAdvertisingPreferences> {
    const result =
      await this.database.query<MobileAdvertisingPreferencesRow>(
        `
          INSERT INTO app.mobile_user_advertising_preferences (
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids
          )
          VALUES ($1, $2, ARRAY[]::TEXT[])
          ON CONFLICT (user_id) DO UPDATE
          SET
            personalized_ads_enabled = EXCLUDED.personalized_ads_enabled,
            updated_at = NOW()
          RETURNING
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids,
            created_at,
            updated_at
        `,
        [
          input.userId,
          input.enabled,
        ]
      );

    return mapPreferencesRow(
      requireSingleRow(
        result,
        "Mobile advertising preferences were not returned after personalized ads update."
      )
    );
  }

  async hideItem(
    input:
      HideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences> {
    const result =
      await this.database.query<MobileAdvertisingPreferencesRow>(
        `
          INSERT INTO app.mobile_user_advertising_preferences (
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids
          )
          VALUES ($1, FALSE, ARRAY[$2]::TEXT[])
          ON CONFLICT (user_id) DO UPDATE
          SET
            hidden_monetization_item_ids =
              CASE
                WHEN $2 = ANY(app.mobile_user_advertising_preferences.hidden_monetization_item_ids)
                  THEN app.mobile_user_advertising_preferences.hidden_monetization_item_ids
                ELSE array_append(
                  app.mobile_user_advertising_preferences.hidden_monetization_item_ids,
                  $2
                )
              END,
            updated_at = NOW()
          RETURNING
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids,
            created_at,
            updated_at
        `,
        [
          input.userId,
          input.itemId,
        ]
      );

    return mapPreferencesRow(
      requireSingleRow(
        result,
        "Mobile advertising preferences were not returned after hide item update."
      )
    );
  }

  async unhideItem(
    input:
      UnhideMobileAdvertisingItemInput
  ): Promise<MobileAdvertisingPreferences> {
    await this.ensureDefaultPreferences(
      input.userId
    );

    const result =
      await this.database.query<MobileAdvertisingPreferencesRow>(
        `
          UPDATE app.mobile_user_advertising_preferences
          SET
            hidden_monetization_item_ids =
              array_remove(hidden_monetization_item_ids, $2),
            updated_at = NOW()
          WHERE user_id = $1
          RETURNING
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids,
            created_at,
            updated_at
        `,
        [
          input.userId,
          input.itemId,
        ]
      );

    return mapPreferencesRow(
      requireSingleRow(
        result,
        "Mobile advertising preferences were not returned after unhide item update."
      )
    );
  }

  async clearHiddenItems(
    input:
      ClearMobileAdvertisingHiddenItemsInput
  ): Promise<MobileAdvertisingPreferences> {
    await this.ensureDefaultPreferences(
      input.userId
    );

    const result =
      await this.database.query<MobileAdvertisingPreferencesRow>(
        `
          UPDATE app.mobile_user_advertising_preferences
          SET
            hidden_monetization_item_ids = ARRAY[]::TEXT[],
            updated_at = NOW()
          WHERE user_id = $1
          RETURNING
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids,
            created_at,
            updated_at
        `,
        [
          input.userId,
        ]
      );

    return mapPreferencesRow(
      requireSingleRow(
        result,
        "Mobile advertising preferences were not returned after clear hidden items update."
      )
    );
  }

  async resetPreferences(
    input:
      ResetMobileAdvertisingPreferencesInput
  ): Promise<MobileAdvertisingPreferences> {
    await this.ensureDefaultPreferences(
      input.userId
    );

    const result =
      await this.database.query<MobileAdvertisingPreferencesRow>(
        `
          UPDATE app.mobile_user_advertising_preferences
          SET
            personalized_ads_enabled = FALSE,
            hidden_monetization_item_ids = ARRAY[]::TEXT[],
            updated_at = NOW()
          WHERE user_id = $1
          RETURNING
            user_id,
            personalized_ads_enabled,
            hidden_monetization_item_ids,
            created_at,
            updated_at
        `,
        [
          input.userId,
        ]
      );

    return mapPreferencesRow(
      requireSingleRow(
        result,
        "Mobile advertising preferences were not returned after reset update."
      )
    );
  }
}

export function createPostgresMobileAdvertisingPreferencesRepository(
  database:
    QueryableDatabase
): MobileAdvertisingPreferencesRepository {
  return new PostgresMobileAdvertisingPreferencesRepository(
    database
  );
}
