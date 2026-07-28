CREATE TABLE IF NOT EXISTS app.platform_metadata (
  metadata_key text PRIMARY KEY
    CHECK (
      char_length(
        btrim(metadata_key)
      ) > 0
    ),

  metadata_value jsonb NOT NULL,

  created_at timestamptz NOT NULL
    DEFAULT now(),

  updated_at timestamptz NOT NULL
    DEFAULT now()
);

COMMENT ON TABLE app.platform_metadata IS
  'Backend-owned platform metadata and database foundation records.';

COMMENT ON COLUMN app.platform_metadata.metadata_key IS
  'Stable unique metadata identifier.';

COMMENT ON COLUMN app.platform_metadata.metadata_value IS
  'Structured metadata payload controlled by the Poster Backend.';

INSERT INTO app.platform_metadata (
  metadata_key,
  metadata_value
)
VALUES (
  'database_foundation',
  jsonb_build_object(
    'service',
    'poster-backend',
    'database',
    'PostgreSQL',
    'migrationVersion',
    '0001'
  )
)
ON CONFLICT (
  metadata_key
)
DO NOTHING;