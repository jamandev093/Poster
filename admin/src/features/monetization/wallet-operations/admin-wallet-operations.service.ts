import type {
  AdminWalletOperationsResponse,
} from "./admin-wallet-operations.types";

const ENDPOINT =
  "/api/v1/admin/payments/wallet-operations";

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

function isRecord(
  value:
    unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isMoney(
  value:
    unknown
): boolean {
  return (
    isRecord(value) &&
    typeof value.minorUnits === "string" &&
    value.currency === "INR"
  );
}

function isNonNegativeInteger(
  value:
    unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function assertValidResponse(
  value:
    unknown
): asserts value is AdminWalletOperationsResponse {
  if (!isRecord(value)) {
    throw new Error(
      "The Backend returned an invalid Wallet Operations response."
    );
  }

  const summary =
    value.summary;

  if (
    typeof value.generatedAt !== "string" ||
    !isRecord(summary) ||
    !isNonNegativeInteger(summary.organizationCount) ||
    !isNonNegativeInteger(summary.walletCount) ||
    !isNonNegativeInteger(summary.activeWalletCount) ||
    !isMoney(summary.totalAvailable) ||
    !isMoney(summary.totalReserved) ||
    !isMoney(summary.totalCredited) ||
    !isMoney(summary.totalSpent) ||
    !isMoney(summary.totalRefunded) ||
    !isNonNegativeInteger(summary.pendingFundingOrderCount) ||
    !isNonNegativeInteger(summary.failedPaymentCount) ||
    !isNonNegativeInteger(summary.openRefundCount) ||
    !isNonNegativeInteger(summary.unreconciledWebhookCount) ||
    !Array.isArray(value.organizations) ||
    !Array.isArray(value.campaignAllocations) ||
    !Array.isArray(value.fundingOrders) ||
    !Array.isArray(value.payments) ||
    !Array.isArray(value.ledgerEntries)
  ) {
    throw new Error(
      "The Backend returned incomplete Wallet Operations data."
    );
  }
}

async function readErrorMessage(
  response:
    Response
): Promise<string> {
  try {
    const body =
      await response.json() as ApiErrorResponse;

    if (body.error?.message) {
      return body.error.message;
    }

    if (body.error?.code) {
      return `Request failed: ${body.error.code}.`;
    }
  } catch {
    // Use status fallback.
  }

  if (response.status === 401) {
    return "Your Admin session has expired. Sign in again.";
  }

  if (response.status === 403) {
    return "You do not have permission to read Wallet Operations.";
  }

  return `Wallet Operations could not be loaded (${response.status}).`;
}

export async function fetchAdminWalletOperations(
  signal?:
    AbortSignal
): Promise<AdminWalletOperationsResponse> {
  const response =
    await fetch(
      ENDPOINT,
      {
        method:
          "GET",

        cache:
          "no-store",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },

        signal,
      }
    );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response
      )
    );
  }

  const body =
    await response.json();

  assertValidResponse(
    body
  );

  return body;
}