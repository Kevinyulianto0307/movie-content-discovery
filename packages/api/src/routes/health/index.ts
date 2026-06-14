import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { HealthSchema } from "../../schemas/health.schema.ts";

// Mounted at /health — derived by autoload from the folder path (src/routes/health),
// which sits outside /api on purpose: health is an operational probe (load
// balancers, orchestrators, uptime monitors), not part of the resource API, so it
// stays independent of any future /api versioning. No prefixOverride needed.

// GET /health — assessor smoke-test signal. Returns 200 even when the DB is down;
// the body distinguishes so process supervisors don't treat a blip as a crash.
const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  const health = app.healthRepository;

  app.get(
    "/",
    {
      schema: {
        summary: "Liveness + DB connectivity",
        tags: ["Health"],
        response: { 200: HealthSchema },
      },
    },
    async () => {
      try {
        await health.ping();
        return { status: "ok", db: "connected" };
      } catch {
        return { status: "degraded", db: "unavailable" };
      }
    },
  );
};

export default healthRoutes;
