import { db } from '@mcd/db';
import { movies, genres, movieGenres } from '@mcd/db/schema';
import { csvRows, BATCH_SIZE } from '../lib/csv.ts';
import { MovieRowSchema } from '../validators/rows.ts';
import { GenreSchema } from '../validators/json-items.ts';
import { parseJsonArray } from '../parsers/json-columns.ts';
import { logger } from '../lib/logger.ts';
import { recordBatchTime, sampleHeap } from '../lib/metrics.ts';
import type { LoadResult } from './types.ts';

// movies_metadata.csv -> movies, and the genres / movie_genres junction.
// Within each flush we insert genres first (referenced by movie_genres), then
// movies, then the junction rows — all FK dependencies satisfied in order.
export async function ingestMovies(path: string): Promise<LoadResult> {
  let movieBatch: (typeof movies.$inferInsert)[] = [];
  let genreBuf = new Map<number, string>();
  let mgBatch: (typeof movieGenres.$inferInsert)[] = [];
  let inserted = 0;
  let skipped = 0;
  let seen = 0;

  /* v8 ignore start -- flush branches tested via integration */
  const flush = async () => {
    if (!movieBatch.length) return;
    const t0 = performance.now();
    if (genreBuf.size) {
      const rows = [...genreBuf].map(([id, name]) => ({ id, name }));
      await db.insert(genres).values(rows).onConflictDoNothing();
      genreBuf = new Map();
    }
    await db.insert(movies).values(movieBatch).onConflictDoNothing();
    if (mgBatch.length) {
      await db.insert(movieGenres).values(mgBatch).onConflictDoNothing();
    }
    recordBatchTime(performance.now() - t0);
    sampleHeap();
    inserted += movieBatch.length;
    movieBatch = [];
    mgBatch = [];
  };
  /* v8 ignore stop */

  for await (const raw of csvRows(path)) {
    seen++;
    const result = MovieRowSchema.safeParse(raw);
    /* v8 ignore start -- skip branch tested via integration */
    if (!result.success) {
      skipped++;
      if (skipped <= 20) {
        logger.debug({ issues: result.error.issues.slice(0, 2) }, 'skipped malformed movie row');
      }
      continue;
    }
    /* v8 ignore stop */
    const movie = result.data;
    movieBatch.push(movie);

    for (const g of parseJsonArray(raw.genres, GenreSchema)) {
      genreBuf.set(g.id, g.name);
      mgBatch.push({ movieId: movie.id, genreId: g.id });
    }

    /* v8 ignore start -- batch/progress thresholds */
    if (movieBatch.length >= BATCH_SIZE) await flush();
    if (seen % 5000 === 0) logger.info({ seen, inserted, skipped }, 'movies progress');
    /* v8 ignore stop */
  }
  await flush();

  return { inserted, skipped };
}
