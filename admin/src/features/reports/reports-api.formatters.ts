import type {
  AdminReportAffectedKind,
  AdminReportStatus,
  AdminReportType,
} from "./reports-api.types";

export function formatReportTimestamp(
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

export function formatReportStatus(
  value:
    AdminReportStatus
): string {
  switch (
    value
  ) {
    case "needs_action":
      return "Needs action";

    case "resolved":
      return "Resolved";

    case "dismissed":
      return "Dismissed";
  }
}

export function formatReportType(
  value:
    AdminReportType
): string {
  switch (
    value
  ) {
    case "misleading_content":
      return "Misleading content";

    case "broken_link":
      return "Broken link";

    case "inappropriate_content":
      return "Inappropriate content";

    case "publisher_issue":
      return "Publisher issue";

    case "commercial_report":
      return "Commercial / ad";

    case "copyright":
      return "Copyright";
  }
}

export function formatAffectedKind(
  value:
    AdminReportAffectedKind
): string {
  switch (
    value
  ) {
    case "content":
      return "Content";

    case "source":
      return "Source";

    case "campaign":
      return "Campaign";
  }
}