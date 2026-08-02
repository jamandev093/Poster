import * as SecureStore from "expo-secure-store";

const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN:
    "poster.auth.access-token",

  REFRESH_TOKEN:
    "poster.auth.refresh-token",
} as const;

export interface AuthTokens {
  accessToken: string;

  refreshToken: string;
}

function normalizeToken(
  value: string
): string {
  return value.trim();
}

async function ensureSecureStorageAvailable(): Promise<void> {
  const available =
    await SecureStore.isAvailableAsync();

  if (!available) {
    throw new Error(
      "Secure authentication storage is unavailable on this platform."
    );
  }
}

class AuthService {
  private mutationQueue:
    Promise<void> =
    Promise.resolve();

  private runMutation<T>(
    mutation: () => Promise<T>
  ): Promise<T> {
    const operation =
      this.mutationQueue.then(
        mutation
      );

    this.mutationQueue =
      operation.then(
        () => undefined,
        () => undefined
      );

    return operation;
  }

  async saveTokens(
    tokens: AuthTokens
  ): Promise<void> {
    const accessToken =
      normalizeToken(
        tokens.accessToken
      );

    const refreshToken =
      normalizeToken(
        tokens.refreshToken
      );

    if (
      !accessToken ||
      !refreshToken
    ) {
      throw new Error(
        "Valid access and refresh tokens are required."
      );
    }

    await this.runMutation(
      async () => {
        await ensureSecureStorageAvailable();

        try {
          await SecureStore.setItemAsync(
            AUTH_STORAGE_KEYS.ACCESS_TOKEN,
            accessToken,
            {
              keychainAccessible:
                SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );

          await SecureStore.setItemAsync(
            AUTH_STORAGE_KEYS.REFRESH_TOKEN,
            refreshToken,
            {
              keychainAccessible:
                SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            }
          );
        } catch (error) {
          await Promise.allSettled([
            SecureStore.deleteItemAsync(
              AUTH_STORAGE_KEYS.ACCESS_TOKEN
            ),

            SecureStore.deleteItemAsync(
              AUTH_STORAGE_KEYS.REFRESH_TOKEN
            ),
          ]);

          throw error;
        }
      }
    );
  }

  async getAccessToken(): Promise<
    string | null
  > {
    await this.mutationQueue;

    await ensureSecureStorageAvailable();

    return SecureStore.getItemAsync(
      AUTH_STORAGE_KEYS.ACCESS_TOKEN
    );
  }

  async getRefreshToken(): Promise<
    string | null
  > {
    await this.mutationQueue;

    await ensureSecureStorageAvailable();

    return SecureStore.getItemAsync(
      AUTH_STORAGE_KEYS.REFRESH_TOKEN
    );
  }

  async getTokens(): Promise<
    AuthTokens | null
  > {
    await this.mutationQueue;

    await ensureSecureStorageAvailable();

    const [
      accessToken,
      refreshToken,
    ] = await Promise.all([
      SecureStore.getItemAsync(
        AUTH_STORAGE_KEYS.ACCESS_TOKEN
      ),

      SecureStore.getItemAsync(
        AUTH_STORAGE_KEYS.REFRESH_TOKEN
      ),
    ]);

    if (
      !accessToken ||
      !refreshToken
    ) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  async hasSession(): Promise<boolean> {
    const tokens =
      await this.getTokens();

    return tokens !== null;
  }

  async clearSession(): Promise<void> {
    await this.runMutation(
      async () => {
        await ensureSecureStorageAvailable();

        await Promise.all([
          SecureStore.deleteItemAsync(
            AUTH_STORAGE_KEYS.ACCESS_TOKEN
          ),

          SecureStore.deleteItemAsync(
            AUTH_STORAGE_KEYS.REFRESH_TOKEN
          ),
        ]);
      }
    );
  }
}

export default new AuthService();