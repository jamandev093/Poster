# Poster Production Rollback Runbook

This runbook is for production rollback planning. It contains no secrets.

## Rollback principles

- Prefer rolling back application revisions before database rollback.
- Do not edit applied migrations.
- Treat migrations as forward-only unless an explicit corrective migration is created.
- Preserve audit logs and payment ledger integrity.
- Never replay Razorpay webhooks without idempotency checks.

## Backend rollback

1. Identify the last known good Cloud Run revision.
2. Route traffic back to the known good Backend revision.
3. Verify GET https://api.getpostar.com/api/v1/health.
4. Verify auth, public business identity, Client Wallet read, and Copyright public status routes.
5. If the incident involves a migration, pause rollout and create a corrective migration only after inspection.

## Frontend rollback

1. Identify the last known good service revision for Website, Admin, Client, or Copyright.
2. Route traffic back to the known good revision.
3. Verify the public route and API base environment.
4. Confirm CORS still allows the production origin.

## Payment incident caution

- Do not manually mutate ledger balances without a dedicated audited correction path.
- Do not expose Razorpay key secret or webhook secret in logs.
- Verify webhook signature and idempotency before retrying payment handling.

## Incident checklist

- Record incident time.
- Record affected service and revision.
- Capture logs.
- Capture smoke-check failures.
- Decide rollback or forward fix.
- Run post-rollback smoke checks.
- Document corrective follow-up.
