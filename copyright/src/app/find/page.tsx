import FindContentMatcher from "@/features/copyright/FindContentMatcher";

export default function FindYourContentPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Copyright
          </div>

          <h1 className="pageTitle">
            Find Your Content
          </h1>

          <p className="pageDescription">
            Check whether content you already know
            about has an exact corresponding record
            in Poster. Enter a Poster Content ID,
            Poster URL, or original-source URL that
            you already possess.
          </p>
        </div>
      </header>

      <FindContentMatcher />
    </>
  );
}