/**
 * Canonical advertising workflow contracts.
 *
 * These contracts are designed to remain consistent across:
 *
 * - Client Web App
 * - Admin Web App
 * - Mobile App
 * - Backend API
 * - PostgreSQL
 *
 * This file owns advertising workflow concepts only.
 * Media, analytics, payments, invoices, refunds, settlements,
 * and ledger records belong to their own domain modules.
 */

export type AdvertisingRequestId =
  `ADV-${string}`;

export type CampaignId =
  `CMP-${string}`;

export type OrganizationId =
  `ORG-${string}`;

export type AdvertisingRequestType =
  | "direct_sponsorship"
  | "affiliate";

export type AdvertisingRequestStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "expired";

export type CampaignStatus =
  | "draft"
  | "payment_pending"
  | "scheduled"
  | "active"
  | "paused"
  | "ended"
  | "disabled"
  | "cancelled";

export type PlacementSurface =
  | "home"
  | "search"
  | "trending";

export type CreativeLayout =
  | "standard"
  | "sliding";

export type BillingModel =
  | "fixed_contract"
  | "budget_based"
  | "cpc"
  | "cpm"
  | "cpa"
  | "affiliate";

export type TrackingStatus =
  | "connected"
  | "not_configured"
  | "processing"
  | "unavailable";

export type CampaignEligibilityStatus =
  | "not_ready"
  | "awaiting_review"
  | "awaiting_payment"
  | "eligible"
  | "blocked";

export type AdvertisingActorType =
  | "client"
  | "admin"
  | "system";

export interface AdvertisingActorReference {
  actorType: AdvertisingActorType;

  actorId: string;

  displayName?: string;
}

export interface AdvertisingRequestReview {
  requestedChanges: string[];

  reviewNote?: string;

  reviewedBy?: AdvertisingActorReference;

  reviewedAt?: string;
}

export interface AdvertisingRequestVersion {
  version: number;

  submittedAt: string;

  submittedBy: AdvertisingActorReference;

  /**
   * Immutable identifier for the creative version submitted
   * with this request revision.
   *
   * The complete creative/media record belongs to the media
   * domain and will be referenced by ID.
   */
  creativeVersionId: string;

  changeSummary?: string;
}

export interface AdvertisingRequest {
  id: AdvertisingRequestId;

  organizationId: OrganizationId;

  organizationName: string;

  type: AdvertisingRequestType;

  status: AdvertisingRequestStatus;

  campaignName: string;

  contactName: string;

  businessEmail: string;

  website: string;

  requestedPlacements: PlacementSurface[];

  requestedStartDate: string;

  requestedEndDate: string;

  proposedBudgetMinor?: number;

  proposedContractValueMinor?: number;

  currency: string;

  commissionModel?: string;

  conversionDefinition?: string;

  rightsConfirmed: boolean;

  currentVersion: number;

  versions: AdvertisingRequestVersion[];

  review?: AdvertisingRequestReview;

  approvedVersion?: number;

  approvedAt?: string;

  approvalExpiresAt?: string;

  linkedCampaignId?: CampaignId;

  invoiceId?: string;

  createdAt: string;

  updatedAt: string;
}

export interface CampaignPlacementAllocation {
  placementId: string;

  surface: PlacementSurface;

  creativeVersionId: string;

  enabled: boolean;

  allocationPercentage?: number;

  priority?: number;

  startAt?: string;

  endAt?: string;
}

export interface CampaignBillingConfiguration {
  model: BillingModel;

  currency: string;

  /**
   * Monetary values are stored in minor units.
   *
   * Examples:
   * INR 100.00 -> 10000 paise
   * USD 100.00 -> 10000 cents
   */
  approvedRateMinor?: number;

  budgetMinor?: number;

  contractValueMinor?: number;

  spendLimitMinor?: number;

  deliveryTarget?: number;

  conversionDefinition?: string;
}

export interface AdvertisingCampaign {
  id: CampaignId;

  requestId: AdvertisingRequestId;

  approvedRequestVersion: number;

  organizationId: OrganizationId;

  organizationName: string;

  name: string;

  type: AdvertisingRequestType;

  status: CampaignStatus;

  eligibilityStatus: CampaignEligibilityStatus;

  billing: CampaignBillingConfiguration;

  placements: CampaignPlacementAllocation[];

  trackingStatus: TrackingStatus;

  destinationUrl: string;

  scheduledStartAt: string;

  scheduledEndAt: string;

  actualStartAt?: string;

  actualEndAt?: string;

  approvedCreativeVersionId: string;

  createdBy: AdvertisingActorReference;

  approvedBy?: AdvertisingActorReference;

  activatedBy?: AdvertisingActorReference;

  createdAt: string;

  updatedAt: string;
}

export interface AdvertisingRequestPermission {
  canEdit: boolean;

  canWithdraw: boolean;

  canResubmit: boolean;
}

export interface CampaignClientPermission {
  canView: boolean;

  canControl: false;

  canChangeApprovedCreative: false;

  canChangeBillingConfiguration: false;
}

export function getClientRequestPermission(
  status: AdvertisingRequestStatus
): AdvertisingRequestPermission {
  return {
    canEdit:
      status === "draft" ||
      status === "changes_requested",

    canWithdraw:
      status === "draft" ||
      status === "pending_review" ||
      status === "changes_requested",

    canResubmit:
      status === "changes_requested",
  };
}

export function getClientCampaignPermission():
  CampaignClientPermission {
  return {
    canView: true,
    canControl: false,
    canChangeApprovedCreative: false,
    canChangeBillingConfiguration: false,
  };
}
