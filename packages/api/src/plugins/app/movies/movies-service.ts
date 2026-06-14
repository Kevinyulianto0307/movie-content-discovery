import fp from "fastify-plugin";
import type { ListQuery } from "../../../schemas/movies.schema.ts";
import type { MoviesRepository } from "./movies-repository.ts";
import { calcOffset, paginatedResponse } from "../../../lib/pagination.ts";

declare module "fastify" {
  interface FastifyInstance {
    moviesService: MoviesService;
  }
}

// Application logic for the movies aggregate. This is the layer that orchestrates
// repository calls and shapes results — the "presenter" in MVP terms. The route
// (controller) stays thin: validate input, call a service method, set status.
//
// Search and analytics have no orchestration beyond a single query, so their
// routes call their repositories directly rather than adding a passthrough
// service — a deliberate choice to keep ceremony proportional to the logic.
export function makeMoviesService(repo: MoviesRepository) {
  return {
    // List with pagination, sorting and filtering. Runs the page query and the
    // matching count in parallel and returns the standard list envelope.
    async list(q: ListQuery) {
      const filters = {
        yearFrom: q.yearFrom,
        yearTo: q.yearTo,
        minVoteCount: q.minVoteCount,
        genre: q.genre,
      };
      const [data, total] = await Promise.all([
        repo.listMovies({
          ...filters,
          sort: q.sort,
          order: q.order,
          limit: q.pageSize,
          offset: calcOffset(q.page, q.pageSize),
        }),
        repo.countMovies(filters),
      ]);
      return paginatedResponse(data, total, q.page, q.pageSize);
    },

    // Full detail: fans out across the six per-movie queries in parallel, then
    // composes the DTO. Returns null when the movie doesn't exist so the route can
    // map it to a 404.
    async getDetail(id: number) {
      const [movieRows, genreRows, cast, crew, kw, ratingStats] =
        await Promise.all([
          repo.getMovieById(id),
          repo.getGenres(id),
          repo.getCast(id),
          repo.getCrew(id),
          repo.getKeywords(id),
          repo.getRatingStats(id),
        ]);

      /* v8 ignore next -- 404 case tested in integration */
      if (!movieRows[0]) return null;

      return {
        ...movieRows[0],
        genres: genreRows,
        cast,
        crew,
        keywords: kw,
        /* v8 ignore next -- getRatingStats always returns a row */
        ratings: ratingStats[0] ?? { average: null, count: 0 },
      };
    },

    /* v8 ignore next -- simple pass-through, tested via integration */
    async getSimilar(id: number, limit: number) {
      return { data: await repo.getSimilar(id, limit) };
    },
  };
}

export type MoviesService = ReturnType<typeof makeMoviesService>;

// Fastify adapter: decorate the service, built from the movies repository.
/* v8 ignore start */
export default fp(
  async (fastify) => {
    fastify.decorate("moviesService", makeMoviesService(fastify.moviesRepository));
  },
  { name: "movies-service", dependencies: ["movies-repository"] },
);
/* v8 ignore stop */
