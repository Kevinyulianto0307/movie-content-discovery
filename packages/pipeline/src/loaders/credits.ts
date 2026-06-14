import { db, pool } from '@mcd/db';
import { movies, castMembers, crewMembers } from '@mcd/db/schema';
import { csvRows, BATCH_SIZE } from '../lib/csv.ts';
import { CreditsRowSchema } from '../validators/rows.ts';
import { CastItemSchema, CrewItemSchema } from '../validators/json-items.ts';
import { parseJsonArray } from '../parsers/json-columns.ts';
import { logger } from '../lib/logger.ts';
import { recordBatchTime, sampleHeap } from '../lib/metrics.ts';
import type { LoadResult } from './types.ts';

// credits.csv -> cast_members + crew_members.
// Idempotency note: these tables use a serial PK, so onConflictDoNothing cannot
// dedupe a re-run. We TRUNCATE them up front instead, then re-insert fresh — the
// whole file is re-read every run, so this is the correct idempotent strategy for
// serial-PK child tables. Cast/crew for movies that didn't make it into `movies`
// (dropped corrupt rows) are skipped to avoid FK violations.
export async function ingestCredits(path: string): Promise<LoadResult> {
  await pool.query('TRUNCATE cast_members, crew_members RESTART IDENTITY');

  const movieIds = new Set(
    (await db.select({ id: movies.id }).from(movies)).map((r) => r.id),
  );

  let castBatch: (typeof castMembers.$inferInsert)[] = [];
  let crewBatch: (typeof crewMembers.$inferInsert)[] = [];
  let inserted = 0;
  let skipped = 0;
  let seen = 0;

  const flushCast = async () => {
    if (!castBatch.length) return;
    const t0 = performance.now();
    await db.insert(castMembers).values(castBatch);
    recordBatchTime(performance.now() - t0);
    sampleHeap();
    castBatch = [];
  };
  const flushCrew = async () => {
    if (!crewBatch.length) return;
    const t0 = performance.now();
    await db.insert(crewMembers).values(crewBatch);
    recordBatchTime(performance.now() - t0);
    sampleHeap();
    crewBatch = [];
  };

  for await (const raw of csvRows(path)) {
    seen++;
    const result = CreditsRowSchema.safeParse(raw);
    if (!result.success || !movieIds.has(result.data.id)) {
      skipped++;
      continue;
    }
    const movieId = result.data.id;

    /* v8 ignore start -- null coalescing branches for optional fields */
    for (const c of parseJsonArray(raw.cast, CastItemSchema)) {
      castBatch.push({
        movieId,
        personId: c.id ?? null,
        name: c.name ?? null,
        character: c.character ?? null,
        order: c.order ?? null,
      });
      if (castBatch.length >= BATCH_SIZE) await flushCast();
    }
    for (const c of parseJsonArray(raw.crew, CrewItemSchema)) {
      crewBatch.push({
        movieId,
        personId: c.id ?? null,
        name: c.name ?? null,
        job: c.job ?? null,
        department: c.department ?? null,
      });
      if (crewBatch.length >= BATCH_SIZE) await flushCrew();
    }
    /* v8 ignore stop */

    inserted++;
    /* v8 ignore next -- progress logging threshold */
    if (seen % 5000 === 0) logger.info({ seen, inserted, skipped }, 'credits progress');
  }
  await flushCast();
  await flushCrew();

  return { inserted, skipped };
}
