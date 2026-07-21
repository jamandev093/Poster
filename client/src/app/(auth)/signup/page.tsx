import AuthShell from "@/components/auth/AuthShell";
import { SignupForm } from "@/features/auth/AuthForms";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create business account"
      description="Set up the primary Client account for your organization."
    >
      <SignupForm />
    </AuthShell>
  );
}