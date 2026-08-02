CREATE TABLE app.business_identities (
  identity_key text PRIMARY KEY
    CHECK (
      identity_key IN (
        'official'
      )
    ),

  public_brand_name text NOT NULL
    CHECK (
      length(trim(public_brand_name)) BETWEEN 2 AND 120
    ),

  legal_business_name text NULL
    CHECK (
      legal_business_name IS NULL
      OR length(trim(legal_business_name)) <= 180
    ),

  website_url text NOT NULL
    CHECK (
      website_url ~ '^https://'
    ),

  official_business_email text NOT NULL
    CHECK (
      official_business_email ~* '^[^@[:space:]]+@([^@[:space:]]+\.)?getpostar\.com$'
    ),

  support_email text NULL
    CHECK (
      support_email IS NULL
      OR support_email ~* '^[^@[:space:]]+@([^@[:space:]]+\.)?getpostar\.com$'
    ),

  publisher_relations_email text NULL
    CHECK (
      publisher_relations_email IS NULL
      OR publisher_relations_email ~* '^[^@[:space:]]+@([^@[:space:]]+\.)?getpostar\.com$'
    ),

  advertising_email text NULL
    CHECK (
      advertising_email IS NULL
      OR advertising_email ~* '^[^@[:space:]]+@([^@[:space:]]+\.)?getpostar\.com$'
    ),

  copyright_email text NULL
    CHECK (
      copyright_email IS NULL
      OR copyright_email ~* '^[^@[:space:]]+@([^@[:space:]]+\.)?getpostar\.com$'
    ),

  signal_url text NULL
    CHECK (
      signal_url IS NULL
      OR signal_url ~ '^https://'
    ),

  signal_label text NULL
    CHECK (
      signal_label IS NULL
      OR length(trim(signal_label)) <= 120
    ),

  copyright_portal_url text NULL
    CHECK (
      copyright_portal_url IS NULL
      OR copyright_portal_url ~ '^https://'
    ),

  client_portal_url text NULL
    CHECK (
      client_portal_url IS NULL
      OR client_portal_url ~ '^https://'
    ),

  social_links jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  updated_by_user_id uuid NULL,

  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,

  row_version bigint NOT NULL
    DEFAULT 1
);

INSERT INTO app.business_identities (
  identity_key,
  public_brand_name,
  legal_business_name,
  website_url,
  official_business_email,
  support_email,
  publisher_relations_email,
  advertising_email,
  copyright_email,
  signal_url,
  signal_label,
  copyright_portal_url,
  client_portal_url,
  social_links,
  updated_by_user_id,
  created_at,
  updated_at
)
VALUES (
  'official',
  'Poster',
  NULL,
  'https://getpostar.com',
  'hello@getpostar.com',
  'hello@getpostar.com',
  'publishers@getpostar.com',
  NULL,
  NULL,
  NULL,
  'Contact on Signal',
  'https://copyright.getpostar.com',
  NULL,
  '{}'::jsonb,
  NULL,
  now(),
  now()
)
ON CONFLICT (identity_key)
DO NOTHING;