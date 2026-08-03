import type {
  AdvertiserWallet,
} from "./wallet.types";

import type {
  ClientWalletApiOverview,
} from "../services/client-wallet-read.service";

function minorStringToNumber(
  value:
    string
): number {
  if (!/^-?[0-9]+$/.test(value)) {
    return 0;
  }

  const parsed =
    Number(value);

  return Number.isSafeInteger(parsed)
    ? parsed
    : 0;
}

function sumMinorUnits(
  values:
    string[]
): number {
  return values.reduce(
    (
      total,
      value
    ) =>
      total +
      minorStringToNumber(
        value
      ),
    0
  );
}

function sumPendingFundingMinor(
  overview:
    ClientWalletApiOverview
): number {
  const pendingStatuses =
    new Set([
      "created",
      "pending_provider",
      "checkout_opened",
      "payment_submitted",
      "verification_pending",
    ]);

  return sumMinorUnits(
    overview
      .fundingOrders
      .filter(
        order =>
          pendingStatuses.has(
            order.status
          )
      )
      .map(
        order =>
          order.amount.minorUnits
      )
  );
}

export function mapClientWalletApiOverviewToAdvertiserWallet(
  overview:
    ClientWalletApiOverview
): AdvertiserWallet | null {
  const wallet =
    overview.wallet;

  if (!wallet) {
    return null;
  }

  const allocatedMinor =
    sumMinorUnits(
      overview.campaignAllocations.map(
        allocation =>
          allocation.allocated.minorUnits
      )
    );

  const walletForFundingPanel = {
    id:
      wallet.id,

    organizationId:
      wallet.organizationId,

    currency:
      wallet.currency,

    status:
      wallet.status,

    amounts: {
      availableMinor:
        minorStringToNumber(
          wallet.availableBalance.minorUnits
        ),

      reservedMinor:
        minorStringToNumber(
          wallet.reservedBalance.minorUnits
        ),

      pendingVerificationMinor:
        sumPendingFundingMinor(
          overview
        ),

      allocatedMinor,

      spentMinor:
        minorStringToNumber(
          wallet.totalSpent.minorUnits
        ),

      refundReservedMinor:
        0,

      refundedMinor:
        minorStringToNumber(
          wallet.totalRefunded.minorUnits
        ),
    },

    allowances:
      [],

    transactions:
      [],

    createdAt:
      wallet.createdAt,

    updatedAt:
      wallet.updatedAt,
  };

  return walletForFundingPanel as unknown as AdvertiserWallet;
}