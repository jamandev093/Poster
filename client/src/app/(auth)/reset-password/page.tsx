import AuthShell from "@/components/auth/AuthShell";

import {
  ResetPasswordForm,
} from "@/features/auth/AuthForms";

interface ResetPasswordPageProps {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolvedSearchParams =
    await searchParams;

  const token =
    Array.isArray(
      resolvedSearchParams?.token
    )
      ? resolvedSearchParams?.token[0] ?? ""
      : resolvedSearchParams?.token ?? "";

  return (
    <AuthShell
      title="Choose a new password"
      description="Set a new password for your Poster Client account."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}