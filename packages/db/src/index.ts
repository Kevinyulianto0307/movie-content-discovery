// @mcd/db — the shared data layer. Owns the Drizzle schema and the Postgres
// client, so both the API (packages/api) and the ingestion pipeline
// (packages/pipeline) depend on this package rather than on each other.
//
// Note: this barrel intentionally does NOT load .env. Importing the client reads
// process.env at evaluation time, so entry points must import '@mcd/db/env' first
// (it has the side effect of loading the root .env). Keeping env loading on a
// separate subpath preserves explicit ordering and avoids surprising side effects
// for consumers that only want the schema types.
export * from './schema.ts';
export * from './relations.ts';
export * from './types.ts';
export * from './client.ts';
