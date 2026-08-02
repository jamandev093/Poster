import type {
  ProgrammaticApprovedFrame,
  ProgrammaticApprovedScreen,
  ProgrammaticMappingStatus,
  ProgrammaticProviderHealthStatus,
  ProgrammaticProviderStatus,
} from "./programmatic.types";

export function formatProgrammaticProviderStatus(
  status:
    ProgrammaticProviderStatus
): string {
  switch (status) {
    case "enabled":
      return "Enabled";

    case "paused":
      return "Paused";

    case "disabled":
      return "Disabled";
  }
}

export function formatProgrammaticHealthStatus(
  status:
    ProgrammaticProviderHealthStatus
): string {
  switch (status) {
    case "healthy":
      return "Healthy";

    case "degraded":
      return "Degraded";

    case "unhealthy":
      return "Unhealthy";

    case "unknown":
      return "Unknown";
  }
}

export function formatProgrammaticMappingStatus(
  status:
    ProgrammaticMappingStatus
): string {
  switch (status) {
    case "enabled":
      return "Enabled";

    case "paused":
      return "Paused";

    case "disabled":
      return "Disabled";
  }
}

export function formatProgrammaticScreen(
  screen:
    ProgrammaticApprovedScreen
): string {
  switch (screen) {
    case "home":
      return "Home";

    case "search":
      return "Search";

    case "trending":
      return "Trending";
  }
}

export function formatProgrammaticFrame(
  frame:
    ProgrammaticApprovedFrame
): string {
  switch (frame) {
    case "full_width_sponsored_card":
      return "Full-width sponsored card";

    case "three_card_sponsored_frame":
      return "Three-card sponsored frame";
  }
}

export function formatProgrammaticTimestamp(
  value:
    string
): string {
  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
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