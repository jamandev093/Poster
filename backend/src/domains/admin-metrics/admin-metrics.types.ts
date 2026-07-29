export const ADMIN_USER_METRICS_DAILY_WINDOW_HOURS =
  24;

export const ADMIN_USER_METRICS_MONTHLY_WINDOW_DAYS =
  30;

export const ADMIN_USER_METRICS_LIVE_WINDOW_MINUTES =
  5;

export interface ReadAdminUserMetricsInput {
  observedAt: Date;

  dailyActiveSince: Date;

  monthlyActiveSince: Date;

  liveActiveSince: Date;
}

export interface AdminUserMetricCounts {
  totalUsers: number;

  dailyActiveUsers: number;

  monthlyActiveUsers: number;

  liveActiveUsers: number;
}

export interface AdminUserMetricsSnapshot
  extends AdminUserMetricCounts {
  generatedAt: Date;

  windows: {
    dailyActiveHours: number;

    monthlyActiveDays: number;

    liveActiveMinutes: number;
  };
}