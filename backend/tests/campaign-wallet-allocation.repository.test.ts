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
  createCampaignWalletAllocation,
  findCampaignWalletAllocationByCampaignId,
  findCampaignWalletAllocationById,
  updateCampaignWalletAllocationAmounts,
} from "../src/domains/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001701";

const ALLOCATION_ID =
  "00000000-0000-4000-8000-000000002101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const NOW =
  new Date("2026-08-03T07:00:00.000Z");

function createAllocationRow(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: ALLOCATION_ID,
    organization_id: ORGANIZATION_ID,
    wallet_id: WALLET_ID,
    campaign_id: CAMPAIGN_ID,
    currency_code: "INR",
    status: "active",
    allocated_minor_units: "1000000",
    reserved_minor_units: "250000",
    spent_minor_units: "100000",
    released_minor_units: "0",
    refunded_minor_units: "0",
    created_by_user_id: USER_ID,
    created_at: NOW,
    updated_at: NOW,
    row_version: "2",
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

describe("Campaign Wallet allocation repository", () => {
  it("finds a campaign Wallet allocation by id", async () => {
    const { executor, query } =
      createExecutor([[createAllocationRow()]]);

    const allocation =
      await findCampaignWalletAllocationById(
        ALLOCATION_ID,
        executor
      );

    expect(allocation).toMatchObject({
      id: ALLOCATION_ID,
      organizationId: ORGANIZATION_ID,
      walletId: WALLET_ID,
      campaignId: CAMPAIGN_ID,
      status: "active",
      rowVersion: "2",
    });

    expect(allocation?.allocated.minorUnits).toBe(1000000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "FROM app.campaign_wallet_allocations"
    );
  });

  it("finds a campaign Wallet allocation by campaign id", async () => {
    const { executor } =
      createExecutor([[createAllocationRow()]]);

    const allocation =
      await findCampaignWalletAllocationByCampaignId(
        CAMPAIGN_ID,
        executor
      );

    expect(allocation?.id).toBe(ALLOCATION_ID);
    expect(allocation?.reserved.minorUnits).toBe(250000n);
  });

  it("creates a campaign Wallet allocation", async () => {
    const { executor, query } =
      createExecutor([[createAllocationRow()]]);

    const allocation =
      await createCampaignWalletAllocation(
        {
          organizationId: ORGANIZATION_ID,
          walletId: WALLET_ID,
          campaignId: CAMPAIGN_ID,
          currency: "INR",
          allocatedMinorUnits: 1000000n,
          createdByUserId: USER_ID,
        },
        executor
      );

    expect(allocation.status).toBe("active");
    expect(allocation.allocated.minorUnits).toBe(1000000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "INSERT INTO app.campaign_wallet_allocations"
    );
    expect(firstCall?.[1]).toContain(CAMPAIGN_ID);
  });

  it("returns existing allocation on campaign replay", async () => {
    const { executor, query } =
      createExecutor([
        [],
        [createAllocationRow()],
      ]);

    const allocation =
      await createCampaignWalletAllocation(
        {
          organizationId: ORGANIZATION_ID,
          walletId: WALLET_ID,
          campaignId: CAMPAIGN_ID,
          currency: "INR",
          allocatedMinorUnits: 1000000n,
          createdByUserId: USER_ID,
        },
        executor
      );

    expect(allocation.id).toBe(ALLOCATION_ID);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("updates allocation amounts with optimistic row version", async () => {
    const { executor, query } =
      createExecutor([
        [
          createAllocationRow({
            status: "exhausted",
            reserved_minor_units: "0",
            spent_minor_units: "1000000",
            released_minor_units: "0",
            refunded_minor_units: "0",
            row_version: "3",
          }),
        ],
      ]);

    const allocation =
      await updateCampaignWalletAllocationAmounts(
        {
          allocationId: ALLOCATION_ID,
          status: "exhausted",
          reservedMinorUnits: 0n,
          spentMinorUnits: 1000000n,
          releasedMinorUnits: 0n,
          refundedMinorUnits: 0n,
          expectedRowVersion: "2",
        },
        executor
      );

    expect(allocation).toMatchObject({
      status: "exhausted",
      rowVersion: "3",
    });

    expect(allocation?.spent.minorUnits).toBe(1000000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "UPDATE app.campaign_wallet_allocations"
    );
  });

  it("returns null when allocation row version does not match", async () => {
    const { executor } =
      createExecutor([[]]);

    await expect(
      updateCampaignWalletAllocationAmounts(
        {
          allocationId: ALLOCATION_ID,
          status: "active",
          reservedMinorUnits: 0n,
          spentMinorUnits: 0n,
          releasedMinorUnits: 0n,
          refundedMinorUnits: 0n,
          expectedRowVersion: "99",
        },
        executor
      )
    ).resolves.toBeNull();
  });
});