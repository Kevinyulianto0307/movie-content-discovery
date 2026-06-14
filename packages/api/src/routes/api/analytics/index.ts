import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  AnalyticsQuery,
  TopGenresResponseSchema,
} from "../../../schemas/analytics.schema.ts";

// Mounted at /api/analytics — derived by autoload from the folder path.

const analyticsRoutes: FastifyPluginAsyncZod = async (app) => {
  const analytics = app.analyticsService;

  app.get(
    "/top-genres",
    {
      schema: {
        summary:
          "Genre popularity by decade or year, with avg revenue + rating",
        tags: ["Analytics"],
        querystring: AnalyticsQuery,
        response: { 200: TopGenresResponseSchema },
      },
    },
    async (req) => analytics.topGenres(req.query),
  );
};

export default analyticsRoutes;
