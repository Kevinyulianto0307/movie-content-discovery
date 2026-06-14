import { describe, it, expect, beforeEach } from 'vitest';
import { db, pool } from '@mcd/db';
import {
  movies,
  movieLinks,
  genres,
  movieGenres,
  castMembers,
  crewMembers,
  keywords,
  movieKeywords,
  ratings,
} from '@mcd/db/schema';
import { ingestLinks } from '../../src/loaders/links.ts';
import { ingestMovies } from '../../src/loaders/movies.ts';
import { ingestCredits } from '../../src/loaders/credits.ts';
import { ingestKeywords } from '../../src/loaders/keywords.ts';
import { ingestRatings } from '../../src/loaders/ratings.ts';
import { populateSearchVector } from '../../src/loaders/search-vector.ts';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

describe('Full Ingestion Flow', () => {
  beforeEach(async () => {
    // Clean all tables
    await pool.query('TRUNCATE movie_links RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE movies, genres, movie_genres RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE cast_members, crew_members RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE keywords, movie_keywords RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE ratings RESTART IDENTITY CASCADE');
  });

  it('runs complete ingestion pipeline in FK-safe order', async () => {
    // Step 1: Links
    const linksResult = await ingestLinks(join(fixturesDir, 'links.csv'));
    expect(linksResult.inserted).toBe(3);

    // Step 2: Movies (with genres)
    const moviesResult = await ingestMovies(join(fixturesDir, 'movies_metadata.csv'));
    expect(moviesResult.inserted).toBe(3);

    // Step 3: Credits
    const creditsResult = await ingestCredits(join(fixturesDir, 'credits.csv'));
    expect(creditsResult.inserted).toBe(3);

    // Step 4: Keywords
    const keywordsResult = await ingestKeywords(join(fixturesDir, 'keywords.csv'));
    expect(keywordsResult.inserted).toBe(3);

    // Step 5: Ratings
    const ratingsResult = await ingestRatings(join(fixturesDir, 'ratings.csv'));
    expect(ratingsResult.inserted).toBe(5);

    // Step 6: Search vector
    await populateSearchVector();

    // Verify all tables are populated
    const allLinks = await db.select().from(movieLinks);
    const allMovies = await db.select().from(movies);
    const allGenres = await db.select().from(genres);
    const allMovieGenres = await db.select().from(movieGenres);
    const allCast = await db.select().from(castMembers);
    const allCrew = await db.select().from(crewMembers);
    const allKeywords = await db.select().from(keywords);
    const allMovieKeywords = await db.select().from(movieKeywords);
    const allRatings = await db.select().from(ratings);

    expect(allLinks).toHaveLength(3);
    expect(allMovies).toHaveLength(3);
    expect(allGenres.length).toBeGreaterThanOrEqual(6);
    expect(allMovieGenres).toHaveLength(8); // Total genre associations
    expect(allCast).toHaveLength(6);
    expect(allCrew).toHaveLength(3);
    expect(allKeywords.length).toBeGreaterThanOrEqual(8);
    expect(allMovieKeywords).toHaveLength(8);
    expect(allRatings).toHaveLength(5);

    // Verify search vectors are populated
    allMovies.forEach((movie) => {
      expect(movie.searchVector).toBeTruthy();
    });
  });

  it('verifies FK relationships are intact', async () => {
    // Run full ingestion
    await ingestLinks(join(fixturesDir, 'links.csv'));
    await ingestMovies(join(fixturesDir, 'movies_metadata.csv'));
    await ingestCredits(join(fixturesDir, 'credits.csv'));
    await ingestKeywords(join(fixturesDir, 'keywords.csv'));
    await ingestRatings(join(fixturesDir, 'ratings.csv'));

    // Test FK: movie_genres -> movies
    const movieGenresData = await db
      .select()
      .from(movieGenres)
      .innerJoin(movies, eq(movies.id, movieGenres.movieId));
    expect(movieGenresData.length).toBeGreaterThan(0);

    // Test FK: cast_members -> movies
    const castData = await db
      .select()
      .from(castMembers)
      .innerJoin(movies, eq(movies.id, castMembers.movieId));
    expect(castData).toHaveLength(6);

    // Test FK: ratings -> movies
    const ratingsData = await db
      .select()
      .from(ratings)
      .innerJoin(movies, eq(movies.id, ratings.movieId));
    expect(ratingsData).toHaveLength(5);
  });

  it('handles gracefully when optional files are missing', async () => {
    // Only load required files: links and movies
    await ingestLinks(join(fixturesDir, 'links.csv'));
    await ingestMovies(join(fixturesDir, 'movies_metadata.csv'));

    // Credits, keywords, and ratings not loaded
    const allMovies = await db.select().from(movies);
    const allCast = await db.select().from(castMembers);
    const allKeywords = await db.select().from(keywords);
    const allRatings = await db.select().from(ratings);

    expect(allMovies).toHaveLength(3);
    expect(allCast).toHaveLength(0);
    expect(allKeywords).toHaveLength(0);
    expect(allRatings).toHaveLength(0);
  });

  it('is fully idempotent on complete re-run', async () => {
    // First run
    await ingestLinks(join(fixturesDir, 'links.csv'));
    await ingestMovies(join(fixturesDir, 'movies_metadata.csv'));
    await ingestCredits(join(fixturesDir, 'credits.csv'));
    await ingestKeywords(join(fixturesDir, 'keywords.csv'));
    await ingestRatings(join(fixturesDir, 'ratings.csv'));
    await populateSearchVector();

    const firstCounts = {
      links: (await db.select().from(movieLinks)).length,
      movies: (await db.select().from(movies)).length,
      genres: (await db.select().from(genres)).length,
      movieGenres: (await db.select().from(movieGenres)).length,
      cast: (await db.select().from(castMembers)).length,
      crew: (await db.select().from(crewMembers)).length,
      keywords: (await db.select().from(keywords)).length,
      movieKeywords: (await db.select().from(movieKeywords)).length,
      ratings: (await db.select().from(ratings)).length,
    };

    // Second run
    await ingestLinks(join(fixturesDir, 'links.csv'));
    await ingestMovies(join(fixturesDir, 'movies_metadata.csv'));
    await ingestCredits(join(fixturesDir, 'credits.csv'));
    await ingestKeywords(join(fixturesDir, 'keywords.csv'));
    await ingestRatings(join(fixturesDir, 'ratings.csv'));
    await populateSearchVector();

    const secondCounts = {
      links: (await db.select().from(movieLinks)).length,
      movies: (await db.select().from(movies)).length,
      genres: (await db.select().from(genres)).length,
      movieGenres: (await db.select().from(movieGenres)).length,
      cast: (await db.select().from(castMembers)).length,
      crew: (await db.select().from(crewMembers)).length,
      keywords: (await db.select().from(keywords)).length,
      movieKeywords: (await db.select().from(movieKeywords)).length,
      ratings: (await db.select().from(ratings)).length,
    };

    // All counts should match
    expect(secondCounts).toEqual(firstCounts);
  });

  it('provides accurate summary stats', async () => {
    const summary = {
      links: await ingestLinks(join(fixturesDir, 'links.csv')),
      movies: await ingestMovies(join(fixturesDir, 'movies_metadata.csv')),
      credits: await ingestCredits(join(fixturesDir, 'credits.csv')),
      keywords: await ingestKeywords(join(fixturesDir, 'keywords.csv')),
      ratings: await ingestRatings(join(fixturesDir, 'ratings.csv')),
    };

    // Verify each loader reports correct counts
    expect(summary.links).toEqual({ inserted: 3, skipped: 0 });
    expect(summary.movies).toEqual({ inserted: 3, skipped: 0 });
    expect(summary.credits).toEqual({ inserted: 3, skipped: 0 });
    expect(summary.keywords).toEqual({ inserted: 3, skipped: 0 });
    expect(summary.ratings).toEqual({ inserted: 5, skipped: 0 });
  });
});
