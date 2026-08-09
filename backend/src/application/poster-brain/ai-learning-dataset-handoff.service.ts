import type {
  PosterBrainAiLearningDatasetEvent,
} from "./ai-learning-dataset.types.js";

import type {
  PosterBrainAiLearningDatasetReadySnapshot,
  PosterBrainAiLearningDatasetSnapshotReadRepository,
} from "./ai-learning-dataset-snapshot-read.repository.js";

const DEFAULT_HANDOFF_PAGE_SIZE =
  5000;

const MAX_HANDOFF_PAGE_SIZE =
  5000;

const MINIMUM_TRAINING_EVENTS =
  10000;

const NDJSON_CONTENT_TYPE =
  "application/x-ndjson";

export type PosterBrainAiLearningDatasetHandoffErrorCode =
  | "snapshot_not_ready"
  | "snapshot_invalid"
  | "transport_failed"
  | "transport_timeout"
  | "remote_rejected"
  | "response_invalid";

export class PosterBrainAiLearningDatasetHandoffError
  extends Error
{
  readonly code:
    PosterBrainAiLearningDatasetHandoffErrorCode;

  readonly status:
    number |
    null;

  constructor(input: {
    readonly code:
      PosterBrainAiLearningDatasetHandoffErrorCode;

    readonly message:
      string;

    readonly status?:
      number;
  }) {
    super(
      input.message
    );

    this.name =
      "PosterBrainAiLearningDatasetHandoffError";

    this.code =
      input.code;

    this.status =
      input.status ??
      null;
  }
}

export interface PosterBrainAiLearningDatasetHandoffFetchRequest {
  readonly method:
    "POST";

  readonly headers:
    Readonly<
      Record<string, string>
    >;

  readonly body:
    ReadableStream<
      Uint8Array
    >;

  readonly signal:
    AbortSignal;

  readonly duplex:
    "half";
}

export interface PosterBrainAiLearningDatasetHandoffFetchResponse {
  readonly ok:
    boolean;

  readonly status:
    number;

  json():
    Promise<unknown>;
}

export type PosterBrainAiLearningDatasetHandoffFetch =
  (
    url:
      string,

    request:
      PosterBrainAiLearningDatasetHandoffFetchRequest
  ) =>
    Promise<
      PosterBrainAiLearningDatasetHandoffFetchResponse
    >;

export interface PosterBrainAiLearningDatasetHandoffResult {
  readonly status:
    "validated";

  readonly accepted:
    true;

  readonly datasetId:
    string;

  readonly schemaVersion:
    1;

  readonly datasetChecksum:
    string;

  readonly pageCount:
    number;

  readonly eventCount:
    number;

  readonly contentCount:
    number;

  readonly sourceCutoffAt:
    string;

  readonly trainingStarted:
    false;
}

export interface PosterBrainAiLearningDatasetHandoffService {
  handoffReadySnapshot(
    datasetId:
      string
  ): Promise<
    PosterBrainAiLearningDatasetHandoffResult
  >;
}

export interface PosterBrainAiLearningDatasetHandoffServiceDependencies {
  readonly repository:
    PosterBrainAiLearningDatasetSnapshotReadRepository;

  readonly endpointUrl:
    string;

  readonly timeoutMs:
    number;

  readonly pageSize?:
    number;

  readonly fetchImplementation?:
    PosterBrainAiLearningDatasetHandoffFetch;
}

interface HandoffStreamState {
  pageCount:
    number;

  eventCount:
    number;
}

interface HandoffValidationResponseRecord {
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

  readonly pageCount?:
    unknown;

  readonly eventCount?:
    unknown;

  readonly contentCount?:
    unknown;

  readonly sourceCutoffAt?:
    unknown;

  readonly trainingStarted?:
    unknown;
}

function cleanRequiredText(
  value:
    string,

  fieldName:
    string
): string {
  const cleaned =
    value.trim();

  if (!cleaned) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        `Poster Brain learning dataset ${fieldName} cannot be empty.`,
    });
  }

  return cleaned;
}

function normalizeEndpointUrl(
  value:
    string
): string {
  const cleaned =
    cleanRequiredText(
      value,
      "handoff endpoint"
    );

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        cleaned
      );
  }
  catch {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset handoff endpoint must be a valid HTTP or HTTPS URL.",
    });
  }

  if (
    parsed.protocol !==
      "http:" &&
    parsed.protocol !==
      "https:"
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset handoff endpoint must use HTTP or HTTPS.",
    });
  }

  return parsed.toString();
}

function normalizeTimeoutMs(
  value:
    number
): number {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value <= 0
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset handoff timeout must be a positive safe integer.",
    });
  }

  return value;
}

function normalizePageSize(
  value:
    number |
    undefined
): number {
  if (
    value === undefined
  ) {
    return DEFAULT_HANDOFF_PAGE_SIZE;
  }

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value <= 0
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset handoff page size must be a positive safe integer.",
    });
  }

  return Math.min(
    MAX_HANDOFF_PAGE_SIZE,
    value
  );
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
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        `Poster Brain learning dataset ${fieldName} must be a valid timestamp.`,
    });
  }

  return parsed.toISOString();
}

function validateReadySnapshot(
  snapshot:
    PosterBrainAiLearningDatasetReadySnapshot
): PosterBrainAiLearningDatasetReadySnapshot {
  if (
    snapshot.materializedEventCount <
      MINIMUM_TRAINING_EVENTS
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        `Poster Brain learning dataset requires at least ${MINIMUM_TRAINING_EVENTS} materialized events.`,
    });
  }

  if (
    snapshot.materializedEventCount >
      snapshot.sourceEventCount
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset materialized event count exceeds source event count.",
    });
  }

  if (
    snapshot.materializedContentCount <
      1
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset must contain at least one materialized content record.",
    });
  }

  const firstEventAt =
    normalizeTimestamp(
      snapshot.firstEventAt,
      "firstEventAt"
    );

  const lastEventAt =
    normalizeTimestamp(
      snapshot.lastEventAt,
      "lastEventAt"
    );

  const sourceCutoffAt =
    normalizeTimestamp(
      snapshot.sourceCutoffAt,
      "sourceCutoffAt"
    );

  if (
    firstEventAt >
      lastEventAt
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset firstEventAt cannot be after lastEventAt.",
    });
  }

  if (
    lastEventAt >
      sourceCutoffAt
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "snapshot_invalid",

      message:
        "Poster Brain learning dataset lastEventAt cannot be after sourceCutoffAt.",
    });
  }

  return snapshot;
}

function createManifestLine(
  snapshot:
    PosterBrainAiLearningDatasetReadySnapshot
): string {
  return (
    JSON.stringify({
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
    "\n"
  );
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
  return (
    JSON.stringify({
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
    "\n"
  );
}

async function* createHandoffLines(input: {
  readonly snapshot:
    PosterBrainAiLearningDatasetReadySnapshot;

  readonly repository:
    PosterBrainAiLearningDatasetSnapshotReadRepository;

  readonly pageSize:
    number;

  readonly state:
    HandoffStreamState;
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
      throw new PosterBrainAiLearningDatasetHandoffError({
        code:
          "snapshot_invalid",

        message:
          "Poster Brain ready learning dataset produced an empty frozen event page.",
      });
    }

    const nextEventCount =
      input.state.eventCount +
      page.events.length;

    if (
      nextEventCount >
      input.snapshot.materializedEventCount
    ) {
      throw new PosterBrainAiLearningDatasetHandoffError({
        code:
          "snapshot_invalid",

        message:
          "Poster Brain frozen event stream exceeds the snapshot materialized event count.",
      });
    }

    const isFinalPage =
      page.nextCursor ===
      null;

    if (
      isFinalPage &&
      nextEventCount !==
        input.snapshot.materializedEventCount
    ) {
      throw new PosterBrainAiLearningDatasetHandoffError({
        code:
          "snapshot_invalid",

        message:
          "Poster Brain frozen event stream does not match the snapshot materialized event count.",
      });
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
      throw new PosterBrainAiLearningDatasetHandoffError({
        code:
          "snapshot_invalid",

        message:
          "Poster Brain frozen event paging cursor did not advance.",
      });
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
      nextEventCount;

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
        await iterator.return(undefined);
      }
    },
  });
}

function readRecord(
  value:
    unknown
): HandoffValidationResponseRecord {
  if (
    value ===
      null ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "response_invalid",

      message:
        "Poster Brain AI handoff returned a non-object response.",
    });
  }

  return value as
    HandoffValidationResponseRecord;
}

function readRequiredSafeInteger(
  value:
    unknown,

  fieldName:
    string
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isSafeInteger(
      value
    ) ||
    value < 0
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "response_invalid",

      message:
        `Poster Brain AI handoff returned an invalid ${fieldName}.`,
    });
  }

  return value;
}

function validateRemoteResponse(input: {
  readonly value:
    unknown;

  readonly snapshot:
    PosterBrainAiLearningDatasetReadySnapshot;

  readonly state:
    HandoffStreamState;
}): PosterBrainAiLearningDatasetHandoffResult {
  const record =
    readRecord(
      input.value
    );

  if (
    record.status !==
      "validated" ||
    record.accepted !==
      true ||
    record.trainingStarted !==
      false
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "response_invalid",

      message:
        "Poster Brain AI handoff returned an invalid validation state.",
    });
  }

  if (
    typeof record.sourceCutoffAt !==
    "string"
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "response_invalid",

      message:
        "Poster Brain AI handoff returned an invalid sourceCutoffAt.",
    });
  }

  const remoteSourceCutoffAt =
    normalizeTimestamp(
      record.sourceCutoffAt,
      "response.sourceCutoffAt"
    );

  const snapshotSourceCutoffAt =
    normalizeTimestamp(
      input.snapshot.sourceCutoffAt,
      "sourceCutoffAt"
    );

  if (
    record.datasetId !==
      input.snapshot.id ||
    record.schemaVersion !==
      input.snapshot.schemaVersion ||
    record.datasetChecksum !==
      input.snapshot.datasetChecksum ||
    remoteSourceCutoffAt !==
      snapshotSourceCutoffAt
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "response_invalid",

      message:
        "Poster Brain AI handoff response does not match the frozen snapshot manifest.",
    });
  }

  const pageCount =
    readRequiredSafeInteger(
      record.pageCount,
      "pageCount"
    );

  const eventCount =
    readRequiredSafeInteger(
      record.eventCount,
      "eventCount"
    );

  const contentCount =
    readRequiredSafeInteger(
      record.contentCount,
      "contentCount"
    );

  if (
    pageCount !==
      input.state.pageCount ||
    eventCount !==
      input.state.eventCount ||
    eventCount !==
      input.snapshot.materializedEventCount ||
    contentCount !==
      input.snapshot.materializedContentCount
  ) {
    throw new PosterBrainAiLearningDatasetHandoffError({
      code:
        "response_invalid",

      message:
        "Poster Brain AI handoff response counts do not match the frozen snapshot.",
    });
  }

  return {
    status:
      "validated",

    accepted:
      true,

    datasetId:
      input.snapshot.id,

    schemaVersion:
      input.snapshot.schemaVersion,

    datasetChecksum:
      input.snapshot.datasetChecksum,

    pageCount,

    eventCount,

    contentCount,

    sourceCutoffAt:
      input.snapshot.sourceCutoffAt,

    trainingStarted:
      false,
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

export class DefaultPosterBrainAiLearningDatasetHandoffService
  implements PosterBrainAiLearningDatasetHandoffService
{
  private readonly repository:
    PosterBrainAiLearningDatasetSnapshotReadRepository;

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
      PosterBrainAiLearningDatasetHandoffServiceDependencies
  ) {
    this.repository =
      dependencies.repository;

    this.endpointUrl =
      normalizeEndpointUrl(
        dependencies.endpointUrl
      );

    this.timeoutMs =
      normalizeTimeoutMs(
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

  async handoffReadySnapshot(
    datasetId:
      string
  ): Promise<
    PosterBrainAiLearningDatasetHandoffResult
  > {
    const normalizedDatasetId =
      cleanRequiredText(
        datasetId,
        "datasetId"
      );

    const foundSnapshot =
      await this.repository.getReadySnapshot(
        normalizedDatasetId
      );

    if (
      foundSnapshot ===
      null
    ) {
      throw new PosterBrainAiLearningDatasetHandoffError({
        code:
          "snapshot_not_ready",

        message:
          "Poster Brain learning dataset snapshot is not ready.",
      });
    }

    const snapshot =
      validateReadySnapshot(
        foundSnapshot
      );

    const state:
      HandoffStreamState = {
        pageCount:
          0,

        eventCount:
          0,
      };

    const body =
      createReadableBody(
        createHandoffLines({
          snapshot,

          repository:
            this.repository,

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
        throw new PosterBrainAiLearningDatasetHandoffError({
          code:
            "remote_rejected",

          status:
            response.status,

          message:
            `Poster Brain AI rejected learning dataset handoff with HTTP ${response.status}.`,
        });
      }

      let parsedResponse:
        unknown;

      try {
        parsedResponse =
          await response.json();
      }
      catch {
        throw new PosterBrainAiLearningDatasetHandoffError({
          code:
            "response_invalid",

          message:
            "Poster Brain AI handoff returned invalid JSON.",
        });
      }

      return validateRemoteResponse({
        value:
          parsedResponse,

        snapshot,

        state,
      });
    }
    catch (error) {
      if (
        error instanceof
        PosterBrainAiLearningDatasetHandoffError
      ) {
        throw error;
      }

      if (
        controller.signal.aborted
      ) {
        throw new PosterBrainAiLearningDatasetHandoffError({
          code:
            "transport_timeout",

          message:
            `Poster Brain AI learning dataset handoff timed out after ${this.timeoutMs}ms.`,
        });
      }

      throw new PosterBrainAiLearningDatasetHandoffError({
        code:
          "transport_failed",

        message:
          "Poster Brain AI learning dataset handoff transport failed.",
      });
    }
    finally {
      clearTimeout(
        timeout
      );
    }
  }
}

export function createPosterBrainAiLearningDatasetHandoffService(
  dependencies:
    PosterBrainAiLearningDatasetHandoffServiceDependencies
): PosterBrainAiLearningDatasetHandoffService {
  return new DefaultPosterBrainAiLearningDatasetHandoffService(
    dependencies
  );
}