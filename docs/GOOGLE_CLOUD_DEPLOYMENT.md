# Poster Google Cloud Deployment Guide

This guide documents the planned Google Cloud production deployment. It contains placeholders only and no secrets.

## Target services

- Backend API: Cloud Run service poster-backend-api
- Website: Cloud Run service poster-website
- Admin: Cloud Run service poster-admin
- Client: Cloud Run service poster-client
- Copyright: Cloud Run service poster-copyright
- Database: Cloud SQL PostgreSQL
- Images: Artifact Registry
- Secrets: Secret Manager
- Domains and TLS: external HTTPS load balancer or Cloud Run domain mappings with managed certificates

## Required placeholders

- PROJECT_ID
- REGION
- AR_REGION
- REPOSITORY
- CLOUD_SQL_INSTANCE
- DOMAIN
- SERVICE_ACCOUNT

## Deployment order

1. Create or select the Google Cloud project.
2. Enable Cloud Run, Artifact Registry, Cloud SQL, Secret Manager, Cloud Build, Certificate Manager, and Cloud Logging.
3. Create Artifact Registry repository.
4. Build and push Backend image.
5. Configure Secret Manager values.
6. Create Cloud SQL PostgreSQL instance and database.
7. Run Backend migration status.
8. Apply Backend migrations.
9. Deploy Backend Cloud Run service.
10. Verify GET https://api.getpostar.com/api/v1/health.
11. Deploy Website, Admin, Client, and Copyright services.
12. Configure DNS, TLS, and routing.
13. Run post-deploy smoke checks.

## Backend image build

Use backend/Dockerfile.

Example command shape:

gcloud builds submit --config cloudbuild.yaml --substitutions _AR_REGION=REGION,_REPOSITORY=poster,_IMAGE_NAME=poster-backend-api

## Migration rule

Migrations must run as a separate deployment step using DATABASE_MIGRATION_URL. Do not run migrations automatically inside every API container start.

## Locked production domains

- https://getpostar.com
- https://api.getpostar.com
- https://admin.getpostar.com
- https://client.getpostar.com
- https://copyright.getpostar.com

## Current limits

These templates are deployment starting points. They do not create cloud resources by themselves and they intentionally avoid real project IDs, real secret values, credentials, or private keys.
