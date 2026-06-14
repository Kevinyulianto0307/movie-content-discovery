import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import { movieLinks } from '@mcd/db/schema';
import { ingestLinks } from '../../src/loaders/links.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Links Ingestion', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE movie_links RESTART IDENTITY CASCADE');
  });

  it('ingests links from CSV', async () => {
    const path = join(fixturesDir, 'links.csv');
    const result = await ingestLinks(path);

    expect(result.inserted).toBe(3);
    expect(result.skipped).toBe(0);

    const links = await db.select().from(movieLinks);
    expect(links).toHaveLength(3);
    expect(links[0]).toMatchObject({
      movielensId: 1,
      tmdbId: 862,
    });
  });

  it('is idempotent on re-run', async () => {
    const path = join(fixturesDir, 'links.csv');

    // First run
    await ingestLinks(path);
    const firstCount = await db.select().from(movieLinks);
    expect(firstCount).toHaveLength(3);

    // Second run should not duplicate
    await ingestLinks(path);
    const secondCount = await db.select().from(movieLinks);
    expect(secondCount).toHaveLength(3);
  });

  it('skips malformed rows', async () => {
    // Create a temp CSV with an invalid row
    const invalidCsv = join(fixturesDir, 'links_invalid.csv');
    const { writeFileSync, unlinkSync } = await import('node:fs');

    writeFileSync(invalidCsv, 'movieId,imdbId,tmdbId\n1,tt0114709,862\nINVALID\n3,tt0113228,15602\n');

    try {
      const result = await ingestLinks(invalidCsv);
      // Should insert 2 valid rows and skip 1
      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(1);

      const links = await db.select().from(movieLinks);
      expect(links).toHaveLength(2);
    } finally {
      unlinkSync(invalidCsv);
    }
  });
});
