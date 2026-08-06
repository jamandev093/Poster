# Cloud SQL PostgreSQL

Cloud SQL is the planned managed PostgreSQL runtime for production.

## Placeholder values

- PROJECT_ID
- REGION
- CLOUD_SQL_INSTANCE
- DATABASE_NAME
- RUNTIME_DB_USER
- MIGRATION_DB_USER

## Required separation

- DATABASE_URL uses a restricted runtime DB user.
- DATABASE_MIGRATION_URL uses a migration-capable DB user.
- Migration credentials must not be used by the normal Backend runtime.

## Deployment flow

1. Create Cloud SQL PostgreSQL instance.
2. Create database.
3. Create runtime and migration users.
4. Store runtime connection string in Secret Manager.
5. Store migration connection string in Secret Manager.
6. Run npm run db:migrate:status.
7. Run npm run db:migrate.
8. Deploy Backend after migrations complete.

## Notes

- Applied migrations are immutable.
- Use forward corrective migrations for production fixes.
- Confirm SSL requirements match Backend .env.production.example.
