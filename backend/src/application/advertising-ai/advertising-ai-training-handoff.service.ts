import {
  Readable,
} from "node:stream";

import type {
  AdvertisingAiLearningSnapshot,
  AdvertisingAiLearningSnapshotRepository,
} from "./index.js";

export interface AdvertisingAiTrainingCandidateMetrics {
  readonly validationEventCount:
    number;

  readonly validationPositiveCount:
    number;

  readonly validationNegativeCount:
    number;

  readonly accuracy:
    number;

  readonly logLoss:
    number;

  readonly rocAuc:
    number |
    null;
}

export interface AdvertisingAiTrainingCandidateModel {
  readonly modelId:
    string;

  readonly modelType:
    "hashed_logistic_ad_response_v1";

  readonly trainingEngineVersion:
    string;

  readonly featureVersion:
    string;

  readonly featureDimension:
    256;

  readonly datasetId:
    string;

  readonly datasetChecksum:
    string;

  readonly trainedAt:
    string;

  readonly materializedEventCount:
    number;

  readonly labeledEventCount:
    number;

  readonly trainingEventCount:
    number;

  readonly trainingPositiveCount:
    number;

  readonly trainingNegativeCount:
    number;

  readonly intercept:
    number;

  readonly weights:
    readonly number[];

  readonly metrics:
    AdvertisingAiTrainingCandidateMetrics;

  readonly modelChecksum:
    string;
}

export interface AdvertisingAiTrainingHandoffResult {
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

  readonly materializedEventCount:
    number;

  readonly trainingAttempted:
    true;

  readonly candidateCreated:
    boolean;

  readonly reason:
    string;

  readonly observedEventCount:
    number;

  readonly labeledEventCount:
    number;

  readonly skippedEventCount:
    number;

  readonly positiveEventCount:
    number;

  readonly negativeEventCount:
    number;

  readonly candidate:
    AdvertisingAiTrainingCandidateModel |
    null;

  readonly promoted:
    false;
}

interface AdvertisingAiTrainingFetchInit
  extends RequestInit {
  readonly body:
    ReadableStream<Uint8Array>;

  readonly duplex:
    "half";
}

export type AdvertisingAiTrainingFetch =
  (
    input:
      string,

    init:
      AdvertisingAiTrainingFetchInit
  ) =>
    Promise<Response>;

export interface AdvertisingAiTrainingHandoffService {
  train(
    datasetId:
      string
  ):
    Promise<
      AdvertisingAiTrainingHandoffResult
    >;
}

export interface AdvertisingAiTrainingHandoffDependencies {
  readonly snapshotRepository:
    AdvertisingAiLearningSnapshotRepository;

  readonly endpoint:
    string;

  readonly fetchImplementation:
    AdvertisingAiTrainingFetch;

  readonly timeoutMs?:
    number;

  readonly pageSize?:
    number;
}

function positiveInteger(
  value:
    number,

  field:
    string
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 1
  ) {
    throw new Error(
      `Advertising AI ${field} must be a positive integer.`
    );
  }

  return value;
}

function normalizeEndpoint(
  value:
    string
): string {
  const cleaned =
    value.trim();

  const url =
    new URL(
      cleaned
    );

  if (
    url.protocol !==
      "http:" &&
    url.protocol !==
      "https:"
  ) {
    throw new Error(
      "Advertising AI training endpoint must use HTTP or HTTPS."
    );
  }

  return url.toString();
}

function normalizedTimestamp(
  value:
    string
): string {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Advertising AI timestamp is invalid."
    );
  }

  return date.toISOString();
}

function isRecord(
  value:
    unknown
): value is
  Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  );
}

function requiredString(
  object:
    Record<string, unknown>,

  key:
    string
): string {
  const value =
    object[key];

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
  ) {
    throw new Error(
      `Advertising AI training response ${key} is invalid.`
    );
  }

  return value;
}

function requiredNumber(
  object:
    Record<string, unknown>,

  key:
    string
): number {
  const value =
    object[key];

  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    throw new Error(
      `Advertising AI training response ${key} is invalid.`
    );
  }

  return value;
}

function requiredInteger(
  object:
    Record<string, unknown>,

  key:
    string
): number {
  const value =
    requiredNumber(
      object,
      key
    );

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 0
  ) {
    throw new Error(
      `Advertising AI training response ${key} is invalid.`
    );
  }

  return value;
}

function parseMetrics(
  value:
    unknown
):
  AdvertisingAiTrainingCandidateMetrics {
  if (!isRecord(value)) {
    throw new Error(
      "Advertising AI candidate metrics are invalid."
    );
  }

  const roc =
    value.rocAuc;

  if (
    roc !==
      null &&
    (
      typeof roc !==
        "number" ||
      !Number.isFinite(
        roc
      )
    )
  ) {
    throw new Error(
      "Advertising AI candidate ROC AUC is invalid."
    );
  }

  return {
    validationEventCount:
      requiredInteger(
        value,
        "validationEventCount"
      ),

    validationPositiveCount:
      requiredInteger(
        value,
        "validationPositiveCount"
      ),

    validationNegativeCount:
      requiredInteger(
        value,
        "validationNegativeCount"
      ),

    accuracy:
      requiredNumber(
        value,
        "accuracy"
      ),

    logLoss:
      requiredNumber(
        value,
        "logLoss"
      ),

    rocAuc:
      roc,
  };
}

function parseCandidate(
  value:
    unknown
):
  AdvertisingAiTrainingCandidateModel {
  if (!isRecord(value)) {
    throw new Error(
      "Advertising AI candidate model is invalid."
    );
  }

  if (
    value.modelType !==
    "hashed_logistic_ad_response_v1"
  ) {
    throw new Error(
      "Advertising AI candidate model type is invalid."
    );
  }

  if (
    value.featureDimension !==
    256
  ) {
    throw new Error(
      "Advertising AI candidate feature dimension is invalid."
    );
  }

  if (
    !Array.isArray(
      value.weights
    ) ||
    value.weights.length !==
      256 ||
    value.weights.some(
      weight =>
        typeof weight !==
          "number" ||
        !Number.isFinite(
          weight
        )
    )
  ) {
    throw new Error(
      "Advertising AI candidate weights are invalid."
    );
  }

  return {
    modelId:
      requiredString(
        value,
        "modelId"
      ),

    modelType:
      "hashed_logistic_ad_response_v1",

    trainingEngineVersion:
      requiredString(
        value,
        "trainingEngineVersion"
      ),

    featureVersion:
      requiredString(
        value,
        "featureVersion"
      ),

    featureDimension:
      256,

    datasetId:
      requiredString(
        value,
        "datasetId"
      ),

    datasetChecksum:
      requiredString(
        value,
        "datasetChecksum"
      ),

    trainedAt:
      requiredString(
        value,
        "trainedAt"
      ),

    materializedEventCount:
      requiredInteger(
        value,
        "materializedEventCount"
      ),

    labeledEventCount:
      requiredInteger(
        value,
        "labeledEventCount"
      ),

    trainingEventCount:
      requiredInteger(
        value,
        "trainingEventCount"
      ),

    trainingPositiveCount:
      requiredInteger(
        value,
        "trainingPositiveCount"
      ),

    trainingNegativeCount:
      requiredInteger(
        value,
        "trainingNegativeCount"
      ),

    intercept:
      requiredNumber(
        value,
        "intercept"
      ),

    weights:
      value.weights as
        readonly number[],

    metrics:
      parseMetrics(
        value.metrics
      ),

    modelChecksum:
      requiredString(
        value,
        "modelChecksum"
      ),
  };
}

function parseResponse(
  value:
    unknown
):
  AdvertisingAiTrainingHandoffResult {
  if (!isRecord(value)) {
    throw new Error(
      "Advertising AI training response is invalid."
    );
  }

  if (
    value.status !==
      "trained" &&
    value.status !==
      "not_trainable"
  ) {
    throw new Error(
      "Advertising AI training status is invalid."
    );
  }

  if (
    value.accepted !==
      true ||
    value.schemaVersion !==
      1 ||
    value.trainingAttempted !==
      true ||
    value.promoted !==
      false
  ) {
    throw new Error(
      "Advertising AI training response contract is invalid."
    );
  }

  if (
    typeof value.candidateCreated !==
    "boolean"
  ) {
    throw new Error(
      "Advertising AI candidateCreated is invalid."
    );
  }

  const candidate =
    value.candidate ===
      null
      ? null
      : parseCandidate(
          value.candidate
        );

  if (
    value.candidateCreated !==
    (candidate !== null)
  ) {
    throw new Error(
      "Advertising AI candidate response is inconsistent."
    );
  }

  return {
    status:
      value.status,

    accepted:
      true,

    datasetId:
      requiredString(
        value,
        "datasetId"
      ),

    schemaVersion:
      1,

    datasetChecksum:
      requiredString(
        value,
        "datasetChecksum"
      ),

    sourceCutoffAt:
      requiredString(
        value,
        "sourceCutoffAt"
      ),

    materializedEventCount:
      requiredInteger(
        value,
        "materializedEventCount"
      ),

    trainingAttempted:
      true,

    candidateCreated:
      value.candidateCreated,

    reason:
      requiredString(
        value,
        "reason"
      ),

    observedEventCount:
      requiredInteger(
        value,
        "observedEventCount"
      ),

    labeledEventCount:
      requiredInteger(
        value,
        "labeledEventCount"
      ),

    skippedEventCount:
      requiredInteger(
        value,
        "skippedEventCount"
      ),

    positiveEventCount:
      requiredInteger(
        value,
        "positiveEventCount"
      ),

    negativeEventCount:
      requiredInteger(
        value,
        "negativeEventCount"
      ),

    candidate,

    promoted:
      false,
  };
}

async function* ndjsonChunks(
  snapshot:
    AdvertisingAiLearningSnapshot,

  repository:
    AdvertisingAiLearningSnapshotRepository,

  pageSize:
    number
):
  AsyncGenerator<
    Buffer,
    void,
    undefined
  > {
  yield Buffer.from(
    JSON.stringify({
      recordType:
        "manifest",

      schemaVersion:
        1,

      datasetId:
        snapshot.id,

      datasetChecksum:
        snapshot.datasetChecksum,

      sourceCutoffAt:
        snapshot.sourceCutoffAt,

      materializedEventCount:
        snapshot.materializedEventCount,
    }) +
    "\n",
    "utf8"
  );

  let cursor:
    string |
    null =
    null;

  let observed =
    0;

  while (true) {
    const page =
      await repository
        .listFrozenEvents({
          datasetId:
            snapshot.id,

          limit:
            pageSize,

          cursor,
        });

    if (
      page.events.length ===
        0 &&
      page.nextCursor !==
        null
    ) {
      throw new Error(
        "Advertising AI frozen dataset returned an empty non-final page."
      );
    }

    for (
      const event of
      page.events
    ) {
      observed +=
        1;

      yield Buffer.from(
        JSON.stringify({
          recordType:
            "event",

          eventKey:
            event.eventKey,

          sourceEventId:
            event.sourceEventId,

          campaignId:
            event.campaignId,

          eventType:
            event.eventType,

          placement:
            event.placement,

          occurredAt:
            event.occurredAt,
        }) +
        "\n",
        "utf8"
      );
    }

    if (
      page.nextCursor ===
      null
    ) {
      break;
    }

    cursor =
      page.nextCursor;
  }

  if (
    observed !==
    snapshot.materializedEventCount
  ) {
    throw new Error(
      "Advertising AI frozen event count changed during handoff."
    );
  }
}

export function createAdvertisingAiTrainingHandoffService(
  dependencies:
    AdvertisingAiTrainingHandoffDependencies
): AdvertisingAiTrainingHandoffService {
  const endpoint =
    normalizeEndpoint(
      dependencies.endpoint
    );

  const timeoutMs =
    positiveInteger(
      dependencies.timeoutMs ??
      120_000,
      "training timeout"
    );

  const pageSize =
    positiveInteger(
      dependencies.pageSize ??
      5000,
      "training page size"
    );

  if (
    pageSize >
    5000
  ) {
    throw new Error(
      "Advertising AI training page size cannot exceed 5000."
    );
  }

  return {
    async train(
      datasetId
    ) {
      const snapshot =
        await dependencies
          .snapshotRepository
          .getReadySnapshot(
            datasetId
          );

      if (
        snapshot ===
        null
      ) {
        throw new Error(
          "Advertising AI ready frozen dataset was not found."
        );
      }

      if (
        snapshot.datasetChecksum ===
          null ||
        snapshot.materializedEventCount !==
          snapshot.sourceEventCount
      ) {
        throw new Error(
          "Advertising AI ready frozen dataset is inconsistent."
        );
      }

      const nodeBody =
        Readable.from(
          ndjsonChunks(
            snapshot,
            dependencies
              .snapshotRepository,
            pageSize
          )
        );

      const body =
        Readable.toWeb(
          nodeBody
        ) as
          ReadableStream<
            Uint8Array
          >;

      const abortController =
        new AbortController();

      const timeout =
        setTimeout(
          () => {
            abortController
              .abort();
          },
          timeoutMs
        );

      try {
        const response =
          await dependencies
            .fetchImplementation(
              endpoint,
              {
                method:
                  "POST",

                headers: {
                  "content-type":
                    "application/x-ndjson",
                },

                body,

                duplex:
                  "half",

                signal:
                  abortController
                    .signal,
              }
            );

        if (!response.ok) {
          throw new Error(
            `Advertising AI training endpoint rejected request with HTTP ${response.status}.`
          );
        }

        const result =
          parseResponse(
            await response.json()
          );

        if (
          result.datasetId !==
          snapshot.id
        ) {
          throw new Error(
            "Advertising AI training response dataset id mismatch."
          );
        }

        if (
          result.datasetChecksum !==
          snapshot.datasetChecksum
        ) {
          throw new Error(
            "Advertising AI training response checksum mismatch."
          );
        }

        if (
          normalizedTimestamp(
            result.sourceCutoffAt
          ) !==
          normalizedTimestamp(
            snapshot.sourceCutoffAt
          )
        ) {
          throw new Error(
            "Advertising AI training response cutoff mismatch."
          );
        }

        if (
          result.materializedEventCount !==
          snapshot.materializedEventCount ||
          result.observedEventCount !==
          snapshot.materializedEventCount
        ) {
          throw new Error(
            "Advertising AI training response event count mismatch."
          );
        }

        if (
          result.status ===
            "trained" &&
          result.candidate ===
            null
        ) {
          throw new Error(
            "Advertising AI trained response did not contain a candidate model."
          );
        }

        if (
          result.candidate !==
          null &&
          (
            result.candidate
              .datasetId !==
              snapshot.id ||
            result.candidate
              .datasetChecksum !==
              snapshot.datasetChecksum ||
            result.candidate
              .materializedEventCount !==
              snapshot.materializedEventCount
          )
        ) {
          throw new Error(
            "Advertising AI candidate model does not match the frozen dataset."
          );
        }

        return result;
      }
      finally {
        clearTimeout(
          timeout
        );
      }
    },
  };
}