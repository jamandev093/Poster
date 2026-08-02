import {
  InterestTopicDefinition,
} from "../taxonomy.types";

export const BUSINESS_TOPICS:
  readonly InterestTopicDefinition[] = [
  {
      id: "topic-startups",
      slug: "startups",
      name: "Startups",
      description:
        "Young companies building new products, services and business models.",
      domainId: "domain-startups-entrepreneurship",
      categoryId: "category-startups",
      tier: "hub",
      aliases: [
        "startup companies",
      ],
      searchKeywords: [
        "founders",
        "funding",
        "innovation",
        "entrepreneurship",
      ],
      relatedTopicIds: [
        "topic-venture-capital",
        "topic-innovation",
        "topic-finance",
      ],
      status: "active",
      searchable: true,
      selectable: true,
      featured: true,
      onboarding: true,
      onboardingPriority: 8,
      searchPriority: 1,
      trendingPriority: 1,
      recommendationWeight: 1,
    },
  {
      id: "topic-venture-capital",
      slug: "venture-capital",
      name: "Venture Capital",
      description:
        "Investment in high-growth private companies and startups.",
      domainId: "domain-startups-entrepreneurship",
      categoryId: "category-startups",
      parentTopicId: "topic-startups",
      tier: "core",
      aliases: [
        "VC",
        "startup investing",
      ],
      searchKeywords: [
        "investors",
        "fundraising",
        "funding rounds",
        "private markets",
      ],
      relatedTopicIds: [
        "topic-startups",
        "topic-finance",
      ],
      status: "active",
      searchable: true,
      selectable: true,
      featured: true,
      onboarding: false,
      searchPriority: 2,
      recommendationWeight: 0.9,
    },
  {
      id: "topic-finance",
      slug: "finance",
      name: "Finance",
      description:
        "Money, investing, markets and financial systems.",
      domainId: "domain-finance-investing",
      categoryId: "category-finance",
      tier: "hub",
      aliases: [
        "financial markets",
      ],
      searchKeywords: [
        "money",
        "investing",
        "banking",
        "capital",
        "markets",
      ],
      relatedTopicIds: [
        "topic-investing",
        "topic-government-public-policy",
        "topic-venture-capital",
      ],
      status: "active",
      searchable: true,
      selectable: true,
      featured: true,
      onboarding: true,
      onboardingPriority: 9,
      searchPriority: 1,
      trendingPriority: 1,
      recommendationWeight: 1,
    },
  {
      id: "topic-investing",
      slug: "investing",
      name: "Investing",
      description:
        "Allocating capital to assets with the aim of future returns.",
      domainId: "domain-finance-investing",
      categoryId: "category-finance",
      parentTopicId: "topic-finance",
      tier: "core",
      aliases: [
        "investment",
      ],
      searchKeywords: [
        "stocks",
        "bonds",
        "portfolio",
        "markets",
        "wealth",
      ],
      relatedTopicIds: [
        "topic-finance",
        "topic-government-public-policy",
        "topic-venture-capital",
      ],
      status: "active",
      searchable: true,
      selectable: true,
      featured: true,
      onboarding: false,
      searchPriority: 2,
      recommendationWeight: 0.9,
    }
];
