import type {
  FastifyPluginAsync
} from "fastify";

interface ServiceStatusResponse {
  status:
    | "ok"
    | "ready";

  service: string;

  environment: string;

  timestamp: string;
}

export const healthRoutes:
  FastifyPluginAsync =
  async (app) => {
    app.get(
      "/health",
      async (): Promise<ServiceStatusResponse> => ({
        status: "ok",
        service: "poster-backend",
        environment:
          process.env.NODE_ENV ??
          "development",
        timestamp:
          new Date().toISOString()
      })
    );

    app.get(
      "/ready",
      async (): Promise<ServiceStatusResponse> => ({
        status: "ready",
        service: "poster-backend",
        environment:
          process.env.NODE_ENV ??
          "development",
        timestamp:
          new Date().toISOString()
      })
    );
  };