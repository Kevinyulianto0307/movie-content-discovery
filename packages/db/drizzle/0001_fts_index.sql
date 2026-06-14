-- Hand-written migration: GIN index on the full-text search vector.
-- drizzle-kit does not emit GIN indexes, so this lives alongside the generated
-- migrations and is applied by src/db/migrate.ts (pass 2). IF NOT EXISTS keeps
-- it idempotent across re-runs.
CREATE INDEX IF NOT EXISTS idx_movies_fts
  ON movies USING GIN (search_vector);
