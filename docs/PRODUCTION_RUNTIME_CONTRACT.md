# Poster Production Runtime Contract

This document records the production runtime and deployment contract for Poster. It contains no production secrets.

## Production domains

- Website: https://getpostar.com
- Backend API: https://api.getpostar.com
- Admin: https://admin.getpostar.com
- Client: https://client.getpostar.com
- Copyright: https://copyright.getpostar.com
- Mobile: app-store distributed application

## Source roots

- Backend: F:\Project\Poster\backend
- Admin: F:\Project\Poster\admin
- Client: F:\Project\Poster\client
- Copyright: F:\Project\Poster\copyright
- Website: F:\Project\Poster\website
- Mobile: F:\Project\Poster\frontend

## Production env templates

- backend/.env.production.example
- admin/.env.production.example
- client/.env.production.example
- copyright/.env.production.example
- website/.env.production.example
- frontend/.env.production.example

Do not commit .env, .env.local, .env.production, service-account JSON, private keys, or real production secrets.

## Backend runtime

- Install: npm ci
- Typecheck: npm run typecheck
- Test: npm test
- Build: npm run build
- Start: npm start
- Start command: node dist/server.js
- Migration status: npm run db:migrate:status
- Apply migrations: npm run db:migrate
- Database check: npm run db:check
- Health endpoint: GET https://api.getpostar.com/api/v1/health

Backend production env values must include DATABASE_URL, DATABASE_MIGRATION_URL, SESSION_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET.

Backend production CORS origins:

- CLIENT_WEB_ORIGIN=https://client.getpostar.com
- ADMIN_WEB_ORIGIN=https://admin.getpostar.com
- COPYRIGHT_WEB_ORIGIN=https://copyright.getpostar.com

## Backend container

Backend has backend/Dockerfile and backend/.dockerignore. The container exposes port 4000 and runs node dist/server.js as the node user.

Migrations must run as a separate deployment step before promoting a new Backend version. Do not run migrations automatically inside every API container start.

## Database migration order

1. Build Backend.
2. Configure production secret env values.
3. Run npm run db:migrate:status.
4. Run npm run db:migrate using DATABASE_MIGRATION_URL.
5. Start or roll out Backend API.
6. Confirm GET /api/v1/health.
7. Deploy frontend apps pointing to https://api.getpostar.com.

## Admin runtime

- Install: npm ci
- Typecheck: npx --no-install tsc --noEmit
- Lint: npm run lint
- Build: npm run build
- Start: npm start
- Env: NEXT_PUBLIC_POSTER_API_BASE_URL=https://api.getpostar.com/api/v1

Admin currently expects the API base URL to include /api/v1.

## Client runtime

- Install: npm ci
- Test: npm test
- Typecheck: npx --no-install tsc --noEmit
- Lint: npm run lint
- Build: npm run build
- Start: npm start
- Env: NEXT_PUBLIC_POSTER_API_BASE_URL=https://api.getpostar.com
- Env: NEXT_PUBLIC_RAZORPAY_KEY_ID=

Only NEXT_PUBLIC_RAZORPAY_KEY_ID is public. Razorpay secret keys remain Backend-only.

## Copyright runtime

- Install: npm ci
- Test: npm test
- Typecheck: npx --no-install tsc --noEmit
- Lint: npm run lint
- Build: npm run build
- Start: npm start
- Env: NEXT_PUBLIC_POSTER_API_BASE_URL=https://api.getpostar.com
- Env: NEXT_PUBLIC_API_BASE_URL=

Locked public Copyright routes:

- POST /api/v1/public/copyright/claims
- POST /api/v1/public/copyright/status
- POST /api/v1/public/copyright/bulk-removal
- POST /api/v1/public/copyright/content-match

## Website runtime

- Install: npm ci
- Typecheck: npx --no-install tsc --noEmit
- Lint: npm run lint
- Build: npm run build
- Start: npm start
- Env: POSTER_PUBLIC_API_BASE_URL=https://api.getpostar.com
- Env: NEXT_PUBLIC_POSTER_API_BASE_URL=https://api.getpostar.com
- Env: NEXT_PUBLIC_API_BASE_URL=

## Mobile runtime

- Install: npm ci
- Typecheck: npm run typecheck
- Expo start: npm start
- Android dev start: npm run android
- iOS dev start: npm run ios
- Web dev start: npm run web
- Env: EXPO_PUBLIC_POSTER_API_BASE_URL=https://api.getpostar.com

Mobile is not deployed as a server process. Production release should use the app-store build pipeline after Backend-connected mobile flows are ready.

## Current deployment artifact gaps

- Google Cloud Run service definitions are not present yet.
- Artifact Registry image build and push commands are not present yet.
- Cloud SQL instance and connection documentation are not present yet.
- Load balancer and managed certificate documentation are not present yet.
- Production secret manager mapping is not present yet.
- Rollback and incident runbook are not present yet.

## Post-deploy smoke checks

- GET https://api.getpostar.com/api/v1/health
- GET https://api.getpostar.com/api/v1/public/business-identity
- https://getpostar.com
- https://client.getpostar.com/login
- https://admin.getpostar.com/login
- https://copyright.getpostar.com/request
- https://copyright.getpostar.com/status
- https://copyright.getpostar.com/find

## Locked caution

Render remains temporary staging/testing only. Full production target is Google Cloud.
