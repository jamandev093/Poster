# Poster PostgreSQL Database

This directory contains the authoritative, version-controlled PostgreSQL migrations for the Poster Core Backend.

## Migration rules

- Migration filenames use the format `0001_description.sql`.
- Applied migration files are immutable.
- Never edit an applied migration.
- Add a new migration for every database change.
- Each migration is applied inside a PostgreSQL transaction.
- A SHA-256 checksum protects migration history.
- An advisory lock prevents concurrent migration processes.
- The migration runner uses `DATABASE_MIGRATION_URL`.
- The application runtime uses the restricted `DATABASE_URL`.

## Commands

```powershell
cd F:\Project\Poster\backend

npm run db:check
npm run db:migrate:status
npm run db:migrate
```

## Local secrets

Local database credentials belong only in:

```text
backend\.env.local
```

Never display or commit that file.