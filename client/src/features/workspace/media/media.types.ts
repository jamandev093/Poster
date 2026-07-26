import type {
  AdvertisingActorReference,
  AdvertisingRequestId,
  CampaignId,
  CreativeLayout,
  OrganizationId,
  PlacementSurface,
} from "../advertising/advertising.types";

/**
 * Canonical advertising-media contracts.
 *
 * Shared meanings must remain compatible across:
 *
 * - Client Web App
 * - Admin Web App
 * - Mobile App
 * - Backend media processing
 * - Object storage and CDN delivery
 *
 * This file contains media data contracts only.
 * Validation rules belong in media.validation.ts.
 */

export type CreativeAssetId =
  `AST-${string}`;

export type CreativeId =
  `CRV-${string}`;

export type CreativeVersionId =
  `CRV-${string}-V${number}`;

export type MediaUploadId =
  `UPL-${string}`;

export type CreativeMediaType =
  | "image"
  | "video";

export type CreativeMediaRole =
  | "primary"
  | "logo"
  | "slide"
  | "video_poster";

export type CreativeFrameProfile =
  | "standard_media"
  | "sliding_card_media"
  | "advertiser_logo";

export type SlidingCardSlot =
  | 1
  | 2
  | 3;

export type MediaUploadStatus =
  | "not_started"
  | "uploading"
  | "uploaded"
  | "failed"
  | "cancelled";

export type MediaInspectionStatus =
  | "not_started"
  | "pending"
  | "processing"
  | "passed"
  | "failed";

export type MediaTranscodingStatus =
  | "not_required"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type MediaModerationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected"
  | "manual_review";

export type MediaApprovalStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "superseded";

export type MediaStorageVisibility =
  | "private"
  | "signed_delivery"
  | "public_cdn";

export type MediaChecksumAlgorithm =
  | "sha256";

export interface MediaDimensions {
  width: number;

  height: number;

  aspectRatio: number;
}

export interface MediaFileIdentity {
  originalFileName: string;

  declaredMimeType?: string;

  detectedMimeType?: string;

  extension?: string;

  sizeBytes: number;

  checksum?: string;

  checksumAlgorithm?:
    MediaChecksumAlgorithm;
}

export interface VideoTechnicalMetadata {
  durationMilliseconds: number;

  framesPerSecond?: number;

  videoCodec?: string;

  audioCodec?: string;

  bitrateBitsPerSecond?: number;

  hasAudio?: boolean;

  posterAssetId?: CreativeAssetId;
}

export interface MediaStorageReference {
  provider:
    | "google_cloud_storage";

  bucketName?: string;

  objectKey?: string;

  visibility:
    MediaStorageVisibility;

  /**
   * Permanent delivery URL.
   *
   * Browser object URLs must never be stored here.
   */
  deliveryUrl?: string;

  signedUrlExpiresAt?: string;

  cdnUrl?: string;
}

export interface MediaProcessingState {
  uploadStatus:
    MediaUploadStatus;

  inspectionStatus:
    MediaInspectionStatus;

  transcodingStatus:
    MediaTranscodingStatus;

  moderationStatus:
    MediaModerationStatus;

  approvalStatus:
    MediaApprovalStatus;

  failureCode?: string;

  failureMessage?: string;

  rejectionReason?: string;
}

export interface CreativeMediaAsset {
  id:
    CreativeAssetId;

  uploadId?:
    MediaUploadId;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  creativeId:
    CreativeId;

  creativeVersionId:
    CreativeVersionId;

  role:
    CreativeMediaRole;

  type:
    CreativeMediaType;

  frameProfile:
    CreativeFrameProfile;

  /**
   * Required only for sliding-card media.
   */
  slidingCardSlot?:
    SlidingCardSlot;

  title?: string;

  altText?: string;

  file:
    MediaFileIdentity;

  dimensions?:
    MediaDimensions;

  video?:
    VideoTechnicalMetadata;

  storage:
    MediaStorageReference;

  processing:
    MediaProcessingState;

  createdBy:
    AdvertisingActorReference;

  reviewedBy?:
    AdvertisingActorReference;

  createdAt:
    string;

  updatedAt:
    string;

  reviewedAt?:
    string;
}

export interface SlidingCreativeCard {
  /**
   * Locked Poster sliding format:
   *
   * Card 1 = video
   * Card 2 = image
   * Card 3 = image
   */
  slot:
    SlidingCardSlot;

  title:
    string;

  mediaAssetId:
    CreativeAssetId;
}

export interface CommercialCreativeContent {
  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;
}

export interface CreativeVersion {
  id:
    CreativeVersionId;

  creativeId:
    CreativeId;

  version:
    number;

  organizationId:
    OrganizationId;

  requestId:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  layout:
    CreativeLayout;

  content:
    CommercialCreativeContent;

  requestedPlacements:
    PlacementSurface[];

  /**
   * Standard layout uses exactly one primary asset.
   */
  primaryMediaAssetId?:
    CreativeAssetId;

  /**
   * Sliding layout uses exactly three ordered cards.
   */
  slidingCards?:
    SlidingCreativeCard[];

  logoAssetId?:
    CreativeAssetId;

  approvalStatus:
    MediaApprovalStatus;

  submittedBy:
    AdvertisingActorReference;

  reviewedBy?:
    AdvertisingActorReference;

  submittedAt:
    string;

  reviewedAt?:
    string;

  reviewNote?:
    string;

  requestedChanges?:
    string[];

  supersedesVersionId?:
    CreativeVersionId;
}

export interface AdvertisingCreative {
  id:
    CreativeId;

  organizationId:
    OrganizationId;

  requestId:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  currentVersionId:
    CreativeVersionId;

  approvedVersionId?:
    CreativeVersionId;

  versions:
    CreativeVersionId[];

  createdAt:
    string;

  updatedAt:
    string;
}

export interface MediaUploadPreparation {
  uploadId:
    MediaUploadId;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  creativeId:
    CreativeId;

  creativeVersionId:
    CreativeVersionId;

  role:
    CreativeMediaRole;

  mediaType:
    CreativeMediaType;

  frameProfile:
    CreativeFrameProfile;

  slidingCardSlot?:
    SlidingCardSlot;

  originalFileName:
    string;

  declaredMimeType:
    string;

  sizeBytes:
    number;

  /**
   * Backend-generated upload target.
   *
   * Client must not invent permanent object keys.
   */
  uploadTargetUrl?:
    string;

  uploadTargetExpiresAt?:
    string;
}

export interface MediaInspectionResult {
  assetId:
    CreativeAssetId;

  status:
    MediaInspectionStatus;

  detectedMimeType?:
    string;

  dimensions?:
    MediaDimensions;

  video?:
    VideoTechnicalMetadata;

  checksum?:
    string;

  checksumAlgorithm?:
    MediaChecksumAlgorithm;

  inspectedAt?:
    string;

  errors:
    string[];

  warnings:
    string[];
}
