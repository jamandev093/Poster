import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  DEFAULT_AUDIENCE_PRIVACY_SETTING_KEY,
  type AudiencePrivacySettingsRecord,
} from "./audience-insights.types.js";

interface AudiencePrivacySettingsDatabaseRow
  extends QueryResultRow {
  setting_key: string;

  minimum_reportable_audience: number;

  minimum_campaign_audience: number;

  created_at: Date;

  updated_at: Date;

  row_version: string;
}

const AUDIENCE_PRIVACY_COLUMNS = `
  setting_key,
  minimum_reportable_audience,
  minimum_campaign_audience,
  created_at,
  updated_at,
  row_version::text
    AS row_version
`;

function mapAudiencePrivacySettingsRow(
  row:
    AudiencePrivacySettingsDatabaseRow
): AudiencePrivacySettingsRecord {
  return {
    settingKey:
      row.setting_key,

    minimumReportableAudience:
      row.minimum_reportable_audience,

    minimumCampaignAudience:
      row.minimum_campaign_audience,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    rowVersion:
      row.row_version,
  };
}

export async function readAudiencePrivacySettings(
  executor?:
    DatabaseQueryExecutor
): Promise<AudiencePrivacySettingsRecord> {
  const result =
    await executeDatabaseQuery<
      AudiencePrivacySettingsDatabaseRow
    >(
      `
        SELECT
          ${AUDIENCE_PRIVACY_COLUMNS}
        FROM app.audience_privacy_settings
        WHERE setting_key = $1
        LIMIT 1
      `,
      [
        DEFAULT_AUDIENCE_PRIVACY_SETTING_KEY,
      ],
      executor
    );

  const row =
    result.rows[0];

  if (
    !row
  ) {
    throw new Error(
      "Audience privacy settings are not configured."
    );
  }

  return mapAudiencePrivacySettingsRow(
    row
  );
}
