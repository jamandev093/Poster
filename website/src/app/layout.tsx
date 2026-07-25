import type {
  Metadata,
  Viewport,
} from "next";

import WebsiteShell from "@/components/site/WebsiteShell";

import "./globals.css";

const SITE_URL =
  "https://getpostar.com";

const SITE_NAME =
  "Poster";

const SITE_DESCRIPTION =
  "Poster helps people discover useful, relevant information from trusted sources and continue to the original publisher.";

export const metadata: Metadata = {
  metadataBase:
    new URL(SITE_URL),

  title: {
    default:
      "Poster — Knowledge Discovery",
    template:
      "%s | Poster",
  },

  description:
    SITE_DESCRIPTION,

  applicationName:
    SITE_NAME,

  category:
    "Knowledge discovery",

  keywords: [
    "Poster",
    "knowledge discovery",
    "trusted sources",
    "personalized discovery",
    "information discovery",
    "original publishers",
    "content discovery",
    "learning",
    "search",
    "trending information",
  ],

  authors: [
    {
      name:
        SITE_NAME,
      url:
        SITE_URL,
    },
  ],

  creator:
    SITE_NAME,

  publisher:
    SITE_NAME,

  referrer:
    "origin-when-cross-origin",

  formatDetection: {
    email:
      false,
    address:
      false,
    telephone:
      false,
  },

  robots: {
    index:
      true,
    follow:
      true,
    nocache:
      false,

    googleBot: {
      index:
        true,
      follow:
        true,
      noimageindex:
        false,
      "max-video-preview":
        -1,
      "max-image-preview":
        "large",
      "max-snippet":
        -1,
    },
  },

  openGraph: {
    type:
      "website",

    locale:
      "en_US",

    siteName:
      SITE_NAME,

    title:
      "Poster — Knowledge Discovery",

    description:
      "Discover useful knowledge from trusted sources and continue directly to the original publisher.",
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Poster — Knowledge Discovery",

    description:
      "Discover useful knowledge from trusted sources and continue directly to the original publisher.",
  },

  other: {
    "theme-color":
      "#eef2fb",
  },
};

export const viewport: Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  themeColor:
    "#eef2fb",

  colorScheme:
    "light",
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