import type { Metadata } from "next";

import AdminShell from "@/components/admin/AdminShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Poster Admin",
  description: "Operational control panel for Poster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
