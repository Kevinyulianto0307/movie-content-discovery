import { db } from '@mcd/db';
import { movies, keywords, movieKeywords } from '@mcd/db/schema';
import { csvRows, BATCH_SIZE } from '../lib/csv.ts';
import { KeywordsRowSchema } from '../validators/rows.ts';
import { KeywordItemSchema } from '../validators/json-items.ts';
import { parseJsonArray } from '../parsers/json-columns.ts';
import type { LoadResult } from './types.ts';

// keywords.csv -> keywords + movie_keywords junction. Keywords inserted before
// junction rows (FK). Rows for movies not in `movies` are skipped (FK safety).
export async function ingestKeywords(path: string): Promise<LoadResult> {
  const movieIds = new Set(
    (await db.select({ id: movies.id }).from(movies)).map((r) => r.id),
  );

  let kwBuf = new Map<number, string>();
  let mkBatch: (typeof movieKeywords.$inferInsert)[] = [];
  let inserted = 0;
  let skipped = 0;

  const flush = async () => {
    if (kwBuf.size) {
      const rows = [...kwBuf].map(([id, name]) => ({ id, name }));
      await db.insert(keywords).values(rows).onConflictDoNothing();
      kwBuf = new Map();
    }
    if (mkBatch.length) {
      await db.insert(movieKeywords).values(mkBatch).onConflictDoNothing();
      mkBatch = [];
    }
  };

  for await (const raw of csvRows(path)) {
    const result = KeywordsRowSchema.safeParse(raw);
    if (!result.success || !movieIds.has(result.data.id)) {
      skipped++;
      continue;
    }
    const movieId = result.data.id;

    for (const k of parseJsonArray(raw.keywords, KeywordItemSchema)) {
      kwBuf.set(k.id, k.name);
      mkBatch.push({ movieId, keywordId: k.id });
    }

    inserted++;
    /* v8 ignore next -- batch flush threshold rarely hit in tests */
    if (mkBatch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  return { inserted, skipped };
}
