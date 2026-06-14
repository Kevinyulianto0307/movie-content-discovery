import { z } from 'zod';

// Response schema for the health route.
export const HealthSchema = z.object({
  status: z.string(),
  db: z.string(),
});
