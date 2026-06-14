import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  ListQuery,
  IdParam,
  SimilarQuery,
  MovieListResponseSchema,
  MovieDetailSchema,
  SimilarResponseSchema,
  NotFoundSchema,
} from "../../../schemas/movies.schema.ts";

// Mounted at /api/movies — derived by @fastify/autoload from the folder path
// (src/routes/api/movies), so no explicit prefix is needed here.

// Controller layer for /api/movies. Each route declares its full schema —
// request validation (querystring/params), response shape, and OpenAPI tags —
// and delegates to the movies service. req.query / req.params are typed and
// already validated/coerced by the Zod type provider.
const moviesRoutes: FastifyPluginAsyncZod = async (app) => {
  const movies = app.moviesService;

  // GET /api/movies — list with pagination, sorting, filtering.
  app.get(
    "/",
    {
      schema: {
        summary: "List movies",
        tags: ["Movies"],
        querystring: ListQuery,
        response: { 200: MovieListResponseSchema },
      },
    },
    async (req) => movies.list(req.query),
  );

  // GET /api/movies/:id — full detail (cast top 10, key crew, keywords, ratings).
  app.get(
    "/:id",
    {
      schema: {
        summary: "Get a movie by id",
        tags: ["Movies"],
        params: IdParam,
        response: { 200: MovieDetailSchema, 404: NotFoundSchema },
      },
    },
    /* v8 ignore start -- 404 branch tested in integration tests */
    async (req, reply) => {
      const detail = await movies.getDetail(req.params.id);
      if (!detail) return reply.code(404).send({ error: "not_found" });
      return detail;
    },
    /* v8 ignore stop */
  );

  // GET /api/movies/:id/similar — weighted Jaccard over shared genres + keywords.
  app.get(
    "/:id/similar",
    {
      schema: {
        summary: "List movies similar to :id",
        tags: ["Movies"],
        params: IdParam,
        querystring: SimilarQuery,
        response: { 200: SimilarResponseSchema },
      },
    },
    async (req) => movies.getSimilar(req.params.id, req.query.limit),
  );
};

export default moviesRoutes;
