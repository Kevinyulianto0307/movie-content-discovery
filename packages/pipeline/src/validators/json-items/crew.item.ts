import { z } from 'zod';

// Item inside the stringified-JSON `crew` column.
export const CrewItemSchema = z.object({
  id: z.coerce.number().int().nullish(),
  name: z.string().nullish(),
  job: z.string().nullish(),
  department: z.string().nullish(),
});
