import AuthShell from "@/components/auth/AuthShell";
import {
  OrganizationOnboardingForm,
} from "@/features/auth/AuthForms";

export default function OrganizationOnboardingPage() {
  return (
    <AuthShell
      title="Complete organization"
      description="Add the business details needed for requests and billing."
    >
      <OrganizationOnboardingForm />
    </AuthShell>
  );
}