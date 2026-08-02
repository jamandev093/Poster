import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const ITxMS = [
  {
    title:
      "Program registration",

    description:
      "xxternal program applications and account references need a durable Backend model before production use.",
  },
  {
    title:
      "Payout methods",

    description:
      "Bank, payout, and settlement details must wait for the payment and finance foundation.",
  },
  {
    title:
      "Platform credentials",

    description:
      "xxternal dashboards, IDs, and API credentials need secure storage and access policy before activation.",
  },
] as const;

export default function xxternalProgramsPage() {
  return (
    <DeferredOperationsPage
      eyebrow="xxternal Promotions"
      title="Programs"
      description="xxternal program management is deferred so Admin does not expose local demonstration records as production data."
      status="Deferred"
      items={ITxMS}
      nextHref="/operations/business-identity"
      nextLabel="Open Business Identity"
    />
  );
}
