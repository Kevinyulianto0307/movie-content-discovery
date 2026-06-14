import { z } from 'zod';

// Item inside the stringified-JSON `keywords` column.
export const KeywordItemSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().min(1),
});
