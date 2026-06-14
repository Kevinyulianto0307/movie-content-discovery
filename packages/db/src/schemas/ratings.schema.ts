import { pgTable, integer, real, index, primaryKey } from 'drizzle-orm/pg-core';

export const ratings = pgTable(
  'ratings',
  {
    userId: integer('user_id').notNull(),
    movieId: integer('movie_id').notNull(), // TMDB id (resolved from movielens via links)
    rating: real('rating'),
    timestamp: integer('timestamp'),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.movieId] }),
    // Supports rating stats aggregation in GET /api/movies/:id
    index('idx_ratings_movie').on(table.movieId),
  ],
);
