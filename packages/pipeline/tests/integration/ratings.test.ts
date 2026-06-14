import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import { movies, movieLinks, ratings } from '@mcd/db/schema';
import { ingestLinks } from '../../src/loaders/links.ts';
import { ingestMovies } from '../../src/loaders/movies.ts';
import { ingestRatings } from '../../src/loaders/ratings.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Ratings Ingestion', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE movie_links RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE ratings RESTART IDENTITY CASCADE');

    // Load links and movies first (FK dependencies)
    const linksPath = join(fixturesDir, 'links.csv');
    const moviesPath = join(fixturesDir, 'movies_metadata.csv');
    await ingestLinks(linksPath);
    await ingestMovies(moviesPath);
  });

  it('ingests ratings from CSV with MovieLens ID mapping', async () => {
    const path = join(fixturesDir, 'ratings.csv');
    const result = await ingestRatings(path);

    expect(result.inserted).toBe(5);
    expect(result.skipped).toBe(0);

    const allRatings = await db.select().from(ratings);
    expect(allRatings).toHaveLength(5);
  });

  it('maps MovieLens IDs to TMDB IDs correctly', async () => {
    const path = join(fixturesDir, 'ratings.csv');
    await ingestRatings(path);

    // MovieLens ID 1 -> TMDB ID 862 (Toy Story)
    const toyStoryRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.movieId, 862));

    // Should have 3 ratings for Toy Story (users 1, 2, 3)
    expect(toyStoryRatings).toHaveLength(3);

    const userOneRating = toyStoryRatings.find((r) => r.userId === 1);
    expect(userOneRating).toMatchObject({
      userId: 1,
      movieId: 862,
      rating: 4.0,
      timestamp: 964982703,
    });
  });

  it('skips ratings for movies without MovieLens mapping', async () => {
    // Create a rating CSV with an unmapped MovieLens ID
    const invalidCsv = join(fixturesDir, 'ratings_invalid.csv');
    const { writeFileSync, unlinkSync } = await import('node:fs');

    writeFileSync(
      invalidCsv,
      'userId,movieId,rating,timestamp\n1,1,4.0,964982703\n1,9999,5.0,964982704\n',
    );

    try {
      const result = await ingestRatings(invalidCsv);
      // Should insert 1 valid rating and skip 1 (unmapped movieId)
      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(1);

      const allRatings = await db.select().from(ratings);
      expect(allRatings).toHaveLength(1);
    } finally {
      unlinkSync(invalidCsv);
    }
  });

  it('is idempotent on re-run', async () => {
    const path = join(fixturesDir, 'ratings.csv');

    // First run
    await ingestRatings(path);
    const firstRatings = await db.select().from(ratings);

    // Second run should not duplicate
    await ingestRatings(path);
    const secondRatings = await db.select().from(ratings);

    expect(secondRatings).toHaveLength(firstRatings.length);
  });

  it('handles multiple ratings per movie', async () => {
    const path = join(fixturesDir, 'ratings.csv');
    await ingestRatings(path);

    // MovieLens ID 1 (TMDB 862) has 3 ratings
    const toyStoryRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.movieId, 862));

    expect(toyStoryRatings).toHaveLength(3);

    // Verify different users
    const userIds = toyStoryRatings.map((r) => r.userId).sort();
    expect(userIds).toEqual([1, 2, 3]);

    // Verify different ratings
    const ratingValues = toyStoryRatings.map((r) => r.rating).sort();
    expect(ratingValues).toEqual([4.0, 4.0, 5.0]);
  });
});
