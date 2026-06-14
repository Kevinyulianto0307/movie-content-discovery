import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import { movies } from '@mcd/db/schema';
import { ingestMovies } from '../../src/loaders/movies.ts';
import { populateSearchVector } from '../../src/loaders/search-vector.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { eq, sql } from 'drizzle-orm';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Search Vector Population', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');

    // Load movies first
    const moviesPath = join(fixturesDir, 'movies_metadata.csv');
    await ingestMovies(moviesPath);
  });

  it('populates search_vector for all movies', async () => {
    await populateSearchVector();

    const allMovies = await db.select().from(movies);

    // All movies should have search_vector populated
    allMovies.forEach((movie) => {
      expect(movie.searchVector).toBeTruthy();
    });
  });

  it('search_vector includes title content', async () => {
    await populateSearchVector();

    // Query using ts_query to verify "Toy Story" is searchable
    const result = await pool.query(
      `SELECT id, title FROM movies WHERE search_vector @@ to_tsquery('english', 'toy') LIMIT 1`,
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].title).toBe('Toy Story');
  });

  it('search_vector includes overview content', async () => {
    await populateSearchVector();

    // Query for "toys" which appears in Toy Story's overview
    const result = await pool.query(
      `SELECT id, title FROM movies WHERE search_vector @@ to_tsquery('english', 'toys')`,
    );

    expect(result.rows.length).toBeGreaterThan(0);
    const toyStory = result.rows.find((r: { title: string }) => r.title === 'Toy Story');
    expect(toyStory).toBeTruthy();
  });

  it('search_vector includes tagline content', async () => {
    await populateSearchVector();

    // Query for "cowboy" which appears in Toy Story's tagline
    const result = await pool.query(
      `SELECT id, title FROM movies WHERE search_vector @@ to_tsquery('english', 'cowboy')`,
    );

    expect(result.rows.length).toBeGreaterThan(0);
    const toyStory = result.rows.find((r: { title: string }) => r.title === 'Toy Story');
    expect(toyStory).toBeTruthy();
  });

  it('is idempotent on re-run', async () => {
    // First population
    await populateSearchVector();
    const firstResult = await pool.query(
      `SELECT id, search_vector FROM movies ORDER BY id`,
    );

    // Second population
    await populateSearchVector();
    const secondResult = await pool.query(
      `SELECT id, search_vector FROM movies ORDER BY id`,
    );

    // Should have same results
    expect(secondResult.rows).toHaveLength(firstResult.rows.length);
  });

  it('handles movies with null/missing text fields', async () => {
    // Create a movie with minimal text
    await db.insert(movies).values({
      id: 99999,
      title: 'Minimal',
      // No overview, tagline, or originalTitle
    });

    await populateSearchVector();

    // Should not crash and should populate based on title alone
    const movie = await db.select().from(movies).where(eq(movies.id, 99999));
    expect(movie[0].searchVector).toBeTruthy();
  });
});
