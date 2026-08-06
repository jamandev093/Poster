# Artifact Registry

Artifact Registry stores production container images.

## Placeholder values

- PROJECT_ID
- AR_REGION
- REPOSITORY

## Backend image

Image name shape:

AR_REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/poster-backend-api:SHORT_SHA

## Commands

gcloud artifacts repositories create REPOSITORY --repository-format=docker --location=AR_REGION
gcloud builds submit --config cloudbuild.yaml --substitutions _AR_REGION=AR_REGION,_REPOSITORY=REPOSITORY,_IMAGE_NAME=poster-backend-api

## Notes

- Do not push images with real secrets baked into layers.
- Runtime secrets must come from Secret Manager or deployment env injection.
- Frontend Cloud Run images need dedicated Dockerfiles or provider-specific build configuration before production rollout.
