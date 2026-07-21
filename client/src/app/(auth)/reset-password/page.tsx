import AuthShell from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/features/auth/AuthForms";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Create new password"
      description="Choose a secure password for your Client account."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}