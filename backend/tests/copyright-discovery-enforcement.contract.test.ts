import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";

const readProjectFile = (
  relativePath: string,
): string =>
  readFileSync(
    new URL(
      relativePath,
      import.meta.url,
    ),
    "utf8",
  );

describe(
  "Copyright discovery enforcement contract",
  () => {
    it(
      "links copyright cases to authoritative discovery content",
      () => {
        const migration =
          readProjectFile(
            "../database/migrations/0012_copyright_cases.sql",
          );

        expect(
          migration,
        ).toContain(
          "REFERENCES app.discovery_content",
        );

        expect(
          migration,
        ).toMatch(
          /content_id\s+uuid\s+NOT NULL/i,
        );
      },
    );

    it(
      "removes discovery content with copyright enforcement metadata",
      () => {
        const repository =
          readProjectFile(
            "../src/domains/content-sources/discovery-content.repository.ts",
          );

        expect(
          repository,
        ).toContain(
          "export async function removeDiscoveryContent",
        );

        expect(
          repository,
        ).toContain(
          "status = 'removed'",
        );

        expect(
          repository,
        ).toContain(
          "copyright_case_id",
        );

        expect(
          repository,
        ).toContain(
          "copyright_claimant",
        );

        expect(
          repository,
        ).toContain(
          "AND status = 'removed'",
        );
      },
    );

    it(
      "keeps removed and copyright-blocked content out of AI learning eligibility",
      () => {
        const datasetRepository =
          readProjectFile(
            "../src/application/poster-brain/ai-learning-dataset.repository.ts",
          );

        const snapshotRepository =
          readProjectFile(
            "../src/application/poster-brain/ai-learning-dataset-snapshot-read.repository.ts",
          );

        for (
          const source
          of [
            datasetRepository,
            snapshotRepository,
          ]
        ) {
          expect(
            source,
          ).toContain(
            'case "removed":',
          );

          expect(
            source,
          ).toContain(
            'case "copyright_blocked":',
          );
        }
      },
    );
  },
);