import {
  requestPosterApiJson,
} from "@/features/workspace/services/client-api.service";

export interface ClientAccountUser {
  id:
    string;

  email:
    string;

  fullName:
    string;

  status:
    string;

  rowVersion?:
    string;
}

export interface ClientAccountOrganization {
  id:
    string;

  name:
    string;

  legalName?:
    string;

  displayName?:
    string;

  websiteUrl?:
    string |
    null;

  billingEmail?:
    string |
    null;

  countryCode?:
    string;

  status:
    string;

  rowVersion:
    string;

  createdAt?:
    string;

  updatedAt?:
    string;
}

export interface ClientAccount {
  user:
    ClientAccountUser;

  organization:
    ClientAccountOrganization;
}

interface ClientAccountResponse {
  account:
    ClientAccount;
}

interface ClientOrganizationResponse {
  organization:
    ClientAccountOrganization;
}

export interface UpdateClientOrganizationInput {
  displayName:
    string;

  legalName?:
    string;

  websiteUrl?:
    string |
    null;

  billingEmail?:
    string |
    null;

  countryCode:
    string;

  expectedRowVersion:
    string;
}

export async function getClientAccount():
  Promise<ClientAccount> {
  const response =
    await requestPosterApiJson<ClientAccountResponse>(
      "/api/v1/client/account",
      {
        method:
          "GET",
      }
    );

  return response.account;
}

export async function getClientCurrentOrganization():
  Promise<ClientAccountOrganization> {
  const response =
    await requestPosterApiJson<ClientOrganizationResponse>(
      "/api/v1/client/organizations/current",
      {
        method:
          "GET",
      }
    );

  return response.organization;
}

export async function updateClientCurrentOrganization(
  input:
    UpdateClientOrganizationInput
): Promise<ClientAccountOrganization> {
  const response =
    await requestPosterApiJson<ClientOrganizationResponse>(
      "/api/v1/client/organizations/current",
      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            displayName:
              input.displayName,

            legalName:
              input.legalName,

            websiteUrl:
              input.websiteUrl,

            billingEmail:
              input.billingEmail,

            countryCode:
              input.countryCode,

            expectedRowVersion:
              input.expectedRowVersion,
          }),
      }
    );

  return response.organization;
}