import type { ReactNode } from "react";

import ClientShell from "@/components/client/ClientShell";

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({
  children,
}: PortalLayoutProps) {
  return <ClientShell>{children}</ClientShell>;
}