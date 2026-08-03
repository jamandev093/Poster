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
  WalletFundingService,
} from "../src/application/payments/index.js";

import type {
  WalletFundingOrderRecord,
} from "../src/domains/payments/index.js";

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

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date("2026-08-03T09:30:00.000Z");

const FUNDING_ORDER:
  WalletFundingOrderRecord = {
    id:
      FUNDING_ORDER_ID,

    organizationId:
      ORGANIZATION_ID,

    walletId:
      WALLET_ID,

    requestedByUserId:
      USER_ID,

    provider:
      "razorpay",

    providerOrderId:
      null,

    providerReceipt:
      null,

    amount: {
      minorUnits:
        500000n,

      currency:
        "INR",
    },

    status:
      "created",

    idempotencyKey:
      "wallet-funding-0001",

    providerPayload: {},

    expiresAt:
      new Date("2026-08-03T09:45:00.000Z"),

    creditedAt:
      null,

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  };

describe("Client Wallet app wiring", () => {
  it("registers Client Wallet funding route with auth context and injected service", async () => {
    const authorizationContextService:
      AuthorizationContextService = {
        resolve:
          vi.fn()
            .mockResolvedValue({
              userId:
                USER_ID,

              sessionId:
                SESSION_ID,

              email:
                "client@example.com",

              fullName:
                "Client Owner",

              accountStatus:
                "active",

              platformRoles:
                [],

              platformPermissions:
                [],

              organizationMemberships: [
                {
                  membershipId:
                    MEMBERSHIP_ID,

                  organizationId:
                    ORGANIZATION_ID,

                  role:
                    "owner",

                  isPrimaryContact:
                    true,
                },
              ],
            }),
      };

    const startFunding =
      vi.fn<
        WalletFundingService[
          "startFunding"
        ]
      >()
        .mockResolvedValue(
          FUNDING_ORDER
        );

    const app =
      await buildApp({
        authorizationContextService,

        walletFundingService: {
          startFunding,
        },
      });

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/client/wallet/funding-orders",

        headers: {
          authorization:
            "Bearer payload.signature",
        },

        payload: {
          amountMinorUnits:
            "500000",

          currency:
            "INR",

          idempotencyKey:
            "wallet-funding-0001",
        },
      });

    await app.close();

    expect(
      response.statusCode
    ).toBe(
      201
    );

    expect(
      response.json()
    ).toMatchObject({
      order: {
        id:
          FUNDING_ORDER_ID,

        amountMinorUnits:
          "500000",

        currency:
          "INR",

        status:
          "created",
      },
    });

    expect(
      startFunding
    ).toHaveBeenCalledTimes(
      1
    );

    expect(
      startFunding.mock.calls[0]?.[0]
    ).toMatchObject({
      organizationId:
        ORGANIZATION_ID,

      actorUserId:
        USER_ID,

      amountMinorUnits:
        500000n,

      currency:
        "INR",

      provider:
        "razorpay",
    });
  });
});