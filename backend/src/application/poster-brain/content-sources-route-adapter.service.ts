import type {
  PosterBrainContentSourceIngestionRunInput,
  PosterBrainContentSourceIngestionRunResult,
  PosterBrainContentSourceRouteHealth,
  PosterBrainContentSourceRouteItem,
  PosterBrainContentSourceRouteStatus,
  PosterBrainContentSourcesListInput,
  PosterBrainContentSourcesListResult,
  PosterBrainContentSourcesRouteService,
} from "../../routes/poster-brain-content-sources.routes.js";

export interface PosterBrainContentSourceRegistryRow {
  readonly sourceKey: string;
  readonly displayName: string;
  readonly feedUrl: string;
  readonly status: PosterBrainContentSourceRouteStatus;
  readonly health?: PosterBrainContentSourceRouteHealth | null;
  readonly priority?: number | null;
  readonly lastFetchedAt?: string | Date | null;
  readonly nextAllowedAt?: string | Date | null;
}

export interface PosterBrainContentSourceRegistryRepository {
  listSources(
    input: PosterBrainContentSourcesListInput
  ): Promise<readonly PosterBrainContentSourceRegistryRow[]>;
}

export interface PosterBrainContentSourceIngestionRunExecutorInput {
  readonly actorUserId: string;
  readonly sourceKeys?: readonly string[];
  readonly maxSources: number;
  readonly force: boolean;
  readonly requestedAt: string;
}

export interface PosterBrainContentSourceIngestionRunExecutor {
  requestRun(
    input: PosterBrainContentSourceIngestionRunExecutorInput
  ): Promise<PosterBrainContentSourceIngestionRunResult>;
}

export interface PosterBrainContentSourcesRouteAdapterDependencies {
  readonly sourceRegistryRepository: PosterBrainContentSourceRegistryRepository;
  readonly ingestionRunExecutor: PosterBrainContentSourceIngestionRunExecutor;
  readonly now: () => string;
}

function normalizeIsoDate(
  value: string | Date | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const timestamp =
    Date.parse(
      value
    );

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(
    timestamp
  ).toISOString();
}

function normalizePriority(
  value: number | null | undefined
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

function mapSourceRowToRouteItem(
  row: PosterBrainContentSourceRegistryRow
): PosterBrainContentSourceRouteItem {
  return {
    sourceKey:
      row.sourceKey,
    displayName:
      row.displayName,
    feedUrl:
      row.feedUrl,
    status:
      row.status,
    health:
      row.health ?? "unknown",
    priority:
      normalizePriority(
        row.priority
      ),
    lastFetchedAt:
      normalizeIsoDate(
        row.lastFetchedAt
      ),
    nextAllowedAt:
      normalizeIsoDate(
        row.nextAllowedAt
      ),
  };
}

function createRunExecutorInput(input: {
  readonly request: PosterBrainContentSourceIngestionRunInput;
  readonly requestedAt: string;
}): PosterBrainContentSourceIngestionRunExecutorInput {
  const executorInput:
    PosterBrainContentSourceIngestionRunExecutorInput = {
      actorUserId:
        input.request.actorUserId,
      maxSources:
        input.request.maxSources,
      force:
        input.request.force,
      requestedAt:
        input.requestedAt,
    };

  if (input.request.sourceKeys !== undefined) {
    Object.assign(
      executorInput,
      {
        sourceKeys:
          input.request.sourceKeys,
      }
    );
  }

  return executorInput;
}

export function createPosterBrainContentSourcesRouteAdapterService(
  dependencies: PosterBrainContentSourcesRouteAdapterDependencies
): PosterBrainContentSourcesRouteService {
  return {
    async listSources(
      input: PosterBrainContentSourcesListInput
    ): Promise<PosterBrainContentSourcesListResult> {
      const generatedAt =
        dependencies.now();

      const rows =
        await dependencies
          .sourceRegistryRepository
          .listSources(
            input
          );

      const sources =
        rows.map(
          mapSourceRowToRouteItem
        );

      return {
        sources,
        totalSources:
          sources.length,
        generatedAt,
      };
    },

    async requestIngestionRun(
      input: PosterBrainContentSourceIngestionRunInput
    ): Promise<PosterBrainContentSourceIngestionRunResult> {
      const requestedAt =
        dependencies.now();

      return dependencies
        .ingestionRunExecutor
        .requestRun(
          createRunExecutorInput({
            request:
              input,
            requestedAt,
          })
        );
    },
  };
}