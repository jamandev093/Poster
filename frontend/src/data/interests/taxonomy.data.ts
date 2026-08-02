import {
  InterestTaxonomy,
} from "./taxonomy.types";

import {
  INTEREST_DOMAINS,
} from "./taxonomy.domains";

import {
  INTEREST_CATEGORIES,
} from "./taxonomy.hubs";

import {
  INTEREST_TOPICS,
} from "./topics/allTopics";

export {
  INTEREST_DOMAINS,
  INTEREST_CATEGORIES,
  INTEREST_TOPICS,
};

export const interestTaxonomyData:
  InterestTaxonomy = {
    version: 6,

    domains:
      INTEREST_DOMAINS,

    categories:
      INTEREST_CATEGORIES,

    topics:
      INTEREST_TOPICS,
  };