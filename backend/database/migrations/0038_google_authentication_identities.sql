CREATE TABLE app.user_external_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE CASCADE,

    provider text NOT NULL,

    provider_subject text NOT NULL,

    provider_email text,

    created_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    last_authenticated_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT user_external_identities_provider_check
        CHECK (
            provider IN ('google')
        ),

    CONSTRAINT user_external_identities_subject_check
        CHECK (
            char_length(
                btrim(provider_subject)
            ) BETWEEN 1 AND 255
        ),

    CONSTRAINT user_external_identities_email_check
        CHECK (
            provider_email IS NULL
            OR (
                char_length(
                    btrim(provider_email)
                ) BETWEEN 1 AND 320
            )
        ),

    CONSTRAINT user_external_identities_provider_subject_unique
        UNIQUE (
            provider,
            provider_subject
        ),

    CONSTRAINT user_external_identities_user_provider_unique
        UNIQUE (
            user_id,
            provider
        )
);

CREATE INDEX user_external_identities_user_id_idx
    ON app.user_external_identities (
        user_id
    );