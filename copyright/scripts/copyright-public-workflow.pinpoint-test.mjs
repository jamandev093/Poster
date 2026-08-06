import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath,
} from "node:url";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

const root =
  path.resolve(
    __dirname,
    ".."
  );

function read(
  relativePath
) {
  return fs.readFileSync(
    path.join(
      root,
      relativePath
    ),
    "utf8"
  );
}

function exists(
  relativePath
) {
  return fs.existsSync(
    path.join(
      root,
      relativePath
    )
  );
}

function listFiles(
  directory
) {
  const entries =
    fs.readdirSync(
      directory,
      {
        withFileTypes:
          true,
      }
    );

  const files =
    [];

  for (
    const entry of entries
  ) {
    const absolutePath =
      path.join(
        directory,
        entry.name
      );

    if (
      absolutePath.includes(
        `${path.sep}node_modules${path.sep}`
      ) ||
      absolutePath.includes(
        `${path.sep}.next${path.sep}`
      )
    ) {
      continue;
    }

    if (
      entry.isDirectory()
    ) {
      files.push(
        ...listFiles(
          absolutePath
        )
      );
    } else {
      files.push(
        absolutePath
      );
    }
  }

  return files;
}

function readSourceFiles() {
  return listFiles(
    path.join(
      root,
      "src"
    )
  )
    .filter(
      file =>
        /\.(ts|tsx|css)$/.test(
          file
        )
    )
    .map(
      file => ({
        absolutePath:
          file,

        relativePath:
          path.relative(
            root,
            file
          ),

        content:
          fs.readFileSync(
            file,
            "utf8"
          ),
      })
    );
}

function assertIncludes(
  relativePath,
  token,
  message
) {
  const content =
    read(
      relativePath
    );

  assert.ok(
    content.includes(
      token
    ),
    message ??
      `${relativePath} should include ${token}`
  );
}

function assertNotIncludes(
  relativePath,
  token,
  message
) {
  const content =
    read(
      relativePath
    );

  assert.ok(
    !content.includes(
      token
    ),
    message ??
      `${relativePath} should not include ${token}`
  );
}

function assertAllSourceFilesExclude(
  token
) {
  const offenders =
    readSourceFiles()
      .filter(
        file =>
          file.content.includes(
            token
          )
      )
      .map(
        file =>
          file.relativePath
      );

  assert.deepEqual(
    offenders,
    [],
    `Source files must not include stale token ${token}. Found in: ${offenders.join(", ")}`
  );
}

const tests =
  [];

function test(
  name,
  fn
) {
  tests.push({
    name,
    fn,
  });
}

test(
  "expected public Copyright app routes exist",
  () => {
    [
      "src/app/page.tsx",
      "src/app/request/page.tsx",
      "src/app/status/page.tsx",
      "src/app/bulk-removal/page.tsx",
      "src/app/find/page.tsx",
      "src/app/submitted/page.tsx",
      "src/app/policy/page.tsx",
    ].forEach(
      relativePath =>
        assert.ok(
          exists(
            relativePath
          ),
          `${relativePath} should exist`
        )
    );
  }
);

test(
  "public Copyright API service exposes all four Backend endpoints",
  () => {
    const file =
      "src/features/copyright/public-copyright.service.ts";

    [
      "submitPublicCopyrightClaim",
      "submitPublicBulkRemoval",
      "lookupPublicCopyrightStatus",
      "lookupPublicCopyrightContentMatches",
      "/api/v1/public/copyright/claims",
      "/api/v1/public/copyright/bulk-removal",
      "/api/v1/public/copyright/status",
      "/api/v1/public/copyright/content-match",
      "method:",
      '"POST"',
      '"content-type"',
      '"application/json"',
      "PublicCopyrightClaimError",
      "NEXT_PUBLIC_POSTER_API_BASE_URL",
      "NEXT_PUBLIC_API_BASE_URL",
    ].forEach(
      token =>
        assertIncludes(
          file,
          token
        )
    );
  }
);

test(
  "single claim form uses Backend submission and Backend reference redirect",
  () => {
    const file =
      "src/features/copyright/CopyrightClaimForm.tsx";

    [
      "submitPublicCopyrightClaim",
      "await submitPublicCopyrightClaim",
      "isSubmitting",
      "setIsSubmitting",
      "goodFaith",
      "accurate",
      "authorized",
      "legalName",
      "role=\"alert\"",
      "disabled={isSubmitting}",
      "/submitted?reference=",
      "claim.reference",
    ].forEach(
      token =>
        assertIncludes(
          file,
          token
        )
    );

    assertNotIncludes(
      file,
      "/submitted?type=claim&count=1"
    );

    assertNotIncludes(
      file,
      "CR-DEMO"
    );
  }
);

test(
  "bulk removal form uses Backend submission, limits, declarations, and Backend reference redirect",
  () => {
    const file =
      "src/features/copyright/BulkRemovalForm.tsx";

    [
      "submitPublicBulkRemoval",
      "await submitPublicBulkRemoval",
      "MAX_BULK_ITEMS",
      "MAX_FILE_SIZE_BYTES",
      "1024 * 1024",
      "isSubmitting",
      "setIsSubmitting",
      "goodFaith",
      "accurate",
      "authorized",
      "legalName",
      "role=\"alert\"",
      "disabled={isSubmitting}",
      "/submitted?reference=",
      "bulkRequest.reference",
      "bulkRequest.itemCount",
    ].forEach(
      token =>
        assertIncludes(
          file,
          token
        )
    );

    assertNotIncludes(
      file,
      "/submitted?type=bulk&count=${selectedCount}"
    );

    assertNotIncludes(
      file,
      "CR-DEMO"
    );
  }
);

test(
  "status page uses Backend lookup and does not render private case fields",
  () => {
    const file =
      "src/app/status/page.tsx";

    [
      "lookupPublicCopyrightStatus",
      "await lookupPublicCopyrightStatus",
      "No matching copyright request was found with those details.",
      "isLoading",
      "setIsLoading",
      "role=\"alert\"",
      "disabled={isLoading}",
      "Claim reference",
      "Verification",
      "Re-import protection",
      "SignalContact",
    ].forEach(
      token =>
        assertIncludes(
          file,
          token
        )
    );

    [
      "DEMO_CLAIMS",
      "CR-DEMO",
      "claim.email",
      "claim.claimantBusinessEmail",
      "claim.claimantName",
      "claim.legalName",
      "claim.rowVersion",
      "claim.sourceId",
      "claim.actorUserId",
      "claim.storageObjectKey",
      "claim.sha256Digest",
    ].forEach(
      token =>
        assertNotIncludes(
          file,
          token
        )
    );
  }
);

test(
  "find matcher uses Backend exact lookup and preserves single/bulk deep links",
  () => {
    const file =
      "src/features/copyright/FindContentMatcher.tsx";

    [
      "lookupPublicCopyrightContentMatches",
      "await lookupPublicCopyrightContentMatches",
      "exact_match",
      "not_found",
      "invalid",
      "duplicate",
      "MAX_IDENTIFIERS",
      "isLoading",
      "role=\"alert\"",
      "/request?content=",
      "/bulk-removal?items=",
      "does not expose a searchable public content",
    ].forEach(
      token =>
        assertIncludes(
          file,
          token
        )
    );

    [
      "DEMO_CONTENT",
      "CR-DEMO",
      "rowVersion",
      "sourceId",
      "internal UUID",
    ].forEach(
      token =>
        assertNotIncludes(
          file,
          token
        )
    );
  }
);

test(
  "submitted page displays Backend references and rejects demo references",
  () => {
    const file =
      "src/app/submitted/page.tsx";

    [
      "normalizeReference",
      "^CR-[0-9]{4,}$",
      "reference",
      "Check status",
      "Your claim was received",
      "Your bulk request was received",
    ].forEach(
      token =>
        assertIncludes(
          file,
          token
        )
    );

    assertNotIncludes(
      file,
      "CR-DEMO"
    );
  }
);

test(
  "official Signal contact comes from public Business Identity service",
  () => {
    [
      "src/components/SignalContact.tsx",
      "src/features/business-identity/use-public-business-identity.ts",
      "src/features/business-identity/public-business-identity.service.ts",
    ].forEach(
      relativePath =>
        assert.ok(
          exists(
            relativePath
          ),
          `${relativePath} should exist`
        )
    );

    assertIncludes(
      "src/components/SignalContact.tsx",
      "usePublicBusinessIdentity"
    );

    assertIncludes(
      "src/features/business-identity/public-business-identity.service.ts",
      "/api/v1/public/business-identity"
    );

    assertIncludes(
      "src/features/business-identity/public-business-identity.service.ts",
      "NEXT_PUBLIC_POSTER_API_BASE_URL"
    );
  }
);

test(
  "stale demo and frontend-only workflow tokens are absent from Copyright source",
  () => {
    [
      "DEMO_",
      "DEMO_CONTENT",
      "DEMO_CLAIMS",
      "CR-DEMO",
      "temporary until backend integration",
      "Frontend-only demonstration",
      "/submitted?type=claim&count=1",
      "/submitted?type=bulk&count=${selectedCount}",
      "TODO",
      "FIXME",
      "coming soon",
    ].forEach(
      token =>
        assertAllSourceFilesExclude(
          token
        )
    );
  }
);

test(
  "public workflow files do not expose internal backend-only fields in UI result paths",
  () => {
    const displayFiles =
      [
        "src/app/status/page.tsx",
        "src/app/submitted/page.tsx",
        "src/features/copyright/FindContentMatcher.tsx",
      ];

    for (
      const file of displayFiles
    ) {
      [
        "claimantBusinessEmail",
        "actorUserId",
        "storageObjectKey",
        "sha256Digest",
        "resolvedByUserId",
      ].forEach(
        token =>
          assertNotIncludes(
            file,
            token
          )
      );
    }
  }
);

let failures =
  0;

for (
  const entry of tests
) {
  try {
    entry.fn();
    console.log(
      `PASS ${entry.name}`
    );
  } catch (
    error
  ) {
    failures +=
      1;

    console.error(
      `FAIL ${entry.name}`
    );

    console.error(
      error instanceof Error
        ? error.message
        : String(
            error
          )
    );
  }
}

console.log(
  ""
);

console.log(
  `Pinpoint tests completed: ${tests.length - failures}/${tests.length} passed.`
);

if (
  failures > 0
) {
  process.exitCode =
    1;
}