import { z } from 'zod';
import { nullableNumber } from './shared.ts';

export const RatingRowSchema = z.object({
  userId: z.coerce.number().int().positive(),
  movieId: z.coerce.number().int().positive(), // MovieLens id, resolved later
  rating: nullableNumber,
  timestamp: z.coerce.number().int(),
});
