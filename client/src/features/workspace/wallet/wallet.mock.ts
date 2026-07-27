import type {
  AdvertiserWallet,
} from "./wallet.types";

/**
 * Development-only Wallet fixture.
 *
 * Backend ledger and verified Razorpay webhooks will become
 * authoritative after API integration.
 */

export const mockAdvertiserWallet:
  AdvertiserWallet = {
  id:
    "WLT-ORG-1001",

  organizationId:
    "ORG-1001",

  status:
    "active",

  currency:
    "INR",

  amounts: {
    currency:
      "INR",

    totalFundedMinor:
      20000000,

    pendingVerificationMinor:
      0,

    availableMinor:
      11875000,

    reservedMinor:
      0,

    finalizedSpendMinor:
      8245000,

    refundReservedMinor:
      120000,

    refundedMinor:
      0,

    creditMinor:
      120000,

    debitMinor:
      8245000,
  },

  allowances: [
    {
      id:
        "CAL-CMP-3001",

      walletId:
        "WLT-ORG-1001",

      organizationId:
        "ORG-1001",

      campaignId:
        "CMP-3001",

      requestId:
        "ADV-0998",

      status:
        "partially_consumed",

      currency:
        "INR",

      requestedMinor:
        20000000,

      reservedMinor:
        0,

      consumedMinor:
        8245000,

      releasedMinor:
        0,

      remainingMinor:
        11875000,

      requestedAt:
        "2026-06-28T10:30:00+05:30",

      reservedAt:
        "2026-06-29T09:00:00+05:30",

      updatedAt:
        "2026-07-26T23:30:00+05:30",
    },
  ],

  transactions: [
    {
      id:
        "WTX-00045-03",

      walletId:
        "WLT-ORG-1001",

      organizationId:
        "ORG-1001",

      campaignId:
        "CMP-3001",

      requestId:
        "ADV-0998",

      ledgerEntryId:
        "LED-00045-03",

      type:
        "invalid_traffic_credit",

      direction:
        "credit",

      status:
        "finalized",

      currency:
        "INR",

      amountMinor:
        120000,

      description:
        "Invalid-traffic credit returned to available balance.",

      occurredAt:
        "2026-07-26T23:30:00+05:30",
    },

    {
      id:
        "WTX-00045-02",

      walletId:
        "WLT-ORG-1001",

      organizationId:
        "ORG-1001",

      campaignId:
        "CMP-3001",

      requestId:
        "ADV-0998",

      ledgerEntryId:
        "LED-00045-02",

      type:
        "campaign_spend",

      direction:
        "debit",

      status:
        "finalized",

      currency:
        "INR",

      amountMinor:
        8245000,

      description:
        "Finalized valid campaign delivery.",

      occurredAt:
        "2026-07-26T22:45:00+05:30",
    },

    {
      id:
        "WTX-00045-01",

      walletId:
        "WLT-ORG-1001",

      organizationId:
        "ORG-1001",

      paymentId:
        "PAY-00045",

      ledgerEntryId:
        "LED-00045-01",

      type:
        "funds_added",

      direction:
        "credit",

      status:
        "finalized",

      currency:
        "INR",

      amountMinor:
        20000000,

      description:
        "Verified Razorpay Wallet funding payment.",

      occurredAt:
        "2026-06-29T12:15:00+05:30",
    },
  ],

  updatedAt:
    "2026-07-26T23:30:00+05:30",
};