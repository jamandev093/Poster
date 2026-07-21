import AccountManager from "@/features/account/AccountManager";

export default function AccountPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Organization
          </div>

          <h1 className="pageTitle">
            Account
          </h1>

          <p className="pageDescription">
            Organization, primary contact, and
            notification settings.
          </p>
        </div>
      </header>

      <AccountManager />
    </>
  );
}