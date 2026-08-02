import {
  InterestTopicDefinition,
} from "../taxonomy.types";

import {
  TECHNOLOGY_TOPICS,
} from "./technology.topics";

import {
  SCIENCE_TOPICS,
} from "./science.topics";

import {
  HEALTH_TOPICS,
} from "./health.topics";

import {
  BUSINESS_TOPICS,
} from "./business.topics";

import {
  GOVERNMENT_TOPICS,
} from "./government.topics";

import {
  ENVIRONMENT_TOPICS,
} from "./environment.topics";

import {
  SOCIETY_TOPICS,
} from "./society.topics";

import {
  HUMANITIES_TOPICS,
} from "./humanities.topics";

import {
  CREATIVE_LIFESTYLE_TOPICS,
} from "./creativeLifestyle.topics";

import {
  SPORTS_TRAVEL_TOPICS,
} from "./sportsTravel.topics";

export const INTEREST_TOPICS:
  readonly InterestTopicDefinition[] = [
    ...TECHNOLOGY_TOPICS,
    ...SCIENCE_TOPICS,
    ...HEALTH_TOPICS,
    ...BUSINESS_TOPICS,
    ...GOVERNMENT_TOPICS,
    ...ENVIRONMENT_TOPICS,
    ...SOCIETY_TOPICS,
    ...HUMANITIES_TOPICS,
    ...CREATIVE_LIFESTYLE_TOPICS,
    ...SPORTS_TRAVEL_TOPICS,
  ];