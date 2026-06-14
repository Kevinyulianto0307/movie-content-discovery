// Type re-exports for cleaner consumer code. Instead of:
//   typeof movies.$inferSelect
// Consumers can import:
//   import type { Movie, NewMovie } from '@mcd/db';

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  movies,
  genres,
  movieGenres,
  keywords,
  movieKeywords,
  castMembers,
  crewMembers,
  ratings,
  movieLinks,
} from './schema.ts';

// Select types (full row as returned by db.select())
export type Movie = InferSelectModel<typeof movies>;
export type Genre = InferSelectModel<typeof genres>;
export type MovieGenre = InferSelectModel<typeof movieGenres>;
export type Keyword = InferSelectModel<typeof keywords>;
export type MovieKeyword = InferSelectModel<typeof movieKeywords>;
export type CastMember = InferSelectModel<typeof castMembers>;
export type CrewMember = InferSelectModel<typeof crewMembers>;
export type Rating = InferSelectModel<typeof ratings>;
export type MovieLink = InferSelectModel<typeof movieLinks>;

// Insert types (for db.insert())
export type NewMovie = InferInsertModel<typeof movies>;
export type NewGenre = InferInsertModel<typeof genres>;
export type NewMovieGenre = InferInsertModel<typeof movieGenres>;
export type NewKeyword = InferInsertModel<typeof keywords>;
export type NewMovieKeyword = InferInsertModel<typeof movieKeywords>;
export type NewCastMember = InferInsertModel<typeof castMembers>;
export type NewCrewMember = InferInsertModel<typeof crewMembers>;
export type NewRating = InferInsertModel<typeof ratings>;
export type NewMovieLink = InferInsertModel<typeof movieLinks>;
