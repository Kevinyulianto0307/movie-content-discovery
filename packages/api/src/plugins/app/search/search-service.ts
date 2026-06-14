import fp from "fastify-plugin";
import type { SearchQuery } from "../../../schemas/search.schema.ts";
import type { SearchRepository } from "./search-repository.ts";
import { calcOffset, paginatedResponse } from "../../../lib/pagination.ts";

declare module "fastify" {
  interface FastifyInstance {
    searchService: SearchService;
  }
}

export function makeSearchService(repo: SearchRepository) {
  return {
    async search(q: SearchQuery) {
      const [data, total] = await Promise.all([
        repo.search(q.q, q.pageSize, calcOffset(q.page, q.pageSize), q.sort, q.order),
        repo.countSearch(q.q),
      ]);
      return paginatedResponse(data, total, q.page, q.pageSize);
    },
  };
}

export type SearchService = ReturnType<typeof makeSearchService>;

/* v8 ignore start */
export default fp(
  async (fastify) => {
    fastify.decorate("searchService", makeSearchService(fastify.searchRepository));
  },
  { name: "search-service", dependencies: ["search-repository"] },
);
/* v8 ignore stop */
