import AuthShell from "@/components/auth/AuthShell";
import { VerifyEmailForm } from "@/features/auth/AuthForms";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Verify business email"
      description="Enter the 6-digit code sent to your email."
    >
      <VerifyEmailForm email={params.email} />
    </AuthShell>
  );
}