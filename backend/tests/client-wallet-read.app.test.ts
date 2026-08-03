import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  ClientWalletReadOverview,
  ClientWalletReadService,
} from "../src/application/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const SESSION_ID =
  "00000000-0000-4000-8000-000000001302";

const MEMBERSHIP_ID =
  "00000000-0000-4000-8000-000000001303";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const NOW =
  "2026-08-03T14:30:00.000Z";

const OVERVIEW: ClientWalletReadOverview = {
  wallet: {
    id: WALLET_ID,
    organizationId: ORGANIZATION_ID,
    currency: "INR",
    status: "active",
    availableBalance: { minorUnits: "500000", currency: "INR" },
    reservedBalance: { minorUnits: "100000", currency: "INR" },
    totalCredited: { minorUnits: "750000", currency: "INR" },
    totalSpent: { minorUnits: "150000", currency: "INR" },
    totalRefunded: { minorUnits: "0", currency: "INR" },
    createdAt: NOW,
    updatedAt: NOW,
    rowVersion: "4",
  },
  fundingOrders: [],
  ledgerEntries: [],
  payments: [],
  invoices: [],
  refunds: [],
  campaignAllocations: [],
  generatedAt: NOW,
};

function createAuthorizationContextService():
  AuthorizationContextService {
  return {
    resolve:
      vi.fn()
        .mockResolvedValue({
          userId: USER_ID,
          sessionId: SESSION_ID,
          email: "client@example.com",
          fullName: "Client Owner",
          accountStatus: "active",
          platformRoles: [],
          platformPermissions: [],
          organizationMemberships: [
            {
              membershipId: MEMBERSHIP_ID,
              organizationId: ORGANIZATION_ID,
              role: "owner",
              isPrimaryContact: true,
            },
          ],
        }),
  };
}

function createWalletReadService():
  ClientWalletReadService {
  return {
    getOverview:
      vi.fn<ClientWalletReadService["getOverview"]>()
        .mockResolvedValue(OVERVIEW),

    listFundingOrders:
      vi.fn<ClientWalletReadService["listFundingOrders"]>()
        .mockResolvedValue([]),

    listLedgerEntries:
      vi.fn<ClientWalletReadService["listLedgerEntries"]>()
        .mockResolvedValue([]),

    listPayments:
      vi.fn<ClientWalletReadService["listPayments"]>()
        .mockResolvedValue([]),

    listInvoices:
      vi.fn<ClientWalletReadService["listInvoices"]>()
        .mockResolvedValue([]),

    listRefunds:
      vi.fn<ClientWalletReadService["listRefunds"]>()
        .mockResolvedValue([]),

    listCampaignAllocations:
      vi.fn<ClientWalletReadService["listCampaignAllocations"]>()
        .mockResolvedValue([]),
  };
}

describe("Client Wallet read app wiring", () => {
  it("registers Client Wallet read routes with auth context and injected read service", async () => {
    const walletReadService =
      createWalletReadService();

    const app =
      await buildApp({
        authorizationContextService:
          createAuthorizationContextService(),

        walletReadService,
      });

    const response =
      await app.inject({
        method: "GET",
        url: "/api/v1/client/wallet?limit=9",
        headers: {
          authorization: "Bearer payload.signature",
        },
      });

    await app.close();

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      wallet: {
        id: WALLET_ID,
        organizationId: ORGANIZATION_ID,
        availableBalance: {
          minorUnits: "500000",
          currency: "INR",
        },
        reservedBalance: {
          minorUnits: "100000",
          currency: "INR",
        },
      },
      fundingOrders: [],
      ledgerEntries: [],
      payments: [],
      invoices: [],
      refunds: [],
      campaignAllocations: [],
    });

    expect(
      vi.mocked(walletReadService.getOverview)
    ).toHaveBeenCalledWith({
      organizationId: ORGANIZATION_ID,
      limit: 9,
    });
  });
});