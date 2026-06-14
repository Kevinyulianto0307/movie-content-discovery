export interface LoadResult {
  /** Rows accepted into a batch insert (re-runs may no-op via onConflictDoNothing). */
  inserted: number;
  /** Rows skipped: failed validation, or no FK/ID mapping. */
  skipped: number;
}
