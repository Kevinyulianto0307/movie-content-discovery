import fp from "fastify-plugin";
import { sql } from "drizzle-orm";
import type { Db } from "@mcd/db";
import { TopGenreRowSchema } from "../../../schemas/analytics.schema.ts";
import type { TopGenreRow } from "../../../schemas/analytics.schema.ts";
import { parseRows } from "../../../lib/sql-result.ts";

declare module "fastify" {
  interface FastifyInstance {
    analyticsRepository: AnalyticsRepository;
  }
}

// Genre popularity by decade (or year) with average revenue and rating. minVotes
// filters out one-rating outliers that would otherwise dominate the averages.
export function makeAnalyticsRepository(db: Db) {
  return {
    async topGenres(
      bucket: "decade" | "year",
      minVotes: number,
    ): Promise<TopGenreRow[]> {
      const bucketExpr =
        bucket === "decade" ? sql`(release_year / 10) * 10` : sql`release_year`;

      const result = await db.execute(sql`
        SELECT
          ${bucketExpr}::int AS bucket,
          g.name AS genre,
          count(*)::int AS "movieCount",
          avg(NULLIF(m.revenue, 0))::float AS "avgRevenue",
          avg(m.vote_average)::float AS "avgRating"
        FROM movies m
        JOIN movie_genres mg ON mg.movie_id = m.id
        JOIN genres g ON g.id = mg.genre_id
        WHERE m.release_year IS NOT NULL
          AND m.vote_count >= ${minVotes}
        GROUP BY bucket, g.name
        ORDER BY bucket ASC, "movieCount" DESC
      `);
      return parseRows(TopGenreRowSchema, result.rows);
    },
  };
}

export type AnalyticsRepository = ReturnType<typeof makeAnalyticsRepository>;

// Fastify adapter: decorate the repository, built from the injected db client.
/* v8 ignore start */
export default fp(
  async (fastify) => {
    fastify.decorate("analyticsRepository", makeAnalyticsRepository(fastify.db));
  },
  { name: "analytics-repository", dependencies: ["db"] },
);
/* v8 ignore stop */
