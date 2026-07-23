import AccountManager from "@/features/account/AccountManager";

export default function AccountPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Client workspace
          </div>

          <h1 className="pageTitle">
            Account
          </h1>

          <p className="pageDescription">
            Manage the business identity and primary contact connected to
            your Poster Client workspace.
          </p>
        </div>
      </header>

      <AccountManager />
    </>
  );
}