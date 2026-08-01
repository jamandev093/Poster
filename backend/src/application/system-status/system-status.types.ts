export type SystemServiceStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "not_connected";

export type SystemServiceKey =
  | "admin_ui"
  | "backend_api"
  | "postgresql"
  | "provider_apis"
  | "rss_ingestion"
  | "ai_services"
  | "email_notifications";

export type SystemServiceGroupKey =
  | "core_services"
  | "content_ingestion"
  | "intelligence_communication";

export interface SystemServiceHealth {
  key:
    SystemServiceKey;

  name: string;

  area: string;

  status:
    SystemServiceStatus;

  statusLabel: string;

  description: string;

  checkedAt:
    Date |
    null;

  latencyMilliseconds:
    number |
    null;

  metadata:
    Record<
      string,
      string |
      number |
      boolean |
      null
    >;
}

export interface SystemServiceGroup {
  key:
    SystemServiceGroupKey;

  title: string;

  description: string;

  services:
    SystemServiceHealth[];
}

export interface AdminSystemStatusSnapshot {
  generatedAt: Date;

  environment: string;

  summary: {
    total: number;

    operational: number;

    degraded: number;

    unavailable: number;

    notConnected: number;
  };

  groups:
    SystemServiceGroup[];
}