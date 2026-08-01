import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminSystemStatusService,
  type AdminSystemStatusServiceDependencies,
} from "../src/application/system-status/index.js";

import type {
  DatabaseHealthResult,
} from "../src/database/database.health.js";

const GENERATED_AT =
  new Date(
    "2026-08-01T14:30:00.000Z"
  );

const DATABASE_CHECKED_AT =
  "2026-08-01T14:29:59.950Z";

const HEALTHY_DATABASE:
  DatabaseHealthResult = {
  status:
    "ok",

  databaseName:
    "poster",

  authenticatedUser:
    "poster_app",

  currentSchema:
    "app",

  serverVersion:
    "17.5",

  latencyMilliseconds:
    24,

  checkedAt:
    DATABASE_CHECKED_AT,
};

function createDependencies() {
  const checkDatabase =
    vi.fn()
      .mockResolvedValue(
        HEALTHY_DATABASE
      );

  const dependencies = {
    checkDatabase,

    now:
      () =>
        GENERATED_AT,

    environment:
      () =>
        "test",
  } satisfies
    AdminSystemStatusServiceDependencies;

  return {
    dependencies,
    checkDatabase,
  };
}

describe(
  "Admin System Status service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "returns real Backend and PostgreSQL health with explicit pending integrations",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminSystemStatusService({
            dependencies:
              mocks.dependencies,
          });

        const snapshot =
          await service
            .getSnapshot();

        expect(
          snapshot.generatedAt
        ).toEqual(
          GENERATED_AT
        );

        expect(
          snapshot.environment
        ).toBe(
          "test"
        );

        expect(
          mocks.checkDatabase
        ).toHaveBeenCalledTimes(
          1
        );

        const services =
          snapshot.groups.flatMap(
            group =>
              group.services
          );

        const backend =
          services.find(
            service =>
              service.key ===
              "backend_api"
          );

        const database =
          services.find(
            service =>
              service.key ===
              "postgresql"
          );

        expect(
          backend
        ).toMatchObject({
          status:
            "healthy",

          statusLabel:
            "Healthy",

          checkedAt:
            GENERATED_AT,
        });

        expect(
          database
        ).toMatchObject({
          status:
            "healthy",

          statusLabel:
            "Healthy",

          latencyMilliseconds:
            24,

          metadata: {
            databaseName:
              "poster",

            currentSchema:
              "app",

            serverVersion:
              "17.5",
          },
        });

        expect(
          database?.checkedAt
        ).toEqual(
          new Date(
            DATABASE_CHECKED_AT
          )
        );

        for (
          const key
          of [
            "provider_apis",
            "rss_ingestion",
            "ai_services",
            "email_notifications",
          ] as const
        ) {
          expect(
            services.find(
              service =>
                service.key ===
                key
            )
          ).toMatchObject({
            status:
              "not_connected",

            statusLabel:
              "Not connected",

            checkedAt:
              null,

            latencyMilliseconds:
              null,
          });
        }

        expect(
          snapshot.summary
        ).toEqual({
          total:
            7,

          operational:
            3,

          degraded:
            0,

          unavailable:
            0,

          notConnected:
            4,
        });
      }
    );

    it(
      "reports PostgreSQL as unavailable without failing the whole snapshot",
      async () => {
        const mocks =
          createDependencies();

        mocks.checkDatabase
          .mockRejectedValue(
            new Error(
              "Database connection failed."
            )
          );

        const service =
          createAdminSystemStatusService({
            dependencies:
              mocks.dependencies,
          });

        const snapshot =
          await service
            .getSnapshot();

        const database =
          snapshot.groups
            .flatMap(
              group =>
                group.services
            )
            .find(
              service =>
                service.key ===
                "postgresql"
            );

        expect(
          database
        ).toMatchObject({
          status:
            "unavailable",

          statusLabel:
            "Unavailable",

          checkedAt:
            GENERATED_AT,

          latencyMilliseconds:
            null,

          metadata:
            {},
        });

        expect(
          snapshot.summary
        ).toEqual({
          total:
            7,

          operational:
            2,

          degraded:
            0,

          unavailable:
            1,

          notConnected:
            4,
        });
      }
    );

    it(
      "rejects an invalid generation timestamp",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminSystemStatusService({
            dependencies: {
              ...mocks.dependencies,

              now:
                () =>
                  new Date(
                    Number.NaN
                  ),
            },
          });

        await expect(
          service.getSnapshot()
        ).rejects.toThrow(
          "System Status generation time is invalid."
        );

        expect(
          mocks.checkDatabase
        ).not.toHaveBeenCalled();
      }
    );
  }
);