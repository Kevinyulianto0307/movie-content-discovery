import { z } from 'zod';
import { nullableNumber, emptyToNull, parseYear } from './shared.ts';

/**
 * movies_metadata.csv row -> movies insert shape. Non-numeric `id` rows (the ~3
 * corrupted, column-shifted rows) fail `.int().positive()` and are skipped by the
 * loader. Genres are parsed separately from the raw `genres` column.
 */
export const MovieRowSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    imdb_id: z.string().optional(),
    title: z.string().min(1),
    original_title: z.string().optional(),
    overview: z.string().optional(),
    tagline: z.string().optional(),
    release_date: z.string().optional(),
    budget: nullableNumber,
    revenue: nullableNumber,
    runtime: nullableNumber,
    vote_average: nullableNumber,
    vote_count: nullableNumber,
    popularity: nullableNumber,
    status: z.string().optional(),
    original_language: z.string().optional(),
    adult: z.string().optional(),
  })
  .transform((r) => ({
    id: r.id,
    imdbId: emptyToNull(r.imdb_id),
    title: r.title,
    originalTitle: emptyToNull(r.original_title),
    overview: emptyToNull(r.overview),
    tagline: emptyToNull(r.tagline),
    releaseDate: emptyToNull(r.release_date),
    releaseYear: parseYear(r.release_date),
    budget: r.budget,
    revenue: r.revenue,
    runtime: r.runtime,
    voteAverage: r.vote_average,
    voteCount: r.vote_count === null ? null : Math.trunc(r.vote_count),
    popularity: r.popularity,
    status: emptyToNull(r.status),
    originalLanguage: emptyToNull(r.original_language),
    adult: r.adult === 'True' ? 1 : 0,
  }));

export type MovieInsert = z.infer<typeof MovieRowSchema>;
