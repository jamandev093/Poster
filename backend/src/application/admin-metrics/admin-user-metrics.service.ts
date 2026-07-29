import {
  ADMIN_USER_METRICS_DAILY_WINDOW_HOURS,
  ADMIN_USER_METRICS_LIVE_WINDOW_MINUTES,
  ADMIN_USER_METRICS_MONTHLY_WINDOW_DAYS,
  readAdminUserMetrics,
  type AdminUserMetricsSnapshot,
} from "../../domains/admin-metrics/index.js";

export interface AdminUserMetricsService {
  getSnapshot:
    () => Promise<
      AdminUserMetricsSnapshot
    >;
}

export interface AdminUserMetricsServiceDependencies {
  readMetrics:
    typeof readAdminUserMetrics;

  now:
    () => Date;
}

export interface CreateAdminUserMetricsServiceOptions {
  dependencies?:
    Partial<
      AdminUserMetricsServiceDependencies
    >;
}

function subtractMilliseconds(
  value: Date,
  milliseconds: number
): Date {
  return new Date(
    value.getTime() -
    milliseconds
  );
}

export function createAdminUserMetricsService(
  options:
    CreateAdminUserMetricsServiceOptions =
    {}
): AdminUserMetricsService {
  const dependencies:
    AdminUserMetricsServiceDependencies = {
    readMetrics:
      readAdminUserMetrics,

    now:
      () => new Date(),

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
            "Admin user-metrics generation time is invalid."
          );
        }

        const counts =
          await dependencies
            .readMetrics({
              observedAt:
                generatedAt,

              dailyActiveSince:
                subtractMilliseconds(
                  generatedAt,
                  ADMIN_USER_METRICS_DAILY_WINDOW_HOURS *
                    60 *
                    60 *
                    1000
                ),

              monthlyActiveSince:
                subtractMilliseconds(
                  generatedAt,
                  ADMIN_USER_METRICS_MONTHLY_WINDOW_DAYS *
                    24 *
                    60 *
                    60 *
                    1000
                ),

              liveActiveSince:
                subtractMilliseconds(
                  generatedAt,
                  ADMIN_USER_METRICS_LIVE_WINDOW_MINUTES *
                    60 *
                    1000
                ),
            });

        return {
          ...counts,

          generatedAt,

          windows: {
            dailyActiveHours:
              ADMIN_USER_METRICS_DAILY_WINDOW_HOURS,

            monthlyActiveDays:
              ADMIN_USER_METRICS_MONTHLY_WINDOW_DAYS,

            liveActiveMinutes:
              ADMIN_USER_METRICS_LIVE_WINDOW_MINUTES,
          },
        };
      },
  };
}