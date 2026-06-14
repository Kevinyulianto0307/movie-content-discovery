import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  SearchQuery,
  SearchResponseSchema,
} from "../../../schemas/search.schema.ts";

// Mounted at /api/search — derived by autoload from the folder path.

const searchRoutes: FastifyPluginAsyncZod = async (app) => {
  const search = app.searchService;

  app.get(
    "/",
    {
      schema: {
        summary: "Full-text search across title / overview / tagline",
        tags: ["Search"],
        querystring: SearchQuery,
        response: { 200: SearchResponseSchema },
      },
    },
    async (req) => search.search(req.query),
  );
};

export default searchRoutes;
