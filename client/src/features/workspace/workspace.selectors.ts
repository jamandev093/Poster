import {
  campaigns,
  commercialRequests,
  currentOrganization,
} from "./workspace.mock";

import type {
  ClientCampaign,
  CommercialRequest,
} from "./workspace.types";

export function getCurrentOrganization() {
  return currentOrganization;
}

export function getOrganizationRequests(): CommercialRequest[] {
  return commercialRequests.filter(
    (request) =>
      request.organizationId ===
      currentOrganization.id
  );
}

export function getOrganizationCampaigns(): ClientCampaign[] {
  return campaigns.filter(
    (campaign) =>
      campaign.organizationId ===
      currentOrganization.id
  );
}

export function getRequestById(
  requestId: string
): CommercialRequest | undefined {
  return getOrganizationRequests().find(
    (request) =>
      request.id === requestId
  );
}

export function getCampaignById(
  campaignId: string
): ClientCampaign | undefined {
  return getOrganizationCampaigns().find(
    (campaign) =>
      campaign.id === campaignId
  );
}

export function getRequestsNeedingAction(): CommercialRequest[] {
  return getOrganizationRequests().filter(
    (request) =>
      request.status ===
      "changes_requested"
  );
}

export function getPendingRequests(): CommercialRequest[] {
  return getOrganizationRequests().filter(
    (request) =>
      request.status ===
      "pending_review"
  );
}

export function getApprovedRequests(): CommercialRequest[] {
  return getOrganizationRequests().filter(
    (request) =>
      request.status ===
      "approved"
  );
}

export function getActiveCampaigns(): ClientCampaign[] {
  return getOrganizationCampaigns().filter(
    (campaign) =>
      campaign.status ===
      "active"
  );
}

export function clientCanEditRequest(
  request: CommercialRequest
): boolean {
  return (
    request.status ===
    "changes_requested"
  );
}

export function clientCanControlCampaign(): false {
  return false;
}

export function getCampaignForRequest(
  request: CommercialRequest
): ClientCampaign | undefined {
  if (!request.linkedCampaignId) {
    return undefined;
  }

  return getCampaignById(
    request.linkedCampaignId
  );
}