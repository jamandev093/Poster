import type {
  Metadata,
} from "next";

import WalletDashboard from "@/features/workspace/components/WalletDashboard";

export const metadata:
  Metadata = {
  title:
    "Wallet",
};

export default function WalletPage() {
  return (
    <>
      <header
        className="pageHeader"
      >
        <div>
          <span
            className="pageEyebrow"
          >
            ADVERTISER FUNDING
          </span>

          <h1>
            Wallet
          </h1>

          <p
            className="pageDescription"
          >
            Add funds, manage available balance, and allocate
            controlled allowances to campaigns.
          </p>
        </div>
      </header>

      <WalletDashboard />
    </>
  );
}