import type {
  CopyrightCaseStatus,
  CopyrightRequestType,
  CopyrightVerificationCheckStatus,
  CopyrightVerificationStatus,
  DiscoveryContentAcquisitionMethod,
} from "./copyright-api.types";

export function formatCopyrightTimestamp(
  value:
    string |
    null
): string {
  if (
    !value
  ) {
    return "Not recorded";
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

export function formatCopyrightRequestType(
  value:
    CopyrightRequestType
): string {
  switch (
    value
  ) {
    case "copyright_strike":
      return "Copyright strike";

    case "copyright_request":
      return "Copyright request";

    case "publisher_removal":
      return "Publisher removal";
  }
}

export function formatCopyrightCaseStatus(
  value:
    CopyrightCaseStatus
): string {
  switch (
    value
  ) {
    case "needs_action":
      return "Needs action";

    case "removed":
      return "Removed";

    case "resolved":
      return "Resolved";
  }
}

export function formatVerificationStatus(
  value:
    CopyrightVerificationStatus
): string {
  switch (
    value
  ) {
    case "pending":
      return "Pending";

    case "verified":
      return "Verified";

    case "needs_review":
      return "Needs review";
  }
}

export function formatVerificationCheckStatus(
  value:
    CopyrightVerificationCheckStatus
): string {
  switch (
    value
  ) {
    case "passed":
      return "Passed";

    case "review":
      return "Review";

    case "failed":
      return "Failed";
  }
}

export function formatAcquisitionMethod(
  value:
    DiscoveryContentAcquisitionMethod
): string {
  switch (
    value
  ) {
    case "api":
      return "Official API";

    case "rss":
      return "Authorized RSS";

    case "embed":
      return "Official Embed/oEmbed";

    case "agreement":
      return "Publisher Agreement";

    case "link_only":
      return "Link-only";
  }
}