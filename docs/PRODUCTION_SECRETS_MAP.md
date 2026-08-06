# Poster Production Secrets Map

This document maps required production secrets to Google Secret Manager names. It contains no secret values.

## Backend secrets

| Env key | Secret Manager name | Used by | Notes |
| --- | --- | --- | --- |
| DATABASE_URL | poster-backend-database-url | Backend Cloud Run | Runtime application database connection. Use restricted runtime DB role. |
| DATABASE_MIGRATION_URL | poster-backend-database-migration-url | Migration job/operator | Migration database connection. Use migration-capable DB role. |
| SESSION_SECRET | poster-backend-session-secret | Backend Cloud Run | Required for auth token/session signing. |
| RAZORPAY_KEY_ID | poster-razorpay-key-id | Backend Cloud Run | Backend Razorpay adapter. |
| RAZORPAY_KEY_SECRET | poster-razorpay-key-secret | Backend Cloud Run | Backend-only secret. |
| RAZORPAY_WEBHOOK_SECRET | poster-razorpay-webhook-secret | Backend Cloud Run | Backend webhook signature verification. |

## Public values

| Env key | Location | Notes |
| --- | --- | --- |
| NEXT_PUBLIC_POSTER_API_BASE_URL | Admin, Client, Copyright, Website | Public API base. Not secret. |
| POSTER_PUBLIC_API_BASE_URL | Website | Server-side public API base. Not secret. |
| EXPO_PUBLIC_POSTER_API_BASE_URL | Mobile | Public mobile API base convention. Not secret. |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | Client | Public Razorpay Checkout key only. |

## Secret handling rules

- Never commit .env, .env.local, .env.production, service-account JSON, private keys, or real secret values.
- Store production secret values only in Google Secret Manager or approved deployment secret storage.
- Grant Cloud Run services only the specific secrets they require.
- Rotate Razorpay webhook secret if webhook endpoint exposure changes.
- Keep runtime DB role separate from migration DB role.
