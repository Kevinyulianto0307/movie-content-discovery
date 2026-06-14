import { z } from 'zod';

// links.csv: MovieLens movieId -> TMDB id. Rows with no TMDB id (empty -> 0)
// fail `.positive()` and are skipped (no mapping possible).
export const LinkRowSchema = z
  .object({
    movieId: z.coerce.number().int().positive(),
    tmdbId: z.coerce.number().int().positive(),
  })
  .transform((r) => ({ movielensId: r.movieId, tmdbId: r.tmdbId }));
