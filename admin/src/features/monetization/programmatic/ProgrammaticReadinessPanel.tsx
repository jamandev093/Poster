"use client";

import type {
  ProgrammaticOverviewResponse,
  ProgrammaticSlotMapping,
} from "./programmatic.types";

import styles from "./ProgrammaticReadinessPanel.module.css";

interface ProgrammaticReadinessPanelProps {
  overview:
    ProgrammaticOverviewResponse;
}

interface ProgrammaticReadinessCheck {
  label:
    string;

  value:
    string;

  healthy:
    boolean;

  note:
    string;
}

const APPROVED_SCREENS = [
  "home",
  "search",
  "trending",
] as const;

const APPROVED_FRAMES = [
  "full_width_sponsored_card",
  "three_card_sponsored_frame",
] as const;

const BLOCKED_PLACEMENT_TERMS = [
  "banner",
  "popup",
  "pop_up",
  "interstitial",
  "overlay",
  "floating",
  "vertical",
  "provider_created",
  "provider-created",
];

function hasRules(
  value:
    Record<string, unknown>
): boolean {
  return Object.keys(
    value
  ).length > 0;
}

function hasBlockedPlacementName(
  mapping:
    ProgrammaticSlotMapping
): boolean {
  const normalized =
    mapping.placement.toLowerCase();

  return BLOCKED_PLACEMENT_TERMS.some(
    term =>
      normalized.includes(
        term
      )
  );
}

function getEnabledMappings(
  overview:
    ProgrammaticOverviewResponse
): ProgrammaticSlotMapping[] {
  return overview.slotMappings.filter(
    mapping =>
      mapping.status === "enabled"
  );
}

function countCoveredScreens(
  mappings:
    ProgrammaticSlotMapping[]
): number {
  return APPROVED_SCREENS.filter(
    screen =>
      mappings.some(
        mapping =>
          mapping.screen === screen
      )
  ).length;
}

function countCoveredFrames(
  mappings:
    ProgrammaticSlotMapping[]
): number {
  return APPROVED_FRAMES.filter(
    frame =>
      mappings.some(
        mapping =>
          mapping.frame === frame
      )
  ).length;
}

function getReadinessChecks(
  overview:
    ProgrammaticOverviewResponse
): ProgrammaticReadinessCheck[] {
  const enabledProviders =
    overview.providers.filter(
      provider =>
        provider.status === "enabled"
    );

  const healthyEnabledProviders =
    enabledProviders.filter(
      provider =>
        provider.healthStatus === "healthy"
    );

  const enabledProviderIds =
    new Set(
      enabledProviders.map(
        provider =>
          provider.id
      )
    );

  const enabledMappings =
    getEnabledMappings(
      overview
    );

  const mappingsUsingEnabledProviders =
    enabledMappings.filter(
      mapping =>
        enabledProviderIds.has(
          mapping.providerId
        )
    );

  const mappingsUsingBlockedNames =
    enabledMappings.filter(
      hasBlockedPlacementName
    );

  const mappingsMissingSafetyRules =
    enabledMappings.filter(
      mapping =>
        !hasRules(
          mapping.safetyRules
        )
    );

  const mappingsMissingFallbackRules =
    enabledMappings.filter(
      mapping =>
        !hasRules(
          mapping.fallbackRules
        )
    );

  const screenCoverage =
    countCoveredScreens(
      enabledMappings
    );

  const frameCoverage =
    countCoveredFrames(
      enabledMappings
    );

  return [
    {
      label:
        "Provider registry",

      value:
        `${overview.providers.length} provider${
          overview.providers.length === 1
            ? ""
            : "s"
        }`,

      healthy:
        overview.providers.length > 0,

      note:
        "Providers are loaded from the protected Backend registry, not local browser state.",
    },
    {
      label:
        "Healthy enabled providers",

      value:
        `${healthyEnabledProviders.length}/${enabledProviders.length} healthy`,

      healthy:
        enabledProviders.length > 0 &&
        healthyEnabledProviders.length === enabledProviders.length,

      note:
        "Enabled providers should be healthy before they fill Poster-approved slots.",
    },
    {
      label:
        "Enabled slot mappings",

      value:
        `${enabledMappings.length} enabled`,

      healthy:
        enabledMappings.length > 0,

      note:
        "Programmatic can run only through enabled Poster-controlled slot mappings.",
    },
    {
      label:
        "Provider linkage",

      value:
        `${mappingsUsingEnabledProviders.length}/${enabledMappings.length} linked`,

      healthy:
        enabledMappings.length > 0 &&
        mappingsUsingEnabledProviders.length === enabledMappings.length,

      note:
        "Every enabled slot mapping should point to an enabled provider.",
    },
    {
      label:
        "Approved screen coverage",

      value:
        `${screenCoverage}/3 screens`,

      healthy:
        screenCoverage > 0,

      note:
        "Only Home, Search, and Trending are approved programmatic screens.",
    },
    {
      label:
        "Approved frame coverage",

      value:
        `${frameCoverage}/2 frames`,

      healthy:
        frameCoverage > 0,

      note:
        "Only the full-width sponsored card and three-card sponsored frame are approved.",
    },
    {
      label:
        "Blocked format guard",

      value:
        mappingsUsingBlockedNames.length === 0
          ? "No blocked names"
          : `${mappingsUsingBlockedNames.length} review`,

      healthy:
        mappingsUsingBlockedNames.length === 0,

      note:
        "Banner, popup, interstitial, overlay, floating, vertical, and provider-created placements remain prohibited.",
    },
    {
      label:
        "Safety rules",

      value:
        mappingsMissingSafetyRules.length === 0
          ? "Configured"
          : `${mappingsMissingSafetyRules.length} default/empty`,

      healthy:
        enabledMappings.length === 0 ||
        mappingsMissingSafetyRules.length === 0,

      note:
        "Enabled mappings should carry explicit category/domain/safety constraints where applicable.",
    },
    {
      label:
        "Fallback rules",

      value:
        mappingsMissingFallbackRules.length === 0
          ? "Configured"
          : `${mappingsMissingFallbackRules.length} default/empty`,

      healthy:
        enabledMappings.length === 0 ||
        mappingsMissingFallbackRules.length === 0,

      note:
        "Fallback behavior should be explicit for no-fill, unhealthy provider, or paused mapping states.",
    },
  ];
}

export default function ProgrammaticReadinessPanel(
  props:
    ProgrammaticReadinessPanelProps
) {
  const checks =
    getReadinessChecks(
      props.overview
    );

  const attentionCount =
    checks.filter(
      check =>
        !check.healthy
    ).length;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h3>
            Programmatic readiness
          </h3>

          <p>
            Provider health, enabled mappings, approved frames, screen coverage,
            blocked-format guardrails, safety rules, and fallback readiness.
          </p>
        </div>

        <span
          className={
            attentionCount === 0
              ? styles.readyBadge
              : styles.attentionBadge
          }
        >
          {attentionCount === 0
            ? "Ready"
            : `${attentionCount} checks need attention`}
        </span>
      </header>

      <div className={styles.grid}>
        {checks.map(
          check => (
            <article
              key={check.label}
              className={
                check.healthy
                  ? styles.itemReady
                  : styles.itemAttention
              }
            >
              <span>
                {check.label}
              </span>

              <strong>
                {check.value}
              </strong>

              <p>
                {check.note}
              </p>
            </article>
          )
        )}
      </div>
    </section>
  );
}