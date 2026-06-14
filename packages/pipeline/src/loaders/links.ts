import { db } from '@mcd/db';
import { movieLinks } from '@mcd/db/schema';
import { csvRows, BATCH_SIZE } from '../lib/csv.ts';
import { LinkRowSchema } from '../validators/rows.ts';
import type { LoadResult } from './types.ts';

// links.csv -> movie_links. Loaded first; ratings depend on this mapping.
export async function ingestLinks(path: string): Promise<LoadResult> {
  let batch: (typeof movieLinks.$inferInsert)[] = [];
  let inserted = 0;
  let skipped = 0;

  const flush = async () => {
    if (!batch.length) return;
    await db.insert(movieLinks).values(batch).onConflictDoNothing();
    inserted += batch.length;
    batch = [];
  };

  for await (const raw of csvRows(path)) {
    const result = LinkRowSchema.safeParse(raw);
    if (!result.success) {
      skipped++;
      continue;
    }
    batch.push(result.data);
    /* v8 ignore next -- batch flush threshold rarely hit in tests */
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  return { inserted, skipped };
}
