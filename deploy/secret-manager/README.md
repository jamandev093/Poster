# Secret Manager

Google Secret Manager stores production secrets. This file contains names only, never values.

## Backend secrets

- poster-backend-database-url
- poster-backend-database-migration-url
- poster-backend-session-secret
- poster-razorpay-key-id
- poster-razorpay-key-secret
- poster-razorpay-webhook-secret

## Public non-secret env values

- NEXT_PUBLIC_POSTER_API_BASE_URL
- POSTER_PUBLIC_API_BASE_URL
- EXPO_PUBLIC_POSTER_API_BASE_URL
- NEXT_PUBLIC_RAZORPAY_KEY_ID

## Rules

- Do not commit secret values.
- Do not copy secrets into docs, screenshots, packets, or logs.
- Grant least privilege per Cloud Run service.
- Rotate secrets after accidental exposure or provider reconfiguration.
- Keep Razorpay key secret and webhook secret Backend-only.
