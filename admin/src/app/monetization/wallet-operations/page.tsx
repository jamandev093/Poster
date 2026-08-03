import type {
  Metadata,
} from "next";

import AdminWalletOperationsManager from "@/features/monetization/wallet-operations/AdminWalletOperationsManager";

export const metadata: Metadata = {
  title:
    "Wallet Operations",
};

export default function AdminWalletOperationsPage() {
  return (
    <AdminWalletOperationsManager />
  );
}