ALTER TABLE app.users
  ADD COLUMN username TEXT,
  ADD COLUMN profile_image_url TEXT,
  ADD COLUMN profile_interests JSONB NOT NULL DEFAULT jsonb_build_object(
    'topicIds',
    jsonb_build_array(),
    'topicNames',
    jsonb_build_array(),
    'unresolvedValues',
    jsonb_build_array(),
    'displayValues',
    jsonb_build_array()
  ),
  ADD COLUMN profile_preferences JSONB NOT NULL DEFAULT jsonb_build_object(
    'darkMode',
    false,
    'notifications',
    true,
    'personalizedAds',
    true
  );

ALTER TABLE app.users
  ADD CONSTRAINT users_username_format_check
  CHECK (
    username IS NULL
    OR username ~ '^[a-z0-9_]{3,30}$'
  );

ALTER TABLE app.users
  ADD CONSTRAINT users_profile_image_url_length_check
  CHECK (
    profile_image_url IS NULL
    OR char_length(profile_image_url) <= 2048
  );

CREATE UNIQUE INDEX users_active_username_unique_idx
  ON app.users (lower(username))
  WHERE username IS NOT NULL
    AND deleted_at IS NULL;
