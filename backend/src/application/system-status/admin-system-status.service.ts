import {
  checkDatabaseHealth,
  type DatabaseHealthResult,
} from "../../database/database.health.js";

import type {
  AdminSystemStatusSnapshot,
  SystemServiceHealth,
  SystemServiceStatus,
} from "./system-status.types.js";

export interface AdminSystemStatusService {
  getSnapshot:
    () => Promise<
      AdminSystemStatusSnapshot
    >;
}

export interface AdminSystemStatusServiceDependencies {
  checkDatabase:
    typeof checkDatabaseHealth;

  now:
    () => Date;

  environment:
    () => string;
}

export interface CreateAdminSystemStatusServiceOptions {
  dependencies?:
    Partial<
      AdminSystemStatusServiceDependencies
    >;
}

function createStaticService(
  input: {
    key:
      SystemServiceHealth[
        "key"
      ];

    name: string;

    area: string;

    description: string;
  }
): SystemServiceHealth {
  return {
    ...input,

    status:
      "not_connected",

    statusLabel:
      "Not connected",

    checkedAt:
      null,

    latencyMilliseconds:
      null,

    metadata:
      {},
  };
}

function createDatabaseService(
  health:
    DatabaseHealthResult
): SystemServiceHealth {
  return {
    key:
      "postgresql",

    name:
      "PostgreSQL Database",

    area:
      "Persistence",

    status:
      "healthy",

    statusLabel:
      "Healthy",

    description:
      "The Backend successfully completed a read-only PostgreSQL connectivity check.",

    checkedAt:
      new Date(
        health.checkedAt
      ),

    latencyMilliseconds:
      health.latencyMilliseconds,

    metadata: {
      databaseName:
        health.databaseName,

      currentSchema:
        health.currentSchema,

      serverVersion:
        health.serverVersion,
    },
  };
}

function createUnavailableDatabaseService(
  checkedAt: Date
): SystemServiceHealth {
  return {
    key:
      "postgresql",

    name:
      "PostgreSQL Database",

    area:
      "Persistence",

    status:
      "unavailable",

    statusLabel:
      "Unavailable",

    description:
      "The Backend could not complete the PostgreSQL health check.",

    checkedAt,

    latencyMilliseconds:
      null,

    metadata:
      {},
  };
}

function countStatus(
  services:
    readonly SystemServiceHealth[],
  status:
    SystemServiceStatus
): number {
  return services.filter(
    service =>
      service.status ===
      status
  ).length;
}

export function createAdminSystemStatusService(
  options:
    CreateAdminSystemStatusServiceOptions =
    {}
): AdminSystemStatusService {
  const dependencies:
    AdminSystemStatusServiceDependencies = {
    checkDatabase:
      checkDatabaseHealth,

    now:
      () => new Date(),

    environment:
      () =>
        process.env.NODE_ENV ??
        "development",

    ...options.dependencies,
  };

  return {
    getSnapshot:
      async () => {
        const generatedAt =
          dependencies.now();

        if (
          !Number.isFinite(
            generatedAt.getTime()
          )
        ) {
          throw new Error(
            "System Status generation time is invalid."
          );
        }

        let databaseService:
          SystemServiceHealth;

        try {
          databaseService =
            createDatabaseService(
              await dependencies
                .checkDatabase()
            );
        } catch {
          databaseService =
            createUnavailableDatabaseService(
              generatedAt
            );
        }

        const backendService:
          SystemServiceHealth = {
          key:
            "backend_api",

          name:
            "Backend API",

          area:
            "Application service",

          status:
            "healthy",

          statusLabel:
            "Healthy",

          description:
            "The protected System Status request was served successfully by the Poster Backend.",

          checkedAt:
            generatedAt,

          latencyMilliseconds:
            null,

          metadata: {
            service:
              "poster-backend",
          },
        };

        const groups:
          AdminSystemStatusSnapshot[
            "groups"
          ] = [
          {
            key:
              "core_services",

            title:
              "Core services",

            description:
              "Essential application and persistence services.",

            services: [
              {
                key:
                  "admin_ui",

                name:
                  "Admin UI",

                area:
                  "Operations",

                status:
                  "healthy",

                statusLabel:
                  "Healthy",

                description:
                  "The Admin interface loaded the protected System Status workspace.",

                checkedAt:
                  generatedAt,

                latencyMilliseconds:
                  null,

                metadata:
                  {},
              },

              backendService,
              databaseService,
            ],
          },

          {
            key:
              "content_ingestion",

            title:
              "Content ingestion",

            description:
              "Services responsible for receiving permitted external content.",

            services: [
              createStaticService({
                key:
                  "provider_apis",

                name:
                  "Provider APIs",

                area:
                  "External integrations",

                description:
                  "No authoritative provider API health probe is connected yet.",
              }),

              createStaticService({
                key:
                  "rss_ingestion",

                name:
                  "RSS Ingestion",

                area:
                  "Feed synchronization",

                description:
                  "RSS scheduling, worker, retry, and synchronization health probes are not connected yet.",
              }),
            ],
          },

          {
            key:
              "intelligence_communication",

            title:
              "Intelligence & communication",

            description:
              "Intelligence and outbound communication services.",

            services: [
              createStaticService({
                key:
                  "ai_services",

                name:
                  "AI Services",

                area:
                  "Intelligence",

                description:
                  "No authoritative AI classification, ranking, or recommendation health probe is connected yet.",
              }),

              createStaticService({
                key:
                  "email_notifications",

                name:
                  "Email Notifications",

                area:
                  "Communication",

                description:
                  "No authoritative production email-delivery health probe is connected yet.",
              }),
            ],
          },
        ];

        const services =
          groups.flatMap(
            group =>
              group.services
          );

        return {
          generatedAt,

          environment:
            dependencies
              .environment(),

          summary: {
            total:
              services.length,

            operational:
              countStatus(
                services,
                "healthy"
              ),

            degraded:
              countStatus(
                services,
                "degraded"
              ),

            unavailable:
              countStatus(
                services,
                "unavailable"
              ),

            notConnected:
              countStatus(
                services,
                "not_connected"
              ),
          },

          groups,
        };
      },
  };
}