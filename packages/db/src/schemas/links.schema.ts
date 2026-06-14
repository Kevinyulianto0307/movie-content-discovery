import { pgTable, integer, index } from 'drizzle-orm/pg-core';

// links.csv: maps MovieLens movieId -> TMDB id; used to resolve ratings.
export const movieLinks = pgTable(
  'movie_links',
  {
    movielensId: integer('movielens_id').primaryKey(),
    tmdbId: integer('tmdb_id').notNull(),
  },
  (table) => [
    // Supports reverse lookup: TMDB → MovieLens during ratings ingestion
    index('idx_links_tmdb').on(table.tmdbId),
  ],
);
