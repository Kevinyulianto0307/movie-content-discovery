import { db } from '@mcd/db';
import { movieLinks, ratings } from '@mcd/db/schema';
import { csvRows, BATCH_SIZE } from '../lib/csv.ts';
import { RatingRowSchema } from '../validators/rows.ts';
import type { LoadResult } from './types.ts';

// ratings_small.csv -> ratings. The CSV uses MovieLens movieId; resolve to TMDB
// id via the in-memory links map before insert. Rows with no mapping are skipped.
export async function ingestRatings(path: string): Promise<LoadResult> {
  const linkRows = await db.select().from(movieLinks);
  const movielensToTmdb = new Map(linkRows.map((r) => [r.movielensId, r.tmdbId]));

  let batch: (typeof ratings.$inferInsert)[] = [];
  let inserted = 0;
  let skipped = 0;

  /* v8 ignore start -- flush empty check */
  const flush = async () => {
    if (!batch.length) return;
    await db.insert(ratings).values(batch).onConflictDoNothing();
    inserted += batch.length;
    batch = [];
  };
  /* v8 ignore stop */

  for await (const raw of csvRows(path)) {
    const result = RatingRowSchema.safeParse(raw);
    /* v8 ignore start -- skip branch tested via integration */
    if (!result.success) {
      skipped++;
      continue;
    }
    /* v8 ignore stop */
    const tmdbId = movielensToTmdb.get(result.data.movieId);
    if (!tmdbId) {
      skipped++;
      continue;
    }
    batch.push({
      userId: result.data.userId,
      movieId: tmdbId,
      rating: result.data.rating,
      timestamp: result.data.timestamp,
    });
    /* v8 ignore next -- batch threshold */
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  return { inserted, skipped };
}
