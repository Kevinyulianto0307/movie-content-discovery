import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import { movies, movieLinks } from '@mcd/db/schema';
import { ingestMovies } from '../../src/loaders/movies.ts';
import { ingestLinks } from '../../src/loaders/links.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, unlinkSync } from 'node:fs';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Error Handling', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE movie_links RESTART IDENTITY CASCADE');
  });

  it('continues processing after encountering malformed rows', async () => {
    const path = join(fixturesDir, 'movies_with_errors.csv');
    const result = await ingestMovies(path);

    // Should process 2 valid movies and skip 1 malformed row
    expect(result.inserted).toBe(2);
    expect(result.skipped).toBe(1);

    const allMovies = await db.select().from(movies);
    expect(allMovies).toHaveLength(2);

    // Verify that the valid movies were inserted correctly
    const movieIds = allMovies.map((m) => m.id).sort();
    expect(movieIds).toEqual([862, 8844]);
  });

  it('handles CSV with missing optional columns', async () => {
    const tempCsv = join(fixturesDir, 'movies_minimal.csv');

    // Create CSV with minimal required fields
    writeFileSync(
      tempCsv,
      'adult,budget,genres,id,imdb_id,original_language,original_title,overview,popularity,release_date,revenue,runtime,status,tagline,title,vote_average,vote_count\n' +
      '0,1000000,"[]",99999,tt9999999,en,Test Movie,,1.0,2020-01-01,0,90,Released,,Test Movie,5.0,10\n',
    );

    try {
      const result = await ingestMovies(tempCsv);
      expect(result.inserted).toBe(1);

      const movie = await db.select().from(movies).where();
      expect(movie).toHaveLength(1);
      expect(movie[0].title).toBe('Test Movie');
      expect(movie[0].overview).toBeNull();
      expect(movie[0].tagline).toBeNull();
    } finally {
      unlinkSync(tempCsv);
    }
  });

  it('handles CSV with empty JSON arrays for genres/keywords', async () => {
    const tempCsv = join(fixturesDir, 'movies_no_genres.csv');

    writeFileSync(
      tempCsv,
      'adult,budget,genres,id,imdb_id,original_language,original_title,overview,popularity,release_date,revenue,runtime,status,tagline,title,vote_average,vote_count\n' +
      '0,1000000,"[]",99998,tt9999998,en,No Genres Movie,A movie with no genres,1.0,2020-01-01,0,90,Released,Empty,No Genres Movie,5.0,10\n',
    );

    try {
      const result = await ingestMovies(tempCsv);
      expect(result.inserted).toBe(1);

      const movie = await db.select().from(movies);
      expect(movie).toHaveLength(1);
      expect(movie[0].title).toBe('No Genres Movie');
    } finally {
      unlinkSync(tempCsv);
    }
  });

  it('handles completely empty CSV (header only)', async () => {
    const tempCsv = join(fixturesDir, 'empty.csv');

    writeFileSync(
      tempCsv,
      'movieId,imdbId,tmdbId\n',
    );

    try {
      const result = await ingestLinks(tempCsv);
      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);

      const links = await db.select().from(movieLinks);
      expect(links).toHaveLength(0);
    } finally {
      unlinkSync(tempCsv);
    }
  });

  it('handles rows with invalid data types', async () => {
    const tempCsv = join(fixturesDir, 'invalid_types.csv');

    writeFileSync(
      tempCsv,
      'movieId,imdbId,tmdbId\n' +
      '1,tt0114709,862\n' +
      'NOT_A_NUMBER,tt0113497,8844\n' + // Invalid movieId
      '3,tt0113228,INVALID\n', // Invalid tmdbId
    );

    try {
      const result = await ingestLinks(tempCsv);
      // Should insert 1 valid row and skip 2 invalid rows
      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(2);

      const links = await db.select().from(movieLinks);
      expect(links).toHaveLength(1);
      expect(links[0].movielensId).toBe(1);
    } finally {
      unlinkSync(tempCsv);
    }
  });

  it('logs errors without crashing when threshold is exceeded', async () => {
    // Create a CSV where most rows are invalid
    const tempCsv = join(fixturesDir, 'mostly_invalid.csv');

    const rows = ['movieId,imdbId,tmdbId'];
    // Add 1 valid row
    rows.push('1,tt0114709,862');
    // Add 25 invalid rows (more than the typical logging threshold of 20)
    for (let i = 0; i < 25; i++) {
      rows.push('INVALID_ROW');
    }

    writeFileSync(tempCsv, rows.join('\n'));

    try {
      const result = await ingestLinks(tempCsv);
      // Should still complete without crashing
      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(25);

      const links = await db.select().from(movieLinks);
      expect(links).toHaveLength(1);
    } finally {
      unlinkSync(tempCsv);
    }
  });

  it('handles rows with extra/unexpected columns', async () => {
    const tempCsv = join(fixturesDir, 'extra_columns.csv');

    writeFileSync(
      tempCsv,
      'movieId,imdbId,tmdbId,extraColumn,anotherExtra\n' +
      '1,tt0114709,862,ignored,also_ignored\n',
    );

    try {
      const result = await ingestLinks(tempCsv);
      expect(result.inserted).toBe(1);

      const links = await db.select().from(movieLinks);
      expect(links).toHaveLength(1);
      // Extra columns should be ignored
      expect(Object.keys(links[0])).toEqual(['movielensId', 'tmdbId']);
    } finally {
      unlinkSync(tempCsv);
    }
  });
});
