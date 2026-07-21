import AuthShell from "@/components/auth/AuthShell";
import { LoginForm } from "@/features/auth/AuthForms";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Open your organization’s Client workspace."
    >
      <LoginForm />
    </AuthShell>
  );
}