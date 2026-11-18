import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { renderDashboardHtml } from "../views/dashboard.html";

export const uiRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const sendApp = (_req: unknown, reply: any) => {
    reply
      .header("Cache-Control", "no-cache, no-store, must-revalidate")
      .type("text/html; charset=utf-8")
      .send(renderDashboardHtml());
  };

  app.get("/", sendApp);
  app.get("/login", sendApp);
  app.get("/queue", sendApp);
  app.get("/records", sendApp);
};
