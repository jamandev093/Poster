import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  ClientWalletAllocationConflictError,
  ClientWalletAllocationInsufficientBalanceError,
  ClientWalletAllocationNotFoundError,
  ClientWalletAllocationValidationError,
  type ClientWalletAllocationValidationIssue,
} from "./client-wallet-allocation.errors.js";

export type ClientWalletAllocationStatus =
  | "active"
  | "paused"
  | "exhausted"
  | "released"
  | "cancelled";

export interface ClientWalletAllocationMoney {
  minorUnits:
    bigint;

  currency:
    "INR";
}

export interface ClientWalletAllocationWallet {
  id:
    string;

  organizationId:
    string;

  currency:
    "INR";

  status:
    string;

  availableBalance:
    ClientWalletAllocationMoney;

  reservedBalance:
    ClientWalletAllocationMoney;

  totalCredited:
    ClientWalletAllocationMoney;

  totalSpent:
    ClientWalletAllocationMoney;

  totalRefunded:
    ClientWalletAllocationMoney;

  rowVersion:
    string;
}

export interface ClientWalletAllocationCampaign {
  id:
    string;

  organizationId:
    string;

  status:
    string;
}

export interface ClientWalletAllocationRecord {
  id:
    string;

  organizationId:
    string;

  walletId:
    string;

  campaignId:
    string;

  currency:
    "INR";

  status:
    ClientWalletAllocationStatus;

  allocated:
    ClientWalletAllocationMoney;

  reserved:
    ClientWalletAllocationMoney;

  spent:
    ClientWalletAllocationMoney;

  released:
    ClientWalletAllocationMoney;

  refunded:
    ClientWalletAllocationMoney;

  createdByUserId:
    string;

  createdAt:
    Date;

  updatedAt:
    Date;

  rowVersion:
    string;
}

export interface AllocateClientCampaignWalletInput {
  organizationId:
    string;

  actorUserId:
    string;

  campaignId:
    string;

  amountMinorUnits:
    bigint;

  currency:
    "INR";

  idempotencyKey:
    string;
}

export interface ReleaseClientCampaignWalletInput {
  organizationId:
    string;

  actorUserId:
    string;

  campaignId:
    string;

  amountMinorUnits?:
    bigint;

  expectedRowVersion:
    string;

  idempotencyKey:
    string;
}

export interface ClientWalletAllocationMutationResult {
  wallet:
    ClientWalletAllocationWallet;

  allocation:
    ClientWalletAllocationRecord;
}

export interface ClientWalletAllocationService {
  allocateCampaignWalletFunds: (
    input:
      AllocateClientCampaignWalletInput
  ) => Promise<ClientWalletAllocationMutationResult>;

  releaseCampaignWalletFunds: (
    input:
      ReleaseClientCampaignWalletInput
  ) => Promise<ClientWalletAllocationMutationResult>;
}

export interface ClientWalletAllocationServiceDependencies {
  findWalletByOrganizationId: (
    organizationId:
      string,

    executor?:
      DatabaseQueryExecutor
  ) => Promise<ClientWalletAllocationWallet | null>;

  findCampaignById: (
    campaignId:
      string,

    executor?:
      DatabaseQueryExecutor
  ) => Promise<ClientWalletAllocationCampaign | null>;

  findAllocationByCampaignId: (
    campaignId:
      string,

    executor?:
      DatabaseQueryExecutor
  ) => Promise<ClientWalletAllocationRecord | null>;

  createAllocation: (
    input: {
      organizationId:
        string;

      walletId:
        string;

      campaignId:
        string;

      currency:
        "INR";

      allocatedMinorUnits:
        bigint;

      createdByUserId:
        string;
    },

    executor:
      DatabaseQueryExecutor
  ) => Promise<ClientWalletAllocationRecord>;

  updateAllocationAmounts: (
    input: {
      allocationId:
        string;

      status:
        ClientWalletAllocationStatus;

      reservedMinorUnits:
        bigint;

      spentMinorUnits:
        bigint;

      releasedMinorUnits:
        bigint;

      refundedMinorUnits:
        bigint;

      expectedRowVersion:
        string;
    },

    executor:
      DatabaseQueryExecutor
  ) => Promise<ClientWalletAllocationRecord | null>;

  updateWalletBalances: (
    input: {
      walletId:
        string;

      availableBalanceMinorUnits:
        bigint;

      reservedBalanceMinorUnits:
        bigint;

      totalCreditedMinorUnits:
        bigint;

      totalSpentMinorUnits:
        bigint;

      totalRefundedMinorUnits:
        bigint;

      expectedRowVersion:
        string;
    },

    executor:
      DatabaseQueryExecutor
  ) => Promise<ClientWalletAllocationWallet | null>;

  createLedgerEntry: (
    input: {
      organizationId:
        string;

      walletId:
        string;

      campaignId:
        string;

      allocationId:
        string;

      entryType:
        "campaign_reservation" |
        "campaign_release";

      direction:
        "credit" |
        "debit" |
        "neutral";

      amountMinorUnits:
        bigint;

      currency:
        "INR";

      balanceBeforeMinorUnits:
        bigint;

      balanceAfterMinorUnits:
        bigint;

      createdByUserId:
        string;

      idempotencyKey:
        string;
    },

    executor:
      DatabaseQueryExecutor
  ) => Promise<unknown>;

  runTransaction: <Result>(
    operation: (
      executor:
        DatabaseQueryExecutor
    ) => Promise<Result>
  ) => Promise<Result>;
}

const ELIGIBLE_CAMPAIGN_STATUSES =
  new Set([
    "draft",
    "scheduled",
    "active",
    "paused",
  ]);

function validateUuidLike(
  value:
    string,

  field:
    string,

  issues:
    ClientWalletAllocationValidationIssue[]
): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    issues.push({
      field,
      code:
        "required",
      message:
        `${field} is required.`,
    });
  }
}

function validatePositiveMoney(
  value:
    bigint | undefined,

  field:
    string,

  issues:
    ClientWalletAllocationValidationIssue[]
): void {
  if (
    value === undefined ||
    value <= 0n
  ) {
    issues.push({
      field,
      code:
        "positive_amount_required",
      message:
        `${field} must be greater than zero minor currency units.`,
    });
  }
}

function validateRowVersion(
  value:
    string | undefined,

  issues:
    ClientWalletAllocationValidationIssue[]
): void {
  if (
    typeof value !== "string" ||
    !/^[1-9][0-9]*$/.test(
      value
    )
  ) {
    issues.push({
      field:
        "expectedRowVersion",
      code:
        "invalid",
      message:
        "expectedRowVersion must be a positive integer string.",
    });
  }
}

function assertActiveWallet(
  wallet:
    ClientWalletAllocationWallet
): void {
  if (
    wallet.status !== "active"
  ) {
    throw new ClientWalletAllocationConflictError(
      "Wallet is not active for campaign allocation."
    );
  }
}

function assertCampaignBelongsToOrganization(
  campaign:
    ClientWalletAllocationCampaign,

  organizationId:
    string
): void {
  if (
    campaign.organizationId !== organizationId
  ) {
    throw new ClientWalletAllocationNotFoundError(
      "Campaign was not found for this Client organization."
    );
  }
}

function assertCampaignEligible(
  campaign:
    ClientWalletAllocationCampaign
): void {
  if (
    !ELIGIBLE_CAMPAIGN_STATUSES.has(
      campaign.status
    )
  ) {
    throw new ClientWalletAllocationConflictError(
      "Campaign status does not allow Wallet allocation changes."
    );
  }
}

function validateAllocateInput(
  input:
    AllocateClientCampaignWalletInput
): void {
  const issues:
    ClientWalletAllocationValidationIssue[] =
      [];

  validateUuidLike(
    input.organizationId,
    "organizationId",
    issues
  );

  validateUuidLike(
    input.actorUserId,
    "actorUserId",
    issues
  );

  validateUuidLike(
    input.campaignId,
    "campaignId",
    issues
  );

  validatePositiveMoney(
    input.amountMinorUnits,
    "amountMinorUnits",
    issues
  );

  if (
    input.currency !== "INR"
  ) {
    issues.push({
      field:
        "currency",
      code:
        "unsupported",
      message:
        "Only INR Wallet allocation is supported.",
    });
  }

  validateUuidLike(
    input.idempotencyKey,
    "idempotencyKey",
    issues
  );

  if (
    issues.length > 0
  ) {
    throw new ClientWalletAllocationValidationError(
      issues
    );
  }
}

function validateReleaseInput(
  input:
    ReleaseClientCampaignWalletInput
): void {
  const issues:
    ClientWalletAllocationValidationIssue[] =
      [];

  validateUuidLike(
    input.organizationId,
    "organizationId",
    issues
  );

  validateUuidLike(
    input.actorUserId,
    "actorUserId",
    issues
  );

  validateUuidLike(
    input.campaignId,
    "campaignId",
    issues
  );

  if (
    input.amountMinorUnits !== undefined
  ) {
    validatePositiveMoney(
      input.amountMinorUnits,
      "amountMinorUnits",
      issues
    );
  }

  validateRowVersion(
    input.expectedRowVersion,
    issues
  );

  validateUuidLike(
    input.idempotencyKey,
    "idempotencyKey",
    issues
  );

  if (
    issues.length > 0
  ) {
    throw new ClientWalletAllocationValidationError(
      issues
    );
  }
}

export function createClientWalletAllocationService(
  dependencies:
    ClientWalletAllocationServiceDependencies
): ClientWalletAllocationService {
  async function allocateCampaignWalletFunds(
    input:
      AllocateClientCampaignWalletInput
  ): Promise<ClientWalletAllocationMutationResult> {
    validateAllocateInput(
      input
    );

    return await dependencies.runTransaction(
      async executor => {
        const wallet =
          await dependencies.findWalletByOrganizationId(
            input.organizationId,
            executor
          );

        if (
          !wallet
        ) {
          throw new ClientWalletAllocationNotFoundError(
            "Wallet was not found for this Client organization."
          );
        }

        assertActiveWallet(
          wallet
        );

        const campaign =
          await dependencies.findCampaignById(
            input.campaignId,
            executor
          );

        if (
          !campaign
        ) {
          throw new ClientWalletAllocationNotFoundError(
            "Campaign was not found."
          );
        }

        assertCampaignBelongsToOrganization(
          campaign,
          input.organizationId
        );

        assertCampaignEligible(
          campaign
        );

        if (
          wallet.availableBalance.minorUnits <
          input.amountMinorUnits
        ) {
          throw new ClientWalletAllocationInsufficientBalanceError();
        }

        const existingAllocation =
          await dependencies.findAllocationByCampaignId(
            input.campaignId,
            executor
          );

        const balanceBefore =
          wallet.availableBalance.minorUnits;

        const nextAvailable =
          wallet.availableBalance.minorUnits -
          input.amountMinorUnits;

        const nextReservedBalance =
          wallet.reservedBalance.minorUnits +
          input.amountMinorUnits;

        const nextWallet =
          await dependencies.updateWalletBalances(
            {
              walletId:
                wallet.id,

              availableBalanceMinorUnits:
                nextAvailable,

              reservedBalanceMinorUnits:
                nextReservedBalance,

              totalCreditedMinorUnits:
                wallet.totalCredited.minorUnits,

              totalSpentMinorUnits:
                wallet.totalSpent.minorUnits,

              totalRefundedMinorUnits:
                wallet.totalRefunded.minorUnits,

              expectedRowVersion:
                wallet.rowVersion,
            },
            executor
          );

        if (
          !nextWallet
        ) {
          throw new ClientWalletAllocationConflictError(
            "Wallet balance changed before allocation could be completed."
          );
        }

        const allocation =
          existingAllocation
            ? await dependencies.updateAllocationAmounts(
                {
                  allocationId:
                    existingAllocation.id,

                  status:
                    "active",

                  reservedMinorUnits:
                    existingAllocation.reserved.minorUnits +
                    input.amountMinorUnits,

                  spentMinorUnits:
                    existingAllocation.spent.minorUnits,

                  releasedMinorUnits:
                    existingAllocation.released.minorUnits,

                  refundedMinorUnits:
                    existingAllocation.refunded.minorUnits,

                  expectedRowVersion:
                    existingAllocation.rowVersion,
                },
                executor
              )
            : await dependencies.createAllocation(
                {
                  organizationId:
                    input.organizationId,

                  walletId:
                    wallet.id,

                  campaignId:
                    input.campaignId,

                  currency:
                    input.currency,

                  allocatedMinorUnits:
                    input.amountMinorUnits,

                  createdByUserId:
                    input.actorUserId,
                },
                executor
              );

        if (
          !allocation
        ) {
          throw new ClientWalletAllocationConflictError(
            "Campaign allocation changed before allocation could be completed."
          );
        }

        await dependencies.createLedgerEntry(
          {
            organizationId:
              input.organizationId,

            walletId:
              wallet.id,

            campaignId:
              input.campaignId,

            allocationId:
              allocation.id,

            entryType:
              "campaign_reservation",

            direction:
              "debit",

            amountMinorUnits:
              input.amountMinorUnits,

            currency:
              input.currency,

            balanceBeforeMinorUnits:
              balanceBefore,

            balanceAfterMinorUnits:
              nextAvailable,

            createdByUserId:
              input.actorUserId,

            idempotencyKey:
              input.idempotencyKey,
          },
          executor
        );

        return {
          wallet:
            nextWallet,

          allocation,
        };
      }
    );
  }

  async function releaseCampaignWalletFunds(
    input:
      ReleaseClientCampaignWalletInput
  ): Promise<ClientWalletAllocationMutationResult> {
    validateReleaseInput(
      input
    );

    return await dependencies.runTransaction(
      async executor => {
        const wallet =
          await dependencies.findWalletByOrganizationId(
            input.organizationId,
            executor
          );

        if (
          !wallet
        ) {
          throw new ClientWalletAllocationNotFoundError(
            "Wallet was not found for this Client organization."
          );
        }

        assertActiveWallet(
          wallet
        );

        const campaign =
          await dependencies.findCampaignById(
            input.campaignId,
            executor
          );

        if (
          !campaign
        ) {
          throw new ClientWalletAllocationNotFoundError(
            "Campaign was not found."
          );
        }

        assertCampaignBelongsToOrganization(
          campaign,
          input.organizationId
        );

        const allocation =
          await dependencies.findAllocationByCampaignId(
            input.campaignId,
            executor
          );

        if (
          !allocation
        ) {
          throw new ClientWalletAllocationNotFoundError(
            "Campaign Wallet allocation was not found."
          );
        }

        if (
          allocation.rowVersion !==
          input.expectedRowVersion
        ) {
          throw new ClientWalletAllocationConflictError();
        }

        const releasable =
          allocation.reserved.minorUnits;

        const releaseAmount =
          input.amountMinorUnits ??
          releasable;

        if (
          releaseAmount >
          releasable
        ) {
          throw new ClientWalletAllocationConflictError(
            "Release amount exceeds reserved campaign allocation."
          );
        }

        const balanceBefore =
          wallet.availableBalance.minorUnits;

        const nextAvailable =
          wallet.availableBalance.minorUnits +
          releaseAmount;

        const nextReservedBalance =
          wallet.reservedBalance.minorUnits -
          releaseAmount;

        const nextWallet =
          await dependencies.updateWalletBalances(
            {
              walletId:
                wallet.id,

              availableBalanceMinorUnits:
                nextAvailable,

              reservedBalanceMinorUnits:
                nextReservedBalance,

              totalCreditedMinorUnits:
                wallet.totalCredited.minorUnits,

              totalSpentMinorUnits:
                wallet.totalSpent.minorUnits,

              totalRefundedMinorUnits:
                wallet.totalRefunded.minorUnits,

              expectedRowVersion:
                wallet.rowVersion,
            },
            executor
          );

        if (
          !nextWallet
        ) {
          throw new ClientWalletAllocationConflictError(
            "Wallet balance changed before release could be completed."
          );
        }

        const nextReserved =
          allocation.reserved.minorUnits -
          releaseAmount;

        const nextReleased =
          allocation.released.minorUnits +
          releaseAmount;

        const updatedAllocation =
          await dependencies.updateAllocationAmounts(
            {
              allocationId:
                allocation.id,

              status:
                nextReserved === 0n
                  ? "released"
                  : allocation.status,

              reservedMinorUnits:
                nextReserved,

              spentMinorUnits:
                allocation.spent.minorUnits,

              releasedMinorUnits:
                nextReleased,

              refundedMinorUnits:
                allocation.refunded.minorUnits,

              expectedRowVersion:
                allocation.rowVersion,
            },
            executor
          );

        if (
          !updatedAllocation
        ) {
          throw new ClientWalletAllocationConflictError();
        }

        await dependencies.createLedgerEntry(
          {
            organizationId:
              input.organizationId,

            walletId:
              wallet.id,

            campaignId:
              input.campaignId,

            allocationId:
              allocation.id,

            entryType:
              "campaign_release",

            direction:
              "credit",

            amountMinorUnits:
              releaseAmount,

            currency:
              allocation.currency,

            balanceBeforeMinorUnits:
              balanceBefore,

            balanceAfterMinorUnits:
              nextAvailable,

            createdByUserId:
              input.actorUserId,

            idempotencyKey:
              input.idempotencyKey,
          },
          executor
        );

        return {
          wallet:
            nextWallet,

          allocation:
            updatedAllocation,
        };
      }
    );
  }

  return {
    allocateCampaignWalletFunds,
    releaseCampaignWalletFunds,
  };
}