// @vitest-environment jsdom

import {
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

const authMocks =
  vi.hoisted(() => ({
    loginClient:
      vi.fn(),

    signupClient:
      vi.fn(),

    verifyClientSignupEmail:
      vi.fn(),

    requestClientPasswordReset:
      vi.fn(),

    confirmClientPasswordReset:
      vi.fn(),
  }));

const accountMocks =
  vi.hoisted(() => ({
    getClientAccount:
      vi.fn(),

    updateClientCurrentOrganization:
      vi.fn(),
  }));

const routerMocks =
  vi.hoisted(() => ({
    push:
      vi.fn(),
  }));

vi.mock(
  "./client-auth.service",
  () => ({
    loginClient:
      authMocks.loginClient,

    signupClient:
      authMocks.signupClient,

    verifyClientSignupEmail:
      authMocks.verifyClientSignupEmail,

    requestClientPasswordReset:
      authMocks.requestClientPasswordReset,

    confirmClientPasswordReset:
      authMocks.confirmClientPasswordReset,
  })
);

vi.mock(
  "@/features/account/client-account.service",
  () => ({
    getClientAccount:
      accountMocks.getClientAccount,

    updateClientCurrentOrganization:
      accountMocks.updateClientCurrentOrganization,
  })
);

vi.mock(
  "next/navigation",
  () => ({
    useRouter:
      () => ({
        push:
          routerMocks.push,
      }),
  })
);

import {
  LoginForm,
  SignupForm,
  VerifyEmailForm,
} from "./AuthForms";

function getForm():
  HTMLFormElement {
  const form =
    document.querySelector(
      "form"
    );

  if (
    !(form instanceof HTMLFormElement)
  ) {
    throw new Error(
      "Expected form."
    );
  }

  return form;
}

function getInputById(
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

function getLoginEmailInput():
  HTMLInputElement {
  const form =
    getForm();

  const input =
    form.querySelector(
      'input[type="email"]'
    ) ??
    form.querySelector(
      'input[autocomplete="email"]'
    ) ??
    form.querySelector(
      'input[name="email"]'
    );

  if (
    !(input instanceof HTMLInputElement)
  ) {
    throw new Error(
      "Expected Login email input."
    );
  }

  return input;
}

function getLoginPasswordInput():
  HTMLInputElement {
  const form =
    getForm();

  const input =
    form.querySelector(
      'input[type="password"]'
    ) ??
    form.querySelector(
      'input[autocomplete="current-password"]'
    ) ??
    form.querySelector(
      'input[name="password"]'
    );

  if (
    !(input instanceof HTMLInputElement)
  ) {
    throw new Error(
      "Expected Login password input."
    );
  }

  return input;
}

beforeEach(
  () => {
    authMocks
      .loginClient
      .mockReset();

    authMocks
      .signupClient
      .mockReset();

    authMocks
      .verifyClientSignupEmail
      .mockReset();

    authMocks
      .requestClientPasswordReset
      .mockReset();

    authMocks
      .confirmClientPasswordReset
      .mockReset();

    accountMocks
      .getClientAccount
      .mockReset();

    accountMocks
      .updateClientCurrentOrganization
      .mockReset();

    routerMocks
      .push
      .mockReset();

    window
      .sessionStorage
      .clear();

    authMocks
      .loginClient
      .mockResolvedValue(
        undefined
      );

    authMocks
      .signupClient
      .mockResolvedValue(
        undefined
      );

    authMocks
      .verifyClientSignupEmail
      .mockResolvedValue(
        undefined
      );
  }
);

afterEach(
  () => {
    cleanup();

    window
      .sessionStorage
      .clear();
  }
);

describe(
  "LoginForm behavior",
  () => {
    it(
      "blocks missing email or password before Backend login",
      async () => {
        const user =
          userEvent.setup();

        render(
          <LoginForm />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Sign in",
            }
          )
        );

        expect(
          screen.getByText(
            "Enter your business email and password."
          )
        ).toBeTruthy();

        expect(
          authMocks.loginClient
        ).not.toHaveBeenCalled();

        expect(
          routerMocks.push
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "normalizes email, authenticates through Backend, and opens dashboard",
      async () => {
        const user =
          userEvent.setup();

        render(
          <LoginForm />
        );

        fireEvent.change(
          getLoginEmailInput(),
          {
            target: {
              value:
                "  PERSON@Example.COM  ",
            },
          }
        );

        fireEvent.change(
          getLoginPasswordInput(),
          {
            target: {
              value:
                "StrongPassword1",
            },
          }
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Sign in",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              authMocks.loginClient
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          authMocks.loginClient
        ).toHaveBeenCalledWith({
          email:
            "PERSON@Example.COM",

          password:
            "StrongPassword1",
        });

        expect(
          routerMocks.push
        ).toHaveBeenCalledWith(
          "/dashboard"
        );
      }
    );

    it(
      "surfaces Backend login failure and does not navigate",
      async () => {
        const user =
          userEvent.setup();

        authMocks
          .loginClient
          .mockRejectedValue(
            new Error(
              "Invalid Client credentials."
            )
          );

        render(
          <LoginForm />
        );

        fireEvent.change(
          getLoginEmailInput(),
          {
            target: {
              value:
                "person@example.com",
            },
          }
        );

        fireEvent.change(
          getLoginPasswordInput(),
          {
            target: {
              value:
                "StrongPassword1",
            },
          }
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Sign in",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              screen.getByText(
                "Invalid Client credentials."
              )
            ).toBeTruthy();
          }
        );

        expect(
          routerMocks.push
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "prevents duplicate login while request is pending",
      async () => {
        let resolveLogin:
          (() => void) |
          undefined;

        const pending =
          new Promise<void>(
            resolve => {
              resolveLogin =
                resolve;
            }
          );

        authMocks
          .loginClient
          .mockReturnValue(
            pending
          );

        render(
          <LoginForm />
        );

        fireEvent.change(
          getLoginEmailInput(),
          {
            target: {
              value:
                "person@example.com",
            },
          }
        );

        fireEvent.change(
          getLoginPasswordInput(),
          {
            target: {
              value:
                "StrongPassword1",
            },
          }
        );

        fireEvent.submit(
          getForm()
        );

        await waitFor(
          () => {
            expect(
              authMocks.loginClient
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        const pendingButton =
          screen.getByRole(
            "button",
            {
              name:
                "Signing in...",
            }
          ) as HTMLButtonElement;

        expect(
          pendingButton.disabled
        ).toBe(
          true
        );

        fireEvent.submit(
          getForm()
        );

        expect(
          authMocks.loginClient
        ).toHaveBeenCalledTimes(
          1
        );

        resolveLogin?.();

        await pending;

        await waitFor(
          () => {
            expect(
              routerMocks.push
            ).toHaveBeenCalledWith(
              "/dashboard"
            );
          }
        );
      }
    );
  }
);

describe(
  "SignupForm behavior",
  () => {
    function fillIdentity() {
      fireEvent.change(
        getInputById(
          "signup-name"
        ),
        {
          target: {
            value:
              "  Poster Client  ",
          },
        }
      );

      fireEvent.change(
        getInputById(
          "signup-email"
        ),
        {
          target: {
            value:
              "  CLIENT@Example.COM  ",
          },
        }
      );
    }

    function fillPasswords(
      password:
        string,
      confirmation:
        string
    ) {
      fireEvent.change(
        getInputById(
          "signup-password"
        ),
        {
          target: {
            value:
              password,
          },
        }
      );

      fireEvent.change(
        getInputById(
          "signup-confirmation"
        ),
        {
          target: {
            value:
              confirmation,
          },
        }
      );
    }

    function acceptAuthority() {
      fireEvent.click(
        screen.getByRole(
          "checkbox"
        )
      );
    }

    function submitSignup() {
      fireEvent.submit(
        getForm()
      );
    }

    it(
      "enforces minimum password length",
      async () => {
        render(
          <SignupForm />
        );

        fillIdentity();

        fillPasswords(
          "short",
          "short"
        );

        acceptAuthority();

        submitSignup();

        expect(
          await screen.findByText(
            "Use at least 8 characters for the password."
          )
        ).toBeTruthy();

        expect(
          authMocks.signupClient
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects password mismatch",
      async () => {
        render(
          <SignupForm />
        );

        fillIdentity();

        fillPasswords(
          "StrongPassword1",
          "DifferentPassword1"
        );

        acceptAuthority();

        submitSignup();

        expect(
          await screen.findByText(
            "The passwords do not match."
          )
        ).toBeTruthy();

        expect(
          authMocks.signupClient
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "requires business-account authorization",
      async () => {
        render(
          <SignupForm />
        );

        fillIdentity();

        fillPasswords(
          "StrongPassword1",
          "StrongPassword1"
        );

        submitSignup();

        expect(
          await screen.findByText(
            "Confirm that you are authorized to create this business account."
          )
        ).toBeTruthy();

        expect(
          authMocks.signupClient
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "normalizes identity, creates Backend account, stores signup draft, and opens verification",
      async () => {
        render(
          <SignupForm />
        );

        fillIdentity();

        fillPasswords(
          "StrongPassword1",
          "StrongPassword1"
        );

        acceptAuthority();

        submitSignup();

        await waitFor(
          () => {
            expect(
              authMocks.signupClient
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          authMocks.signupClient
        ).toHaveBeenCalledWith({
          fullName:
            "Poster Client",

          email:
            "client@example.com",

          password:
            "StrongPassword1",
        });

        expect(
          JSON.parse(
            window
              .sessionStorage
              .getItem(
                "poster-client-signup-draft"
              ) ??
              "{}"
          )
        ).toEqual({
          fullName:
            "Poster Client",

          businessEmail:
            "client@example.com",
        });

        expect(
          routerMocks.push
        ).toHaveBeenCalledWith(
          "/verify-email?email=client%40example.com"
        );
      }
    );

    it(
      "does not persist signup draft when Backend account creation fails",
      async () => {
        authMocks
          .signupClient
          .mockRejectedValue(
            new Error(
              "Signup unavailable."
            )
          );

        render(
          <SignupForm />
        );

        fillIdentity();

        fillPasswords(
          "StrongPassword1",
          "StrongPassword1"
        );

        acceptAuthority();

        submitSignup();

        expect(
          await screen.findByText(
            "Signup unavailable."
          )
        ).toBeTruthy();

        expect(
          window
            .sessionStorage
            .getItem(
              "poster-client-signup-draft"
            )
        ).toBeNull();

        expect(
          routerMocks.push
        ).not.toHaveBeenCalled();
      }
    );
  }
);

describe(
  "VerifyEmailForm behavior",
  () => {
    it(
      "rejects verification when signup email context is missing",
      async () => {
        const user =
          userEvent.setup();

        render(
          <VerifyEmailForm />
        );

        await user.type(
          getInputById(
            "verification-code"
          ),
          "123456"
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Verify email",
            }
          )
        );

        expect(
          screen.getByText(
            "Open the verification link from the same signup flow or sign up again."
          )
        ).toBeTruthy();

        expect(
          authMocks
            .verifyClientSignupEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "keeps only six numeric verification characters",
      () => {
        render(
          <VerifyEmailForm
            email="client@example.com"
          />
        );

        fireEvent.change(
          getInputById(
            "verification-code"
          ),
          {
            target: {
              value:
                "12a34b56789",
            },
          }
        );

        expect(
          getInputById(
            "verification-code"
          ).value
        ).toBe(
          "123456"
        );
      }
    );

    it(
      "requires exactly six verification digits",
      async () => {
        render(
          <VerifyEmailForm
            email="client@example.com"
          />
        );

        fireEvent.change(
          getInputById(
            "verification-code"
          ),
          {
            target: {
              value:
                "12345",
            },
          }
        );

        fireEvent.submit(
          getForm()
        );

        expect(
          await screen.findByText(
            "Enter the 6-digit verification code."
          )
        ).toBeTruthy();

        expect(
          authMocks
            .verifyClientSignupEmail
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "normalizes email, verifies through Backend, and opens organization setup",
      async () => {
        render(
          <VerifyEmailForm
            email="  CLIENT@Example.COM  "
          />
        );

        fireEvent.change(
          getInputById(
            "verification-code"
          ),
          {
            target: {
              value:
                "123456",
            },
          }
        );

        fireEvent.submit(
          getForm()
        );

        await waitFor(
          () => {
            expect(
              authMocks
                .verifyClientSignupEmail
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          authMocks
            .verifyClientSignupEmail
        ).toHaveBeenCalledWith({
          email:
            "client@example.com",

          token:
            "123456",
        });

        expect(
          routerMocks.push
        ).toHaveBeenCalledWith(
          "/onboarding/organization"
        );
      }
    );

    it(
      "shows resend guidance and clears it after code editing",
      async () => {
        const user =
          userEvent.setup();

        render(
          <VerifyEmailForm
            email="client@example.com"
          />
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Resend code",
            }
          )
        );

        expect(
          screen
            .getByRole(
              "status"
            )
            .textContent
        ).toBe(
          "Use the latest verification code from your email."
        );

        fireEvent.change(
          getInputById(
            "verification-code"
          ),
          {
            target: {
              value:
                "1",
            },
          }
        );

        expect(
          screen.queryByRole(
            "status"
          )
        ).toBeNull();
      }
    );

    it(
      "surfaces Backend verification failure without navigation",
      async () => {
        authMocks
          .verifyClientSignupEmail
          .mockRejectedValue(
            new Error(
              "Verification code expired."
            )
          );

        render(
          <VerifyEmailForm
            email="client@example.com"
          />
        );

        fireEvent.change(
          getInputById(
            "verification-code"
          ),
          {
            target: {
              value:
                "123456",
            },
          }
        );

        fireEvent.submit(
          getForm()
        );

        expect(
          await screen.findByText(
            "Verification code expired."
          )
        ).toBeTruthy();

        expect(
          routerMocks.push
        ).not.toHaveBeenCalled();
      }
    );
  }
);