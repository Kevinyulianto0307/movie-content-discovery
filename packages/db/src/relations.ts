// Drizzle relational definitions. These unlock the db.query API for nested reads:
//   db.query.movies.findFirst({ where: eq(movies.id, 1), with: { genres: true } })
//
// Note: These are separate from FK constraints (which are defined in each schema
// file). FKs enforce referential integrity in Postgres; relations tell Drizzle
// how to build nested queries in TypeScript.

import { relations } from 'drizzle-orm';
import {
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

// Movies have many genres, keywords, cast, and crew
export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  movieKeywords: many(movieKeywords),
  cast: many(castMembers),
  crew: many(crewMembers),
  ratings: many(ratings),
}));

// Genres can belong to many movies
export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

// Junction table: movie <-> genre
export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

// Keywords can belong to many movies
export const keywordsRelations = relations(keywords, ({ many }) => ({
  movieKeywords: many(movieKeywords),
}));

// Junction table: movie <-> keyword
export const movieKeywordsRelations = relations(movieKeywords, ({ one }) => ({
  movie: one(movies, {
    fields: [movieKeywords.movieId],
    references: [movies.id],
  }),
  keyword: one(keywords, {
    fields: [movieKeywords.keywordId],
    references: [keywords.id],
  }),
}));

// Cast members belong to a movie
export const castMembersRelations = relations(castMembers, ({ one }) => ({
  movie: one(movies, {
    fields: [castMembers.movieId],
    references: [movies.id],
  }),
}));

// Crew members belong to a movie
export const crewMembersRelations = relations(crewMembers, ({ one }) => ({
  movie: one(movies, {
    fields: [crewMembers.movieId],
    references: [movies.id],
  }),
}));

// Ratings belong to a movie (userId is the other part of the composite PK)
export const ratingsRelations = relations(ratings, ({ one }) => ({
  movie: one(movies, {
    fields: [ratings.movieId],
    references: [movies.id],
  }),
}));

// Movie links map MovieLens IDs to TMDB IDs (no FK, just a lookup table)
export const movieLinksRelations = relations(movieLinks, () => ({}));
