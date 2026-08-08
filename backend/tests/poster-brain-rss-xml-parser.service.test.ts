import { describe, expect, it } from "vitest";

import {
  createPosterBrainRssIngestionService,
} from "../src/application/poster-brain/index.js";

import {
  parsePosterBrainRssXml,
  type PosterBrainRssSource,
} from "../src/domains/poster-brain/index.js";

const source: PosterBrainRssSource = {
  sourceKey: "example-news",
  sourceName: "Example News",
  homepageUrl: "https://example.com",
  feedUrl: "https://example.com/rss.xml",
  publisherName: "Example News",
  defaultLanguage: "en",
  defaultRegion: "IN",
  acquisitionMethod: "authorized_rss",
};

describe("Poster Brain RSS XML parser", () => {
  it("parses RSS item XML into raw ingestion items", () => {
    const items =
      parsePosterBrainRssXml(`
        <rss version="2.0">
          <channel>
            <item>
              <guid>rss-1</guid>
              <title><![CDATA[RSS &amp; AI update]]></title>
              <link>https://example.com/rss-story?utm_source=newsletter</link>
              <description><![CDATA[<p>RSS story excerpt.</p>]]></description>
              <pubDate>Sat, 08 Aug 2026 10:00:00 GMT</pubDate>
              <dc:creator>Reporter One</dc:creator>
              <category>AI</category>
              <category>Policy</category>
              <media:content url="https://example.com/image.jpg" />
            </item>
          </channel>
        </rss>
      `);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      guid: "rss-1",
      title: "RSS & AI update",
      link: "https://example.com/rss-story?utm_source=newsletter",
      description: "<p>RSS story excerpt.</p>",
      publishedAt: "Sat, 08 Aug 2026 10:00:00 GMT",
      author: "Reporter One",
      imageUrl: "https://example.com/image.jpg",
    });
    expect(items[0]?.categories).toEqual([
      "AI",
      "Policy",
    ]);
  });

  it("parses Atom entry XML into raw ingestion items", () => {
    const items =
      parsePosterBrainRssXml(`
        <feed>
          <entry>
            <id>atom-1</id>
            <title>Atom Story</title>
            <link href="https://example.com/atom-story" />
            <summary>Atom excerpt.</summary>
            <published>2026-08-08T10:00:00Z</published>
            <updated>2026-08-08T11:00:00Z</updated>
            <author><name>Reporter Two</name></author>
            <category term="Technology" />
          </entry>
        </feed>
      `);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      guid: "atom-1",
      title: "Atom Story",
      link: "https://example.com/atom-story",
      summary: "Atom excerpt.",
      publishedAt: "2026-08-08T10:00:00Z",
      updatedAt: "2026-08-08T11:00:00Z",
      author: "Reporter Two",
    });
    expect(items[0]?.categories).toEqual([
      "Technology",
    ]);
  });

  it("parses XML and normalizes it through the RSS ingestion service", () => {
    const service =
      createPosterBrainRssIngestionService();

    const result =
      service.parseFeedXml({
        source,
        xml: `
          <rss version="2.0">
            <channel>
              <item>
                <guid>rss-service-1</guid>
                <title>Service Story</title>
                <link>https://example.com/service-story/?utm_campaign=test</link>
                <description>Service excerpt.</description>
                <category>Discovery</category>
              </item>
            </channel>
          </rss>
        `,
      });

    expect(result.rejected).toHaveLength(0);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({
      externalContentId: "example-news:guid:rss-service-1",
      title: "Service Story",
      excerpt: "Service excerpt.",
      originalUrl: "https://example.com/service-story",
      canonicalUrl: "https://example.com/service-story",
      publisherName: "Example News",
    });
    expect(result.accepted[0]?.tags).toEqual([
      "Discovery",
    ]);
  });
});
