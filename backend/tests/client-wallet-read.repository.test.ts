import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  findClientWalletByOrganizationId,
  listClientWalletCampaignAllocations,
  listClientWalletFundingOrders,
  listClientWalletInvoices,
  listClientWalletLedgerEntries,
  listClientWalletPayments,
  listClientWalletRefunds,
} from "../src/application/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const NOW =
  new Date("2026-08-03T14:10:00.000Z");

function createExecutor(
  rowsByCall: unknown[][]
): {
  executor: DatabaseQueryExecutor;
  query: ReturnType<typeof vi.fn>;
} {
  const query =
    vi.fn();

  for (const rows of rowsByCall) {
    query.mockResolvedValueOnce({
      rows,
    });
  }

  return {
    executor:
      {
        query,
      } as unknown as DatabaseQueryExecutor,

    query,
  };
}

function createWalletRow() {
  return {
    id:
      WALLET_ID,

    organization_id:
      ORGANIZATION_ID,

    currency_code:
      "INR",

    status:
      "active",

    available_balance_minor_units:
      "500000",

    reserved_balance_minor_units:
      "100000",

    total_credited_minor_units:
      "750000",

    total_spent_minor_units:
      "150000",

    total_refunded_minor_units:
      "0",

    created_at:
      NOW,

    updated_at:
      NOW,

    row_version:
      "4",
  };
}

function createFundingOrderRow() {
  return {
    id:
      "00000000-0000-4000-8000-000000001501",

    organization_id:
      ORGANIZATION_ID,

    wallet_id:
      WALLET_ID,

    requested_by_user_id:
      USER_ID,

    provider:
      "razorpay",

    provider_order_id:
      "order_0001",

    provider_receipt:
      "wf_0001",

    amount_minor_units:
      "500000",

    currency_code:
      "INR",

    status:
      "credited",

    idempotency_key:
      "wallet-funding-0001",

    expires_at:
      null,

    credited_at:
      NOW,

    created_at:
      NOW,

    updated_at:
      NOW,

    row_version:
      "2",
  };
}

function createLedgerRow() {
  return {
    id:
      "00000000-0000-4000-8000-000000002201",

    organization_id:
      ORGANIZATION_ID,

    wallet_id:
      WALLET_ID,

    funding_order_id:
      "00000000-0000-4000-8000-000000001501",

    campaign_id:
      null,

    allocation_id:
      null,

    invoice_id:
      null,

    payment_id:
      "00000000-0000-4000-8000-000000001901",

    refund_id:
      null,

    entry_type:
      "payment_credit",

    direction:
      "credit",

    status:
      "posted",

    amount_minor_units:
      "500000",

    currency_code:
      "INR",

    balance_before_minor_units:
      "0",

    balance_after_minor_units:
      "500000",

    idempotency_key:
      "wallet-credit:pay_0001",

    provider_reference:
      "pay_0001",

    metadata:
      {
        source:
          "test",
      },

    created_by_user_id:
      USER_ID,

    created_at:
      NOW,

    row_version:
      "1",
  };
}

function createPaymentRow() {
  return {
    id:
      "00000000-0000-4000-8000-000000001901",

    organization_id:
      ORGANIZATION_ID,

    wallet_id:
      WALLET_ID,

    funding_order_id:
      "00000000-0000-4000-8000-000000001501",

    invoice_id:
      null,

    campaign_id:
      null,

    provider:
      "razorpay",

    provider_order_id:
      "order_0001",

    provider_payment_id:
      "pay_0001",

    status:
      "captured",

    amount_minor_units:
      "500000",

    captured_minor_units:
      "500000",

    refunded_minor_units:
      "0",

    currency_code:
      "INR",

    paid_at:
      NOW,

    failed_at:
      null,

    created_at:
      NOW,

    updated_at:
      NOW,

    row_version:
      "1",
  };
}

function createInvoiceRow() {
  return {
    id:
      "00000000-0000-4000-8000-000000003001",

    organization_id:
      ORGANIZATION_ID,

    campaign_id:
      "00000000-0000-4000-8000-000000001701",

    invoice_number:
      "INV-2026-0001",

    status:
      "issued",

    subtotal_minor_units:
      "100000",

    tax_minor_units:
      "18000",

    total_minor_units:
      "118000",

    paid_minor_units:
      "0",

    refunded_minor_units:
      "0",

    currency_code:
      "INR",

    issued_at:
      NOW,

    due_at:
      NOW,

    paid_at:
      null,

    cancelled_at:
      null,

    created_at:
      NOW,

    updated_at:
      NOW,

    row_version:
      "1",
  };
}

function createRefundRow() {
  return {
    id:
      "00000000-0000-4000-8000-000000003501",

    organization_id:
      ORGANIZATION_ID,

    payment_id:
      "00000000-0000-4000-8000-000000001901",

    invoice_id:
      null,

    campaign_id:
      null,

    provider:
      "razorpay",

    provider_refund_id:
      "rfnd_0001",

    reason:
      "duplicate_payment",

    status:
      "refunded",

    requested_amount_minor_units:
      "100000",

    approved_amount_minor_units:
      "100000",

    refunded_amount_minor_units:
      "100000",

    currency_code:
      "INR",

    requested_at:
      NOW,

    approved_at:
      NOW,

    refunded_at:
      NOW,

    failed_at:
      null,

    cancelled_at:
      null,

    created_at:
      NOW,

    updated_at:
      NOW,

    row_version:
      "1",
  };
}

function createAllocationRow() {
  return {
    id:
      "00000000-0000-4000-8000-000000004001",

    organization_id:
      ORGANIZATION_ID,

    wallet_id:
      WALLET_ID,

    campaign_id:
      "00000000-0000-4000-8000-000000001701",

    currency_code:
      "INR",

    status:
      "active",

    allocated_minor_units:
      "300000",

    reserved_minor_units:
      "100000",

    spent_minor_units:
      "50000",

    released_minor_units:
      "0",

    refunded_minor_units:
      "0",

    created_by_user_id:
      USER_ID,

    created_at:
      NOW,

    updated_at:
      NOW,

    row_version:
      "1",
  };
}

const REQUEST = {
  organizationId:
    ORGANIZATION_ID,

  limit:
    10,
};

describe("Client Wallet read repository", () => {
  it("reads Wallet, funding orders, and ledger entries for one organization", async () => {
    const {
      executor,
      query,
    } =
      createExecutor([
        [
          createWalletRow(),
        ],
        [
          createFundingOrderRow(),
        ],
        [
          createLedgerRow(),
        ],
      ]);

    const wallet =
      await findClientWalletByOrganizationId(
        REQUEST,
        executor
      );

    const fundingOrders =
      await listClientWalletFundingOrders(
        REQUEST,
        executor
      );

    const ledgerEntries =
      await listClientWalletLedgerEntries(
        REQUEST,
        executor
      );

    expect(wallet?.availableBalance.minorUnits).toBe("500000");
    expect(fundingOrders[0]?.providerOrderId).toBe("order_0001");
    expect(ledgerEntries[0]?.metadata).toEqual({ source: "test" });

    expect(query.mock.calls[0]?.[0]).toContain("FROM app.advertiser_wallets");
    expect(query.mock.calls[1]?.[0]).toContain("FROM app.wallet_funding_orders");
    expect(query.mock.calls[2]?.[0]).toContain("FROM app.advertiser_wallet_ledger_entries");
    expect(query.mock.calls[1]?.[1]).toEqual([ORGANIZATION_ID, 10]);
  });

  it("reads payments, invoices, refunds, and campaign allocations for one organization", async () => {
    const {
      executor,
      query,
    } =
      createExecutor([
        [
          createPaymentRow(),
        ],
        [
          createInvoiceRow(),
        ],
        [
          createRefundRow(),
        ],
        [
          createAllocationRow(),
        ],
      ]);

    const payments =
      await listClientWalletPayments(
        REQUEST,
        executor
      );

    const invoices =
      await listClientWalletInvoices(
        REQUEST,
        executor
      );

    const refunds =
      await listClientWalletRefunds(
        REQUEST,
        executor
      );

    const allocations =
      await listClientWalletCampaignAllocations(
        REQUEST,
        executor
      );

    expect(payments[0]?.captured.minorUnits).toBe("500000");
    expect(invoices[0]?.invoiceNumber).toBe("INV-2026-0001");
    expect(refunds[0]?.approvedAmount?.minorUnits).toBe("100000");
    expect(allocations[0]?.reserved.minorUnits).toBe("100000");

    expect(query.mock.calls[0]?.[0]).toContain("FROM app.advertiser_payments");
    expect(query.mock.calls[1]?.[0]).toContain("FROM app.advertiser_invoices");
    expect(query.mock.calls[2]?.[0]).toContain("FROM app.advertiser_refunds");
    expect(query.mock.calls[3]?.[0]).toContain("FROM app.campaign_wallet_allocations");
  });
});