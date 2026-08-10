import type {
  PosterBrainAiLearningDatasetEvent,
} from "./ai-learning-dataset.types.js";

import type {
  PosterBrainAiLearningDatasetReadySnapshot,
  PosterBrainAiLearningDatasetSnapshotReadRepository,
} from "./ai-learning-dataset-snapshot-read.repository.js";

import type {
  PosterBrainAiLearningDatasetHandoffFetch,
} from "./ai-learning-dataset-handoff.service.js";

import type {
  CreatePosterBrainAiModelCandidateInput,
  PosterBrainAiModelRegistryRepository,
  PosterBrainAiModelVersion,
} from "./ai-model-registry.repository.js";

const DEFAULT_PAGE_SIZE =
  5000;

const MAX_PAGE_SIZE =
  5000;

const MINIMUM_TRAINING_EVENTS =
  10000;

const NDJSON_CONTENT_TYPE =
  "application/x-ndjson";

const SHA256_PATTERN =
  /^sha256:[0-9a-f]{64}$/i;

const TRAINED_MODEL_TYPE =
  "hashed_logistic_engagement_v1";

export type PosterBrainAiTrainingCandidateErrorCode =
  | "snapshot_not_ready"
  | "snapshot_invalid"
  | "transport_failed"
  | "transport_timeout"
  | "remote_rejected"
  | "response_invalid"
  | "candidate_persistence_failed";

export class PosterBrainAiTrainingCandidateError
  extends Error
{
  readonly code:
    PosterBrainAiTrainingCandidateErrorCode;

  readonly status:
    number |
    null;

  constructor(input: {
    readonly code:
      PosterBrainAiTrainingCandidateErrorCode;

    readonly message:
      string;

    readonly status?:
      number;
  }) {
    super(
      input.message
    );

    this.name =
      "PosterBrainAiTrainingCandidateError";

    this.code =
      input.code;

    this.status =
      input.status ??
      null;
  }
}

export interface PosterBrainAiTrainingCandidateResult {
  readonly status:
    "trained" |
    "not_trainable";

  readonly accepted:
    true;

  readonly datasetId:
    string;

  readonly schemaVersion:
    1;

  readonly datasetChecksum:
    string;

  readonly sourceCutoffAt:
    string;

  readonly pageCount:
    number;

  readonly eventCount:
    number;

  readonly contentCount:
    number;

  readonly labeledEventCount:
    number;

  readonly positiveEventCount:
    number;

  readonly negativeEventCount:
    number;

  readonly skippedEventCount:
    number;

  readonly reason:
    string;

  readonly trainingAttempted:
    true;

  readonly candidateCreated:
    boolean;

  readonly candidatePersisted:
    boolean;

  readonly candidate:
    PosterBrainAiModelVersion |
    null;

  readonly promoted:
    false;
}

export interface PosterBrainAiTrainingCandidateService {
  trainReadySnapshot(
    datasetId:
      string
  ): Promise<
    PosterBrainAiTrainingCandidateResult
  >;
}

export interface PosterBrainAiTrainingCandidateServiceDependencies {
  readonly snapshotRepository:
    PosterBrainAiLearningDatasetSnapshotReadRepository;

  readonly modelRegistryRepository:
    PosterBrainAiModelRegistryRepository;

  readonly endpointUrl:
    string;

  readonly timeoutMs:
    number;

  readonly pageSize?:
    number;

  readonly fetchImplementation?:
    PosterBrainAiLearningDatasetHandoffFetch;
}

interface TrainingStreamState {
  pageCount:
    number;

  eventCount:
    number;
}

interface TrainingResponseRecord {
  readonly status?:
    unknown;

  readonly accepted?:
    unknown;

  readonly datasetId?:
    unknown;

  readonly schemaVersion?:
    unknown;

  readonly datasetChecksum?:
    unknown;

  readonly sourceCutoffAt?:
    unknown;

  readonly pageCount?:
    unknown;

  readonly eventCount?:
    unknown;

  readonly contentCount?:
    unknown;

  readonly labeledEventCount?:
    unknown;

  readonly positiveEventCount?:
    unknown;

  readonly negativeEventCount?:
    unknown;

  readonly skippedEventCount?:
    unknown;

  readonly reason?:
    unknown;

  readonly trainingAttempted?:
    unknown;

  readonly candidateCreated?:
    unknown;

  readonly candidate?:
    unknown;

  readonly promoted?:
    unknown;
}

interface CandidateRecord {
  readonly modelId?:
    unknown;

  readonly modelType?:
    unknown;

  readonly trainingEngineVersion?:
    unknown;

  readonly featureVersion?:
    unknown;

  readonly featureDimension?:
    unknown;

  readonly datasetId?:
    unknown;

  readonly datasetChecksum?:
    unknown;

  readonly trainedAt?:
    unknown;

  readonly materializedEventCount?:
    unknown;

  readonly labeledEventCount?:
    unknown;

  readonly trainingEventCount?:
    unknown;

  readonly trainingPositiveCount?:
    unknown;

  readonly trainingNegativeCount?:
    unknown;

  readonly intercept?:
    unknown;

  readonly weights?:
    unknown;

  readonly metrics?:
    unknown;

  readonly modelChecksum?:
    unknown;
}

interface CandidateMetricsRecord {
  readonly validationEventCount?:
    unknown;

  readonly validationPositiveCount?:
    unknown;

  readonly validationNegativeCount?:
    unknown;

  readonly accuracy?:
    unknown;

  readonly logLoss?:
    unknown;

  readonly rocAuc?:
    unknown;
}

function fail(
  code:
    PosterBrainAiTrainingCandidateErrorCode,
  message:
    string
): never {
  throw new PosterBrainAiTrainingCandidateError({
    code,
    message,
  });
}

function requireText(
  value:
    unknown,
  fieldName:
    string
): string {
  if (
    typeof value !==
    "string"
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI training returned invalid ${fieldName}.`
    );
  }

  const cleaned =
    value.trim();

  if (!cleaned) {
    return fail(
      "response_invalid",
      `Poster Brain AI training returned empty ${fieldName}.`
    );
  }

  return cleaned;
}

function requireInteger(
  value:
    unknown,
  fieldName:
    string,
  minimum:
    number = 0
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isSafeInteger(
      value
    ) ||
    value <
      minimum
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI training returned invalid ${fieldName}.`
    );
  }

  return value;
}

function requireNumber(
  value:
    unknown,
  fieldName:
    string
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI training returned invalid ${fieldName}.`
    );
  }

  return value;
}

function requireProbability(
  value:
    unknown,
  fieldName:
    string
): number {
  const number =
    requireNumber(
      value,
      fieldName
    );

  if (
    number < 0 ||
    number > 1
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI training returned invalid probability ${fieldName}.`
    );
  }

  return number;
}

function requireChecksum(
  value:
    unknown,
  fieldName:
    string
): string {
  const checksum =
    requireText(
      value,
      fieldName
    ).toLowerCase();

  if (
    !SHA256_PATTERN.test(
      checksum
    )
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI training returned invalid checksum ${fieldName}.`
    );
  }

  return checksum;
}

function normalizeTimestamp(
  value:
    string,
  fieldName:
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
    return fail(
      "response_invalid",
      `Poster Brain AI training returned invalid timestamp ${fieldName}.`
    );
  }

  return parsed.toISOString();
}

function requireRecord(
  value:
    unknown,
  fieldName:
    string
): Readonly<
  Record<
    string,
    unknown
  >
> {
  if (
    value ===
      null ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return fail(
      "response_invalid",
      `Poster Brain AI training returned invalid object ${fieldName}.`
    );
  }

  return value as Readonly<
    Record<
      string,
      unknown
    >
  >;
}

function normalizeEndpointUrl(
  value:
    string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training endpoint cannot be empty."
    );
  }

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        cleaned
      );
  }
  catch {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training endpoint must be a valid URL."
    );
  }

  if (
    parsed.protocol !==
      "http:" &&
    parsed.protocol !==
      "https:"
  ) {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training endpoint must use HTTP or HTTPS."
    );
  }

  return parsed.toString();
}

function normalizeTimeout(
  value:
    number
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value <= 0
  ) {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training timeout must be a positive safe integer."
    );
  }

  return value;
}

function normalizePageSize(
  value:
    number |
    undefined
): number {
  if (
    value ===
    undefined
  ) {
    return DEFAULT_PAGE_SIZE;
  }

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value <= 0
  ) {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training page size must be a positive safe integer."
    );
  }

  return Math.min(
    MAX_PAGE_SIZE,
    value
  );
}

function validateSnapshot(
  snapshot:
    PosterBrainAiLearningDatasetReadySnapshot
): PosterBrainAiLearningDatasetReadySnapshot {
  if (
    snapshot.materializedEventCount <
      MINIMUM_TRAINING_EVENTS
  ) {
    return fail(
      "snapshot_invalid",
      `Poster Brain AI training requires at least ${MINIMUM_TRAINING_EVENTS} frozen events.`
    );
  }

  if (
    snapshot.materializedEventCount >
      snapshot.sourceEventCount
  ) {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training frozen event count exceeds source event count."
    );
  }

  if (
    snapshot.materializedContentCount <
      1
  ) {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training snapshot has no frozen content."
    );
  }

  requireChecksum(
    snapshot.datasetChecksum,
    "snapshot.datasetChecksum"
  );

  const first =
    normalizeTimestamp(
      snapshot.firstEventAt,
      "snapshot.firstEventAt"
    );

  const last =
    normalizeTimestamp(
      snapshot.lastEventAt,
      "snapshot.lastEventAt"
    );

  const cutoff =
    normalizeTimestamp(
      snapshot.sourceCutoffAt,
      "snapshot.sourceCutoffAt"
    );

  if (
    first > last ||
    last > cutoff
  ) {
    return fail(
      "snapshot_invalid",
      "Poster Brain AI training snapshot timestamps are inconsistent."
    );
  }

  return snapshot;
}

function createManifestLine(
  snapshot:
    PosterBrainAiLearningDatasetReadySnapshot
): string {
  return JSON.stringify({
    kind:
      "manifest",

    handoff: {
      manifest: {
        datasetId:
          snapshot.id,

        schemaVersion:
          snapshot.schemaVersion,

        sourceEventCount:
          snapshot.sourceEventCount,

        materializedEventCount:
          snapshot.materializedEventCount,

        materializedContentCount:
          snapshot.materializedContentCount,

        sourceCutoffAt:
          snapshot.sourceCutoffAt,

        firstEventAt:
          snapshot.firstEventAt,

        lastEventAt:
          snapshot.lastEventAt,

        datasetChecksum:
          snapshot.datasetChecksum,
      },
    },
  }) +
  "\n";
}

function createPageLine(input: {
  readonly datasetId:
    string;

  readonly pageNumber:
    number;

  readonly events:
    readonly PosterBrainAiLearningDatasetEvent[];

  readonly isFinalPage:
    boolean;
}): string {
  return JSON.stringify({
    kind:
      "page",

    page: {
      datasetId:
        input.datasetId,

      schemaVersion:
        1,

      pageNumber:
        input.pageNumber,

      events:
        input.events,

      isFinalPage:
        input.isFinalPage,
    },
  }) +
  "\n";
}

async function* createTrainingLines(input: {
  readonly snapshot:
    PosterBrainAiLearningDatasetReadySnapshot;

  readonly repository:
    PosterBrainAiLearningDatasetSnapshotReadRepository;

  readonly pageSize:
    number;

  readonly state:
    TrainingStreamState;
}): AsyncGenerator<string> {
  yield createManifestLine(
    input.snapshot
  );

  let cursor:
    string |
    null =
      null;

  let previousCursor:
    string |
    null =
      null;

  let pageNumber =
    1;

  while (true) {
    const page =
      await input.repository.listReadySnapshotPage({
        datasetId:
          input.snapshot.id,

        limit:
          input.pageSize,

        cursor,
      });

    if (
      page.events.length ===
      0
    ) {
      return fail(
        "snapshot_invalid",
        "Poster Brain AI training produced an empty frozen page."
      );
    }

    const nextCount =
      input.state.eventCount +
      page.events.length;

    if (
      nextCount >
      input.snapshot.materializedEventCount
    ) {
      return fail(
        "snapshot_invalid",
        "Poster Brain AI training stream exceeds frozen event count."
      );
    }

    const isFinalPage =
      page.nextCursor ===
      null;

    if (
      isFinalPage &&
      nextCount !==
        input.snapshot.materializedEventCount
    ) {
      return fail(
        "snapshot_invalid",
        "Poster Brain AI training stream does not reconcile with frozen event count."
      );
    }

    if (
      !isFinalPage &&
      (
        page.nextCursor ===
          cursor ||
        page.nextCursor ===
          previousCursor
      )
    ) {
      return fail(
        "snapshot_invalid",
        "Poster Brain AI training cursor did not advance."
      );
    }

    yield createPageLine({
      datasetId:
        input.snapshot.id,

      pageNumber,

      events:
        page.events,

      isFinalPage,
    });

    input.state.pageCount +=
      1;

    input.state.eventCount =
      nextCount;

    if (isFinalPage) {
      break;
    }

    previousCursor =
      cursor;

    cursor =
      page.nextCursor;

    pageNumber +=
      1;
  }
}

function createReadableBody(
  lines:
    AsyncGenerator<string>
): ReadableStream<
  Uint8Array
> {
  const encoder =
    new TextEncoder();

  const iterator =
    lines[
      Symbol.asyncIterator
    ]();

  return new ReadableStream<
    Uint8Array
  >({
    async pull(
      controller
    ) {
      try {
        const next =
          await iterator.next();

        if (next.done) {
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            next.value
          )
        );
      }
      catch (error) {
        controller.error(
          error
        );
      }
    },

    async cancel() {
      if (
        iterator.return !==
        undefined
      ) {
        await iterator.return(
          undefined
        );
      }
    },
  });
}

function createCandidateInput(input: {
  readonly candidate:
    unknown;

  readonly snapshot:
    PosterBrainAiLearningDatasetReadySnapshot;

  readonly labeledEventCount:
    number;

  readonly positiveEventCount:
    number;

  readonly negativeEventCount:
    number;
}): CreatePosterBrainAiModelCandidateInput {
  const candidate =
    requireRecord(
      input.candidate,
      "candidate"
    ) as CandidateRecord;

  const modelId =
    requireText(
      candidate.modelId,
      "candidate.modelId"
    );

  const modelType =
    requireText(
      candidate.modelType,
      "candidate.modelType"
    );

  if (
    modelType !==
      TRAINED_MODEL_TYPE
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training returned unsupported model type."
    );
  }

  const trainingEngineVersion =
    requireText(
      candidate.trainingEngineVersion,
      "candidate.trainingEngineVersion"
    );

  const featureVersion =
    requireText(
      candidate.featureVersion,
      "candidate.featureVersion"
    );

  const featureDimension =
    requireInteger(
      candidate.featureDimension,
      "candidate.featureDimension",
      1
    );

  const datasetId =
    requireText(
      candidate.datasetId,
      "candidate.datasetId"
    );

  const datasetChecksum =
    requireChecksum(
      candidate.datasetChecksum,
      "candidate.datasetChecksum"
    );

  const modelChecksum =
    requireChecksum(
      candidate.modelChecksum,
      "candidate.modelChecksum"
    );

  const trainedAt =
    normalizeTimestamp(
      requireText(
        candidate.trainedAt,
        "candidate.trainedAt"
      ),
      "candidate.trainedAt"
    );

  const materializedEventCount =
    requireInteger(
      candidate.materializedEventCount,
      "candidate.materializedEventCount"
    );

  const labeledEventCount =
    requireInteger(
      candidate.labeledEventCount,
      "candidate.labeledEventCount"
    );

  const trainingEventCount =
    requireInteger(
      candidate.trainingEventCount,
      "candidate.trainingEventCount"
    );

  const trainingPositiveCount =
    requireInteger(
      candidate.trainingPositiveCount,
      "candidate.trainingPositiveCount"
    );

  const trainingNegativeCount =
    requireInteger(
      candidate.trainingNegativeCount,
      "candidate.trainingNegativeCount"
    );

  if (
    trainingPositiveCount +
      trainingNegativeCount !==
    trainingEventCount
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate training counts do not reconcile."
    );
  }

  if (
    !Array.isArray(
      candidate.weights
    )
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate weights are invalid."
    );
  }

  const weights =
    candidate.weights.map(
      (
        value,
        index
      ) =>
        requireNumber(
          value,
          `candidate.weights[${index}]`
        )
    );

  if (
    weights.length !==
      featureDimension
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate weight count does not match feature dimension."
    );
  }

  const intercept =
    requireNumber(
      candidate.intercept,
      "candidate.intercept"
    );

  const metrics =
    requireRecord(
      candidate.metrics,
      "candidate.metrics"
    ) as CandidateMetricsRecord;

  const validationEventCount =
    requireInteger(
      metrics.validationEventCount,
      "candidate.metrics.validationEventCount"
    );

  const validationPositiveCount =
    requireInteger(
      metrics.validationPositiveCount,
      "candidate.metrics.validationPositiveCount"
    );

  const validationNegativeCount =
    requireInteger(
      metrics.validationNegativeCount,
      "candidate.metrics.validationNegativeCount"
    );

  if (
    validationPositiveCount +
      validationNegativeCount !==
    validationEventCount
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate validation counts do not reconcile."
    );
  }

  if (
    trainingEventCount +
      validationEventCount !==
    labeledEventCount
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate labeled count does not reconcile."
    );
  }

  if (
    labeledEventCount !==
      input.labeledEventCount ||
    trainingPositiveCount +
      validationPositiveCount !==
      input.positiveEventCount ||
    trainingNegativeCount +
      validationNegativeCount !==
      input.negativeEventCount
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate does not match response label counts."
    );
  }

  const accuracy =
    requireProbability(
      metrics.accuracy,
      "candidate.metrics.accuracy"
    );

  const logLoss =
    requireNumber(
      metrics.logLoss,
      "candidate.metrics.logLoss"
    );

  if (
    logLoss < 0
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate log loss cannot be negative."
    );
  }

  const rocAuc =
    metrics.rocAuc ===
      null
      ? null
      : requireProbability(
          metrics.rocAuc,
          "candidate.metrics.rocAuc"
        );

  if (
    datasetId !==
      input.snapshot.id ||
    datasetChecksum !==
      input.snapshot.datasetChecksum.toLowerCase() ||
    materializedEventCount !==
      input.snapshot.materializedEventCount
  ) {
    return fail(
      "response_invalid",
      "Poster Brain AI training candidate provenance does not match frozen snapshot."
    );
  }

  const artifact:
    Readonly<
      Record<
        string,
        unknown
      >
    > = {
      modelId,
      modelType,
      trainingEngineVersion,
      featureVersion,
      featureDimension,
      datasetId,
      datasetChecksum,
      trainedAt,
      materializedEventCount,
      labeledEventCount,
      trainingEventCount,
      trainingPositiveCount,
      trainingNegativeCount,
      intercept,
      weights,

      metrics: {
        validationEventCount,
        validationPositiveCount,
        validationNegativeCount,
        accuracy,
        logLoss,
        rocAuc,
      },

      modelChecksum,
    };

  return {
    modelId,
    modelType,
    trainingEngineVersion,
    featureVersion,
    featureDimension,
    datasetId,
    datasetChecksum,
    modelChecksum,
    trainedAt,
    materializedEventCount,
    labeledEventCount,
    trainingEventCount,
    trainingPositiveCount,
    trainingNegativeCount,

    metrics: {
      validationEventCount,
      validationPositiveCount,
      validationNegativeCount,
      accuracy,
      logLoss,
      rocAuc,
    },

    artifact,
  };
}

const runtimeFetch:
  PosterBrainAiLearningDatasetHandoffFetch =
  async (
    url,
    request
  ) => {
    const response =
      await fetch(
        url,
        request as unknown as
          RequestInit & {
            readonly duplex:
              "half";
          }
      );

    return {
      ok:
        response.ok,

      status:
        response.status,

      json:
        () =>
          response.json(),
    };
  };

export class DefaultPosterBrainAiTrainingCandidateService
  implements PosterBrainAiTrainingCandidateService
{
  private readonly snapshotRepository:
    PosterBrainAiLearningDatasetSnapshotReadRepository;

  private readonly modelRegistryRepository:
    PosterBrainAiModelRegistryRepository;

  private readonly endpointUrl:
    string;

  private readonly timeoutMs:
    number;

  private readonly pageSize:
    number;

  private readonly fetchImplementation:
    PosterBrainAiLearningDatasetHandoffFetch;

  constructor(
    dependencies:
      PosterBrainAiTrainingCandidateServiceDependencies
  ) {
    this.snapshotRepository =
      dependencies.snapshotRepository;

    this.modelRegistryRepository =
      dependencies.modelRegistryRepository;

    this.endpointUrl =
      normalizeEndpointUrl(
        dependencies.endpointUrl
      );

    this.timeoutMs =
      normalizeTimeout(
        dependencies.timeoutMs
      );

    this.pageSize =
      normalizePageSize(
        dependencies.pageSize
      );

    this.fetchImplementation =
      dependencies.fetchImplementation ??
      runtimeFetch;
  }

  async trainReadySnapshot(
    datasetId:
      string
  ): Promise<
    PosterBrainAiTrainingCandidateResult
  > {
    const cleanedDatasetId =
      datasetId.trim();

    if (!cleanedDatasetId) {
      return fail(
        "snapshot_invalid",
        "Poster Brain AI training datasetId cannot be empty."
      );
    }

    const found =
      await this.snapshotRepository.getReadySnapshot(
        cleanedDatasetId
      );

    if (
      found ===
      null
    ) {
      throw new PosterBrainAiTrainingCandidateError({
        code:
          "snapshot_not_ready",

        message:
          "Poster Brain AI training snapshot is not ready.",
      });
    }

    const snapshot =
      validateSnapshot(
        found
      );

    const state:
      TrainingStreamState = {
        pageCount:
          0,

        eventCount:
          0,
      };

    const body =
      createReadableBody(
        createTrainingLines({
          snapshot,

          repository:
            this.snapshotRepository,

          pageSize:
            this.pageSize,

          state,
        })
      );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        this.timeoutMs
      );

    try {
      const response =
        await this.fetchImplementation(
          this.endpointUrl,
          {
            method:
              "POST",

            headers: {
              accept:
                "application/json",

              "content-type":
                NDJSON_CONTENT_TYPE,
            },

            body,

            signal:
              controller.signal,

            duplex:
              "half",
          }
        );

      if (!response.ok) {
        throw new PosterBrainAiTrainingCandidateError({
          code:
            "remote_rejected",

          status:
            response.status,

          message:
            `Poster Brain AI training endpoint rejected dataset with HTTP ${response.status}.`,
        });
      }

      let value:
        unknown;

      try {
        value =
          await response.json();
      }
      catch {
        return fail(
          "response_invalid",
          "Poster Brain AI training endpoint returned invalid JSON."
        );
      }

      const record =
        requireRecord(
          value,
          "response"
        ) as TrainingResponseRecord;

      const status =
        record.status;

      if (
        status !==
          "trained" &&
        status !==
          "not_trainable"
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI training returned invalid status."
        );
      }

      if (
        record.accepted !==
          true ||
        record.trainingAttempted !==
          true ||
        record.promoted !==
          false
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI training returned invalid lifecycle flags."
        );
      }

      const responseDatasetId =
        requireText(
          record.datasetId,
          "datasetId"
        );

      const schemaVersion =
        requireInteger(
          record.schemaVersion,
          "schemaVersion"
        );

      const datasetChecksum =
        requireChecksum(
          record.datasetChecksum,
          "datasetChecksum"
        );

      const responseCutoff =
        normalizeTimestamp(
          requireText(
            record.sourceCutoffAt,
            "sourceCutoffAt"
          ),
          "sourceCutoffAt"
        );

      const snapshotCutoff =
        normalizeTimestamp(
          snapshot.sourceCutoffAt,
          "snapshot.sourceCutoffAt"
        );

      if (
        responseDatasetId !==
          snapshot.id ||
        schemaVersion !==
          snapshot.schemaVersion ||
        datasetChecksum !==
          snapshot.datasetChecksum.toLowerCase() ||
        responseCutoff !==
          snapshotCutoff
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI training response does not match frozen snapshot manifest."
        );
      }

      const pageCount =
        requireInteger(
          record.pageCount,
          "pageCount"
        );

      const eventCount =
        requireInteger(
          record.eventCount,
          "eventCount"
        );

      const contentCount =
        requireInteger(
          record.contentCount,
          "contentCount"
        );

      if (
        pageCount !==
          state.pageCount ||
        eventCount !==
          state.eventCount ||
        eventCount !==
          snapshot.materializedEventCount ||
        contentCount !==
          snapshot.materializedContentCount
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI training response counts do not match frozen snapshot."
        );
      }

      const labeledEventCount =
        requireInteger(
          record.labeledEventCount,
          "labeledEventCount"
        );

      const positiveEventCount =
        requireInteger(
          record.positiveEventCount,
          "positiveEventCount"
        );

      const negativeEventCount =
        requireInteger(
          record.negativeEventCount,
          "negativeEventCount"
        );

      const skippedEventCount =
        requireInteger(
          record.skippedEventCount,
          "skippedEventCount"
        );

      if (
        positiveEventCount +
          negativeEventCount !==
        labeledEventCount
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI training label counts do not reconcile."
        );
      }

      if (
        labeledEventCount +
          skippedEventCount !==
        eventCount
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI training labeled/skipped counts do not reconcile."
        );
      }

      const reason =
        requireText(
          record.reason,
          "reason"
        );

      if (
        typeof record.candidateCreated !==
        "boolean"
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI training returned invalid candidateCreated."
        );
      }

      if (
        status ===
        "not_trainable"
      ) {
        if (
          record.candidateCreated !==
            false ||
          record.candidate !==
            null
        ) {
          return fail(
            "response_invalid",
            "Poster Brain AI returned a candidate for not_trainable status."
          );
        }

        return {
          status,
          accepted:
            true,
          datasetId:
            snapshot.id,
          schemaVersion:
            snapshot.schemaVersion,
          datasetChecksum:
            snapshot.datasetChecksum,
          sourceCutoffAt:
            snapshot.sourceCutoffAt,
          pageCount,
          eventCount,
          contentCount,
          labeledEventCount,
          positiveEventCount,
          negativeEventCount,
          skippedEventCount,
          reason,
          trainingAttempted:
            true,
          candidateCreated:
            false,
          candidatePersisted:
            false,
          candidate:
            null,
          promoted:
            false,
        };
      }

      if (
        record.candidateCreated !==
          true ||
        record.candidate ===
          null ||
        record.candidate ===
          undefined
      ) {
        return fail(
          "response_invalid",
          "Poster Brain AI trained status is missing candidate artifact."
        );
      }

      const candidateInput =
        createCandidateInput({
          candidate:
            record.candidate,

          snapshot,

          labeledEventCount,

          positiveEventCount,

          negativeEventCount,
        });

      let persisted:
        PosterBrainAiModelVersion;

      try {
        persisted =
          await this.modelRegistryRepository.createCandidate(
            candidateInput
          );
      }
      catch {
        throw new PosterBrainAiTrainingCandidateError({
          code:
            "candidate_persistence_failed",

          message:
            "Poster Brain trained candidate could not be persisted.",
        });
      }

      if (
        persisted.modelId !==
          candidateInput.modelId ||
        persisted.modelChecksum !==
          candidateInput.modelChecksum ||
        persisted.datasetId !==
          snapshot.id ||
        persisted.datasetChecksum !==
          snapshot.datasetChecksum.toLowerCase() ||
        persisted.state !==
          "candidate" ||
        persisted.evaluationStatus !==
          "pending"
      ) {
        throw new PosterBrainAiTrainingCandidateError({
          code:
            "candidate_persistence_failed",

          message:
            "Poster Brain persisted candidate does not match trained candidate.",
        });
      }

      return {
        status:
          "trained",

        accepted:
          true,

        datasetId:
          snapshot.id,

        schemaVersion:
          snapshot.schemaVersion,

        datasetChecksum:
          snapshot.datasetChecksum,

        sourceCutoffAt:
          snapshot.sourceCutoffAt,

        pageCount,

        eventCount,

        contentCount,

        labeledEventCount,

        positiveEventCount,

        negativeEventCount,

        skippedEventCount,

        reason,

        trainingAttempted:
          true,

        candidateCreated:
          true,

        candidatePersisted:
          true,

        candidate:
          persisted,

        promoted:
          false,
      };
    }
    catch (error) {
      if (
        error instanceof
        PosterBrainAiTrainingCandidateError
      ) {
        throw error;
      }

      if (
        controller.signal.aborted
      ) {
        throw new PosterBrainAiTrainingCandidateError({
          code:
            "transport_timeout",

          message:
            `Poster Brain AI training timed out after ${this.timeoutMs}ms.`,
        });
      }

      throw new PosterBrainAiTrainingCandidateError({
        code:
          "transport_failed",

        message:
          "Poster Brain AI training transport failed.",
      });
    }
    finally {
      clearTimeout(
        timeout
      );
    }
  }
}

export function createPosterBrainAiTrainingCandidateService(
  dependencies:
    PosterBrainAiTrainingCandidateServiceDependencies
): PosterBrainAiTrainingCandidateService {
  return new DefaultPosterBrainAiTrainingCandidateService(
    dependencies
  );
}