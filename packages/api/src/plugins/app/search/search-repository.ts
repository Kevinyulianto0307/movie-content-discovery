import fp from "fastify-plugin";
import { sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@mcd/db";
import { SearchResultItemSchema } from "../../../schemas/search.schema.ts";
import type { SearchResultItem } from "../../../schemas/search.schema.ts";
import { parseRows, parseFirstRow } from "../../../lib/sql-result.ts";

export type SearchSortField = 'relevance' | 'title' | 'release_date' | 'vote_average' | 'revenue';
export type SearchSortOrder = 'asc' | 'desc';

declare module "fastify" {
  interface FastifyInstance {
    searchRepository: SearchRepository;
  }
}

// Maps sort field names to SQL column expressions.
const sortColumnMap: Record<SearchSortField, SQL> = {
  relevance: sql`rank`,
  title: sql`title`,
  release_date: sql`release_date`,
  vote_average: sql`vote_average`,
  revenue: sql`revenue`,
};

// Full-text search over the weighted tsvector, ranked by ts_rank. plainto_tsquery
// handles raw user input safely (no operator parsing, no escaping needed).
export function makeSearchRepository(db: Db) {
  return {
    async search(
      q: string,
      limit: number,
      offset: number,
      sortField: SearchSortField = 'relevance',
      sortOrder: SearchSortOrder = 'desc',
    ): Promise<SearchResultItem[]> {
      const sortColumn = sortColumnMap[sortField];
      const direction = sortOrder === 'asc' ? sql`asc` : sql`desc`;
      const orderBy = sql`${sortColumn} ${direction} nulls last, vote_count desc nulls last`;

      const result = await db.execute(sql`
        SELECT id, title, release_date AS "releaseDate", release_year AS "releaseYear",
               vote_average AS "voteAverage", vote_count AS "voteCount",
               ts_rank(search_vector, query) AS rank
        FROM movies, plainto_tsquery('english', ${q}) AS query
        WHERE search_vector @@ query
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `);
      return parseRows(SearchResultItemSchema, result.rows);
    },

    async countSearch(q: string): Promise<number> {
      const CountSchema = z.object({ total: z.number() });
      const result = await db.execute(sql`
        SELECT count(*)::int AS total
        FROM movies, plainto_tsquery('english', ${q}) AS query
        WHERE search_vector @@ query
      `);
      /* v8 ignore next -- count(*) always returns a row */
      return parseFirstRow(CountSchema, result.rows)?.total ?? 0;
    },
  };
}

export type SearchRepository = ReturnType<typeof makeSearchRepository>;

// Fastify adapter: decorate the repository, built from the injected db client.
/* v8 ignore start */
export default fp(
  async (fastify) => {
    fastify.decorate("searchRepository", makeSearchRepository(fastify.db));
  },
  { name: "search-repository", dependencies: ["db"] },
);
/* v8 ignore stop */
