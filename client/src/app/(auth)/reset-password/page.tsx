import AuthShell from "@/components/auth/AuthShell";

import {
  ResetPasswordForm,
} from "@/features/auth/AuthForms";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Set a new password for your Poster Client account."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}