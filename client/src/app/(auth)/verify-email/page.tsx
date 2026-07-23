import AuthShell from "@/components/auth/AuthShell";

import {
  VerifyEmailForm,
} from "@/features/auth/AuthForms";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params =
    await searchParams;

  return (
    <AuthShell
      title="Verify your email"
      description="Confirm the business email connected to your Client account."
    >
      <VerifyEmailForm
        email={
          params.email
        }
      />
    </AuthShell>
  );
}