import type {
  PosterBrainRawRssItem,
} from "./rss-ingestion.types.js";

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

const XML_ENTITY_MAP =
  new Map<string, string>([
    ["amp", "&"],
    ["lt", "<"],
    ["gt", ">"],
    ["quot", '"'],
    ["apos", "'"],
    ["nbsp", " "],
  ]);

function escapeRegExp(
  value: string
): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCdata(
  value: string
): string {
  return value.replace(
    /<!\[CDATA\[([\s\S]*?)\]\]>/g,
    "$1"
  );
}

function decodeXmlEntities(
  value: string
): string {
  return value.replace(
    /&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi,
    (_, entity: string) => {
      const key =
        entity.toLowerCase();

      if (key.startsWith("#x")) {
        return String.fromCodePoint(
          Number.parseInt(key.slice(2), 16)
        );
      }

      if (key.startsWith("#")) {
        return String.fromCodePoint(
          Number.parseInt(key.slice(1), 10)
        );
      }

      return XML_ENTITY_MAP.get(key) ?? `&${entity};`;
    }
  );
}

function normalizeXmlText(
  value: string
): string {
  return decodeXmlEntities(stripCdata(value))
    .replace(/\s+/g, " ")
    .trim();
}

function getBlocks(
  xml: string,
  tagName: string
): string[] {
  const escaped =
    escapeRegExp(tagName);

  const regex =
    new RegExp(
      `<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`,
      "gi"
    );

  const blocks: string[] =
    [];

  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1] ?? "");
  }

  return blocks;
}

function getFirstElementText(
  block: string,
  tagName: string
): string | undefined {
  const escaped =
    escapeRegExp(tagName);

  const regex =
    new RegExp(
      `<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`,
      "i"
    );

  const match =
    regex.exec(block);

  if (!match?.[1]) {
    return undefined;
  }

  const normalized =
    normalizeXmlText(match[1]);

  return normalized || undefined;
}

function getFirstMatchingText(
  block: string,
  tagNames: readonly string[]
): string | undefined {
  for (const tagName of tagNames) {
    const value =
      getFirstElementText(block, tagName);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getTagAttributeValues(
  block: string,
  tagName: string,
  attributeName: string
): string[] {
  const escapedTag =
    escapeRegExp(tagName);

  const escapedAttribute =
    escapeRegExp(attributeName);

  const tagRegex =
    new RegExp(`<${escapedTag}\\b([^>]*)>`, "gi");

  const attributeRegex =
    new RegExp(
      `${escapedAttribute}\\s*=\\s*("([^"]*)"|'([^']*)')`,
      "i"
    );

  const values: string[] =
    [];

  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(block)) !== null) {
    const attributes =
      match[1] ?? "";

    const attributeMatch =
      attributeRegex.exec(attributes);

    const rawValue =
      attributeMatch?.[2] ??
      attributeMatch?.[3];

    if (!rawValue) {
      continue;
    }

    const value =
      normalizeXmlText(rawValue);

    if (value) {
      values.push(value);
    }
  }

  return values;
}

function getFirstTagAttribute(
  block: string,
  tagNames: readonly string[],
  attributeName: string
): string | undefined {
  for (const tagName of tagNames) {
    const value =
      getTagAttributeValues(
        block,
        tagName,
        attributeName
      )[0];

    if (value) {
      return value;
    }
  }

  return undefined;
}

function getCategoryValues(
  block: string
): readonly string[] {
  const values: string[] =
    [];

  for (const value of getBlocks(block, "category")) {
    const normalized =
      normalizeXmlText(value);

    if (normalized) {
      values.push(normalized);
    }
  }

  values.push(
    ...getTagAttributeValues(block, "category", "term")
  );

  const seen =
    new Set<string>();

  const deduped: string[] =
    [];

  for (const value of values) {
    const key =
      value.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(value);
  }

  return deduped;
}

function getAuthor(
  block: string
): string | undefined {
  const creator =
    getFirstElementText(block, "dc:creator");

  if (creator) {
    return creator;
  }

  const authorBlock =
    getBlocks(block, "author")[0] ?? "";

  const atomAuthorName =
    getFirstElementText(authorBlock, "name");

  if (atomAuthorName) {
    return atomAuthorName;
  }

  return getFirstElementText(block, "author");
}

function parseItemBlock(
  block: string
): PosterBrainRawRssItem {
  const item: Mutable<PosterBrainRawRssItem> =
    {};

  const guid =
    getFirstMatchingText(block, ["guid", "id"]);

  const title =
    getFirstMatchingText(block, ["title"]);

  const link =
    getFirstMatchingText(block, ["link"]) ??
    getFirstTagAttribute(block, ["link"], "href");

  const canonicalUrl =
    getFirstTagAttribute(
      block,
      ["atom:link", "link"],
      "href"
    );

  const description =
    getFirstMatchingText(block, [
      "description",
      "subtitle",
    ]);

  const summary =
    getFirstMatchingText(block, [
      "summary",
      "media:description",
    ]);

  const publishedAt =
    getFirstMatchingText(block, [
      "pubDate",
      "published",
      "publishedAt",
    ]);

  const updatedAt =
    getFirstMatchingText(block, [
      "updated",
      "updatedAt",
      "lastBuildDate",
    ]);

  const author =
    getAuthor(block);

  const imageUrl =
    getFirstTagAttribute(
      block,
      ["media:content", "media:thumbnail", "enclosure"],
      "url"
    );

  const categories =
    getCategoryValues(block);

  if (guid) {
    item.guid = guid;
  }

  if (title) {
    item.title = title;
  }

  if (link) {
    item.link = link;
  }

  if (canonicalUrl && canonicalUrl !== link) {
    item.canonicalUrl = canonicalUrl;
  }

  if (description) {
    item.description = description;
  }

  if (summary) {
    item.summary = summary;
  }

  if (publishedAt) {
    item.publishedAt = publishedAt;
  }

  if (updatedAt) {
    item.updatedAt = updatedAt;
  }

  if (author) {
    item.author = author;
  }

  if (categories.length > 0) {
    item.categories = categories;
  }

  if (imageUrl) {
    item.imageUrl = imageUrl;
  }

  return item;
}

export function parsePosterBrainRssXml(
  xml: string
): readonly PosterBrainRawRssItem[] {
  const rssItems =
    getBlocks(xml, "item");

  if (rssItems.length > 0) {
    return rssItems.map(parseItemBlock);
  }

  return getBlocks(xml, "entry").map(parseItemBlock);
}
