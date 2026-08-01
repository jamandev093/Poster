export type AcquisitionMethod =
  | "api"
  | "rss"
  | "embed"
  | "agreement"
  | "link_only";

export interface OperationalAuditEvent {
  id: string;

  action: string;

  actorUserId:
    string |
    null;

  actorLabel: string;

  metadata:
    Record<
      string,
      unknown
    >;

  occurredAt: string;
}

export interface ApiErrorEnvelope {
  error?: {
    code?: string;

    message?: string;
  };
}