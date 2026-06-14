import { pgTable, integer, text, index } from 'drizzle-orm/pg-core';
import { movies } from './movies.schema.ts';

export const castMembers = pgTable(
  'cast_members',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    personId: integer('person_id'),
    name: text('name'),
    character: text('character'),
    order: integer('order'),
  },
  (table) => [
    // Supports cast lookups in GET /api/movies/:id (top 10 cast by order)
    index('idx_cast_movie').on(table.movieId),
  ],
);

export const crewMembers = pgTable(
  'crew_members',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    personId: integer('person_id'),
    name: text('name'),
    job: text('job'),
    department: text('department'),
  },
  (table) => [
    // Supports crew lookups in GET /api/movies/:id (director, writer, etc.)
    index('idx_crew_movie').on(table.movieId),
  ],
);
