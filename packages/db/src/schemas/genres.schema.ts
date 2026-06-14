import { pgTable, integer, text, index, primaryKey } from 'drizzle-orm/pg-core';
import { movies } from './movies.schema.ts';

export const genres = pgTable('genres', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const movieGenres = pgTable(
  'movie_genres',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    genreId: integer('genre_id')
      .notNull()
      .references(() => genres.id),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
    // Supports genre filter in GET /api/movies and reverse lookups (movies by genre)
    index('idx_movie_genres_genre').on(table.genreId),
  ],
);
