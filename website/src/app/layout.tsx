import type {
  Metadata,
} from "next";

import WebsiteShell from "@/components/site/WebsiteShell";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase:
    new URL(
      "https://getpostar.com"
    ),

  title: {
    default:
      "Poster — Knowledge Discovery",
    template:
      "%s | Poster",
  },

  description:
    "Poster helps people discover useful, relevant information from trusted sources and continue to the original publisher.",

  applicationName:
    "Poster",

  alternates: {
    canonical:
      "https://getpostar.com",
  },

  openGraph: {
    type: "website",

    siteName:
      "Poster",

    title:
      "Poster — Knowledge Discovery",

    description:
      "Discover useful knowledge from trusted sources and continue to the original publisher.",

    url:
      "https://getpostar.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WebsiteShell>
          {children}
        </WebsiteShell>
      </body>
    </html>
  );
}