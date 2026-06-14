import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import { movies, genres, movieGenres } from '@mcd/db/schema';
import { ingestMovies } from '../../src/loaders/movies.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { eq, and } from 'drizzle-orm';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Movies Ingestion', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');
  });

  it('ingests movies with genres from CSV', async () => {
    const path = join(fixturesDir, 'movies_metadata.csv');
    const result = await ingestMovies(path);

    expect(result.inserted).toBe(3);
    expect(result.skipped).toBe(0);

    const allMovies = await db.select().from(movies);
    expect(allMovies).toHaveLength(3);

    // Verify first movie
    const toyStory = allMovies.find((m) => m.id === 862);
    expect(toyStory).toMatchObject({
      id: 862,
      imdbId: 'tt0114709',
      title: 'Toy Story',
      originalTitle: 'Toy Story',
      overview: 'Led by Woody a group of toys comes to life.',
      releaseDate: '1995-10-30',
      releaseYear: 1995,
      budget: 30000000,
      runtime: 81,
      status: 'Released',
      tagline: 'A cowboy doll and a spaceman.',
      voteAverage: 7.7,
      voteCount: 5415,
      originalLanguage: 'en',
      adult: 0,
    });
    // Check revenue and popularity separately (floating point precision)
    expect(toyStory?.revenue).toBeCloseTo(373554033, -2);
    expect(toyStory?.popularity).toBeCloseTo(21.946943, 2);
  });

  it('populates genres and movie_genres junction table', async () => {
    const path = join(fixturesDir, 'movies_metadata.csv');
    await ingestMovies(path);

    const allGenres = await db.select().from(genres);
    // Animation, Comedy, Family, Adventure, Fantasy, Romance
    expect(allGenres.length).toBeGreaterThanOrEqual(6);

    // Verify Toy Story has Animation, Comedy, Family
    const toyStoryGenres = await db
      .select({ genreId: movieGenres.genreId, name: genres.name })
      .from(movieGenres)
      .innerJoin(genres, eq(genres.id, movieGenres.genreId))
      .where(eq(movieGenres.movieId, 862));

    expect(toyStoryGenres).toHaveLength(3);
    const genreNames = toyStoryGenres.map((g) => g.name).sort();
    expect(genreNames).toEqual(['Animation', 'Comedy', 'Family']);
  });

  it('is idempotent on re-run', async () => {
    const path = join(fixturesDir, 'movies_metadata.csv');

    // First run
    await ingestMovies(path);
    const firstMovies = await db.select().from(movies);
    const firstGenres = await db.select().from(genres);
    const firstJunctions = await db.select().from(movieGenres);

    // Second run should not duplicate
    await ingestMovies(path);
    const secondMovies = await db.select().from(movies);
    const secondGenres = await db.select().from(genres);
    const secondJunctions = await db.select().from(movieGenres);

    expect(secondMovies).toHaveLength(firstMovies.length);
    expect(secondGenres).toHaveLength(firstGenres.length);
    expect(secondJunctions).toHaveLength(firstJunctions.length);
  });

  it('skips malformed rows and continues processing', async () => {
    const path = join(fixturesDir, 'movies_with_errors.csv');
    const result = await ingestMovies(path);

    // Should insert 2 valid movies and skip 1 malformed row
    expect(result.inserted).toBe(2);
    expect(result.skipped).toBe(1);

    const allMovies = await db.select().from(movies);
    expect(allMovies).toHaveLength(2);
  });

  it('parses Python-style JSON genres correctly', async () => {
    const path = join(fixturesDir, 'movies_metadata.csv');
    await ingestMovies(path);

    // Verify the Animation genre exists with correct ID and name
    const animationGenre = await db
      .select()
      .from(genres)
      .where(eq(genres.id, 16));

    expect(animationGenre).toHaveLength(1);
    expect(animationGenre[0].name).toBe('Animation');
  });
});
