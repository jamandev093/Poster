import {
  getDatabasePool,
} from "../../database/database.pool.js";

import {
  createPostgresMobileEngagementRepository,
} from "../../domains/mobile-engagement/index.js";

import {
  createMobileEngagementService,
  type MobileEngagementService,
} from "./mobile-engagement.service.js";

export function createProductionMobileEngagementService():
  MobileEngagementService {
  return createMobileEngagementService(
    createPostgresMobileEngagementRepository(
      getDatabasePool()
    )
  );
}
