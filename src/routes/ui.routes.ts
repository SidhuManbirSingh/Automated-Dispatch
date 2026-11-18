import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { renderDashboardHtml } from "../views/dashboard.html";

export const uiRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/", async (_req, reply) => {
    reply
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .type("text/html; charset=utf-8")
      .send(renderDashboardHtml());
  });
};
