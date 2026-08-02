import type {
  ProgrammaticOverviewResponse,
} from "./programmatic.types";

export function countProgrammaticOverview(
  overview:
    ProgrammaticOverviewResponse
) {
  return {
    providers:
      overview.providers.length,

    enabledProviders:
      overview.providers.filter(
        provider =>
          provider.status ===
          "enabled"
      ).length,

    slotMappings:
      overview.slotMappings.length,

    enabledSlotMappings:
      overview.slotMappings.filter(
        mapping =>
          mapping.status ===
          "enabled"
      ).length,
  };
}