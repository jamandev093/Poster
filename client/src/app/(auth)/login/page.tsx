import AuthShell from "@/components/auth/AuthShell";
import {
  LoginForm,
} from "@/features/auth/AuthForms";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to Client"
      description="Access your organization's requests, campaigns, and performance."
    >
      <LoginForm />
    </AuthShell>
  );
}