import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ContentVisibilityContext,
  ContentVisibilityDecision,
  evaluateContentVisibility,
} from "../data/contentVisibilityPolicy";

import {
  findInterestTopicByName,
  getInterestTopicById,
  getSearchableInterestTopics,
  resolveInterestTopic,
} from "../data/interests";

type CanonicalTopic =
  ReturnType<
    typeof getSearchableInterestTopics
  >[number];

export type TaxonomyLifecycleState =
  | "discovered"
  | "observed"
  | "validated"
  | "promoted"
  | "merged"
  | "quarantined"
  | "deprecated"
  | "blocked";

export interface TaxonomyEvidence {
  observationCount: number;

  engagementCount: number;

  sourceIds: string[];

  trustedSourceIds: string[];

  sessionIds: string[];

  parentConfidence: number;

  semanticDistinctiveness: number;

  duplicateConfidence: number;

  promotionScore: number;

  firstSeenAt: string;

  lastSeenAt: string;
}

export interface EvolvingTopicRecord {
  id: string;

  slug: string;

  name: string;

  normalizedName: string;

  aliases: string[];

  lifecycle:
    TaxonomyLifecycleState;

  visibilityDecision:
    ContentVisibilityDecision;

  canonicalTopicId?: string;

  parentTopicIds: string[];

  mergedIntoTopicId?: string;

  evidence:
    TaxonomyEvidence;

  createdAt: string;

  updatedAt: string;
}

export interface ObserveTopicOptions {
  visibilityContext?:
    ContentVisibilityContext;

  sourceId?: string;

  trustedSource?: boolean;

  engaged?: boolean;

  sessionId?: string;

  now?: Date;
}

export interface TopicObservationResult {
  type:
    | "canonical"
    | "dynamic"
    | "blocked";

  canonicalTopic?:
    CanonicalTopic;

  dynamicTopic?:
    EvolvingTopicRecord;

  visibilityDecision:
    ContentVisibilityDecision;
}

interface CanonicalMatch {
  topic:
    CanonicalTopic;

  confidence: number;
}

const STORAGE_KEY =
  "@poster/evolving_taxonomy_v1";

const MAX_SIGNAL_IDS = 200;

const EXACT_MERGE_CONFIDENCE =
  0.96;

const VALIDATION_SCORE =
  0.5;

const PROMOTION_SCORE =
  0.72;

const MIN_VALIDATION_OBSERVATIONS =
  3;

const MIN_PROMOTION_OBSERVATIONS =
  8;

const MIN_PROMOTION_SOURCES =
  2;

let mutationQueue:
  Promise<void> =
  Promise.resolve();

function normalizeText(
  value?: string
): string {
  return (
    value
      ?.normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase() ?? ""
  );
}

function cleanText(
  value: string
): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

function createSlug(
  value: string
): string {
  return normalizeText(value)
    .replace(/&/g, " and ")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(0, 80);
}

function createHash(
  value: string
): string {
  let hash =
    2166136261;

  for (
    let index = 0;
    index <
    value.length;
    index += 1
  ) {
    hash ^=
      value.charCodeAt(
        index
      );

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return (
    hash >>> 0
  ).toString(36);
}

function createTopicId(
  normalizedName: string
): string {
  return [
    "dynamic",
    createSlug(
      normalizedName
    ) || "topic",
    createHash(
      normalizedName
    ),
  ].join("-");
}

function uniqueValues(
  values:
    readonly string[]
): string[] {
  const seen =
    new Set<string>();

  const result:
    string[] = [];

  values.forEach(
    (value) => {
      const cleanValue =
        cleanText(value);

      const key =
        normalizeText(
          cleanValue
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return;
      }

      seen.add(key);

      result.push(
        cleanValue
      );
    }
  );

  return result;
}

function boundedValues(
  values:
    readonly string[]
): string[] {
  return uniqueValues(
    values
  ).slice(
    -MAX_SIGNAL_IDS
  );
}

function tokenize(
  value: string
): string[] {
  return uniqueValues(
    normalizeText(value)
      .split(
        /[^a-z0-9]+/
      )
      .filter(
        (token) =>
          token.length >= 2
      )
  );
}

function similarity(
  first: string,
  second: string
): number {
  const firstValue =
    normalizeText(first);

  const secondValue =
    normalizeText(second);

  if (
    !firstValue ||
    !secondValue
  ) {
    return 0;
  }

  if (
    firstValue ===
    secondValue
  ) {
    return 1;
  }

  const firstTokens =
    new Set(
      tokenize(
        firstValue
      )
    );

  const secondTokens =
    new Set(
      tokenize(
        secondValue
      )
    );

  if (
    firstTokens.size === 0 ||
    secondTokens.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  firstTokens.forEach(
    (token) => {
      if (
        secondTokens.has(
          token
        )
      ) {
        intersection += 1;
      }
    }
  );

  const union =
    new Set([
      ...firstTokens,
      ...secondTokens,
    ]).size;

  const jaccard =
    union === 0
      ? 0
      : intersection /
        union;

  const containment =
    firstValue.includes(
      secondValue
    ) ||
    secondValue.includes(
      firstValue
    )
      ? 0.2
      : 0;

  return Math.min(
    1,
    jaccard +
      containment
  );
}

function getCanonicalValues(
  topic:
    CanonicalTopic
): string[] {
  const resolved =
    resolveInterestTopic(
      topic
    );

  return uniqueValues([
    topic.id,
    topic.slug,
    topic.name,
    topic.description,

    ...(topic.aliases ??
      []),

    ...(topic.searchKeywords ??
      []),

    resolved?.category.name ??
      "",

    resolved?.domain.name ??
      "",
  ]);
}

function findExactCanonicalTopic(
  value: string
):
  | CanonicalTopic
  | undefined {
  const cleanValue =
    cleanText(value);

  return (
    getInterestTopicById(
      cleanValue
    ) ??
    findInterestTopicByName(
      cleanValue
    )
  );
}

function findBestCanonicalMatch(
  value: string
):
  | CanonicalMatch
  | undefined {
  let best:
    CanonicalMatch
    | undefined;

  getSearchableInterestTopics()
    .forEach(
      (topic) => {
        const confidence =
          Math.max(
            ...getCanonicalValues(
              topic
            ).map(
              (
                candidate
              ) =>
                similarity(
                  value,
                  candidate
                )
            ),
            0
          );

        if (
          !best ||
          confidence >
            best.confidence
        ) {
          best = {
            topic,

            confidence,
          };
        }
      }
    );

  return best;
}

function inferParentTopics(
  value: string,
  limit = 3
): CanonicalMatch[] {
  return getSearchableInterestTopics()
    .map(
      (topic) => ({
        topic,

        confidence:
          Math.max(
            ...getCanonicalValues(
              topic
            ).map(
              (
                candidate
              ) =>
                similarity(
                  value,
                  candidate
                )
            ),
            0
          ),
      })
    )
    .filter(
      (match) =>
        match.confidence >=
        0.2
    )
    .sort(
      (
        first,
        second
      ) =>
        second.confidence -
        first.confidence
    )
    .slice(
      0,
      limit
    );
}

function clamp(
  value: number
): number {
  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function calculatePromotionScore(
  evidence:
    TaxonomyEvidence
): number {
  const demandScore =
    clamp(
      evidence
        .observationCount /
        20
    );

  const engagementScore =
    evidence
      .observationCount ===
    0
      ? 0
      : clamp(
          evidence
            .engagementCount /
            evidence
              .observationCount
        );

  const sourceDiversity =
    clamp(
      evidence
        .sourceIds.length /
        8
    );

  const trustedSourceScore =
    evidence
      .sourceIds.length ===
    0
      ? 0
      : clamp(
          evidence
            .trustedSourceIds
            .length /
            evidence
              .sourceIds.length
        );

  const sessionDiversity =
    clamp(
      evidence
        .sessionIds.length /
        10
    );

  return clamp(
    demandScore *
      0.25 +

      engagementScore *
        0.15 +

      sourceDiversity *
        0.15 +

      trustedSourceScore *
        0.15 +

      sessionDiversity *
        0.1 +

      evidence
        .parentConfidence *
        0.1 +

      evidence
        .semanticDistinctiveness *
        0.1
  );
}

function determineLifecycle(
  record:
    EvolvingTopicRecord
): TaxonomyLifecycleState {
  if (
    record.visibilityDecision ===
    "block"
  ) {
    return "blocked";
  }

  if (
    record.visibilityDecision ===
      "review" ||
    record.visibilityDecision ===
      "restrict"
  ) {
    return "quarantined";
  }

  if (
    record.mergedIntoTopicId
  ) {
    return "merged";
  }

  const evidence =
    record.evidence;

  if (
    evidence.promotionScore >=
      PROMOTION_SCORE &&
    evidence.observationCount >=
      MIN_PROMOTION_OBSERVATIONS &&
    evidence.sourceIds.length >=
      MIN_PROMOTION_SOURCES
  ) {
    return "promoted";
  }

  if (
    evidence.promotionScore >=
      VALIDATION_SCORE &&
    evidence.observationCount >=
      MIN_VALIDATION_OBSERVATIONS
  ) {
    return "validated";
  }

  if (
    evidence.observationCount >=
    2
  ) {
    return "observed";
  }

  return "discovered";
}

function parseRegistry(
  value: string | null
): EvolvingTopicRecord[] {
  if (!value) {
    return [];
  }

  try {
    const parsed:
      unknown =
      JSON.parse(value);

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }

    return parsed.filter(
      (
        item
      ): item is EvolvingTopicRecord =>
        typeof item ===
          "object" &&
        item !== null &&
        typeof (
          item as
            Partial<EvolvingTopicRecord>
        ).id ===
          "string"
    );
  } catch {
    return [];
  }
}

async function readRegistry(): Promise<
  EvolvingTopicRecord[]
> {
  try {
    const value =
      await AsyncStorage.getItem(
        STORAGE_KEY
      );

    return parseRegistry(
      value
    );
  } catch {
    return [];
  }
}

function writeRegistry(
  registry:
    EvolvingTopicRecord[]
): Promise<void> {
  const operation =
    mutationQueue.then(
      async () => {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            registry
          )
        );
      }
    );

  mutationQueue =
    operation.catch(
      () => undefined
    );

  return operation;
}

function findDynamicDuplicate(
  registry:
    readonly EvolvingTopicRecord[],
  normalizedName: string,
  excludedId?: string
):
  | EvolvingTopicRecord
  | undefined {
  return registry
    .filter(
      (topic) =>
        topic.id !==
          excludedId &&
        topic.lifecycle !==
          "deprecated" &&
        topic.lifecycle !==
          "blocked"
    )
    .map(
      (topic) => ({
        topic,

        confidence:
          Math.max(
            similarity(
              normalizedName,
              topic.normalizedName
            ),

            ...topic.aliases.map(
              (alias) =>
                similarity(
                  normalizedName,
                  alias
                )
            )
          ),
      })
    )
    .filter(
      (candidate) =>
        candidate.confidence >=
        EXACT_MERGE_CONFIDENCE
    )
    .sort(
      (
        first,
        second
      ) =>
        second.confidence -
        first.confidence
    )[0]?.topic;
}

function createInitialEvidence(
  now: string
): TaxonomyEvidence {
  return {
    observationCount: 0,

    engagementCount: 0,

    sourceIds: [],

    trustedSourceIds: [],

    sessionIds: [],

    parentConfidence: 0,

    semanticDistinctiveness: 1,

    duplicateConfidence: 0,

    promotionScore: 0,

    firstSeenAt: now,

    lastSeenAt: now,
  };
}

export default class TaxonomyEvolutionService {
  static async observeTopic(
    query: string,
    options:
      ObserveTopicOptions = {}
  ): Promise<TopicObservationResult> {
    const name =
      cleanText(query);

    const normalizedName =
      normalizeText(query);

    const visibility =
      evaluateContentVisibility(
        name,
        options.visibilityContext
      );

    const exactCanonical =
      findExactCanonicalTopic(
        name
      );

    if (
      exactCanonical &&
      (
        visibility.decision ===
          "allow" ||
        visibility.decision ===
          "allow_with_context"
      )
    ) {
      return {
        type:
          "canonical",

        canonicalTopic:
          exactCanonical,

        visibilityDecision:
          visibility.decision,
      };
    }

    if (
      !normalizedName ||
      visibility.decision ===
        "block"
    ) {
      return {
        type:
          "blocked",

        visibilityDecision:
          visibility.decision,
      };
    }

    const now =
      (
        options.now ??
        new Date()
      ).toISOString();

    const registry =
      await readRegistry();

    let record =
      registry.find(
        (topic) =>
          topic.normalizedName ===
          normalizedName
      );

    const bestCanonical =
      findBestCanonicalMatch(
        name
      );

    const parentMatches =
      inferParentTopics(
        name
      );

    if (!record) {
      const duplicate =
        findDynamicDuplicate(
          registry,
          normalizedName
        );

      if (duplicate) {
        duplicate.aliases =
          uniqueValues([
            ...duplicate.aliases,
            name,
          ]);

        duplicate.updatedAt =
          now;

        duplicate.evidence
          .observationCount +=
          1;

        duplicate.evidence
          .lastSeenAt =
          now;

        duplicate.evidence
          .promotionScore =
          calculatePromotionScore(
            duplicate.evidence
          );

        duplicate.lifecycle =
          determineLifecycle(
            duplicate
          );

        await writeRegistry(
          registry
        );

        return {
          type:
            "dynamic",

          dynamicTopic:
            duplicate,

          visibilityDecision:
            visibility.decision,
        };
      }

      const evidence =
        createInitialEvidence(
          now
        );

      record = {
        id:
          createTopicId(
            normalizedName
          ),

        slug:
          createSlug(
            normalizedName
          ),

        name,

        normalizedName,

        aliases: [],

        lifecycle:
          "discovered",

        visibilityDecision:
          visibility.decision,

        parentTopicIds:
          parentMatches.map(
            (match) =>
              match.topic.id
          ),

        evidence,

        createdAt:
          now,

        updatedAt:
          now,
      };

      registry.push(
        record
      );
    }

    record.visibilityDecision =
      visibility.decision;

    record.updatedAt =
      now;

    record.evidence
      .observationCount +=
      1;

    record.evidence
      .lastSeenAt =
      now;

    if (
      options.engaged
    ) {
      record.evidence
        .engagementCount +=
        1;
    }

    if (
      options.sourceId
    ) {
      record.evidence.sourceIds =
        boundedValues([
          ...record.evidence
            .sourceIds,

          options.sourceId,
        ]);

      if (
        options.trustedSource
      ) {
        record.evidence
          .trustedSourceIds =
          boundedValues([
            ...record.evidence
              .trustedSourceIds,

            options.sourceId,
          ]);
      }
    }

    if (
      options.sessionId
    ) {
      record.evidence.sessionIds =
        boundedValues([
          ...record.evidence
            .sessionIds,

          options.sessionId,
        ]);
    }

    const parentConfidence =
      parentMatches[0]
        ?.confidence ?? 0;

    record.evidence
      .parentConfidence =
      parentConfidence;

    record.parentTopicIds =
      parentMatches.map(
        (match) =>
          match.topic.id
      );

    if (bestCanonical) {
      record.evidence
        .duplicateConfidence =
        bestCanonical
          .confidence;

      record.evidence
        .semanticDistinctiveness =
        clamp(
          1 -
            bestCanonical
              .confidence
        );

      if (
        bestCanonical
          .confidence >=
        EXACT_MERGE_CONFIDENCE
      ) {
        record.canonicalTopicId =
          bestCanonical
            .topic.id;

        record.mergedIntoTopicId =
          bestCanonical
            .topic.id;
      }
    }

    record.evidence
      .promotionScore =
      calculatePromotionScore(
        record.evidence
      );

    record.lifecycle =
      determineLifecycle(
        record
      );

    await writeRegistry(
      registry
    );

    return {
      type:
        "dynamic",

      dynamicTopic:
        record,

      visibilityDecision:
        visibility.decision,
    };
  }

  static async getAllTopics(): Promise<
    EvolvingTopicRecord[]
  > {
    await mutationQueue;

    return readRegistry();
  }

  static async getPromotedTopics(): Promise<
    EvolvingTopicRecord[]
  > {
    const registry =
      await TaxonomyEvolutionService
        .getAllTopics();

    return registry.filter(
      (topic) =>
        topic.lifecycle ===
        "promoted"
    );
  }

  static async getActiveTopics(): Promise<
    EvolvingTopicRecord[]
  > {
    const registry =
      await TaxonomyEvolutionService
        .getAllTopics();

    return registry.filter(
      (topic) =>
        topic.lifecycle !==
          "blocked" &&
        topic.lifecycle !==
          "deprecated" &&
        topic.lifecycle !==
          "merged"
    );
  }

  static async mergeTopic(
    sourceTopicId: string,
    targetTopicId: string
  ): Promise<void> {
    const registry =
      await readRegistry();

    const source =
      registry.find(
        (topic) =>
          topic.id ===
          sourceTopicId
      );

    if (!source) {
      return;
    }

    source.lifecycle =
      "merged";

    source.mergedIntoTopicId =
      targetTopicId;

    source.updatedAt =
      new Date()
        .toISOString();

    await writeRegistry(
      registry
    );
  }

  static async deprecateTopic(
    topicId: string
  ): Promise<void> {
    const registry =
      await readRegistry();

    const topic =
      registry.find(
        (item) =>
          item.id ===
          topicId
      );

    if (!topic) {
      return;
    }

    topic.lifecycle =
      "deprecated";

    topic.updatedAt =
      new Date()
        .toISOString();

    await writeRegistry(
      registry
    );
  }

  static async runMaintenance(
    now =
      new Date()
  ): Promise<void> {
    const registry =
      await readRegistry();

    const nowTimestamp =
      now.getTime();

    let changed =
      false;

    registry.forEach(
      (topic) => {
        if (
          topic.lifecycle ===
            "blocked" ||
          topic.lifecycle ===
            "merged" ||
          topic.lifecycle ===
            "deprecated"
        ) {
          return;
        }

        const lastSeen =
          Date.parse(
            topic.evidence
              .lastSeenAt
          );

        if (
          Number.isNaN(
            lastSeen
          )
        ) {
          return;
        }

        const inactiveDays =
          (
            nowTimestamp -
            lastSeen
          ) /
          86_400_000;

        const shouldRetire =
          topic.lifecycle !==
            "promoted" &&
          inactiveDays >=
            180 &&
          topic.evidence
            .observationCount <
            MIN_PROMOTION_OBSERVATIONS;

        if (
          shouldRetire
        ) {
          topic.lifecycle =
            "deprecated";

          topic.updatedAt =
            now.toISOString();

          changed =
            true;
        }
      }
    );

    if (changed) {
      await writeRegistry(
        registry
      );
    }
  }

  static async clearLocalRegistry(): Promise<void> {
    await mutationQueue;

    await AsyncStorage.removeItem(
      STORAGE_KEY
    );
  }
}