import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  PosterBrainContentSourcesRouteService,
} from "../src/routes/poster-brain-content-sources.routes.js";

describe(
  "Poster Brain content sources app wiring",
  () => {
    let app:
      Awaited<ReturnType<typeof buildApp>> |
      null =
      null;

    afterEach(
      async () => {
        await app?.close();
        app =
          null;
      }
    );

    it(
      "rejects unauthenticated app-level source list requests before service execution",
      async () => {
        const service:
          PosterBrainContentSourcesRouteService = {
          listSources: async () => {
            throw new Error(
              "listSources should not run without authentication"
            );
          },

          requestIngestionRun: async () => {
            throw new Error(
              "requestIngestionRun should not run without authentication"
            );
          },
        };

        app =
          await buildApp({
            posterBrainContentSourcesService:
              service,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/poster-brain/sources",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );
      }
    );

    it(
      "rejects unauthenticated app-level ingestion run requests before service execution",
      async () => {
        const service:
          PosterBrainContentSourcesRouteService = {
          listSources: async () => {
            throw new Error(
              "listSources should not run without authentication"
            );
          },

          requestIngestionRun: async () => {
            throw new Error(
              "requestIngestionRun should not run without authentication"
            );
          },
        };

        app =
          await buildApp({
            posterBrainContentSourcesService:
              service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/poster-brain/sources/ingestion-runs",

            payload: {
              maxSources:
                1,

              force:
                false,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );
      }
    );
  }
);