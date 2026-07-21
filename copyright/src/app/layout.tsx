import type { Metadata } from "next";
import type { ReactNode } from "react";

import CopyrightShell from "@/components/CopyrightShell";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Copyright | Poster",
    template: "%s | Poster Copyright",
  },
  description:
    "Submit and track copyright requests relating to content discovered through Poster.",
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