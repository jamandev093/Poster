// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

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
} from "./client-account.service";

import type {
  UseClientAccountResult,
} from "./useClientAccount";

const hookMocks =
  vi.hoisted(
    () => ({
      useClientAccount:
        vi.fn(),
    })
  );

const authMocks =
  vi.hoisted(
    () => ({
      logoutClient:
        vi.fn(),
    })
  );

const routerMocks =
  vi.hoisted(
    () => ({
      replace:
        vi.fn(),
    })
  );

vi.mock(
  "./useClientAccount",
  () => ({
    useClientAccount:
      hookMocks.useClientAccount,
  })
);

vi.mock(
  "@/features/auth/client-auth.service",
  () => ({
    logoutClient:
      authMocks.logoutClient,
  })
);

vi.mock(
  "next/navigation",
  () => ({
    useRouter:
      () => ({
        replace:
          routerMocks.replace,
      }),
  })
);

import AccountManager from "./AccountManager";

function createAccount():
  ClientAccount {
  return {
    user: {
      id:
        "user-1",

      email:
        "client@example.com",

      fullName:
        "Primary Client",

      status:
        "active",

      rowVersion:
        "3",
    },

    organization: {
      id:
        "organization-1",

      name:
        "Poster Labs",

      displayName:
        "Poster Labs",

      legalName:
        "Poster Labs Private Limited",

      websiteUrl:
        "https://poster.example.com",

      billingEmail:
        "billing@poster.example.com",

      countryCode:
        "IN",

      status:
        "active",

      rowVersion:
        "7",
    },
  };
}

function createAccountState(
  overrides:
    Partial<UseClientAccountResult> = {}
): UseClientAccountResult {
  return {
    account:
      createAccount(),

    isLoading:
      false,

    isRefreshing:
      false,

    isSubmitting:
      false,

    errorMessage:
      null,

    savedAt:
      null,

    refresh:
      vi.fn(
        async () => {}
      ),

    updateOrganization:
      vi.fn(
        async () => {}
      ),

    ...overrides,
  };
}

function getInput(
  id:
    string
): HTMLInputElement {
  const input =
    document.getElementById(
      id
    );

  if (
    !(input instanceof HTMLInputElement)
  ) {
    throw new Error(
      `Expected input #${id}.`
    );
  }

  return input;
}

beforeEach(
  () => {
    hookMocks
      .useClientAccount
      .mockReset();

    authMocks
      .logoutClient
      .mockReset();

    routerMocks
      .replace
      .mockReset();

    hookMocks
      .useClientAccount
      .mockReturnValue(
        createAccountState()
      );

    authMocks
      .logoutClient
      .mockResolvedValue(
        undefined
      );
  }
);

afterEach(
  () => {
    cleanup();
  }
);

describe(
  "AccountManager behavior",
  () => {
    it(
      "renders Backend loading boundary",
      () => {
        hookMocks
          .useClientAccount
          .mockReturnValue(
            createAccountState({
              account:
                null,

              isLoading:
                true,
            })
          );

        render(
          <AccountManager />
        );

        expect(
          screen.getByText(
            "Loading Client account from Backend..."
          )
        ).toBeTruthy();
      }
    );

    it(
      "renders load failure and retries",
      async () => {
        const user =
          userEvent.setup();

        const refresh =
          vi.fn(
            async () => {}
          );

        hookMocks
          .useClientAccount
          .mockReturnValue(
            createAccountState({
              account:
                null,

              errorMessage:
                "Account request failed.",

              refresh,
            })
          );

        render(
          <AccountManager />
        );

        expect(
          screen
            .getByRole(
              "alert"
            )
            .textContent
        ).toContain(
          "Account request failed."
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Retry",
            }
          )
        );

        expect(
          refresh
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "maps Backend organization and read-only primary Client fields",
      () => {
        render(
          <AccountManager />
        );

        expect(
          getInput(
            "organization-name"
          ).value
        ).toBe(
          "Poster Labs"
        );

        expect(
          getInput(
            "organization-legal-name"
          ).value
        ).toBe(
          "Poster Labs Private Limited"
        );

        expect(
          getInput(
            "organization-website"
          ).value
        ).toBe(
          "https://poster.example.com"
        );

        expect(
          getInput(
            "organization-country"
          ).value
        ).toBe(
          "IN"
        );

        expect(
          getInput(
            "billing-email"
          ).value
        ).toBe(
          "billing@poster.example.com"
        );

        expect(
          getInput(
            "contact-name"
          ).readOnly
        ).toBe(
          true
        );

        expect(
          getInput(
            "business-email"
          ).readOnly
        ).toBe(
          true
        );
      }
    );

    it(
      "normalizes organization mutation and sends Backend row version",
      async () => {
        const updateOrganization =
          vi.fn(
            async () => {}
          );

        hookMocks
          .useClientAccount
          .mockReturnValue(
            createAccountState({
              updateOrganization,
            })
          );

        render(
          <AccountManager />
        );

        fireEvent.change(
          getInput(
            "organization-name"
          ),
          {
            target: {
              value:
                "  Updated Poster Labs  ",
            },
          }
        );

        fireEvent.change(
          getInput(
            "organization-legal-name"
          ),
          {
            target: {
              value:
                "   ",
            },
          }
        );

        fireEvent.change(
          getInput(
            "organization-website"
          ),
          {
            target: {
              value:
                "  https://updated.example.com  ",
            },
          }
        );

        fireEvent.change(
          getInput(
            "organization-country"
          ),
          {
            target: {
              value:
                "us",
            },
          }
        );

        fireEvent.change(
          getInput(
            "billing-email"
          ),
          {
            target: {
              value:
                "  billing-updated@example.com  ",
            },
          }
        );

        const form =
          document.querySelector(
            "form"
          );

        if (
          !(form instanceof HTMLFormElement)
        ) {
          throw new Error(
            "Expected account form."
          );
        }

        fireEvent.submit(
          form
        );

        await waitFor(
          () => {
            expect(
              updateOrganization
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          updateOrganization
        ).toHaveBeenCalledWith({
          displayName:
            "Updated Poster Labs",

          legalName:
            "Updated Poster Labs",

          websiteUrl:
            "https://updated.example.com",

          billingEmail:
            "billing-updated@example.com",

          countryCode:
            "US",

          expectedRowVersion:
            "7",
        });

        expect(
          screen
            .getByRole(
              "status"
            )
            .textContent
        ).toContain(
          "Account changes saved"
        );
      }
    );

    it(
      "resets edited organization fields",
      async () => {
        const user =
          userEvent.setup();

        render(
          <AccountManager />
        );

        const input =
          getInput(
            "organization-name"
          );

        fireEvent.change(
          input,
          {
            target: {
              value:
                "Temporary Name",
            },
          }
        );

        expect(
          input.value
        ).toBe(
          "Temporary Name"
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Reset",
            }
          )
        );

        expect(
          input.value
        ).toBe(
          "Poster Labs"
        );
      }
    );

    it(
      "blocks submission for missing required values or row version",
      () => {
        render(
          <AccountManager />
        );

        const save =
          screen.getByRole(
            "button",
            {
              name:
                "Save changes",
            }
          ) as HTMLButtonElement;

        expect(
          save.disabled
        ).toBe(
          false
        );

        fireEvent.change(
          getInput(
            "organization-name"
          ),
          {
            target: {
              value:
                "   ",
            },
          }
        );

        expect(
          save.disabled
        ).toBe(
          true
        );

        cleanup();

        const account =
          createAccount();

        account.organization.rowVersion =
          "";

        hookMocks
          .useClientAccount
          .mockReturnValue(
            createAccountState({
              account,
            })
          );

        render(
          <AccountManager />
        );

        expect(
          (
            screen.getByRole(
              "button",
              {
                name:
                  "Save changes",
              }
            ) as HTMLButtonElement
          ).disabled
        ).toBe(
          true
        );
      }
    );

    it(
      "signs out through Backend and redirects to login",
      async () => {
        const user =
          userEvent.setup();

        render(
          <AccountManager />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Sign out",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              authMocks.logoutClient
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          routerMocks.replace
        ).toHaveBeenCalledWith(
          "/login"
        );
      }
    );

    it(
      "surfaces Backend sign-out failure without redirect",
      async () => {
        const user =
          userEvent.setup();

        authMocks
          .logoutClient
          .mockRejectedValue(
            new Error(
              "Logout failed."
            )
          );

        render(
          <AccountManager />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Sign out",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              screen.getByText(
                "Sign out could not be completed"
              )
            ).toBeTruthy();
          }
        );

        expect(
          screen.getByText(
            "Logout failed."
          )
        ).toBeTruthy();

        expect(
          routerMocks.replace
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "uses safe fallback for non-Error sign-out rejection",
      async () => {
        const user =
          userEvent.setup();

        authMocks
          .logoutClient
          .mockRejectedValue(
            "unknown logout failure"
          );

        render(
          <AccountManager />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Sign out",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              screen.getByText(
                "Poster could not sign you out. Please try again."
              )
            ).toBeTruthy();
          }
        );

        expect(
          routerMocks.replace
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "prevents duplicate sign-out while pending",
      async () => {
        let resolveLogout:
          (() => void) |
          undefined;

        const pending =
          new Promise<void>(
            resolve => {
              resolveLogout =
                resolve;
            }
          );

        authMocks
          .logoutClient
          .mockReturnValue(
            pending
          );

        render(
          <AccountManager />
        );

        const button =
          screen.getByRole(
            "button",
            {
              name:
                "Sign out",
            }
          ) as HTMLButtonElement;

        fireEvent.click(
          button
        );

        expect(
          authMocks.logoutClient
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          button.disabled
        ).toBe(
          true
        );

        fireEvent.click(
          button
        );

        expect(
          authMocks.logoutClient
        ).toHaveBeenCalledTimes(
          1
        );

        await act(
          async () => {
            resolveLogout?.();

            await pending;
          }
        );

        await waitFor(
          () => {
            expect(
              routerMocks.replace
            ).toHaveBeenCalledWith(
              "/login"
            );
          }
        );
      }
    );
  }
);