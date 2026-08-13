// @vitest-environment jsdom

import {
  readFileSync,
} from "node:fs";

import {
  resolve,
} from "node:path";

import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  ClientAccount,
  ClientAccountOrganization,
  UpdateClientOrganizationInput,
} from "./client-account.service";

const accountServiceMocks =
  vi.hoisted(
    () => ({
      getClientAccount:
        vi.fn(),

      updateClientCurrentOrganization:
        vi.fn(),
    })
  );

vi.mock(
  "./client-account.service",
  () => ({
    getClientAccount:
      accountServiceMocks.getClientAccount,

    updateClientCurrentOrganization:
      accountServiceMocks.updateClientCurrentOrganization,
  })
);

import {
  useClientAccount,
} from "./useClientAccount";

function createAccount(
  suffix =
    "1"
): ClientAccount {
  return {
    user: {
      id:
        `user-${suffix}`,

      email:
        `client-${suffix}@example.com`,

      fullName:
        `Client User ${suffix}`,

      status:
        "active",

      rowVersion:
        suffix,
    },

    organization: {
      id:
        `organization-${suffix}`,

      name:
        `Poster Organization ${suffix}`,

      legalName:
        `Poster Organization ${suffix} Private Limited`,

      displayName:
        `Poster Organization ${suffix}`,

      websiteUrl:
        `https://organization-${suffix}.example.com`,

      billingEmail:
        `billing-${suffix}@example.com`,

      countryCode:
        "IN",

      status:
        "active",

      rowVersion:
        suffix,
    },
  };
}

function createUpdateInput():
  UpdateClientOrganizationInput {
  return {
    displayName:
      "Updated Poster Organization",

    legalName:
      "Updated Poster Organization Private Limited",

    websiteUrl:
      "https://updated.example.com",

    billingEmail:
      "billing-updated@example.com",

    countryCode:
      "IN",

    expectedRowVersion:
      "1",
  };
}

beforeEach(
  () => {
    accountServiceMocks
      .getClientAccount
      .mockReset();

    accountServiceMocks
      .updateClientCurrentOrganization
      .mockReset();
  }
);

afterEach(
  () => {
    cleanup();
  }
);

describe(
  "useClientAccount behavior",
  () => {
    it(
      "loads the authenticated Client account from Backend",
      async () => {
        const account =
          createAccount();

        accountServiceMocks
          .getClientAccount
          .mockResolvedValue(
            account
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useClientAccount()
          );

        expect(
          result.current.isLoading
        ).toBe(
          true
        );

        await waitFor(
          () => {
            expect(
              result.current.isLoading
            ).toBe(
              false
            );
          }
        );

        expect(
          result.current.account
        ).toEqual(
          account
        );

        expect(
          result.current.errorMessage
        ).toBeNull();

        expect(
          accountServiceMocks.getClientAccount
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "surfaces an initial Backend Error message",
      async () => {
        accountServiceMocks
          .getClientAccount
          .mockRejectedValue(
            new Error(
              "Account Backend unavailable."
            )
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useClientAccount()
          );

        await waitFor(
          () => {
            expect(
              result.current.isLoading
            ).toBe(
              false
            );
          }
        );

        expect(
          result.current.account
        ).toBeNull();

        expect(
          result.current.errorMessage
        ).toBe(
          "Account Backend unavailable."
        );
      }
    );

    it(
      "fails safely for a non-Error load failure",
      async () => {
        accountServiceMocks
          .getClientAccount
          .mockRejectedValue(
            "unknown failure"
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useClientAccount()
          );

        await waitFor(
          () => {
            expect(
              result.current.isLoading
            ).toBe(
              false
            );
          }
        );

        expect(
          result.current.errorMessage
        ).toBe(
          "Client account could not be loaded."
        );
      }
    );

    it(
      "refreshes the account successfully",
      async () => {
        const initial =
          createAccount(
            "1"
          );

        const refreshed =
          createAccount(
            "2"
          );

        accountServiceMocks
          .getClientAccount
          .mockResolvedValueOnce(
            initial
          )
          .mockResolvedValueOnce(
            refreshed
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useClientAccount()
          );

        await waitFor(
          () => {
            expect(
              result.current.account
            ).toEqual(
              initial
            );
          }
        );

        await act(
          async () => {
            await result.current.refresh();
          }
        );

        expect(
          result.current.account
        ).toEqual(
          refreshed
        );

        expect(
          result.current.isRefreshing
        ).toBe(
          false
        );

        expect(
          result.current.errorMessage
        ).toBeNull();

        expect(
          accountServiceMocks.getClientAccount
        ).toHaveBeenCalledTimes(
          2
        );
      }
    );

    it(
      "preserves last good account when refresh fails",
      async () => {
        const account =
          createAccount();

        accountServiceMocks
          .getClientAccount
          .mockResolvedValueOnce(
            account
          )
          .mockRejectedValueOnce(
            new Error(
              "Refresh failed."
            )
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useClientAccount()
          );

        await waitFor(
          () => {
            expect(
              result.current.account
            ).toEqual(
              account
            );
          }
        );

        await act(
          async () => {
            await result.current.refresh();
          }
        );

        expect(
          result.current.account
        ).toEqual(
          account
        );

        expect(
          result.current.errorMessage
        ).toBe(
          "Refresh failed."
        );

        expect(
          result.current.isRefreshing
        ).toBe(
          false
        );
      }
    );

    it(
      "replaces only organization after successful Backend update",
      async () => {
        const account =
          createAccount();

        const updatedOrganization:
          ClientAccountOrganization = {
          ...account.organization,

          displayName:
            "Updated Poster Organization",

          legalName:
            "Updated Poster Organization Private Limited",

          websiteUrl:
            "https://updated.example.com",

          billingEmail:
            "billing-updated@example.com",

          rowVersion:
            "2",
        };

        accountServiceMocks
          .getClientAccount
          .mockResolvedValue(
            account
          );

        accountServiceMocks
          .updateClientCurrentOrganization
          .mockResolvedValue(
            updatedOrganization
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useClientAccount()
          );

        await waitFor(
          () => {
            expect(
              result.current.account
            ).toEqual(
              account
            );
          }
        );

        const input =
          createUpdateInput();

        await act(
          async () => {
            await result.current
              .updateOrganization(
                input
              );
          }
        );

        expect(
          accountServiceMocks
            .updateClientCurrentOrganization
        ).toHaveBeenCalledWith(
          input
        );

        expect(
          result.current.account?.user
        ).toEqual(
          account.user
        );

        expect(
          result.current.account?.organization
        ).toEqual(
          updatedOrganization
        );

        expect(
          result.current.isSubmitting
        ).toBe(
          false
        );

        expect(
          result.current.errorMessage
        ).toBeNull();

        expect(
          typeof result.current.savedAt
        ).toBe(
          "string"
        );
      }
    );

    it(
      "preserves account and rethrows organization update failure",
      async () => {
        const account =
          createAccount();

        const failure =
          new Error(
            "Organization update failed."
          );

        accountServiceMocks
          .getClientAccount
          .mockResolvedValue(
            account
          );

        accountServiceMocks
          .updateClientCurrentOrganization
          .mockRejectedValue(
            failure
          );

        const {
          result,
        } =
          renderHook(
            () =>
              useClientAccount()
          );

        await waitFor(
          () => {
            expect(
              result.current.account
            ).toEqual(
              account
            );
          }
        );

        let thrown:
          unknown;

        await act(
          async () => {
            try {
              await result.current
                .updateOrganization(
                  createUpdateInput()
                );
            } catch (error) {
              thrown =
                error;
            }
          }
        );

        expect(
          thrown
        ).toBe(
          failure
        );

        expect(
          result.current.account
        ).toEqual(
          account
        );

        expect(
          result.current.errorMessage
        ).toBe(
          "Organization update failed."
        );

        expect(
          result.current.savedAt
        ).toBeNull();

        expect(
          result.current.isSubmitting
        ).toBe(
          false
        );
      }
    );

    it(
      "retains explicit 401 session-expiry safety contract",
      () => {
        const source =
          readFileSync(
            resolve(
              process.cwd(),
              "src/features/account/useClientAccount.ts"
            ),
            "utf8"
          );

        expect(
          source
        ).toMatch(
          /===\s*401/
        );

        expect(
          source
        ).toMatch(
          /clearStoredAuthenticationSession\(\)/
        );

        expect(
          source
        ).toMatch(
          /window\.location\.replace\([\s\S]*?"\/login"[\s\S]*?\)/
        );

        expect(
          source
        ).toContain(
          "Your Client session has expired. Sign in again."
        );
      }
    );
  }
);