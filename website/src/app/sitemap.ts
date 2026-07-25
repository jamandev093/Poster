import type { MetadataRoute } from "next";

const BASE_URL = "https://getpostar.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/how-it-works",
    "/get-app",
    "/publishers",
    "/advertisers",
    "/copyright",
    "/contact",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency:
      route === ""
        ? "weekly"
        : route === "/privacy" || route === "/terms"
          ? "yearly"
          : "monthly",
    priority:
      route === ""
        ? 1
        : route === "/get-app" ||
            route === "/how-it-works" ||
            route === "/publishers" ||
            route === "/advertisers" ||
            route === "/copyright"
          ? 0.8
          : 0.6,
  }));
}