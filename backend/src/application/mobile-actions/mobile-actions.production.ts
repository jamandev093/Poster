import {
  getDatabasePool,
} from "../../database/database.pool.js";

import {
  createPostgresMobileUserActionsRepository,
} from "../../domains/mobile-actions/index.js";

import {
  createMobileUserActionsService,
  type MobileUserActionsService,
} from "./mobile-actions.service.js";

export function createProductionMobileUserActionsService():
  MobileUserActionsService {
  return createMobileUserActionsService(
    createPostgresMobileUserActionsRepository(
      getDatabasePool()
    )
  );
}
