import type {
  Metadata,
  Viewport,
} from "next";

import type {
  ReactNode,
} from "react";

import "./globals.css";

const CLIENT_URL =
  "https://client.getpostar.com";

export const metadata: Metadata = {
  metadataBase:
    new URL(CLIENT_URL),

  title: {
    default:
      "Poster Client",
    template:
      "%s | Poster Client",
  },

  description:
    "Manage advertising requests, approved campaigns, delivery, and performance through Poster.",

  applicationName:
    "Poster Client",

  robots: {
    index:
      false,
    follow:
      false,
    nocache:
      true,

    googleBot: {
      index:
        false,
      follow:
        false,
      noimageindex:
        true,
      "max-video-preview":
        0,
      "max-image-preview":
        "none",
      "max-snippet":
        0,
    },
  },

  referrer:
    "no-referrer",

  formatDetection: {
    email:
      false,
    address:
      false,
    telephone:
      false,
  },

  other: {
    "theme-color":
      "#f8fafc",
  },
};

export const viewport: Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  themeColor:
    "#f8fafc",

  colorScheme:
    "light",
};

interface RootLayoutProps {
  children:
    ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}