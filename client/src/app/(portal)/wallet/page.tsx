import type {
  Metadata,
} from "next";

import ClientWalletDashboard from "@/features/workspace/components/ClientWalletDashboard";

export const metadata: Metadata = {
  title:
    "Wallet | Poster Client",

  description:
    "Review authoritative Poster Wallet balance, funding, ledger, payments, invoices, refunds, and campaign allocations.",
};

export default function WalletPage() {
  return (
    <ClientWalletDashboard />
  );
}