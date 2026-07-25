import type { Metadata } from "next";
import type { ReactNode } from "react";

import CopyrightShell from "@/components/CopyrightShell";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://copyright.getpostar.com"
  ),

  title: {
    default: "Poster Copyright & Rights",
    template: "%s | Poster Copyright & Rights",
  },

  description:
    "Find Poster content, submit copyright and rights concerns, request bulk review, and check the status of an existing claim.",

  applicationName:
    "Poster Copyright & Rights",

  alternates: {
    canonical:
      "https://copyright.getpostar.com",
  },

  openGraph: {
    type: "website",

    siteName:
      "Poster Copyright & Rights",

    title:
      "Poster Copyright & Rights",

    description:
      "Submit and track copyright and rights concerns relating to content discovered through Poster.",

    url:
      "https://copyright.getpostar.com",
  },

  robots: {
    index: false,
    follow: false,
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <CopyrightShell>
          {children}
        </CopyrightShell>
      </body>
    </html>
  );
}