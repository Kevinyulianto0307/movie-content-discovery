import { describe, it, expect } from 'vitest';
import {
  ListQuery,
  IdParam,
  SimilarQuery,
  MovieListItemSchema,
  MovieDetailSchema,
  SimilarMovieSchema,
  NotFoundSchema,
} from '../../src/schemas/movies.schema.ts';
import { SearchQuery, SearchResultItemSchema } from '../../src/schemas/search.schema.ts';
import { AnalyticsQuery, TopGenreRowSchema } from '../../src/schemas/analytics.schema.ts';
import { HealthSchema } from '../../src/schemas/health.schema.ts';

describe('Request schemas', () => {
  describe('ListQuery', () => {
    it('parses valid query with defaults', () => {
      const result = ListQuery.parse({});
      expect(result.sort).toBe('vote_average');
      expect(result.order).toBe('desc');
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('parses all filter parameters', () => {
      const result = ListQuery.parse({
        sort: 'title',
        order: 'asc',
        genre: 'Action',
        yearFrom: '2000',
        yearTo: '2020',
        minVoteCount: '100',
        page: '2',
        pageSize: '50',
      });
      expect(result.sort).toBe('title');
      expect(result.order).toBe('asc');
      expect(result.genre).toBe('Action');
      expect(result.yearFrom).toBe(2000);
      expect(result.yearTo).toBe(2020);
      expect(result.minVoteCount).toBe(100);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(50);
    });

    it('rejects invalid sort field', () => {
      expect(() => ListQuery.parse({ sort: 'invalid' })).toThrow();
    });
  });

  describe('IdParam', () => {
    it('parses and coerces numeric id', () => {
      const result = IdParam.parse({ id: '123' });
      expect(result.id).toBe(123);
    });

    it('rejects negative id', () => {
      expect(() => IdParam.parse({ id: '-1' })).toThrow();
    });

    it('rejects zero', () => {
      expect(() => IdParam.parse({ id: '0' })).toThrow();
    });
  });

  describe('SimilarQuery', () => {
    it('uses default limit', () => {
      const result = SimilarQuery.parse({});
      expect(result.limit).toBe(10);
    });

    it('rejects limit over 50', () => {
      expect(() => SimilarQuery.parse({ limit: '51' })).toThrow();
    });
  });

  describe('SearchQuery', () => {
    it('parses valid search query', () => {
      const result = SearchQuery.parse({ q: 'matrix' });
      expect(result.q).toBe('matrix');
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('rejects missing q', () => {
      expect(() => SearchQuery.parse({})).toThrow();
    });

    it('rejects empty q', () => {
      expect(() => SearchQuery.parse({ q: '' })).toThrow();
    });

    it('rejects q longer than 200 chars', () => {
      expect(() => SearchQuery.parse({ q: 'a'.repeat(201) })).toThrow();
    });
  });

  describe('AnalyticsQuery', () => {
    it('uses decade bucket by default', () => {
      const result = AnalyticsQuery.parse({});
      expect(result.bucket).toBe('decade');
      expect(result.minVotes).toBe(50);
    });

    it('accepts year bucket', () => {
      const result = AnalyticsQuery.parse({ bucket: 'year', minVotes: '100' });
      expect(result.bucket).toBe('year');
      expect(result.minVotes).toBe(100);
    });

    it('rejects invalid bucket', () => {
      expect(() => AnalyticsQuery.parse({ bucket: 'month' })).toThrow();
    });
  });
});

describe('Response schemas', () => {
  describe('MovieListItemSchema', () => {
    it('parses valid movie list item', () => {
      const result = MovieListItemSchema.parse({
        id: 1,
        title: 'Test Movie',
        releaseDate: '2020-01-01',
        releaseYear: 2020,
        voteAverage: 7.5,
        voteCount: 1000,
        revenue: 100000000,
      });
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Movie');
    });

    it('allows null optional fields', () => {
      const result = MovieListItemSchema.parse({
        id: 1,
        title: 'Test',
        releaseDate: null,
        releaseYear: null,
        voteAverage: null,
        voteCount: null,
        revenue: null,
      });
      expect(result.releaseDate).toBeNull();
    });
  });

  describe('MovieDetailSchema', () => {
    it('parses complete movie detail', () => {
      const result = MovieDetailSchema.parse({
        id: 1,
        imdbId: 'tt1234567',
        title: 'Test Movie',
        originalTitle: 'Original Test',
        overview: 'A test movie.',
        tagline: 'Test tagline',
        releaseDate: '2020-01-01',
        releaseYear: 2020,
        budget: 50000000,
        revenue: 100000000,
        runtime: 120,
        voteAverage: 7.5,
        voteCount: 1000,
        popularity: 50.5,
        status: 'Released',
        originalLanguage: 'en',
        genres: [{ id: 1, name: 'Action' }],
        cast: [{ personId: 1, name: 'Actor', character: 'Hero', order: 0 }],
        crew: [{ personId: 2, name: 'Director', job: 'Director', department: 'Directing' }],
        keywords: [{ id: 1, name: 'action' }],
        ratings: { average: 4.5, count: 10 },
      });
      expect(result.genres).toHaveLength(1);
      expect(result.cast).toHaveLength(1);
      expect(result.crew).toHaveLength(1);
    });

    it('allows null ratings average', () => {
      const result = MovieDetailSchema.parse({
        id: 1,
        imdbId: null,
        title: 'Test',
        originalTitle: null,
        overview: null,
        tagline: null,
        releaseDate: null,
        releaseYear: null,
        budget: null,
        revenue: null,
        runtime: null,
        voteAverage: null,
        voteCount: null,
        popularity: null,
        status: null,
        originalLanguage: null,
        genres: [],
        cast: [],
        crew: [],
        keywords: [],
        ratings: { average: null, count: 0 },
      });
      expect(result.ratings.average).toBeNull();
    });
  });

  describe('SimilarMovieSchema', () => {
    it('parses valid similar movie', () => {
      const result = SimilarMovieSchema.parse({
        id: 2,
        title: 'Similar Movie',
        releaseYear: 2020,
        voteAverage: 7.0,
        score: 5,
      });
      expect(result.score).toBe(5);
    });
  });

  describe('SearchResultItemSchema', () => {
    it('parses valid search result', () => {
      const result = SearchResultItemSchema.parse({
        id: 1,
        title: 'Found Movie',
        releaseDate: '2020-01-01',
        releaseYear: 2020,
        voteAverage: 7.5,
        voteCount: 500,
        rank: 0.8,
      });
      expect(result.rank).toBe(0.8);
    });
  });

  describe('TopGenreRowSchema', () => {
    it('parses valid analytics row', () => {
      const result = TopGenreRowSchema.parse({
        bucket: 2020,
        genre: 'Action',
        movieCount: 50,
        avgRevenue: 100000000,
        avgRating: 7.5,
      });
      expect(result.movieCount).toBe(50);
    });

    it('allows null averages', () => {
      const result = TopGenreRowSchema.parse({
        bucket: 2020,
        genre: 'Documentary',
        movieCount: 5,
        avgRevenue: null,
        avgRating: null,
      });
      expect(result.avgRevenue).toBeNull();
    });
  });

  describe('NotFoundSchema', () => {
    it('parses not found error', () => {
      const result = NotFoundSchema.parse({ error: 'not_found' });
      expect(result.error).toBe('not_found');
    });
  });

  describe('HealthSchema', () => {
    it('parses health response', () => {
      const result = HealthSchema.parse({ status: 'ok', db: 'connected' });
      expect(result.status).toBe('ok');
      expect(result.db).toBe('connected');
    });

    it('parses degraded health response', () => {
      const result = HealthSchema.parse({ status: 'degraded', db: 'unavailable' });
      expect(result.status).toBe('degraded');
    });
  });
});
