import { pgTable, integer, text, index, primaryKey } from 'drizzle-orm/pg-core';
import { movies } from './movies.schema.ts';

export const keywords = pgTable('keywords', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const movieKeywords = pgTable(
  'movie_keywords',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    keywordId: integer('keyword_id')
      .notNull()
      .references(() => keywords.id),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.keywordId] }),
    // Supports similarity scoring and reverse lookups (movies by keyword)
    index('idx_movie_keywords_keyword').on(table.keywordId),
  ],
);
