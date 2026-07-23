import AuthShell from "@/components/auth/AuthShell";

import {
  SignupForm,
} from "@/features/auth/AuthForms";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create Client account"
      description="Create the primary business account. Organization setup follows email verification."
    >
      <SignupForm />
    </AuthShell>
  );
}