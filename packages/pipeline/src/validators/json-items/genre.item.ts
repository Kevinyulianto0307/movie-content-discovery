import { z } from 'zod';

// Item inside the stringified-JSON `genres` column. Only persisted fields are
// declared; Zod strips unknown keys.
export const GenreSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().min(1),
});
