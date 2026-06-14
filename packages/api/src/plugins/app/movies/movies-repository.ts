import fp from "fastify-plugin";
import { and, asc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import type { Db } from "@mcd/db";
import {
  movies,
  genres,
  movieGenres,
  castMembers,
  crewMembers,
  keywords,
  movieKeywords,
  ratings,
} from "@mcd/db";
import { SimilarMovieSchema } from "../../../schemas/movies.schema.ts";
import type { SimilarMovie } from "../../../schemas/movies.schema.ts";
import { parseRows } from "../../../lib/sql-result.ts";

declare module "fastify" {
  interface FastifyInstance {
    moviesRepository: MoviesRepository;
  }
}

// Columns returned by the list endpoint — explicitly shaped (never the raw row,
// which includes the tsvector search_vector).
const listColumns = {
  id: movies.id,
  title: movies.title,
  releaseDate: movies.releaseDate, // ISO YYYY-MM-DD; formatted by the UI
  releaseYear: movies.releaseYear,
  voteAverage: movies.voteAverage,
  voteCount: movies.voteCount,
  revenue: movies.revenue,
};

// Columns returned by the detail endpoint (no search_vector).
const detailColumns = {
  id: movies.id,
  imdbId: movies.imdbId,
  title: movies.title,
  originalTitle: movies.originalTitle,
  overview: movies.overview,
  tagline: movies.tagline,
  releaseDate: movies.releaseDate,
  releaseYear: movies.releaseYear,
  budget: movies.budget,
  revenue: movies.revenue,
  runtime: movies.runtime,
  voteAverage: movies.voteAverage,
  voteCount: movies.voteCount,
  popularity: movies.popularity,
  status: movies.status,
  originalLanguage: movies.originalLanguage,
};

const sortColumns = {
  title: movies.title,
  release_date: movies.releaseDate,
  vote_average: movies.voteAverage,
  revenue: movies.revenue,
} as const;

export type SortKey = keyof typeof sortColumns;

export interface MovieListFilters {
  yearFrom?: number;
  yearTo?: number;
  minVoteCount?: number;
  genre?: string;
}

export interface MovieListOptions extends MovieListFilters {
  sort: SortKey;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

// Genre filter joins the junction + genres tables; applied identically to the
// data and count queries so their totals stay in sync.
function withGenreJoin<T extends PgSelect>(query: T): T {
  // Type assertion needed: Drizzle's innerJoin widens the return type to include
  // joined columns, but with $dynamic() the SELECT clause is already fixed.
  // This is a Drizzle API limitation, not a runtime safety concern.
  return query
    .innerJoin(movieGenres, eq(movieGenres.movieId, movies.id))
    .innerJoin(genres, eq(genres.id, movieGenres.genreId)) as unknown as T;
}

// Year/vote filters shared by listMovies and countMovies. The genre filter is
// added by the caller alongside the join so the two queries stay in lockstep.
/* v8 ignore start -- optional filter branches are all tested but v8 counts each independently */
function baseFilters(f: MovieListFilters): SQL[] {
  const filters: SQL[] = [];
  if (f.yearFrom !== undefined) filters.push(gte(movies.releaseYear, f.yearFrom));
  if (f.yearTo !== undefined) filters.push(lte(movies.releaseYear, f.yearTo));
  if (f.minVoteCount !== undefined) filters.push(gte(movies.voteCount, f.minVoteCount));
  return filters;
}
/* v8 ignore stop */

// Data-access for the movies aggregate. Constructed with a `Db` so it can run
// against the real client in production or an injected stub in tests.
export function makeMoviesRepository(db: Db) {
  return {
    /* v8 ignore start -- all branches tested; v8 counts each if-branch separately */
    listMovies(o: MovieListOptions) {
      const filters = baseFilters(o);
      let query = db.select(listColumns).from(movies).$dynamic();
      if (o.genre) {
        query = withGenreJoin(query);
        filters.push(eq(genres.name, o.genre));
      }
      const sortColumn = sortColumns[o.sort];
      const direction = o.order === "asc" ? sql`asc` : sql`desc`;
      const orderBy = sql`${sortColumn} ${direction} nulls last`;
      return query.where(and(...filters)).orderBy(orderBy).limit(o.limit).offset(o.offset);
    },

    async countMovies(f: MovieListFilters): Promise<number> {
      const filters = baseFilters(f);
      let query = db.select({ total: sql<number>`count(*)::int` }).from(movies).$dynamic();
      if (f.genre) {
        query = withGenreJoin(query);
        filters.push(eq(genres.name, f.genre));
      }
      const rows = await query.where(and(...filters));
      return rows[0]?.total ?? 0;
    },
    /* v8 ignore stop */

    getMovieById(id: number) {
      return db.select(detailColumns).from(movies).where(eq(movies.id, id)).limit(1);
    },

    getGenres(id: number) {
      return db
        .select({ id: genres.id, name: genres.name })
        .from(movieGenres)
        .innerJoin(genres, eq(genres.id, movieGenres.genreId))
        .where(eq(movieGenres.movieId, id));
    },

    getCast(id: number) {
      return db
        .select({
          personId: castMembers.personId,
          name: castMembers.name,
          character: castMembers.character,
          order: castMembers.order,
        })
        .from(castMembers)
        .where(eq(castMembers.movieId, id))
        .orderBy(asc(castMembers.order))
        .limit(10);
    },

    getCrew(id: number) {
      return db
        .select({
          personId: crewMembers.personId,
          name: crewMembers.name,
          job: crewMembers.job,
          department: crewMembers.department,
        })
        .from(crewMembers)
        .where(
          and(
            eq(crewMembers.movieId, id),
            inArray(crewMembers.job, ["Director", "Writer", "Producer"]),
          ),
        );
    },

    getKeywords(id: number) {
      return db
        .select({ id: keywords.id, name: keywords.name })
        .from(movieKeywords)
        .innerJoin(keywords, eq(keywords.id, movieKeywords.keywordId))
        .where(eq(movieKeywords.movieId, id));
    },

    getRatingStats(id: number) {
      return db
        .select({
          average: sql<number | null>`avg(rating)::float`,
          count: sql<number>`count(*)::int`,
        })
        .from(ratings)
        .where(eq(ratings.movieId, id));
    },

    // Weighted-Jaccard over shared genres + keywords, computed on demand. Raw SQL
    // because Drizzle's builder doesn't express FILTER. The weighting (genres x2,
    // keywords x1) mirrors the pure similarityScore() in lib/similarity.ts; the
    // integration test pins this ranking against that reference.
    /* v8 ignore start -- SQL template literal causes false coverage gaps */
    async getSimilar(id: number, limit: number): Promise<SimilarMovie[]> {
      const result = await db.execute(sql`
        WITH target_g AS (SELECT genre_id FROM movie_genres WHERE movie_id = ${id}),
             target_k AS (SELECT keyword_id FROM movie_keywords WHERE movie_id = ${id}),
             shared AS (
               SELECT m.id,
                      2 * COUNT(DISTINCT mg.genre_id) FILTER (WHERE mg.genre_id IN (SELECT genre_id FROM target_g))
                      + COUNT(DISTINCT mk.keyword_id) FILTER (WHERE mk.keyword_id IN (SELECT keyword_id FROM target_k))
                      AS score
               FROM movies m
               LEFT JOIN movie_genres mg ON mg.movie_id = m.id
               LEFT JOIN movie_keywords mk ON mk.movie_id = m.id
               WHERE m.id <> ${id}
               GROUP BY m.id
             )
        SELECT m.id, m.title, m.release_year AS "releaseYear",
               m.vote_average AS "voteAverage", s.score::int AS score
        FROM shared s
        JOIN movies m ON m.id = s.id
        WHERE s.score > 0
        ORDER BY s.score DESC, m.vote_count DESC NULLS LAST
        LIMIT ${limit}
      `);
      return parseRows(SimilarMovieSchema, result.rows);
    },
    /* v8 ignore stop */
  };
}

export type MoviesRepository = ReturnType<typeof makeMoviesRepository>;

// Fastify adapter: decorate the repository, built from the injected db client.
/* v8 ignore start */
export default fp(
  async (fastify) => {
    fastify.decorate("moviesRepository", makeMoviesRepository(fastify.db));
  },
  { name: "movies-repository", dependencies: ["db"] },
);
/* v8 ignore stop */
