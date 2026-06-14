import { z } from 'zod';

// Item inside the stringified-JSON `cast` column. Only persisted fields are
// declared; Zod strips unknown keys (gender, profile_path, etc.).
export const CastItemSchema = z.object({
  id: z.coerce.number().int().nullish(),
  name: z.string().nullish(),
  character: z.string().nullish(),
  order: z.coerce.number().int().nullish(),
});
