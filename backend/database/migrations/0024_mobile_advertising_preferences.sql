CREATE TABLE IF NOT EXISTS app.mobile_user_advertising_preferences (
    user_id UUID PRIMARY KEY REFERENCES app.users (id) ON DELETE CASCADE,
    personalized_ads_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    hidden_monetization_item_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT mobile_user_advertising_preferences_hidden_items_not_null
        CHECK (hidden_monetization_item_ids IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS mobile_user_advertising_preferences_updated_index
    ON app.mobile_user_advertising_preferences (updated_at DESC);

CREATE INDEX IF NOT EXISTS mobile_user_advertising_preferences_hidden_items_gin_index
    ON app.mobile_user_advertising_preferences
    USING GIN (hidden_monetization_item_ids);
