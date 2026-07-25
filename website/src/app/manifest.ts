import type {
  MetadataRoute,
} from "next";

export default function manifest():
  MetadataRoute.Manifest {
  return {
    name:
      "Poster — Knowledge Discovery",

    short_name:
      "Poster",

    description:
      "Discover useful, relevant knowledge from trusted sources and continue directly to the original publisher.",

    start_url:
      "/",

    scope:
      "/",

    display:
      "browser",

    background_color:
      "#eef2fb",

    theme_color:
      "#eef2fb",

    lang:
      "en",

    categories: [
      "education",
      "news",
      "productivity",
    ],
  };
}