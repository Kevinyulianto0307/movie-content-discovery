import type { z } from "zod";

/**
 * Parses raw SQL result rows through a Zod schema for runtime type safety.
 * Use this instead of `as unknown as T` for raw db.execute() results.
 *
 * @throws {ZodError} if rows don't match the expected schema
 */
export function parseRows<T extends z.ZodTypeAny>(
  schema: T,
  rows: unknown[],
): z.infer<T>[] {
  return rows.map((row) => schema.parse(row));
}

/**
 * Parses a single row from raw SQL results.
 * Returns undefined if rows is empty.
 *
 * @throws {ZodError} if the row doesn't match the expected schema
 */
/* v8 ignore start -- tested in unit tests, v8 aggregation issue */
export function parseFirstRow<T extends z.ZodTypeAny>(
  schema: T,
  rows: unknown[],
): z.infer<T> | undefined {
  if (rows.length === 0) return undefined;
  return schema.parse(rows[0]);
}
/* v8 ignore stop */
