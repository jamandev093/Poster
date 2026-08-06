# Artifact Registry

Artifact Registry stores production container images.

## Placeholder values

- PROJECT_ID
- AR_REGION
- REPOSITORY

## Image names

- AR_REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/poster-backend-api:SHORT_SHA
- AR_REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/poster-admin:SHORT_SHA
- AR_REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/poster-client:SHORT_SHA
- AR_REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/poster-copyright:SHORT_SHA
- AR_REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/poster-website:SHORT_SHA

## Commands

gcloud artifacts repositories create REPOSITORY --repository-format=docker --location=AR_REGION
gcloud builds submit --config cloudbuild.yaml --substitutions _AR_REGION=AR_REGION,_REPOSITORY=REPOSITORY

## Notes

- Do not push images with real secrets baked into layers.
- Runtime secrets must come from Secret Manager or deployment env injection.
- Backend uses backend/Dockerfile.
- Admin uses admin/Dockerfile.
- Client uses client/Dockerfile.
- Copyright uses copyright/Dockerfile.
- Website uses website/Dockerfile.
- Mobile is not deployed as a Cloud Run server image.
