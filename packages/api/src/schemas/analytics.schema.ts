import { z } from 'zod';

// Request and response schemas for the analytics route.

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

// GET /api/analytics/top-genres
export const AnalyticsQuery = z.object({
  bucket: z.enum(['decade', 'year']).default('decade'),
  minVotes: z.coerce.number().int().min(0).default(50),
});
export type AnalyticsQuery = z.infer<typeof AnalyticsQuery>;

// ---------------------------------------------------------------------------
// Response schemas
// ---------------------------------------------------------------------------

export const TopGenreRowSchema = z.object({
  bucket: z.number(),
  genre: z.string(),
  movieCount: z.number(),
  avgRevenue: z.number().nullable(),
  avgRating: z.number().nullable(),
});

export const TopGenresResponseSchema = z.object({
  data: z.array(TopGenreRowSchema),
});

// Single source of truth for the row shape — the repo derives its return type
// from this rather than maintaining a parallel interface.
export type TopGenreRow = z.infer<typeof TopGenreRowSchema>;
