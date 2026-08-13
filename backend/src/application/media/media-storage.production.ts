import {
  getMediaStorageConfiguration,
  type MediaStorageConfiguration,
} from "../../config/media-storage.config.js";

import {
  createGoogleCloudMediaStorageAdapter,
} from "../../domains/media/google-cloud-media-storage.adapter.js";

import type {
  MediaAssetRepository,
} from "../../domains/media/media-asset.types.js";

import type {
  MediaStorageAdapter,
} from "../../domains/media/media-storage-adapter.types.js";

import {
  createMediaAssetLifecycleService,
  type MediaAssetLifecycleService,
  type MediaAssetLifecycleServiceDependencies,
} from "./media-asset-lifecycle.service.js";

import {
  createMediaAssetStorageLocatorFactory,
} from "./media-storage-locator.factory.js";

export interface ProductionMediaStorageRuntime {
  configuration:
    MediaStorageConfiguration;

  storageAdapter:
    MediaStorageAdapter;

  lifecycleService:
    MediaAssetLifecycleService;
}

export interface CreateProductionMediaStorageRuntimeOptions {
  repository:
    MediaAssetRepository;

  getConfiguration?:
    () =>
      MediaStorageConfiguration;

  createStorageAdapter?:
    () =>
      MediaStorageAdapter;

  createAssetId?:
    () =>
      string;

  now?:
    () =>
      Date;
}

/*
 * Production composition remains lazy.
 *
 * No storage configuration is loaded and no Google client
 * is created until this runtime is explicitly requested.
 */
export function createProductionMediaStorageRuntime(
  options:
    CreateProductionMediaStorageRuntimeOptions
): ProductionMediaStorageRuntime {
  const configuration =
    (
      options.getConfiguration ??
      getMediaStorageConfiguration
    )();

  if (
    configuration.provider !==
    "gcs"
  ) {
    throw new Error(
      "Poster production media runtime requires GCS."
    );
  }

  const storageAdapter =
    (
      options.createStorageAdapter ??
      createGoogleCloudMediaStorageAdapter
    )();

  if (
    storageAdapter.provider !==
    configuration.provider
  ) {
    throw new Error(
      "Configured media storage provider does not match the production storage adapter."
    );
  }

  const createStorageLocator =
    createMediaAssetStorageLocatorFactory(
      configuration
    );

  /*
   * exactOptionalPropertyTypes requires optional properties
   * to be omitted rather than explicitly assigned undefined.
   */
  const lifecycleDependencies:
    MediaAssetLifecycleServiceDependencies = {
    repository:
      options.repository,

    storageAdapter,

    createStorageLocator,
  };

  if (
    options.createAssetId !==
    undefined
  ) {
    lifecycleDependencies.createAssetId =
      options.createAssetId;
  }

  if (
    options.now !==
    undefined
  ) {
    lifecycleDependencies.now =
      options.now;
  }

  const lifecycleService =
    createMediaAssetLifecycleService(
      lifecycleDependencies
    );

  return {
    configuration,
    storageAdapter,
    lifecycleService,
  };
}