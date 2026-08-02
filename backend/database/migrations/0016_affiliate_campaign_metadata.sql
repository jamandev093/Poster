CREATE TABLE app.affiliate_campaign_metadata (
  campaign_id uuid PRIMARY KEY
    REFERENCES app.monetization_campaigns(id)
    ON DELETE CASCADE,

  partner_name text NOT NULL
    CHECK (
      length(trim(partner_name)) BETWEEN 2 AND 160
    ),

  offer_name text NOT NULL
    CHECK (
      length(trim(offer_name)) BETWEEN 2 AND 160
    ),

  destination_url text NOT NULL
    CHECK (
      length(trim(destination_url)) BETWEEN 1 AND 2048
      AND destination_url ~* '^https?://'
    ),

  disclosure text NOT NULL
    DEFAULT 'Affiliate · Poster may earn a commission'
    CHECK (
      disclosure = 'Affiliate · Poster may earn a commission'
    ),

  commission_model text NOT NULL
    CHECK (
      commission_model IN (
        'cpa',
        'cpc',
        'revenue_share',
        'flat_fee',
        'hybrid'
      )
    ),

  commission_terms jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  tracking_status text NOT NULL
    DEFAULT 'not_configured'
    CHECK (
      tracking_status IN (
        'not_configured',
        'pending_verification',
        'active',
        'paused',
        'blocked'
      )
    ),

  tracking_url text NULL
    CHECK (
      tracking_url IS NULL
      OR (
        length(trim(tracking_url)) BETWEEN 1 AND 2048
        AND tracking_url ~* '^https?://'
      )
    ),

  payout_readiness_status text NOT NULL
    DEFAULT 'not_ready'
    CHECK (
      payout_readiness_status IN (
        'not_ready',
        'ready',
        'blocked'
      )
    ),

  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,

  row_version bigint NOT NULL
    DEFAULT 1
);

CREATE INDEX affiliate_campaign_metadata_tracking_status_idx
  ON app.affiliate_campaign_metadata (
    tracking_status
  );

CREATE INDEX affiliate_campaign_metadata_payout_readiness_status_idx
  ON app.affiliate_campaign_metadata (
    payout_readiness_status
  );