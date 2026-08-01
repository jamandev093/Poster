export type ContentSourceApplicationErrorCode =
  | "SOURCE_NOT_FOUND"
  | "CONTENT_NOT_FOUND"
  | "SOURCE_VERSION_CONFLICT"
  | "CONTENT_VERSION_CONFLICT"
  | "SOURCE_STATE_CONFLICT"
  | "CONTENT_STATE_CONFLICT"
  | "COPYRIGHT_RESTORE_BLOCKED";

export class ContentSourceApplicationError
  extends Error {
  readonly code:
    ContentSourceApplicationErrorCode;

  constructor(
    code:
      ContentSourceApplicationErrorCode,
    message: string
  ) {
    super(
      message
    );

    this.name =
      "ContentSourceApplicationError";

    this.code =
      code;
  }
}