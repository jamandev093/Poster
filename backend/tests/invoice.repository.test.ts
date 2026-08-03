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
  createAdvertiserInvoice,
  findAdvertiserInvoiceById,
  findAdvertiserInvoiceByNumber,
} from "../src/domains/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001701";

const INVOICE_ID =
  "00000000-0000-4000-8000-000000001801";

const NOW =
  new Date("2026-08-03T05:30:00.000Z");

function createInvoiceRow(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: INVOICE_ID,
    organization_id: ORGANIZATION_ID,
    campaign_id: CAMPAIGN_ID,
    invoice_number: "POSTER-INV-0001",
    status: "issued",
    currency_code: "INR",
    subtotal_minor_units: "1000000",
    tax_minor_units: "180000",
    total_minor_units: "1180000",
    paid_minor_units: "0",
    refunded_minor_units: "0",
    issued_at: NOW,
    due_at: NOW,
    paid_at: null,
    cancelled_at: null,
    document_url: null,
    metadata: {},
    created_at: NOW,
    updated_at: NOW,
    row_version: "1",
    ...overrides,
  };
}

function createExecutor(
  rowsByCall: unknown[][]
): {
  executor: DatabaseQueryExecutor;
  query: ReturnType<typeof vi.fn>;
} {
  const query = vi.fn();

  for (const rows of rowsByCall) {
    query.mockResolvedValueOnce({
      rows,
    });
  }

  return {
    executor: {
      query,
    } as unknown as DatabaseQueryExecutor,

    query,
  };
}

describe("Advertiser invoice repository", () => {
  it("finds an invoice by id", async () => {
    const { executor, query } =
      createExecutor([[createInvoiceRow()]]);

    const invoice =
      await findAdvertiserInvoiceById(
        INVOICE_ID,
        executor
      );

    expect(invoice).toMatchObject({
      id: INVOICE_ID,
      organizationId: ORGANIZATION_ID,
      campaignId: CAMPAIGN_ID,
      invoiceNumber: "POSTER-INV-0001",
      status: "issued",
      rowVersion: "1",
    });

    expect(invoice?.total.minorUnits).toBe(1180000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "FROM app.advertiser_invoices"
    );
  });

  it("finds an invoice by invoice number", async () => {
    const { executor } =
      createExecutor([[createInvoiceRow()]]);

    const invoice =
      await findAdvertiserInvoiceByNumber(
        "POSTER-INV-0001",
        executor
      );

    expect(invoice?.id).toBe(INVOICE_ID);
  });

  it("creates an issued advertiser invoice", async () => {
    const { executor, query } =
      createExecutor([[createInvoiceRow()]]);

    const invoice =
      await createAdvertiserInvoice(
        {
          organizationId: ORGANIZATION_ID,
          campaignId: CAMPAIGN_ID,
          invoiceNumber: "POSTER-INV-0001",
          currency: "INR",
          subtotalMinorUnits: 1000000n,
          taxMinorUnits: 180000n,
          issuedAt: NOW,
          dueAt: NOW,
          metadata: {
            source: "test",
          },
        },
        executor
      );

    expect(invoice.status).toBe("issued");
    expect(invoice.total.minorUnits).toBe(1180000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "INSERT INTO app.advertiser_invoices"
    );
    expect(firstCall?.[1]).toContain(
      "POSTER-INV-0001"
    );
  });
});