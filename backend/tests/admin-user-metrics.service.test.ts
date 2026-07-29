import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminUserMetricsService,
  type AdminUserMetricsServiceDependencies,
} from "../src/application/admin-metrics/admin-user-metrics.service.js";

describe(
  "Poster Admin user-metrics service",
  () => {
    it(
      "creates one snapshot using the canonical rolling windows",
      async () => {
        const generatedAt =
          new Date(
            "2026-07-29T06:00:00.000Z"
          );

        const readMetrics =
          vi.fn<
            AdminUserMetricsServiceDependencies[
              "readMetrics"
            ]
          >();

        readMetrics
          .mockResolvedValue({
            totalUsers:
              8250,

            dailyActiveUsers:
              1420,

            monthlyActiveUsers:
              6780,

            liveActiveUsers:
              184,
          });

        const service =
          createAdminUserMetricsService({
            dependencies: {
              now:
                () => generatedAt,

              readMetrics,
            },
          });

        await expect(
          service.getSnapshot()
        ).resolves.toEqual({
          totalUsers:
            8250,

          dailyActiveUsers:
            1420,

          monthlyActiveUsers:
            6780,

          liveActiveUsers:
            184,

          generatedAt,

          windows: {
            dailyActiveHours:
              24,

            monthlyActiveDays:
              30,

            liveActiveMinutes:
              5,
          },
        });

        expect(
          readMetrics
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          readMetrics
        ).toHaveBeenCalledWith({
          observedAt:
            generatedAt,

          dailyActiveSince:
            new Date(
              "2026-07-28T06:00:00.000Z"
            ),

          monthlyActiveSince:
            new Date(
              "2026-06-29T06:00:00.000Z"
            ),

          liveActiveSince:
            new Date(
              "2026-07-29T05:55:00.000Z"
            ),
        });
      }
    );

    it(
      "rejects an invalid generation time before querying PostgreSQL",
      async () => {
        const readMetrics =
          vi.fn<
            AdminUserMetricsServiceDependencies[
              "readMetrics"
            ]
          >();

        const service =
          createAdminUserMetricsService({
            dependencies: {
              now:
                () => new Date(
                  Number.NaN
                ),

              readMetrics,
            },
          });

        await expect(
          service.getSnapshot()
        ).rejects.toThrow(
          "Admin user-metrics generation time is invalid."
        );

        expect(
          readMetrics
        ).not.toHaveBeenCalled();
      }
    );
  }
);