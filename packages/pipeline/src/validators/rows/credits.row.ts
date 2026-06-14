import { z } from 'zod';

// credits.csv is keyed by movie id; cast/crew come from the raw JSON columns,
// parsed separately.
export const CreditsRowSchema = z.object({ id: z.coerce.number().int().positive() });
