import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import { movies, castMembers, crewMembers } from '@mcd/db/schema';
import { ingestMovies } from '../../src/loaders/movies.ts';
import { ingestCredits } from '../../src/loaders/credits.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Credits Ingestion', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE cast_members, crew_members RESTART IDENTITY CASCADE');

    // Load movies first (FK dependency)
    const moviesPath = join(fixturesDir, 'movies_metadata.csv');
    await ingestMovies(moviesPath);
  });

  it('ingests cast and crew from CSV', async () => {
    const path = join(fixturesDir, 'credits.csv');
    const result = await ingestCredits(path);

    expect(result.inserted).toBe(3);
    expect(result.skipped).toBe(0);

    const allCast = await db.select().from(castMembers);
    const allCrew = await db.select().from(crewMembers);

    // 2 cast per movie * 3 movies = 6 total
    expect(allCast).toHaveLength(6);
    // 1 crew per movie * 3 movies = 3 total
    expect(allCrew).toHaveLength(3);
  });

  it('populates cast members with correct fields', async () => {
    const path = join(fixturesDir, 'credits.csv');
    await ingestCredits(path);

    const toyStoryCast = await db
      .select()
      .from(castMembers)
      .where(eq(castMembers.movieId, 862));

    expect(toyStoryCast).toHaveLength(2);

    const woody = toyStoryCast.find((c) => c.character === 'Woody (voice)');
    expect(woody).toMatchObject({
      movieId: 862,
      personId: 31,
      name: 'Tom Hanks',
      character: 'Woody (voice)',
      order: 0,
    });

    const buzz = toyStoryCast.find((c) => c.character === 'Buzz Lightyear (voice)');
    expect(buzz).toMatchObject({
      movieId: 862,
      personId: 12898,
      name: 'Tim Allen',
      character: 'Buzz Lightyear (voice)',
      order: 1,
    });
  });

  it('populates crew members with correct fields', async () => {
    const path = join(fixturesDir, 'credits.csv');
    await ingestCredits(path);

    const toyStoryCrew = await db
      .select()
      .from(crewMembers)
      .where(eq(crewMembers.movieId, 862));

    expect(toyStoryCrew).toHaveLength(1);
    expect(toyStoryCrew[0]).toMatchObject({
      movieId: 862,
      personId: 7879,
      name: 'John Lasseter',
      job: 'Director',
      department: 'Directing',
    });
  });

  it('truncates and re-inserts on re-run (serial PK strategy)', async () => {
    const path = join(fixturesDir, 'credits.csv');

    // First run
    await ingestCredits(path);
    const firstCast = await db.select().from(castMembers);
    const firstCrew = await db.select().from(crewMembers);

    // Second run should truncate and re-insert
    await ingestCredits(path);
    const secondCast = await db.select().from(castMembers);
    const secondCrew = await db.select().from(crewMembers);

    // Same counts
    expect(secondCast).toHaveLength(firstCast.length);
    expect(secondCrew).toHaveLength(firstCrew.length);

    // IDs should restart from 1 (due to RESTART IDENTITY)
    expect(secondCast[0].id).toBe(1);
    expect(secondCrew[0].id).toBe(1);
  });

  it('skips credits for movies not in the movies table', async () => {
    // Clear movies table
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');

    const path = join(fixturesDir, 'credits.csv');
    const result = await ingestCredits(path);

    // All credits should be skipped (no movies in DB)
    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(3);

    const allCast = await db.select().from(castMembers);
    const allCrew = await db.select().from(crewMembers);
    expect(allCast).toHaveLength(0);
    expect(allCrew).toHaveLength(0);
  });

  it('parses Python-style JSON cast/crew arrays', async () => {
    const path = join(fixturesDir, 'credits.csv');
    await ingestCredits(path);

    // Verify that character names with apostrophes are parsed correctly
    const cast = await db.select().from(castMembers);

    // All cast members should have valid names and characters
    cast.forEach((c) => {
      expect(c.name).toBeTruthy();
      expect(typeof c.name).toBe('string');
    });
  });
});
