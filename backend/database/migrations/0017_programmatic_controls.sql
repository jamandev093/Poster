CREATE TABLE app.programmatic_providers (
  id uuid PRIMARY KEY,

  provider_key text NOT NULL UNIQUE
    CHECK (
      provider_key ~ '^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$'
    ),

  display_name text NOT NULL
    CHECK (
      length(trim(display_name)) BETWEEN 2 AND 160
    ),

  status text NOT NULL
    DEFAULT 'disabled'
    CHECK (
      status IN (
        'disabled',
        'enabled',
        'paused'
      )
    ),

  health_status text NOT NULL
    DEFAULT 'unknown'
    CHECK (
      health_status IN (
        'unknown',
        'healthy',
        'degraded',
        'unhealthy'
      )
    ),

  notes text NULL
    CHECK (
      notes IS NULL
      OR length(trim(notes)) <= 2000
    ),

  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,

  row_version bigint NOT NULL
    DEFAULT 1
);

CREATE TABLE app.programmatic_slot_mappings (
  id uuid PRIMARY KEY,

  provider_id uuid NOT NULL
    REFERENCES app.programmatic_providers(id)
    ON DELETE CASCADE,

  screen text NOT NULL
    CHECK (
      screen IN (
        'home',
        'search',
        'trending'
      )
    ),

  placement text NOT NULL
    CHECK (
      length(trim(placement)) BETWEEN 2 AND 80
      AND placement !~* '(banner|popup|pop_up|interstitial|overlay|floating|vertical|story|reel)'
    ),

  frame text NOT NULL
    CHECK (
      frame IN (
        'full_width_sponsored_card',
        'three_card_sponsored_frame'
      )
    ),

  status text NOT NULL
    DEFAULT 'disabled'
    CHECK (
      status IN (
        'disabled',
        'enabled',
        'paused'
      )
    ),

  safety_rules jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  region_rules jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  device_rules jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  frequency_rules jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  fallback_rules jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,

  row_version bigint NOT NULL
    DEFAULT 1,

  UNIQUE (
    provider_id,
    screen,
    placement,
    frame
  )
);

CREATE INDEX programmatic_providers_status_idx
  ON app.programmatic_providers (
    status
  );

CREATE INDEX programmatic_slot_mappings_screen_status_idx
  ON app.programmatic_slot_mappings (
    screen,
    status
  );