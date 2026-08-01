export interface DashboardUserMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  liveActiveUsers: number;
}

export interface DashboardMetricWindows {
  dailyActiveHours: number;
  monthlyActiveDays: number;
  liveActiveMinutes: number;
}

export interface DashboardSummary {
  generatedAt: string;

  users: {
    windows: DashboardMetricWindows;
    metrics: DashboardUserMetrics;
  };
}

export type DashboardLoadState =
  | "loading"
  | "ready"
  | "error";
