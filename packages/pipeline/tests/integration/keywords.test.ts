import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import { movies, keywords, movieKeywords } from '@mcd/db/schema';
import { ingestMovies } from '../../src/loaders/movies.ts';
import { ingestKeywords } from '../../src/loaders/keywords.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Keywords Ingestion', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE keywords, movie_keywords RESTART IDENTITY CASCADE');

    // Load movies first (FK dependency)
    const moviesPath = join(fixturesDir, 'movies_metadata.csv');
    await ingestMovies(moviesPath);
  });

  it('ingests keywords and junction table from CSV', async () => {
    const path = join(fixturesDir, 'keywords.csv');
    const result = await ingestKeywords(path);

    expect(result.inserted).toBe(3);
    expect(result.skipped).toBe(0);

    const allKeywords = await db.select().from(keywords);
    const allJunctions = await db.select().from(movieKeywords);

    // Unique keywords across all movies: jealousy, toy, boy, board game, disappearance, fishing, best friend, old men = 8
    expect(allKeywords.length).toBeGreaterThanOrEqual(8);

    // Total keyword associations: 3 + 2 + 3 = 8
    expect(allJunctions).toHaveLength(8);
  });

  it('populates keywords with correct IDs and names', async () => {
    const path = join(fixturesDir, 'keywords.csv');
    await ingestKeywords(path);

    const jealousyKeyword = await db
      .select()
      .from(keywords)
      .where(eq(keywords.id, 931));

    expect(jealousyKeyword).toHaveLength(1);
    expect(jealousyKeyword[0].name).toBe('jealousy');

    const toyKeyword = await db
      .select()
      .from(keywords)
      .where(eq(keywords.id, 4290));

    expect(toyKeyword).toHaveLength(1);
    expect(toyKeyword[0].name).toBe('toy');
  });

  it('creates correct movie-keyword associations', async () => {
    const path = join(fixturesDir, 'keywords.csv');
    await ingestKeywords(path);

    // Toy Story (862) should have: jealousy, toy, boy
    const toyStoryKeywords = await db
      .select({ keywordId: movieKeywords.keywordId, name: keywords.name })
      .from(movieKeywords)
      .innerJoin(keywords, eq(keywords.id, movieKeywords.keywordId))
      .where(eq(movieKeywords.movieId, 862));

    expect(toyStoryKeywords).toHaveLength(3);
    const keywordNames = toyStoryKeywords.map((k) => k.name).sort();
    expect(keywordNames).toEqual(['boy', 'jealousy', 'toy']);
  });

  it('is idempotent on re-run', async () => {
    const path = join(fixturesDir, 'keywords.csv');

    // First run
    await ingestKeywords(path);
    const firstKeywords = await db.select().from(keywords);
    const firstJunctions = await db.select().from(movieKeywords);

    // Second run should not duplicate
    await ingestKeywords(path);
    const secondKeywords = await db.select().from(keywords);
    const secondJunctions = await db.select().from(movieKeywords);

    expect(secondKeywords).toHaveLength(firstKeywords.length);
    expect(secondJunctions).toHaveLength(firstJunctions.length);
  });

  it('skips keywords for movies not in the movies table', async () => {
    // Clear movies table
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');

    const path = join(fixturesDir, 'keywords.csv');
    const result = await ingestKeywords(path);

    // All rows should be skipped (no movies in DB)
    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(3);

    const allKeywords = await db.select().from(keywords);
    const allJunctions = await db.select().from(movieKeywords);
    expect(allKeywords).toHaveLength(0);
    expect(allJunctions).toHaveLength(0);
  });

  it('parses Python-style JSON keyword arrays', async () => {
    const path = join(fixturesDir, 'keywords.csv');
    await ingestKeywords(path);

    // Verify all keywords have valid IDs and names
    const allKeywords = await db.select().from(keywords);
    allKeywords.forEach((k) => {
      expect(k.id).toBeGreaterThan(0);
      expect(k.name).toBeTruthy();
      expect(typeof k.name).toBe('string');
    });
  });
});
