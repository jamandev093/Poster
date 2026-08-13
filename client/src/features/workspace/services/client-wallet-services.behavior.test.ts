import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  requestPosterApiJson,
} from "./client-api.service";

import {
  allocateClientCampaignWalletFunds,
  releaseClientCampaignWalletFunds,
} from "./client-wallet-allocation.service";

import {
  getClientWalletOverview,
  listClientWalletCampaignAllocations,
  listClientWalletFundingOrders,
  listClientWalletInvoices,
  listClientWalletLedgerEntries,
  listClientWalletPayments,
  listClientWalletRefunds,
} from "./client-wallet-read.service";

import {
  createWalletFundingOrder,
} from "./wallet-funding.service";

import {
  verifyWalletFundingPayment,
} from "./wallet-payment-verification.service";

vi.mock(
  "./client-api.service",
  () => ({
    requestPosterApiJson:
      vi.fn(),
  })
);

const requestMock =
  vi.mocked(
    requestPosterApiJson
  );

describe(
  "Client Wallet service behavior",
  () => {
    beforeEach(
      () => {
        requestMock.mockReset();
      }
    );

    it(
      "allocates campaign Wallet funds through Backend",
      async () => {
        requestMock.mockResolvedValue(
          {
            marker:
              "allocated",
          } as never
        );

        await allocateClientCampaignWalletFunds({
          campaignId:
            "campaign-1",

          amountMinorUnits:
            "5000",

          currency:
            "INR",

          idempotencyKey:
            "allocation-key",
        });

        const [
          route,
          init,
        ] =
          requestMock.mock.calls[0];

        expect(
          route
        ).toBe(
          "/api/v1/client/wallet/campaign-allocations"
        );

        expect(
          init?.method
        ).toBe(
          "POST"
        );

        expect(
          JSON.parse(
            String(
              init?.body
            )
          )
        ).toEqual({
          campaignId:
            "campaign-1",

          amountMinorUnits:
            "5000",

          currency:
            "INR",

          idempotencyKey:
            "allocation-key",
        });
      }
    );

    it(
      "creates an idempotency boundary when allocation key is omitted",
      async () => {
        requestMock.mockResolvedValue(
          {} as never
        );

        await allocateClientCampaignWalletFunds({
          campaignId:
            "campaign-2",

          amountMinorUnits:
            "1000",

          currency:
            "INR",
        });

        const body =
          JSON.parse(
            String(
              requestMock.mock.calls[0][1]?.body
            )
          );

        expect(
          body.idempotencyKey
        ).toMatch(
          /^client-wallet-allocation:allocate:campaign-2:/
        );
      }
    );

    it(
      "rejects invalid allocation before Backend",
      async () => {
        await expect(
          allocateClientCampaignWalletFunds({
            campaignId:
              " ",

            amountMinorUnits:
              "1000",

            currency:
              "INR",
          })
        ).rejects.toThrow(
          "campaignId"
        );

        await expect(
          allocateClientCampaignWalletFunds({
            campaignId:
              "campaign-1",

            amountMinorUnits:
              "0",

            currency:
              "INR",
          })
        ).rejects.toThrow(
          "amountMinorUnits"
        );

        expect(
          requestMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "releases campaign Wallet allocation through encoded route and row-version contract",
      async () => {
        requestMock.mockResolvedValue(
          {} as never
        );

        await releaseClientCampaignWalletFunds({
          campaignId:
            "campaign/one",

          amountMinorUnits:
            "2500",

          expectedRowVersion:
            "7",

          idempotencyKey:
            "release-key",
        });

        const [
          route,
          init,
        ] =
          requestMock.mock.calls[0];

        expect(
          route
        ).toBe(
          "/api/v1/client/wallet/campaign-allocations/campaign%2Fone/release"
        );

        expect(
          JSON.parse(
            String(
              init?.body
            )
          )
        ).toEqual({
          amountMinorUnits:
            "2500",

          expectedRowVersion:
            "7",

          idempotencyKey:
            "release-key",
        });
      }
    );

    it(
      "rejects release without optimistic row version",
      async () => {
        await expect(
          releaseClientCampaignWalletFunds({
            campaignId:
              "campaign-1",

            expectedRowVersion:
              "",

            idempotencyKey:
              "release-key",
          })
        ).rejects.toThrow(
          "expectedRowVersion"
        );

        expect(
          requestMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "uses all seven authoritative Wallet read routes",
      async () => {
        const overview = {
          wallet:
            null,

          fundingOrders:
            [],

          ledgerEntries:
            [],

          payments:
            [],

          invoices:
            [],

          refunds:
            [],

          campaignAllocations:
            [],
        };

        requestMock
          .mockResolvedValueOnce(
            overview as never
          )
          .mockResolvedValueOnce({
            fundingOrders:
              [],
          } as never)
          .mockResolvedValueOnce({
            ledgerEntries:
              [],
          } as never)
          .mockResolvedValueOnce({
            payments:
              [],
          } as never)
          .mockResolvedValueOnce({
            invoices:
              [],
          } as never)
          .mockResolvedValueOnce({
            refunds:
              [],
          } as never)
          .mockResolvedValueOnce({
            campaignAllocations:
              [],
          } as never);

        expect(
          await getClientWalletOverview(
            11
          )
        ).toBe(
          overview
        );

        expect(
          await listClientWalletFundingOrders(
            12
          )
        ).toEqual(
          []
        );

        expect(
          await listClientWalletLedgerEntries(
            13
          )
        ).toEqual(
          []
        );

        expect(
          await listClientWalletPayments(
            14
          )
        ).toEqual(
          []
        );

        expect(
          await listClientWalletInvoices(
            15
          )
        ).toEqual(
          []
        );

        expect(
          await listClientWalletRefunds(
            16
          )
        ).toEqual(
          []
        );

        expect(
          await listClientWalletCampaignAllocations(
            17
          )
        ).toEqual(
          []
        );

        const routes = [
          "/api/v1/client/wallet",
          "/api/v1/client/wallet/funding-orders",
          "/api/v1/client/wallet/ledger",
          "/api/v1/client/wallet/payments",
          "/api/v1/client/wallet/invoices",
          "/api/v1/client/wallet/refunds",
          "/api/v1/client/wallet/campaign-allocations",
        ];

        const limits = [
          11,
          12,
          13,
          14,
          15,
          16,
          17,
        ];

        routes.forEach(
          (
            expectedRoute,
            index
          ) => {
            const [
              route,
              init,
              query,
            ] =
              requestMock.mock.calls[
                index
              ];

            expect(
              route
            ).toBe(
              expectedRoute
            );

            expect(
              init?.method
            ).toBe(
              "GET"
            );

            expect(
              query
            ).toEqual({
              limit:
                limits[index],
            });
          }
        );
      }
    );

    it(
      "creates and maps a valid Razorpay Wallet funding order",
      async () => {
        requestMock.mockResolvedValue({
          order: {
            fundingOrderId:
              "funding-1",

            walletId:
              "WLT-1",

            organizationId:
              "ORG-1",

            status:
              "verification_pending",

            currency:
              "INR",

            amountMinor:
              5000,

            providerOrderId:
              "order-1",

            publicKeyId:
              "rzp-key",

            checkoutName:
              "Poster Wallet",

            checkoutDescription:
              "Add verified funds.",

            createdAt:
              "2099-01-01T00:00:00.000Z",

            expiresAt:
              "2099-01-01T00:15:00.000Z",
          },
        } as never);

        const result =
          await createWalletFundingOrder({
            walletId:
              "WLT-1",

            organizationId:
              "ORG-1",

            amountMinor:
              5000,

            currency:
              "INR",
          });

        expect(
          result
        ).toMatchObject({
          fundingOrderId:
            "funding-1",

          walletId:
            "WLT-1",

          organizationId:
            "ORG-1",

          status:
            "verification_pending",

          amountMinor:
            5000,

          currency:
            "INR",

          provider:
            "razorpay",
        });

        const body =
          JSON.parse(
            String(
              requestMock.mock.calls[0][1]?.body
            )
          );

        expect(
          body.amountMinorUnits
        ).toBe(
          "5000"
        );

        expect(
          body.providerPayload
        ).toEqual({
          source:
            "client_wallet_ui",

          walletId:
            "WLT-1",

          organizationId:
            "ORG-1",
        });

        expect(
          body.idempotencyKey
        ).toMatch(
          /^client-wallet-funding:/
        );
      }
    );

    it(
      "maps unknown funding state conservatively and rejects missing order identity",
      async () => {
        requestMock.mockResolvedValueOnce({
          order: {
            fundingOrderId:
              "funding-2",

            walletId:
              "WLT-2",

            organizationId:
              "ORG-2",

            status:
              "future_unknown_state",

            currency:
              "INR",

            amountMinor:
              2000,

            providerOrderId:
              "order-2",

            publicKeyId:
              "key",

            createdAt:
              "2099-01-01T00:00:00.000Z",

            expiresAt:
              "2099-01-01T00:15:00.000Z",
          },
        } as never);

        const result =
          await createWalletFundingOrder({
            walletId:
              "WLT-2",

            organizationId:
              "ORG-2",

            amountMinor:
              2000,

            currency:
              "INR",
          });

        expect(
          result.status
        ).toBe(
          "created"
        );

        requestMock.mockResolvedValueOnce({
          order: {
            walletId:
              "WLT-3",

            organizationId:
              "ORG-3",

            currency:
              "INR",

            amountMinor:
              1000,
          },
        } as never);

        await expect(
          createWalletFundingOrder({
            walletId:
              "WLT-3",

            organizationId:
              "ORG-3",

            amountMinor:
              1000,

            currency:
              "INR",
          })
        ).rejects.toThrow(
          "The Wallet funding order response did not include an order id."
        );
      }
    );

    it(
      "passes Razorpay checkout evidence to Backend verification only",
      async () => {
        const verification = {
          payment: {
            id:
              "payment-1",
          },
        };

        requestMock.mockResolvedValue({
          verification,
        } as never);

        const result =
          await verifyWalletFundingPayment({
            fundingOrderId:
              "funding-1",

            providerOrderId:
              "order-1",

            providerPaymentId:
              "pay-1",

            providerSignature:
              "signature-1",

            amountMinor:
              5000,

            currency:
              "INR",
          });

        expect(
          result
        ).toBe(
          verification
        );

        const [
          route,
          init,
        ] =
          requestMock.mock.calls[0];

        expect(
          route
        ).toBe(
          "/api/v1/client/wallet/payment-verifications"
        );

        const body =
          JSON.parse(
            String(
              init?.body
            )
          );

        expect(
          body
        ).toMatchObject({
          fundingOrderId:
            "funding-1",

          providerOrderId:
            "order-1",

          providerPaymentId:
            "pay-1",

          providerSignature:
            "signature-1",

          amountMinorUnits:
            "5000",

          currency:
            "INR",

          methodDetails: {
            channel:
              "razorpay_checkout",
          },

          providerPayload: {
            source:
              "client_wallet_ui_checkout_callback",

            provider:
              "razorpay",
          },
        });

        expect(
          Number.isNaN(
            Date.parse(
              body.paidAt
            )
          )
        ).toBe(
          false
        );
      }
    );
  }
);