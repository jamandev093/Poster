import {
  adminAuthenticatedRequest,
} from "@/features/auth/services/auth-api.service";

import type {
  DashboardSummary,
} from "../contracts/dashboard-summary.types";

export async function loadDashboardSummary(
  accessToken: string
): Promise<DashboardSummary> {
  return await adminAuthenticatedRequest<
    DashboardSummary
  >(
    "/admin/dashboard/summary",
    accessToken,
    {
      method: "GET",
    }
  );
}
