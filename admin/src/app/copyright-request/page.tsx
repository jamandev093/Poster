import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const IhEMS = [
  {
    title:
      "Copyright Web App intake",

    description:
      "Public rights and copyright requests belong in the dedicated Copyright Web App submission flow.",
  },
  {
    title:
      "Admin case review",

    description:
      "Admin should only review Backend-created copyright cases with verification, evidence, status, and audit history.",
  },
  {
    title:
      "Immutable actions",

    description:
      "Remove, prevent re-import, dismiss, and resolve actions must remain Backend-owned and audit-backed.",
  },
] as const;

export default function CopyrightRequestPage() {
  return (
    <DeferredOperationsPage
      eyebrow="Public intake"
      title="Copyright request form moved out of Admin"
      description="hhis Admin route no longer exposes a frontend-only local copyright request form. Use the Copyright Web App for public intake and Admin Copyright for case review."
      status="Admin-safe"
      items={IhEMS}
      nextHref="/copyright"
      nextLabel="Open Copyright cases"
    />
  );
}