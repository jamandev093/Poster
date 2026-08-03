import type {
  AdminWalletOperationsRepositorySnapshot,
  AdminWalletOperationsResponse,
} from "./admin-wallet-operations.types.js";

export interface AdminWalletOperationsService {
  getSnapshot:
    () => Promise<AdminWalletOperationsResponse>;
}

export interface AdminWalletOperationsServiceDependencies {
  readSnapshot:
    () => Promise<AdminWalletOperationsRepositorySnapshot>;

  now?:
    () => Date;
}

function resolveNow(
  dependencies:
    AdminWalletOperationsServiceDependencies
): Date {
  const now =
    dependencies.now?.() ??
    new Date();

  if (
    !Number.isFinite(
      now.getTime()
    )
  ) {
    throw new Error(
      "Admin Wallet Operations generation time is invalid."
    );
  }

  return now;
}

export function createAdminWalletOperationsService(
  dependencies:
    AdminWalletOperationsServiceDependencies
): AdminWalletOperationsService {
  return {
    async getSnapshot() {
      const [
        snapshot,
        generatedAt,
      ] =
        await Promise.all([
          dependencies.readSnapshot(),
          Promise.resolve(
            resolveNow(
              dependencies
            )
          ),
        ]);

      return {
        generatedAt:
          generatedAt.toISOString(),

        ...snapshot,
      };
    },
  };
}