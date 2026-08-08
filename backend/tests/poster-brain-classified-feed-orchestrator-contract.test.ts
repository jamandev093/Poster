import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("Poster Brain classified feed orchestrator contract", () => {
  it("uses classified persistence planning before persistence", () => {
    const source =
      readFileSync(
        new URL(
          "../src/application/poster-brain/feed-ingestion-orchestrator.service.ts",
          import.meta.url
        ),
        "utf8"
      );

    expect(source).toContain(".createClassifiedPersistencePlan(");
    expect(source).not.toContain(".createPersistencePlan(");
  });
});