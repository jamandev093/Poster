import AuthShell from "@/components/auth/AuthShell";

import {
  ForgotPasswordForm,
} from "@/features/auth/AuthForms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter the business email connected to your Client account."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}