import type {
  Metadata,
  Viewport,
} from "next";

import AdminShell from "@/components/admin/AdminShell";

import AdminApplicationBoundary from "@/features/auth/components/AdminApplicationBoundary";
import AdminAuthProvider from "@/features/auth/context/AdminAuthProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Poster Admin",
    template: "%s | Poster Admin",
  },

  description:
    "Operational control panel for Poster.",

  applicationName: "Poster Admin",

  robots: {
    index: false,
    follow: false,
    nocache: true,

    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },

  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AdminAuthProvider>
          <AdminApplicationBoundary>
            <AdminShell>
              {children}
            </AdminShell>
          </AdminApplicationBoundary>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
