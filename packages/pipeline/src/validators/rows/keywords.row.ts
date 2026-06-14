import { z } from 'zod';

// keywords.csv is keyed by movie id; keywords come from the raw JSON column,
// parsed separately.
export const KeywordsRowSchema = z.object({ id: z.coerce.number().int().positive() });
