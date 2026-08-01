import type {
  Metadata,
} from "next";

import DashboardManager from "@/features/dashboard/DashboardManager";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardManager />;
}
