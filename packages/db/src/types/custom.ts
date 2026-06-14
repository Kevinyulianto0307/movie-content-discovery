// Shared custom column types for Drizzle.
// Extract reusable types here so they can be imported across schema files.

import { customType } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL tsvector type for full-text search.
 * Drizzle treats the value as an opaque string; Postgres owns read/write.
 * The column is queried with `@@` and indexed with GIN.
 *
 * Usage:
 * ```ts
 * import { tsvector } from '../types/custom.ts';
 *
 * export const myTable = pgTable('my_table', {
 *   searchVector: tsvector('search_vector'),
 * });
 * ```
 *
 * Note: GIN indexes must be created via hand-written migrations
 * since drizzle-kit doesn't emit GIN indexes automatically.
 */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});
