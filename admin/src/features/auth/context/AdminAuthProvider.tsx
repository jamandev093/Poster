"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  AdminAuthenticatedIdentity,
  AdminAuthStatus,
  AdminLoginInput,
} from "../contracts/auth.types";

import {
  AdminApiError,
  loadAdminAccess,
  loginAdmin,
  logoutAdmin,
  refreshAdminSession,
} from "../services/auth-api.service";

export interface AdminAuthContextValue {
  status: AdminAuthStatus;
  identity:
    AdminAuthenticatedIdentity | null;
  errorMessage: string | null;

  updateAccountName:
    (fullName: string) => void;

  login:
    (
      input: AdminLoginInput
    ) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

export const AdminAuthContext =
  createContext<
    AdminAuthContextValue | null
  >(null);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export default function AdminAuthProvider({
  children,
}: AdminAuthProviderProps) {
  const [
    status,
    setStatus,
  ] = useState<AdminAuthStatus>(
    "restoring"
  );

  const [
    identity,
    setIdentity,
  ] =
    useState<
      AdminAuthenticatedIdentity | null
    >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(null);

  const establishIdentity =
    useCallback(
      async (
        authentication:
          Awaited<
            ReturnType<
              typeof refreshAdminSession
            >
          >
      ) => {
        const access =
          await loadAdminAccess(
            authentication.accessToken
          );

        setIdentity({
          account:
            authentication.data.account,

          session:
            authentication.data.session,

          access,

          accessToken:
            authentication.accessToken,

          accessTokenExpiresAt:
            authentication
              .accessTokenExpiresAt,
        });

        setStatus("authenticated");
        setErrorMessage(null);
      },
      []
    );

  const restore =
    useCallback(async () => {
      setStatus("restoring");
      setErrorMessage(null);

      try {
        const authentication =
          await refreshAdminSession();

        await establishIdentity(
          authentication
        );
      } catch (error) {
        setIdentity(null);

        if (
          error instanceof
            AdminApiError &&
          error.status === 403
        ) {
          setStatus("forbidden");
          return;
        }

        setStatus("unauthenticated");
      }
    }, [establishIdentity]);

  useEffect(() => {
    const restoreTimer =
      window.setTimeout(() => {
        void restore();
      }, 0);

    return () => {
      window.clearTimeout(
        restoreTimer
      );
    };
  }, [restore]);

  const login =
    useCallback(
      async (
        input: AdminLoginInput
      ) => {
        setStatus("restoring");
        setErrorMessage(null);

        try {
          const authentication =
            await loginAdmin(input);

          await establishIdentity(
            authentication
          );
        } catch (error) {
          setIdentity(null);

          if (
            error instanceof
              AdminApiError
          ) {
            if (error.status === 403) {
              setStatus("forbidden");
            } else {
              setStatus(
                "unauthenticated"
              );
            }

            setErrorMessage(
              error.message
            );

            return;
          }

          setStatus("unauthenticated");

          setErrorMessage(
            "The Admin login request could not be completed."
          );
        }
      },
      [establishIdentity]
    );

  const updateAccountName =
    useCallback(
      (
        fullName: string
      ) => {
        setIdentity(
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,

              account: {
                ...current.account,
                fullName,
              },

              access: {
                ...current.access,

                account: {
                  ...current.access.account,
                  fullName,
                },
              },
            };
          }
        );
      },
      []
    );

  const logout =
    useCallback(async () => {
      try {
        await logoutAdmin();
      } finally {
        setIdentity(null);
        setStatus("unauthenticated");
        setErrorMessage(null);
      }
    }, []);

  const value =
    useMemo<
      AdminAuthContextValue
    >(
      () => ({
        status,
        identity,
        errorMessage,
        updateAccountName,
        login,
        logout,
        restore,
      }),
      [
        status,
        identity,
        errorMessage,
        updateAccountName,
        login,
        logout,
        restore,
      ]
    );

  return (
    <AdminAuthContext.Provider
      value={value}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}


