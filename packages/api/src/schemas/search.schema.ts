import { z } from 'zod';
import { PaginationQuery, PaginatedResponseSchema } from '../lib/pagination.ts';

// Request and response schemas for the search route.

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

// GET /api/search (max 50 results per page for search)
export const SearchQuery = PaginationQuery.extend({
  q: z.string().min(1).max(200),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['relevance', 'title', 'release_date', 'vote_average', 'revenue']).default('relevance'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type SearchQuery = z.infer<typeof SearchQuery>;

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const SearchResultItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().nullable(),
  voteAverage: z.number().nullable(),
  voteCount: z.number().nullable(),
  rank: z.number(),
});

export const SearchResponseSchema = PaginatedResponseSchema(SearchResultItemSchema);

// Single source of truth for the row shape — the repo derives its return type
// from this rather than maintaining a parallel interface.
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;
