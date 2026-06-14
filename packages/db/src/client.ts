import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as relations from './relations.ts';

// NODE_ENV=test selects the isolated test database so `npm test` never touches
// ingested data. The caller MUST load the root .env (import '@mcd/db/env') before
// importing this module, so the connection string is available here.
const url =
  process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'DATABASE_URL (or DATABASE_URL_TEST when NODE_ENV=test) is not set. Run `cp .env.example .env` first.',
  );
}

// Cache the pool on globalThis so a module re-evaluation (dev hot-reload, repeated
// imports) reuses the same connections instead of leaking a new pool each time.
// In production the module evaluates once, so the global is skipped.
const globalForDb = globalThis as unknown as { __mcdPool?: Pool };

function createPool(): Pool {
  const p = new Pool({ connectionString: url });
  // node-postgres emits 'error' on an idle pooled client if the connection drops
  // (e.g. Postgres restarts). Without a listener Node treats it as an unhandled
  // error and crashes the process. Log instead so the API stays up; the next query
  // reconnects, and /health reports the DB as unavailable in the meantime.
  p.on('error', (err) => console.error('[db] idle client error:', err.message));
  return p;
}

export const pool = globalForDb.__mcdPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDb.__mcdPool = pool;

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

// The concrete database handle type. Repositories accept a `Db` so they can be
// constructed against the real client in production or a stub/mock in tests —
// this is the seam that lets business logic be exercised without a live database.
export type Db = typeof db;
