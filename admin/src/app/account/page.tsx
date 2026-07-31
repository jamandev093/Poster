import type {
  Metadata,
} from "next";

import AccountProfileManager from "@/features/account/AccountProfileManager";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountPage() {
  return <AccountProfileManager />;
}
