import '../env.ts'; // load root .env before reading DATABASE_URL
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

// Resolve the migrations folder in @mcd/db (not this package) so it works
// regardless of how the script is invoked.
const drizzleDir = fileURLToPath(
  new URL('../../../db/drizzle', import.meta.url),
);

/**
 * Applies migrations in two passes:
 *   1. drizzle-kit-generated schema migrations, via the official migrator
 *      (tracked in __drizzle_migrations, so this is idempotent).
 *   2. hand-written *.sql that drizzle does NOT manage — currently just the
 *      GIN index on search_vector, which drizzle-kit cannot emit.
 *
 * Pass 2 reads drizzle/meta/_journal.json and skips any file the migrator
 * already owns. This avoids the trap where a naive `^\d{4}_` glob re-runs the
 * generated `0000_*.sql` (which has no IF NOT EXISTS) and crashes on a fresh DB.
 * The remaining hand-written files all use IF NOT EXISTS, so re-runs are safe.
 */
export async function runMigrations() {
  const url =
    process.env.NODE_ENV === 'test'
      ? process.env.DATABASE_URL_TEST
      : process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set; cp .env.example .env first');

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  try {
    // Pass 1: drizzle-generated migrations.
    await migrate(db, { migrationsFolder: drizzleDir });

    // Pass 2: hand-written SQL not tracked by drizzle's journal.
    const managed = new Set(readJournalTags(drizzleDir));
    const handWritten = readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql') && /^\d{4}_/.test(f))
      .filter((f) => !managed.has(f.replace(/\.sql$/, '')))
      .sort();

    for (const file of handWritten) {
      const sql = readFileSync(join(drizzleDir, file), 'utf-8');
      await pool.query(sql);
    }
  } finally {
    await pool.end();
  }
}

function readJournalTags(dir: string): string[] {
  try {
    const journal = JSON.parse(
      readFileSync(join(dir, 'meta', '_journal.json'), 'utf-8'),
    ) as { entries?: Array<{ tag: string }> };
    return (journal.entries ?? []).map((e) => e.tag);
  } catch {
    return []; // no journal yet (no generated migrations) — apply all hand-written
  }
}

// Run as a script when invoked directly (`npm run db:migrate`).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runMigrations();
  console.log('Migrations applied.');
}
