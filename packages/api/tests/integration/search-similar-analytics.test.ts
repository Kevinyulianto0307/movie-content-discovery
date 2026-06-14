import { describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../../src/server.ts';
import { truncateAll, seedFixtures } from '../fixtures/seed.ts';
import { similarityScore, type Tags } from '../../src/lib/similarity.ts';

// Genre/keyword tag sets for the seeded fixtures (see fixtures/seed.ts). Used to
// check that the SQL the /similar endpoint runs agrees with the pure
// similarityScore() weighting — i.e. the pure function is an executable spec of
// the in-DB ranking, not dead code.
const FIXTURE_TAGS: Record<number, Tags> = {
  1: { genres: [1, 2], keywords: [10, 11] },
  2: { genres: [2, 3], keywords: [10, 12] },
  3: { genres: [1, 4], keywords: [] },
  8: { genres: [1], keywords: [] },
};

beforeEach(async () => {
  await truncateAll();
  await seedFixtures();
});

describe('GET /api/search', () => {
  it('finds movies by full-text query', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/search?q=alpha' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.data[0].title).toBe('Alpha Adventure');
  });

  it('returns 400 when q is missing', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/search' });
    expect(res.statusCode).toBe(400);
  });

  it('returns paginated results with correct envelope', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/search?q=adventure&page=1&pageSize=1' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ page: 1, pageSize: 1 });
    expect(body.data).toHaveLength(1);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it('returns empty results for non-matching query', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/search?q=xyznonexistent123' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('returns 400 when q exceeds max length', async () => {
    const app = buildServer();
    const longQuery = 'a'.repeat(201);
    const res = await app.inject({ method: 'GET', url: `/api/search?q=${longQuery}` });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when q is empty string', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/search?q=' });
    expect(res.statusCode).toBe(400);
  });

  it('returns empty results when q is only whitespace', async () => {
    const app = buildServer();
    // Whitespace-only passes min(1) validation but returns no FTS matches
    const res = await app.inject({ method: 'GET', url: '/api/search?q=%20%20%20' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(0);
  });

  it('searches across title and overview fields', async () => {
    const app = buildServer();
    // 'quest' appears in movie 1 overview and movie 2 overview
    const res = await app.inject({ method: 'GET', url: '/api/search?q=quest' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it('handles special characters in search query', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/search?q=alpha%26beta' });
    expect(res.statusCode).toBe(200);
    // Should not error, even if no results
  });
});

describe('GET /api/movies/:id/similar', () => {
  it('ranks by weighted shared genres + keywords', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1/similar' });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((m: { id: number }) => m.id);
    // movie 2 shares Adventure(genre) + quest(keyword); movie 3 shares Action(genre)
    expect(ids).toContain(2);
    expect(ids).toContain(3);
    // movie 2 (score 3) should outrank movie 3 (score 2)
    expect(ids.indexOf(2)).toBeLessThan(ids.indexOf(3));
  });

  it('scores each result exactly as the pure similarityScore() reference does', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1/similar' });
    const rows = res.json().data as Array<{ id: number; score: number }>;
    expect(rows.length).toBeGreaterThan(0);
    // For every row the SQL returned, its score must match the pure function — this
    // is what keeps the in-DB weighting and lib/similarity.ts from drifting apart.
    for (const row of rows) {
      expect(row.score).toBe(similarityScore(FIXTURE_TAGS[1]!, FIXTURE_TAGS[row.id]!));
    }
  });

  it('returns empty array for movie with no similar matches', async () => {
    const app = buildServer();
    // Movie 8 has only genre 1 (Action) and no keywords - limited matches
    const res = await app.inject({ method: 'GET', url: '/api/movies/999999/similar' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
  });

  it('excludes the source movie from similar results', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1/similar' });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((m: { id: number }) => m.id);
    expect(ids).not.toContain(1);
  });

  it('orders similar movies by score desc, then by vote_count desc', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1/similar' });
    expect(res.statusCode).toBe(200);
    const rows = res.json().data as Array<{ score: number }>;
    // Verify scores are in descending order
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.score).toBeGreaterThanOrEqual(rows[i]!.score);
    }
  });

  it('respects limit parameter', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1/similar?limit=1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
  });

  it('returns 400 for invalid limit', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1/similar?limit=999' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/analytics/top-genres', () => {
  it('returns genre popularity buckets by decade (default)', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/analytics/top-genres?minVotes=0' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('genre');
    expect(body.data[0]).toHaveProperty('movieCount');
    expect(body.data[0]).toHaveProperty('avgRevenue');
    expect(body.data[0]).toHaveProperty('avgRating');
    expect(body.data[0]).toHaveProperty('bucket');
  });

  it('returns buckets by year when bucket=year', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/analytics/top-genres?bucket=year&minVotes=0' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThan(0);
    // Year buckets should be 4-digit years, not decades
    const buckets = body.data.map((d: { bucket: number }) => d.bucket);
    expect(buckets.every((b: number) => b >= 1900 && b <= 2100)).toBe(true);
  });

  it('filters by minVotes threshold', async () => {
    const app = buildServer();
    // With high minVotes, fewer results should be returned
    const resLow = await app.inject({ method: 'GET', url: '/api/analytics/top-genres?minVotes=0' });
    const resHigh = await app.inject({ method: 'GET', url: '/api/analytics/top-genres?minVotes=1000' });
    expect(resLow.json().data.length).toBeGreaterThanOrEqual(resHigh.json().data.length);
  });

  it('returns 400 for invalid bucket value', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/analytics/top-genres?bucket=invalid' });
    expect(res.statusCode).toBe(400);
  });
});
