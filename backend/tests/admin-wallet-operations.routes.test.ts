import type {
  FastifyInstance,
} from "fastify";

import {
  afterEach,
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
  AdminWalletOperationsResponse,
  AdminWalletOperationsService,
} from "../src/application/payments/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "../src/domains/authorization/authorization.types.js";

const GENERATED_AT =
  "2026-08-03T18:45:00.000Z";

const BASE_CONTEXT:
  AuthorizationContext = {
  userId:
    "00000000-0000-4000-8000-000000009001",

  sessionId:
    "00000000-0000-4000-8000-000000009002",

  email:
    "admin@getpostar.com",

  fullName:
    "Poster Admin",

  accountStatus:
    "active",

  platformRoles: [
    "operations_admin",
  ],

  platformPermissions: [
    "admin.access",
    "monetization.campaigns.read",
  ],

  organizationMemberships:
    [],
};

const SNAPSHOT:
  AdminWalletOperationsResponse = {
  generatedAt:
    GENERATED_AT,

  summary: {
    organizationCount:
      1,

    walletCount:
      1,

    activeWalletCount:
      1,

    totalAvailable: {
      minorUnits:
        "500000",

      currency:
        "INR",
    },

    totalReserved: {
      minorUnits:
        "100000",

      currency:
        "INR",
    },

    totalCredited: {
      minorUnits:
        "700000",

      currency:
        "INR",
    },

    totalSpent: {
      minorUnits:
        "200000",

      currency:
        "INR",
    },

    totalRefunded: {
      minorUnits:
        "0",

      currency:
        "INR",
    },

    pendingFundingOrderCount:
      1,

    failedPaymentCount:
      0,

    openRefundCount:
      0,

    unreconciledWebhookCount:
      0,
  },

  organizations: [
    {
      organizationId:
        "00000000-0000-4000-8000-000000009101",

      organizationName:
        "Organization 00000000",

      walletId:
        "00000000-0000-4000-8000-000000009201",

      walletStatus:
        "active",

      available: {
        minorUnits:
          "500000",

        currency:
          "INR",
      },

      reserved: {
        minorUnits:
          "100000",

        currency:
          "INR",
      },

      credited: {
        minorUnits:
          "700000",

        currency:
          "INR",
      },

      spent: {
        minorUnits:
          "200000",

        currency:
          "INR",
      },

      refunded: {
        minorUnits:
          "0",

        currency:
          "INR",
      },

      fundingOrderCount:
        1,

      paymentCount:
        1,

      invoiceCount:
        0,

      refundCount:
        0,

      allocationCount:
        1,

      lastPaymentAt:
        GENERATED_AT,

      updatedAt:
        GENERATED_AT,
    },
  ],

  fundingOrders: [],

  payments: [],

  ledgerEntries: [],
};

function createAuthorizationContextService(
  permissions:
    readonly PlatformPermission[]
): AuthorizationContextService {
  return {
    resolve:
      vi.fn()
        .mockResolvedValue({
          ...BASE_CONTEXT,

          platformPermissions:
            permissions,
        }),
  };
}

function createService():
  AdminWalletOperationsService {
  return {
    getSnapshot:
      vi.fn()
        .mockResolvedValue(
          SNAPSHOT
        ),
  };
}

describe("Admin Wallet Operations routes", () => {
  let app:
    FastifyInstance |
    null =
    null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("returns Wallet Operations to an authorized Admin", async () => {
    const service =
      createService();

    app =
      await buildApp({
        authorizationContextService:
          createAuthorizationContextService([
            "admin.access",
            "monetization.campaigns.read",
          ]),

        adminWalletOperationsService:
          service,
      });

    const currentApp =
      app;

    if (!currentApp) {
      throw new Error(
        "Test app was not created."
      );
    }

    const response =
      await currentApp.inject({
        method:
          "GET",

        url:
          "/api/v1/admin/payments/wallet-operations",

        headers: {
          authorization:
            "Bearer admin.wallet",
        },
      });

    expect(response.statusCode).toBe(
      200
    );

    expect(response.json()).toMatchObject({
      generatedAt:
        GENERATED_AT,

      summary: {
        walletCount:
          1,

        totalAvailable: {
          minorUnits:
            "500000",

          currency:
            "INR",
        },
      },

      organizations: [
        {
          walletStatus:
            "active",
        },
      ],
    });

    expect(service.getSnapshot).toHaveBeenCalledTimes(
      1
    );
  });

  it("rejects Admin users without monetization read permission", async () => {
    const service =
      createService();

    app =
      await buildApp({
        authorizationContextService:
          createAuthorizationContextService([
            "admin.access",
          ]),

        adminWalletOperationsService:
          service,
      });

    const currentApp =
      app;

    if (!currentApp) {
      throw new Error(
        "Test app was not created."
      );
    }

    const response =
      await currentApp.inject({
        method:
          "GET",

        url:
          "/api/v1/admin/payments/wallet-operations",

        headers: {
          authorization:
            "Bearer admin.wallet",
        },
      });

    expect(response.statusCode).toBe(
      403
    );

    expect(service.getSnapshot).not.toHaveBeenCalled();
  });
});