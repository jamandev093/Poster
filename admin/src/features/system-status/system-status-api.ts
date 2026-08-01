export type SystemServiceStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "not_connected";

export interface SystemStatusService {
  key: string;

  name: string;

  area: string;

  status:
    SystemServiceStatus;

  statusLabel: string;

  description: string;

  checkedAt:
    string |
    null;

  latencyMilliseconds:
    number |
    null;

  metadata:
    Record<
      string,
      string |
      number |
      boolean |
      null
    >;
}

export interface SystemStatusGroup {
  key: string;

  title: string;

  description: string;

  services:
    SystemStatusService[];
}

export interface SystemStatusSnapshot {
  generatedAt: string;

  environment: string;

  summary: {
    total: number;

    operational: number;

    degraded: number;

    unavailable: number;

    notConnected: number;
  };

  groups:
    SystemStatusGroup[];
}

interface ApiErrorBody {
  error?: {
    message?: unknown;
  };
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

function isString(
  value: unknown
): value is string {
  return typeof value ===
    "string";
}

function isNullableString(
  value: unknown
): value is
  | string
  | null {
  return (
    value === null ||
    isString(
      value
    )
  );
}

function isNullableNumber(
  value: unknown
): value is
  | number
  | null {
  return (
    value === null ||
    (
      typeof value ===
        "number" &&
      Number.isFinite(
        value
      )
    )
  );
}

function isService(
  value: unknown
): value is SystemStatusService {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.key
    ) &&
    isString(
      value.name
    ) &&
    isString(
      value.area
    ) &&
    isString(
      value.status
    ) &&
    isString(
      value.statusLabel
    ) &&
    isString(
      value.description
    ) &&
    isNullableString(
      value.checkedAt
    ) &&
    isNullableNumber(
      value.latencyMilliseconds
    ) &&
    isRecord(
      value.metadata
    )
  );
}

function isGroup(
  value: unknown
): value is SystemStatusGroup {
  return (
    isRecord(
      value
    ) &&
    isString(
      value.key
    ) &&
    isString(
      value.title
    ) &&
    isString(
      value.description
    ) &&
    Array.isArray(
      value.services
    ) &&
    value.services.every(
      isService
    )
  );
}

function parseSnapshot(
  value: unknown
): SystemStatusSnapshot {
  if (
    !isRecord(
      value
    ) ||
    !isString(
      value.generatedAt
    ) ||
    !isString(
      value.environment
    ) ||
    !isRecord(
      value.summary
    ) ||
    typeof value.summary.total !==
      "number" ||
    typeof value.summary.operational !==
      "number" ||
    typeof value.summary.degraded !==
      "number" ||
    typeof value.summary.unavailable !==
      "number" ||
    typeof value.summary.notConnected !==
      "number" ||
    !Array.isArray(
      value.groups
    ) ||
    !value.groups.every(
      isGroup
    )
  ) {
    throw new TypeError(
      "The System Status API returned an invalid response."
    );
  }

  return value as unknown as
    SystemStatusSnapshot;
}

async function createApiError(
  response: Response
): Promise<Error> {
  let message =
    `System Status request failed (${response.status}).`;

  try {
    const body =
      await response.json() as
        ApiErrorBody;

    if (
      typeof body.error
        ?.message ===
      "string"
    ) {
      message =
        body.error.message;
    }
  } catch {
    // Keep the safe fallback.
  }

  if (
    response.status ===
    401
  ) {
    message =
      "Your Admin session has expired. Sign in again.";
  } else if (
    response.status ===
    403
  ) {
    message =
      "You do not have permission to view System Status.";
  }

  return new Error(
    message
  );
}

export async function fetchSystemStatus():
  Promise<SystemStatusSnapshot> {
  const response =
    await fetch(
      "/api/v1/admin/system-status",
      {
        method:
          "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  if (
    !response.ok
  ) {
    throw await createApiError(
      response
    );
  }

  return parseSnapshot(
    await response.json()
  );
}

export function formatSystemTimestamp(
  value:
    string |
    null
): string {
  if (
    !value
  ) {
    return "Not checked";
  }

  const parsed =
    new Date(
      value
    );

  if (
    !Number.isFinite(
      parsed.getTime()
    )
  ) {
    return "Invalid timestamp";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    parsed
  );
}