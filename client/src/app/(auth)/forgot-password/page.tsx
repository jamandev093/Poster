import AuthShell from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/AuthForms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Password help"
      description="Enter the business email connected to your account."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}