import { describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../../src/server.ts';
import { truncateAll, seedFixtures } from '../fixtures/seed.ts';

beforeEach(async () => {
  await truncateAll();
  await seedFixtures();
});

describe('GET /api/movies', () => {
  it('returns a paginated list of all movies (no content filter)', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?pageSize=10' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ page: 1, pageSize: 10 });
    expect(body.total).toBe(8); // all 8 fixtures, adult flag is not filtered
    expect(body.data).toHaveLength(8);
    expect(body.data.some((m: { title: string }) => m.title === 'Theta Adult')).toBe(true);
  });

  it('filters by yearFrom', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?yearFrom=2010' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Movies from 2010 and later: 4 (2010), 5 (2015), 7 (2012)
    expect(body.total).toBe(3);
    const years = body.data.map((m: { releaseYear: number }) => m.releaseYear);
    expect(years.every((y: number) => y >= 2010)).toBe(true);
  });

  it('filters by yearTo', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?yearTo=2000' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Movies up to 2000: 1 (1999), 3 (1995), 8 (2000)
    expect(body.total).toBe(3);
    const years = body.data.map((m: { releaseYear: number }) => m.releaseYear);
    expect(years.every((y: number) => y <= 2000)).toBe(true);
  });

  it('filters by yearFrom and yearTo range', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?yearFrom=2000&yearTo=2010' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Movies between 2000-2010: 2 (2001), 4 (2010), 6 (2008), 8 (2000)
    expect(body.total).toBe(4);
  });

  it('filters by minVoteCount', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?minVoteCount=60' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Movies with 60+ votes: 1 (100), 2 (80), 3 (60), 7 (70)
    expect(body.total).toBe(4);
    const voteCounts = body.data.map((m: { voteCount: number }) => m.voteCount);
    expect(voteCounts.every((v: number) => v >= 60)).toBe(true);
  });

  it('combines genre filter with year filter', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?genre=Action&yearFrom=1999' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Action movies from 1999+: 1 (1999), 8 (2000)
    expect(body.total).toBe(2);
  });

  it('returns zero total when no movies match filters', async () => {
    const app = buildServer();
    // No movies exist from year 3000
    const res = await app.inject({ method: 'GET', url: '/api/movies?yearFrom=3000' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(0);
    expect(body.data).toEqual([]);
  });

  it('returns zero total when genre does not exist', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?genre=NonexistentGenre' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(0);
    expect(body.data).toEqual([]);
  });

  it('respects pageSize', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?pageSize=3' });
    expect(res.json().data).toHaveLength(3);
  });

  it('filters by genre', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?genre=Adventure' });
    expect(res.statusCode).toBe(200);
    expect(res.json().total).toBe(2); // movies 1 and 2
  });

  it('returns 400 on an out-of-range pageSize', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies?pageSize=9999' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_query');
  });

  describe('sorting', () => {
    it('sorts by title ascending', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?sort=title&order=asc&pageSize=10' });
      expect(res.statusCode).toBe(200);
      const titles = res.json().data.map((m: { title: string }) => m.title);
      const sorted = [...titles].sort();
      expect(titles).toEqual(sorted);
    });

    it('sorts by title descending', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?sort=title&order=desc&pageSize=10' });
      expect(res.statusCode).toBe(200);
      const titles = res.json().data.map((m: { title: string }) => m.title);
      const sorted = [...titles].sort().reverse();
      expect(titles).toEqual(sorted);
    });

    it('sorts by release_date descending (newest first)', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?sort=release_date&order=desc&pageSize=10' });
      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      // Movies are sorted by releaseDate desc - null values go to end (NULLS LAST)
      // Seed data: 2015, 2012, 2010, 2008, 2001, 2000, 1999, 1995 (all non-null)
      const years = data.map((m: { releaseYear: number | null }) => m.releaseYear);
      // Filter only non-null values which should be in descending order
      const nonNullYears = years.filter((y: number | null): y is number => y !== null);
      // Verify non-null years are in descending order
      for (let i = 0; i < nonNullYears.length - 1; i++) {
        expect(nonNullYears[i]).toBeGreaterThanOrEqual(nonNullYears[i + 1]);
      }
      // Verify the newest movie (2015) is first
      expect(nonNullYears[0]).toBe(2015);
    });

    it('sorts by vote_average descending (highest rated first)', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?sort=vote_average&order=desc&pageSize=10' });
      expect(res.statusCode).toBe(200);
      const ratings = res.json().data.map((m: { voteAverage: number | null }) => m.voteAverage).filter(Boolean);
      // Verify descending order (highest rating first)
      for (let i = 0; i < ratings.length - 1; i++) {
        expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
      }
      // Verify the top movie is Alpha Adventure with 8.0 rating
      expect(res.json().data[0].title).toBe('Alpha Adventure');
      expect(res.json().data[0].voteAverage).toBe(8.0);
    });

    it('sorts by vote_average ascending (lowest rated first)', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?sort=vote_average&order=asc&pageSize=10' });
      expect(res.statusCode).toBe(200);
      const ratings = res.json().data.map((m: { voteAverage: number | null }) => m.voteAverage).filter(Boolean);
      // Verify ascending order (lowest rating first)
      for (let i = 0; i < ratings.length - 1; i++) {
        expect(ratings[i]).toBeLessThanOrEqual(ratings[i + 1]);
      }
    });

    it('sorts by revenue ascending', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?sort=revenue&order=asc&pageSize=10' });
      expect(res.statusCode).toBe(200);
      const revenues = res.json().data.map((m: { revenue: number | null }) => m.revenue).filter(Boolean);
      // Verify ascending order
      for (let i = 0; i < revenues.length - 1; i++) {
        expect(revenues[i]).toBeLessThanOrEqual(revenues[i + 1]);
      }
    });
  });

  describe('pagination edge cases', () => {
    it('returns empty data array when page is beyond total data', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?page=999&pageSize=10' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toEqual([]);
      expect(body.total).toBe(8); // Total count remains accurate
      expect(body.page).toBe(999);
      expect(body.pageSize).toBe(10);
    });

    it('returns 400 validation error for page=0', async () => {
      const app = buildServer();
      const res = await app.inject({ method: 'GET', url: '/api/movies?page=0&pageSize=10' });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('invalid_query');
    });

    it('returns correct items on the last page when not evenly divisible', async () => {
      const app = buildServer();
      // With 8 items and pageSize=3: page 1 (3 items), page 2 (3 items), page 3 (2 items)
      const res = await app.inject({ method: 'GET', url: '/api/movies?page=3&pageSize=3' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(2); // Last page has 2 items
      expect(body.total).toBe(8);
      expect(body.page).toBe(3);
      expect(body.pageSize).toBe(3);
    });

    it('maintains consistent total count across pages', async () => {
      const app = buildServer();
      const page1 = await app.inject({ method: 'GET', url: '/api/movies?page=1&pageSize=3' });
      const page2 = await app.inject({ method: 'GET', url: '/api/movies?page=2&pageSize=3' });
      const page3 = await app.inject({ method: 'GET', url: '/api/movies?page=3&pageSize=3' });

      expect(page1.statusCode).toBe(200);
      expect(page2.statusCode).toBe(200);
      expect(page3.statusCode).toBe(200);

      const total1 = page1.json().total;
      const total2 = page2.json().total;
      const total3 = page3.json().total;

      expect(total1).toBe(8);
      expect(total2).toBe(8);
      expect(total3).toBe(8);

      // Verify no duplicate IDs across pages
      const ids1 = page1.json().data.map((m: { id: number }) => m.id);
      const ids2 = page2.json().data.map((m: { id: number }) => m.id);
      const ids3 = page3.json().data.map((m: { id: number }) => m.id);

      const allIds = [...ids1, ...ids2, ...ids3];
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size); // No duplicates
      expect(allIds.length).toBe(8); // All items retrieved
    });
  });
});

describe('GET /api/movies/:id', () => {
  it('returns full detail with genres, cast, key crew, keywords and ratings', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1' });
    expect(res.statusCode).toBe(200);
    const m = res.json();
    expect(m.title).toBe('Alpha Adventure');
    expect(m.genres.map((g: { name: string }) => g.name).sort()).toEqual(['Action', 'Adventure']);
    expect(m.cast).toHaveLength(2);
    expect(m.crew.some((c: { job: string }) => c.job === 'Director')).toBe(true);
    expect(m.ratings.count).toBe(2);
    expect(m).not.toHaveProperty('searchVector'); // tsvector must not leak
  });

  it('calculates correct ratings average from raw ratings', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1' });
    expect(res.statusCode).toBe(200);
    const m = res.json();
    // Seed data: user 1 rated 4.5, user 2 rated 3.5 → average = 4.0
    expect(m.ratings).toEqual({ average: 4.0, count: 2 });
  });

  it('filters crew to only Director, Writer, Producer jobs', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1' });
    expect(res.statusCode).toBe(200);
    const m = res.json();
    const jobs = m.crew.map((c: { job: string }) => c.job);
    expect(jobs.every((job: string) => ['Director', 'Writer', 'Producer'].includes(job))).toBe(true);
    expect(jobs).toContain('Director');
    expect(jobs).toContain('Writer');
  });

  it('returns null ratings average for movie with no ratings', async () => {
    const app = buildServer();
    // Movie 3 has no ratings in seed data
    const res = await app.inject({ method: 'GET', url: '/api/movies/3' });
    expect(res.statusCode).toBe(200);
    const m = res.json();
    expect(m.ratings).toEqual({ average: null, count: 0 });
  });

  it('limits cast to 10 members ordered by order field', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/1' });
    expect(res.statusCode).toBe(200);
    const m = res.json();
    // Verify order is ascending
    const orders = m.cast.map((c: { order: number }) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    // Verify limit (seed has only 2, but the query limits to 10)
    expect(m.cast.length).toBeLessThanOrEqual(10);
  });

  it('returns 404 for an unknown id', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/999999' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('not_found');
  });

  it('returns 400 for a non-numeric id', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/api/movies/abc' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /health', () => {
  it('reports ok when the DB is reachable', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', db: 'connected' });
  });
});
