import type {
  Metadata,
} from "next";

import ClientWalletRecordsPage from "@/features/workspace/components/ClientWalletRecordsPage";

export const metadata: Metadata = {
  title:
    "Payments | Poster Client",

  description:
    "Review authoritative Poster Client Wallet and payment records from the Backend.",
};

export default function Page() {
  return (
    <ClientWalletRecordsPage
      view="payments"
    />
  );
}