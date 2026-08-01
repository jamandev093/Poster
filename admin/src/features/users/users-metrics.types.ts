export interface AdminUserMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  liveActiveUsers: number;
}

export interface AdminUserMetricWindows {
  dailyActiveHours: number;
  monthlyActiveDays: number;
  liveActiveMinutes: number;
}

export interface AdminUserMetricsResponse {
  generatedAt: string;
  windows: AdminUserMetricWindows;
  metrics: AdminUserMetrics;
}
