import { z } from "zod";

// Shared pagination schema for list endpoints.
// Use .merge() or .extend() to add domain-specific query params.
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

// Calculates offset from page/pageSize for SQL OFFSET clause.
export function calcOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

// Builds the standard paginated response envelope.
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return { data, total, page, pageSize };
}

// Shared response envelope schema factory.
export function PaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });
}
