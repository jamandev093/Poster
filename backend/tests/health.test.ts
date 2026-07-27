import type {
  FastifyInstance
} from "fastify";

import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";

import {
  buildApp
} from "../src/app.js";

describe(
  "Poster Backend health routes",
  () => {
    let app:
      FastifyInstance | null =
      null;

    afterEach(
      async () => {
        if (app) {
          await app.close();

          app =
            null;
        }
      }
    );

    it(
      "returns a healthy service response",
      async () => {
        app =
          await buildApp();

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/health"
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
        ).toMatchObject({
          status:
            "ok",

          service:
            "poster-backend"
        });
      }
    );

    it(
      "returns a structured not-found response",
      async () => {
        app =
          await buildApp();

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/unknown"
          });

        expect(
          response.statusCode
        ).toBe(
          404
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "ROUTE_NOT_FOUND"
          }
        });
      }
    );
  }
);