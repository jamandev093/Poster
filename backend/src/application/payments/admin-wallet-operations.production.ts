import {
  readAdminWalletOperationsSnapshot,
} from "./admin-wallet-operations.repository.js";

import {
  createAdminWalletOperationsService,
  type AdminWalletOperationsService,
} from "./admin-wallet-operations.service.js";

export function createProductionAdminWalletOperationsService():
  AdminWalletOperationsService {
  return createAdminWalletOperationsService({
    readSnapshot:
      async () =>
        await readAdminWalletOperationsSnapshot({
          limit:
            25,
        }),
  });
}