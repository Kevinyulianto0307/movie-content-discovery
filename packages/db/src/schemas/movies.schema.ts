import { pgTable, integer, text, real, index } from 'drizzle-orm/pg-core';
import { tsvector } from '../types/custom.ts';

export const movies = pgTable(
  'movies',
  {
    id: integer('id').primaryKey(), // TMDB id
    imdbId: text('imdb_id'),
    title: text('title').notNull(),
    originalTitle: text('original_title'),
    overview: text('overview'),
    tagline: text('tagline'),
    releaseDate: text('release_date'), // ISO date string
    releaseYear: integer('release_year'),
    budget: real('budget'),
    revenue: real('revenue'),
    runtime: real('runtime'),
    voteAverage: real('vote_average'),
    voteCount: integer('vote_count'),
    popularity: real('popularity'),
    status: text('status'),
    originalLanguage: text('original_language'),
    adult: integer('adult').default(0), // 0/1 from the source data; stored but not filtered by the API
    searchVector: tsvector('search_vector'), // populated post-insert via UPDATE
  },
  (table) => [
    // Supports yearFrom/yearTo filters in GET /api/movies
    index('idx_movies_year').on(table.releaseYear),
    // Supports sort=vote_average in GET /api/movies
    index('idx_movies_vote').on(table.voteAverage),
    // GIN index on search_vector is in drizzle/0001_fts_index.sql (drizzle-kit doesn't emit GIN)
  ],
);
