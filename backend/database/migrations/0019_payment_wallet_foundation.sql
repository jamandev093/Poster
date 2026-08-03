-- Poster Core Backend
-- Migration: 0019_payment_wallet_foundation
--
-- Authoritative advertiser Wallet, funding orders, invoices,
-- payments, refunds, campaign allocations, and immutable ledger.
--
-- Razorpay API calls and webhook handling are intentionally not
-- implemented here. This migration only creates durable storage.

BEGIN;

DO $migration$
BEGIN
    IF to_regnamespace('app') IS NULL THEN
        RAISE EXCEPTION
            'Required application schema "app" does not exist.';
    END IF;

    IF to_regclass('app.users') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.users does not exist.';
    END IF;

    IF to_regclass('app.organizations') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.organizations does not exist.';
    END IF;

    IF to_regclass('app.monetization_campaigns') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.monetization_campaigns does not exist.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'poster_app'
    ) THEN
        RAISE EXCEPTION
            'Required PostgreSQL role "poster_app" does not exist.';
    END IF;
END;
$migration$;

CREATE TABLE app.advertiser_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    currency_code text NOT NULL DEFAULT 'INR',
    status text NOT NULL DEFAULT 'active',

    available_balance_minor_units bigint NOT NULL DEFAULT 0,
    reserved_balance_minor_units bigint NOT NULL DEFAULT 0,
    total_credited_minor_units bigint NOT NULL DEFAULT 0,
    total_spent_minor_units bigint NOT NULL DEFAULT 0,
    total_refunded_minor_units bigint NOT NULL DEFAULT 0,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT advertiser_wallets_organization_unique
        UNIQUE (organization_id),

    CONSTRAINT advertiser_wallets_currency_valid
        CHECK (currency_code = 'INR'),

    CONSTRAINT advertiser_wallets_status_valid
        CHECK (
            status IN (
                'active',
                'frozen',
                'closed'
            )
        ),

    CONSTRAINT advertiser_wallets_balances_non_negative
        CHECK (
            available_balance_minor_units >= 0
            AND reserved_balance_minor_units >= 0
            AND total_credited_minor_units >= 0
            AND total_spent_minor_units >= 0
            AND total_refunded_minor_units >= 0
        ),

    CONSTRAINT advertiser_wallets_row_version_valid
        CHECK (row_version >= 1)
);

CREATE TABLE app.wallet_funding_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    wallet_id uuid NOT NULL
        REFERENCES app.advertiser_wallets(id)
        ON DELETE RESTRICT,

    requested_by_user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE RESTRICT,

    provider text NOT NULL DEFAULT 'razorpay',
    provider_order_id text,
    provider_receipt text,

    amount_minor_units bigint NOT NULL,
    currency_code text NOT NULL DEFAULT 'INR',

    status text NOT NULL DEFAULT 'created',

    idempotency_key text NOT NULL,

    provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

    expires_at timestamp with time zone,

    credited_at timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT wallet_funding_orders_provider_valid
        CHECK (provider = 'razorpay'),

    CONSTRAINT wallet_funding_orders_currency_valid
        CHECK (currency_code = 'INR'),

    CONSTRAINT wallet_funding_orders_status_valid
        CHECK (
            status IN (
                'created',
                'pending_provider',
                'pending_verification',
                'credited',
                'failed',
                'expired',
                'cancelled'
            )
        ),

    CONSTRAINT wallet_funding_orders_amount_valid
        CHECK (
            amount_minor_units >= 10000
            AND amount_minor_units <= 100000000
        ),

    CONSTRAINT wallet_funding_orders_idempotency_not_blank
        CHECK (length(btrim(idempotency_key)) >= 8),

    CONSTRAINT wallet_funding_orders_payload_object
        CHECK (jsonb_typeof(provider_payload) = 'object'),

    CONSTRAINT wallet_funding_orders_credited_consistent
        CHECK (
            (
                status = 'credited'
                AND credited_at IS NOT NULL
            )
            OR
            (
                status <> 'credited'
            )
        ),

    CONSTRAINT wallet_funding_orders_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX wallet_funding_orders_idempotency_unique
    ON app.wallet_funding_orders (
        organization_id,
        idempotency_key
    );

CREATE UNIQUE INDEX wallet_funding_orders_provider_order_unique
    ON app.wallet_funding_orders (provider_order_id)
    WHERE provider_order_id IS NOT NULL;

CREATE INDEX wallet_funding_orders_wallet_index
    ON app.wallet_funding_orders (
        wallet_id,
        created_at DESC
    );

CREATE TABLE app.advertiser_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    campaign_id uuid
        REFERENCES app.monetization_campaigns(id)
        ON DELETE SET NULL,

    invoice_number text NOT NULL,

    status text NOT NULL DEFAULT 'draft',

    currency_code text NOT NULL DEFAULT 'INR',

    subtotal_minor_units bigint NOT NULL DEFAULT 0,
    tax_minor_units bigint NOT NULL DEFAULT 0,
    total_minor_units bigint NOT NULL DEFAULT 0,
    paid_minor_units bigint NOT NULL DEFAULT 0,
    refunded_minor_units bigint NOT NULL DEFAULT 0,

    issued_at timestamp with time zone,
    due_at timestamp with time zone,
    paid_at timestamp with time zone,
    cancelled_at timestamp with time zone,

    document_url text,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT advertiser_invoices_number_not_blank
        CHECK (length(btrim(invoice_number)) >= 5),

    CONSTRAINT advertiser_invoices_number_unique
        UNIQUE (invoice_number),

    CONSTRAINT advertiser_invoices_status_valid
        CHECK (
            status IN (
                'draft',
                'issued',
                'payment_pending',
                'partially_paid',
                'paid',
                'overdue',
                'cancelled',
                'refund_pending',
                'partially_refunded',
                'refunded'
            )
        ),

    CONSTRAINT advertiser_invoices_currency_valid
        CHECK (currency_code = 'INR'),

    CONSTRAINT advertiser_invoices_amounts_valid
        CHECK (
            subtotal_minor_units >= 0
            AND tax_minor_units >= 0
            AND total_minor_units >= 0
            AND paid_minor_units >= 0
            AND refunded_minor_units >= 0
            AND total_minor_units = subtotal_minor_units + tax_minor_units
            AND paid_minor_units <= total_minor_units
            AND refunded_minor_units <= paid_minor_units
        ),

    CONSTRAINT advertiser_invoices_metadata_object
        CHECK (jsonb_typeof(metadata) = 'object'),

    CONSTRAINT advertiser_invoices_row_version_valid
        CHECK (row_version >= 1)
);

CREATE INDEX advertiser_invoices_organization_index
    ON app.advertiser_invoices (
        organization_id,
        status,
        created_at DESC
    );

CREATE INDEX advertiser_invoices_campaign_index
    ON app.advertiser_invoices (
        campaign_id,
        created_at DESC
    )
    WHERE campaign_id IS NOT NULL;

CREATE TABLE app.advertiser_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    wallet_id uuid
        REFERENCES app.advertiser_wallets(id)
        ON DELETE SET NULL,

    funding_order_id uuid
        REFERENCES app.wallet_funding_orders(id)
        ON DELETE SET NULL,

    invoice_id uuid
        REFERENCES app.advertiser_invoices(id)
        ON DELETE SET NULL,

    campaign_id uuid
        REFERENCES app.monetization_campaigns(id)
        ON DELETE SET NULL,

    provider text NOT NULL DEFAULT 'razorpay',

    provider_order_id text,
    provider_payment_id text,
    provider_signature_digest text,

    status text NOT NULL DEFAULT 'created',

    amount_minor_units bigint NOT NULL,
    captured_minor_units bigint NOT NULL DEFAULT 0,
    refunded_minor_units bigint NOT NULL DEFAULT 0,

    currency_code text NOT NULL DEFAULT 'INR',

    method_details jsonb NOT NULL DEFAULT '{}'::jsonb,
    provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

    webhook_verified_at timestamp with time zone,
    paid_at timestamp with time zone,
    failed_at timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT advertiser_payments_provider_valid
        CHECK (provider = 'razorpay'),

    CONSTRAINT advertiser_payments_status_valid
        CHECK (
            status IN (
                'created',
                'authorized',
                'captured',
                'failed',
                'partially_refunded',
                'refunded',
                'disputed'
            )
        ),

    CONSTRAINT advertiser_payments_currency_valid
        CHECK (currency_code = 'INR'),

    CONSTRAINT advertiser_payments_amounts_valid
        CHECK (
            amount_minor_units > 0
            AND captured_minor_units >= 0
            AND refunded_minor_units >= 0
            AND captured_minor_units <= amount_minor_units
            AND refunded_minor_units <= captured_minor_units
        ),

    CONSTRAINT advertiser_payments_method_object
        CHECK (jsonb_typeof(method_details) = 'object'),

    CONSTRAINT advertiser_payments_payload_object
        CHECK (jsonb_typeof(provider_payload) = 'object'),

    CONSTRAINT advertiser_payments_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX advertiser_payments_provider_payment_unique
    ON app.advertiser_payments (provider_payment_id)
    WHERE provider_payment_id IS NOT NULL;

CREATE INDEX advertiser_payments_organization_index
    ON app.advertiser_payments (
        organization_id,
        status,
        created_at DESC
    );

CREATE INDEX advertiser_payments_invoice_index
    ON app.advertiser_payments (
        invoice_id,
        created_at DESC
    )
    WHERE invoice_id IS NOT NULL;

CREATE TABLE app.advertiser_refunds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    payment_id uuid NOT NULL
        REFERENCES app.advertiser_payments(id)
        ON DELETE RESTRICT,

    invoice_id uuid
        REFERENCES app.advertiser_invoices(id)
        ON DELETE SET NULL,

    campaign_id uuid
        REFERENCES app.monetization_campaigns(id)
        ON DELETE SET NULL,

    requested_by_user_id uuid
        REFERENCES app.users(id)
        ON DELETE SET NULL,

    approved_by_user_id uuid
        REFERENCES app.users(id)
        ON DELETE SET NULL,

    provider text NOT NULL DEFAULT 'razorpay',
    provider_refund_id text,

    reason text NOT NULL,
    status text NOT NULL DEFAULT 'requested',

    requested_amount_minor_units bigint NOT NULL,
    approved_amount_minor_units bigint,
    refunded_amount_minor_units bigint NOT NULL DEFAULT 0,

    currency_code text NOT NULL DEFAULT 'INR',

    provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

    requested_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    approved_at timestamp with time zone,
    refunded_at timestamp with time zone,
    failed_at timestamp with time zone,
    cancelled_at timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT advertiser_refunds_provider_valid
        CHECK (provider = 'razorpay'),

    CONSTRAINT advertiser_refunds_status_valid
        CHECK (
            status IN (
                'requested',
                'approved',
                'provider_pending',
                'partially_refunded',
                'refunded',
                'failed',
                'cancelled'
            )
        ),

    CONSTRAINT advertiser_refunds_reason_not_blank
        CHECK (length(btrim(reason)) >= 3),

    CONSTRAINT advertiser_refunds_currency_valid
        CHECK (currency_code = 'INR'),

    CONSTRAINT advertiser_refunds_amounts_valid
        CHECK (
            requested_amount_minor_units > 0
            AND (
                approved_amount_minor_units IS NULL
                OR approved_amount_minor_units > 0
            )
            AND refunded_amount_minor_units >= 0
            AND (
                approved_amount_minor_units IS NULL
                OR refunded_amount_minor_units <= approved_amount_minor_units
            )
        ),

    CONSTRAINT advertiser_refunds_payload_object
        CHECK (jsonb_typeof(provider_payload) = 'object'),

    CONSTRAINT advertiser_refunds_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX advertiser_refunds_provider_refund_unique
    ON app.advertiser_refunds (provider_refund_id)
    WHERE provider_refund_id IS NOT NULL;

CREATE INDEX advertiser_refunds_payment_index
    ON app.advertiser_refunds (
        payment_id,
        created_at DESC
    );

CREATE INDEX advertiser_refunds_organization_index
    ON app.advertiser_refunds (
        organization_id,
        status,
        created_at DESC
    );

CREATE TABLE app.campaign_wallet_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    wallet_id uuid NOT NULL
        REFERENCES app.advertiser_wallets(id)
        ON DELETE RESTRICT,

    campaign_id uuid NOT NULL
        REFERENCES app.monetization_campaigns(id)
        ON DELETE CASCADE,

    currency_code text NOT NULL DEFAULT 'INR',

    status text NOT NULL DEFAULT 'active',

    allocated_minor_units bigint NOT NULL,
    reserved_minor_units bigint NOT NULL DEFAULT 0,
    spent_minor_units bigint NOT NULL DEFAULT 0,
    released_minor_units bigint NOT NULL DEFAULT 0,
    refunded_minor_units bigint NOT NULL DEFAULT 0,

    created_by_user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE RESTRICT,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT campaign_wallet_allocations_campaign_unique
        UNIQUE (campaign_id),

    CONSTRAINT campaign_wallet_allocations_currency_valid
        CHECK (currency_code = 'INR'),

    CONSTRAINT campaign_wallet_allocations_status_valid
        CHECK (
            status IN (
                'active',
                'paused',
                'exhausted',
                'released',
                'cancelled'
            )
        ),

    CONSTRAINT campaign_wallet_allocations_amounts_valid
        CHECK (
            allocated_minor_units > 0
            AND reserved_minor_units >= 0
            AND spent_minor_units >= 0
            AND released_minor_units >= 0
            AND refunded_minor_units >= 0
            AND reserved_minor_units <= allocated_minor_units
            AND spent_minor_units <= allocated_minor_units
            AND released_minor_units <= allocated_minor_units
            AND refunded_minor_units <= spent_minor_units
        ),

    CONSTRAINT campaign_wallet_allocations_row_version_valid
        CHECK (row_version >= 1)
);

CREATE INDEX campaign_wallet_allocations_organization_index
    ON app.campaign_wallet_allocations (
        organization_id,
        status,
        created_at DESC
    );

CREATE INDEX campaign_wallet_allocations_wallet_index
    ON app.campaign_wallet_allocations (
        wallet_id,
        status,
        created_at DESC
    );

CREATE TABLE app.advertiser_wallet_ledger_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    wallet_id uuid NOT NULL
        REFERENCES app.advertiser_wallets(id)
        ON DELETE RESTRICT,

    funding_order_id uuid
        REFERENCES app.wallet_funding_orders(id)
        ON DELETE SET NULL,

    campaign_id uuid
        REFERENCES app.monetization_campaigns(id)
        ON DELETE SET NULL,

    allocation_id uuid
        REFERENCES app.campaign_wallet_allocations(id)
        ON DELETE SET NULL,

    invoice_id uuid
        REFERENCES app.advertiser_invoices(id)
        ON DELETE SET NULL,

    payment_id uuid
        REFERENCES app.advertiser_payments(id)
        ON DELETE SET NULL,

    refund_id uuid
        REFERENCES app.advertiser_refunds(id)
        ON DELETE SET NULL,

    entry_type text NOT NULL,
    direction text NOT NULL,
    status text NOT NULL DEFAULT 'posted',

    amount_minor_units bigint NOT NULL,
    currency_code text NOT NULL DEFAULT 'INR',

    balance_before_minor_units bigint NOT NULL,
    balance_after_minor_units bigint NOT NULL,

    idempotency_key text NOT NULL,
    provider_reference text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE RESTRICT,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT advertiser_wallet_ledger_entry_type_valid
        CHECK (
            entry_type IN (
                'opening_balance',
                'wallet_funding_pending',
                'payment_credit',
                'manual_payment_credit',
                'campaign_reservation',
                'campaign_spend',
                'campaign_release',
                'refund_reservation',
                'refund_debit',
                'refund_release',
                'adjustment_credit',
                'adjustment_debit'
            )
        ),

    CONSTRAINT advertiser_wallet_ledger_direction_valid
        CHECK (
            direction IN (
                'credit',
                'debit',
                'neutral'
            )
        ),

    CONSTRAINT advertiser_wallet_ledger_status_valid
        CHECK (
            status IN (
                'pending',
                'posted',
                'voided',
                'reversed'
            )
        ),

    CONSTRAINT advertiser_wallet_ledger_currency_valid
        CHECK (currency_code = 'INR'),

    CONSTRAINT advertiser_wallet_ledger_amount_valid
        CHECK (amount_minor_units > 0),

    CONSTRAINT advertiser_wallet_ledger_balances_valid
        CHECK (
            balance_before_minor_units >= 0
            AND balance_after_minor_units >= 0
            AND (
                (
                    direction = 'credit'
                    AND balance_after_minor_units =
                        balance_before_minor_units + amount_minor_units
                )
                OR
                (
                    direction = 'debit'
                    AND balance_after_minor_units =
                        balance_before_minor_units - amount_minor_units
                )
                OR
                (
                    direction = 'neutral'
                    AND balance_after_minor_units =
                        balance_before_minor_units
                )
            )
        ),

    CONSTRAINT advertiser_wallet_ledger_idempotency_not_blank
        CHECK (length(btrim(idempotency_key)) >= 8),

    CONSTRAINT advertiser_wallet_ledger_metadata_object
        CHECK (jsonb_typeof(metadata) = 'object'),

    CONSTRAINT advertiser_wallet_ledger_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX advertiser_wallet_ledger_idempotency_unique
    ON app.advertiser_wallet_ledger_entries (
        organization_id,
        idempotency_key
    );

CREATE INDEX advertiser_wallet_ledger_wallet_index
    ON app.advertiser_wallet_ledger_entries (
        wallet_id,
        created_at DESC,
        id DESC
    );

CREATE INDEX advertiser_wallet_ledger_campaign_index
    ON app.advertiser_wallet_ledger_entries (
        campaign_id,
        created_at DESC
    )
    WHERE campaign_id IS NOT NULL;

CREATE OR REPLACE FUNCTION app.prevent_wallet_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION
        'Advertiser Wallet ledger entries are immutable. Insert reversal entries instead.';
END;
$function$;

CREATE TRIGGER advertiser_wallets_set_updated_at_and_version
    BEFORE UPDATE ON app.advertiser_wallets
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER wallet_funding_orders_set_updated_at_and_version
    BEFORE UPDATE ON app.wallet_funding_orders
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER advertiser_invoices_set_updated_at_and_version
    BEFORE UPDATE ON app.advertiser_invoices
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER advertiser_payments_set_updated_at_and_version
    BEFORE UPDATE ON app.advertiser_payments
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER advertiser_refunds_set_updated_at_and_version
    BEFORE UPDATE ON app.advertiser_refunds
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER campaign_wallet_allocations_set_updated_at_and_version
    BEFORE UPDATE ON app.campaign_wallet_allocations
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER advertiser_wallet_ledger_prevent_update
    BEFORE UPDATE ON app.advertiser_wallet_ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION app.prevent_wallet_ledger_mutation();

CREATE TRIGGER advertiser_wallet_ledger_prevent_delete
    BEFORE DELETE ON app.advertiser_wallet_ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION app.prevent_wallet_ledger_mutation();

REVOKE ALL
ON TABLE
    app.advertiser_wallets,
    app.wallet_funding_orders,
    app.advertiser_invoices,
    app.advertiser_payments,
    app.advertiser_refunds,
    app.campaign_wallet_allocations,
    app.advertiser_wallet_ledger_entries
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON TABLE
    app.advertiser_wallets,
    app.wallet_funding_orders,
    app.advertiser_invoices,
    app.advertiser_payments,
    app.advertiser_refunds,
    app.campaign_wallet_allocations
TO poster_app;

GRANT
    SELECT,
    INSERT
ON TABLE
    app.advertiser_wallet_ledger_entries
TO poster_app;

COMMENT ON TABLE app.advertiser_wallets IS
    'Authoritative advertiser Wallet balance for one Client organization.';

COMMENT ON TABLE app.wallet_funding_orders IS
    'Wallet funding order requested by a Client organization before provider payment verification.';

COMMENT ON TABLE app.advertiser_invoices IS
    'Advertiser invoice records for campaign and Wallet payment obligations.';

COMMENT ON TABLE app.advertiser_payments IS
    'Verified and provider-referenced advertiser payment records.';

COMMENT ON TABLE app.advertiser_refunds IS
    'Advertiser refund workflow and provider refund references.';

COMMENT ON TABLE app.campaign_wallet_allocations IS
    'Campaign-level allocation of Wallet funds for delivery eligibility and spend control.';

COMMENT ON TABLE app.advertiser_wallet_ledger_entries IS
    'Immutable advertiser Wallet ledger. Corrections must be represented by new reversal or adjustment entries.';

COMMIT;