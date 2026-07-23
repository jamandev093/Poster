import AuthShell from "@/components/auth/AuthShell";

import {
  OrganizationOnboardingForm,
} from "@/features/auth/AuthForms";

export default function OrganizationOnboardingPage() {
  return (
    <AuthShell
      title="Set up your organization"
      description="Add the business details used for advertising requests and billing."
    >
      <OrganizationOnboardingForm />
    </AuthShell>
  );
}