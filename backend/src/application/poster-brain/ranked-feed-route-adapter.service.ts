import {
  createPosterBrainRankedFeedAssemblyService,
  type PosterBrainRankedFeedAssemblyService,
} from "./ranked-feed-assembly.service.js";

import type {
  PosterBrainRankedDiscoveryQueryInput,
  PosterBrainRankedDiscoveryQueryRepository,
} from "./ranked-discovery-query.repository.js";

import type {
  PosterBrainCandidateScore,
  PosterBrainDiscoveryContentRankingRow,
  PosterBrainRankingPolicy,
  PosterBrainRankingSurface,
  PosterBrainUserInterestProfile,
} from "../../domains/poster-brain/index.js";

export interface PosterBrainRankedFeedRouteAdapterInput {
  readonly actorUserId: string;
  readonly surface: PosterBrainRankingSurface;
  readonly limit: number;
  readonly candidatePoolLimit?: number;
  readonly searchQuery?: string;
  readonly languageCode?: string;
  readonly regionCode?: string;
  readonly category?: string;
}

export interface PosterBrainRankedFeedRouteAdapterItem {
  readonly id: string;
  readonly title: string;
  readonly originalUrl: string;
  readonly publisherName: string;
  readonly score: number;
  readonly publishedAt: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface PosterBrainRankedFeedRouteAdapterResult {
  readonly items: readonly PosterBrainRankedFeedRouteAdapterItem[];
  readonly totalItems: number;
  readonly generatedAt: string;
}

export interface PosterBrainRankedFeedRouteAdapterService {
  readRankedFeed(
    input: PosterBrainRankedFeedRouteAdapterInput
  ): Promise<PosterBrainRankedFeedRouteAdapterResult>;
}

export interface PosterBrainRankedFeedRouteAdapterPolicyOptions {
  readonly freshnessHalfLifeHours?: number;
  readonly minimumQualityScore?: number;
  readonly reportPenaltyWeight?: number;
  readonly hidePenaltyWeight?: number;
}

export interface PosterBrainRankedFeedUserInterestProfileResolver {
  resolveUserInterestProfile(input: {
    readonly actorUserId: string;
  }): Promise<PosterBrainUserInterestProfile | null>;
}

export interface PosterBrainRankedFeedRouteAdapterDependencies {
  readonly rankedDiscoveryQueryRepository:
    PosterBrainRankedDiscoveryQueryRepository;
  readonly now: () => string;
  readonly policy?: PosterBrainRankedFeedRouteAdapterPolicyOptions;
  readonly userInterestProfileResolver?:
    PosterBrainRankedFeedUserInterestProfileResolver;
  readonly rankedFeedAssemblyService?:
    PosterBrainRankedFeedAssemblyService;
}

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return 20;
  }

  return Math.min(
    50,
    Math.max(
      1,
      Math.floor(value)
    )
  );
}

function createCandidatePoolLimit(input: {
  readonly limit: number;
  readonly candidatePoolLimit?: number;
}): number {
  if (
    input.candidatePoolLimit !== undefined &&
    Number.isFinite(input.candidatePoolLimit)
  ) {
    return Math.max(
      input.limit,
      Math.min(
        200,
        Math.floor(input.candidatePoolLimit)
      )
    );
  }

  return Math.min(
    200,
    Math.max(
      input.limit,
      input.limit * 3
    )
  );
}

function createPolicy(input: {
  readonly now: string;
  readonly options?: PosterBrainRankedFeedRouteAdapterPolicyOptions;
}): PosterBrainRankingPolicy {
  return {
    now:
      input.now,
    freshnessHalfLifeHours:
      input.options?.freshnessHalfLifeHours ?? 72,
    minimumQualityScore:
      input.options?.minimumQualityScore ?? 0.2,
    reportPenaltyWeight:
      input.options?.reportPenaltyWeight ?? 0.12,
    hidePenaltyWeight:
      input.options?.hidePenaltyWeight ?? 0.16,
  };
}

function createRepositoryQuery(
  input: PosterBrainRankedFeedRouteAdapterInput
): PosterBrainRankedDiscoveryQueryInput {
  const limit =
    normalizeLimit(input.limit);

  const poolLimit =
    input.candidatePoolLimit === undefined
      ? createCandidatePoolLimit({
          limit,
        })
      : createCandidatePoolLimit({
          limit,
          candidatePoolLimit:
            input.candidatePoolLimit,
        });

  const query:
    PosterBrainRankedDiscoveryQueryInput = {
      surface:
        input.surface,
      limit:
        poolLimit,
    };

  if (input.searchQuery !== undefined) {
    Object.assign(
      query,
      {
        searchQuery:
          input.searchQuery,
      }
    );
  }

  if (input.languageCode !== undefined) {
    Object.assign(
      query,
      {
        languageCode:
          input.languageCode,
      }
    );
  }

  if (input.regionCode !== undefined) {
    Object.assign(
      query,
      {
        regionCode:
          input.regionCode,
      }
    );
  }

  if (input.category !== undefined) {
    Object.assign(
      query,
      {
        category:
          input.category,
      }
    );
  }

  return query;
}

function normalizePublishedAt(
  value: string | Date | null
): string | null {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const timestamp =
    Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function getOriginalUrl(
  row: PosterBrainDiscoveryContentRankingRow
): string | null {
  const originalUrl =
    row.originalUrl?.trim();

  return originalUrl ? originalUrl : null;
}

function createRowByExternalContentId(
  rows: readonly PosterBrainDiscoveryContentRankingRow[]
): ReadonlyMap<string, PosterBrainDiscoveryContentRankingRow> {
  return new Map(
    rows.map(row => [
      row.externalContentId,
      row,
    ])
  );
}

function createRouteScore(input: {
  readonly surface: PosterBrainRankingSurface;
  readonly score: PosterBrainCandidateScore;
}): number {
  if (input.surface === "trending") {
    return input.score.trendingScore;
  }

  return input.score.rankingScore;
}

function createRouteItem(input: {
  readonly surface: PosterBrainRankingSurface;
  readonly row: PosterBrainDiscoveryContentRankingRow;
  readonly score: PosterBrainCandidateScore;
}): PosterBrainRankedFeedRouteAdapterItem | null {
  const originalUrl =
    getOriginalUrl(input.row);

  if (originalUrl === null) {
    return null;
  }

  return {
    id:
      input.score.externalContentId,
    title:
      input.row.title,
    originalUrl,
    publisherName:
      input.row.publisherName,
    score:
      createRouteScore({
        surface:
          input.surface,
        score:
          input.score,
      }),
    publishedAt:
      normalizePublishedAt(input.row.publishedAt),
    metadata: {
      rankingScore:
        input.score.rankingScore,
      trendingScore:
        input.score.trendingScore,
      freshnessScore:
        input.score.freshnessScore,
      engagementScore:
        input.score.engagementScore,
      interestMatchScore:
        input.score.interestMatchScore,
      qualityScore:
        input.score.qualityScore,
      sourcePriorityScore:
        input.score.sourcePriorityScore,
    },
  };
}

export function createPosterBrainRankedFeedRouteAdapterService(
  dependencies: PosterBrainRankedFeedRouteAdapterDependencies
): PosterBrainRankedFeedRouteAdapterService {
  const rankedFeedAssemblyService =
    dependencies.rankedFeedAssemblyService ??
    createPosterBrainRankedFeedAssemblyService();

  return {
    async readRankedFeed(input) {
      const generatedAt =
        dependencies.now();

      const rows =
        await dependencies
          .rankedDiscoveryQueryRepository
          .listRankingRows(
            createRepositoryQuery(input)
          );

      const userProfile =
        dependencies.userInterestProfileResolver
          ? await dependencies
              .userInterestProfileResolver
              .resolveUserInterestProfile({
                actorUserId:
                  input.actorUserId,
              })
          : null;

      const policy =
        dependencies.policy === undefined
          ? createPolicy({
              now:
                generatedAt,
            })
          : createPolicy({
              now:
                generatedAt,
              options:
                dependencies.policy,
            });

      const scores =
        rankedFeedAssemblyService.assembleRankedFeed({
          rows,
          surface:
            input.surface,
          policy,
          userProfile,
          limit:
            normalizeLimit(input.limit),
        });

      const rowsByExternalContentId =
        createRowByExternalContentId(
          rows
        );

      const items =
        scores
          .map(score => {
            const row =
              rowsByExternalContentId.get(
                score.externalContentId
              );

            if (!row) {
              return null;
            }

            return createRouteItem({
              surface:
                input.surface,
              row,
              score,
            });
          })
          .filter(
            (
              item
            ): item is PosterBrainRankedFeedRouteAdapterItem =>
              item !== null
          );

      return {
        items,
        totalItems:
          items.length,
        generatedAt,
      };
    },
  };
}