import type {
  Metadata,
  Viewport,
} from "next";

import AdminShell from "@/components/admin/AdminShell";

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
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
