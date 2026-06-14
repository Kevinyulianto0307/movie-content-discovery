import { z } from 'zod';
import { PaginationQuery, PaginatedResponseSchema } from '../lib/pagination.ts';

// All Zod schemas for the movies routes live here — both the request schemas
// (querystring / path params, used for validation + coercion) and the response
// schemas (used by the serializer to shape outgoing payloads and to feed the
// OpenAPI docs). Keeping request and response shapes for one resource in a single
// file makes the route's full contract readable in one place.

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------

// GET /api/movies — pagination, sorting, filtering.
export const ListQuery = PaginationQuery.extend({
  sort: z.enum(['title', 'release_date', 'vote_average', 'revenue']).default('vote_average'),
  order: z.enum(['asc', 'desc']).default('desc'),
  genre: z.string().min(1).optional(),
  yearFrom: z.coerce.number().int().optional(),
  yearTo: z.coerce.number().int().optional(),
  minVoteCount: z.coerce.number().int().min(0).optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;

// Path param for /:id routes.
export const IdParam = z.object({
  id: z.coerce.number().int().positive(),
});
export type IdParam = z.infer<typeof IdParam>;

// GET /api/movies/:id/similar
export const SimilarQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type SimilarQuery = z.infer<typeof SimilarQuery>;

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------
// The serializer validates outgoing payloads against these and strips anything
// not listed (so the tsvector and any other internal column can never leak).

export const MovieListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().nullable(),
  voteAverage: z.number().nullable(),
  voteCount: z.number().nullable(),
  revenue: z.number().nullable(),
});

export const MovieListResponseSchema = PaginatedResponseSchema(MovieListItemSchema);

const GenreSchema = z.object({ id: z.number(), name: z.string() });
const KeywordSchema = z.object({ id: z.number(), name: z.string() });

const CastSchema = z.object({
  personId: z.number().nullable(),
  name: z.string().nullable(),
  character: z.string().nullable(),
  order: z.number().nullable(),
});

const CrewSchema = z.object({
  personId: z.number().nullable(),
  name: z.string().nullable(),
  job: z.string().nullable(),
  department: z.string().nullable(),
});

const RatingStatsSchema = z.object({
  average: z.number().nullable(),
  count: z.number(),
});

export const MovieDetailSchema = z.object({
  id: z.number(),
  imdbId: z.string().nullable(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  overview: z.string().nullable(),
  tagline: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().nullable(),
  budget: z.number().nullable(),
  revenue: z.number().nullable(),
  runtime: z.number().nullable(),
  voteAverage: z.number().nullable(),
  voteCount: z.number().nullable(),
  popularity: z.number().nullable(),
  status: z.string().nullable(),
  originalLanguage: z.string().nullable(),
  genres: z.array(GenreSchema),
  cast: z.array(CastSchema),
  crew: z.array(CrewSchema),
  keywords: z.array(KeywordSchema),
  ratings: RatingStatsSchema,
});

export const SimilarMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  releaseYear: z.number().nullable(),
  voteAverage: z.number().nullable(),
  score: z.number(),
});

export const SimilarResponseSchema = z.object({
  data: z.array(SimilarMovieSchema),
});

// Single source of truth for the row shape — the repo derives its return type
// from this rather than maintaining a parallel interface.
export type SimilarMovie = z.infer<typeof SimilarMovieSchema>;

export const NotFoundSchema = z.object({ error: z.string() });
