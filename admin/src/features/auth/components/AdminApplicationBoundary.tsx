"use client";

import {
  type ReactNode,
  useEffect,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import useAdminAuth from "../hooks/useAdminAuth";

const PUBLIC_ROUTES = [
  "/login",
  "/copyright-request",
  "/advertise",
] as const;

function isPublicRoute(
  pathname: string
) {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`
      )
  );
}

interface AdminApplicationBoundaryProps {
  children: ReactNode;
}

export default function AdminApplicationBoundary({
  children,
}: AdminApplicationBoundaryProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    status,
  } = useAdminAuth();

  const publicRoute =
    isPublicRoute(pathname);

  useEffect(() => {
    if (
      status === "unauthenticated" &&
      !publicRoute
    ) {
      router.replace("/login");
      return;
    }

    if (
      status === "authenticated" &&
      pathname === "/login"
    ) {
      router.replace("/");
      return;
    }

    if (
      status === "forbidden" &&
      pathname !== "/forbidden"
    ) {
      router.replace("/forbidden");
    }
  }, [
    pathname,
    publicRoute,
    router,
    status,
  ]);

  if (publicRoute) {
    return children;
  }

  if (status === "restoring") {
    return (
      <main className="auth-boundary-state">
        <section>
          <span
            className="auth-boundary-spinner"
            aria-hidden="true"
          />

          <h1>
            Restoring Admin session
          </h1>

          <p>
            Verifying the secure Poster
            Admin session.
          </p>
        </section>
      </main>
    );
  }

  if (
    status !== "authenticated"
  ) {
    return null;
  }

  return children;
}
