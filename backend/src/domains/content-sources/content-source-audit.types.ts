export const CONTENT_SOURCE_AUDIT_ENTITY_TYPES = [
  "source",
  "content",
] as const;

export type ContentSourceAuditEntityType =
  (typeof CONTENT_SOURCE_AUDIT_ENTITY_TYPES)[number];

export interface ContentSourceAuditEventRecord {
  id: string;

  entityType:
    ContentSourceAuditEntityType;

  sourceId:
    string |
    null;

  contentId:
    string |
    null;

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

  occurredAt: Date;
}

export interface AppendSourceAuditEventInput {
  sourceId: string;

  action: string;

  actorUserId?:
    string |
    null;

  actorLabel: string;

  metadata?:
    Record<
      string,
      unknown
    >;

  occurredAt: Date;
}

export interface AppendContentAuditEventInput {
  contentId: string;

  action: string;

  actorUserId?:
    string |
    null;

  actorLabel: string;

  metadata?:
    Record<
      string,
      unknown
    >;

  occurredAt: Date;
}