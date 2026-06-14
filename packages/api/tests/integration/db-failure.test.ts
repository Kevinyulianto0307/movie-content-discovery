import { describe, it, expect } from 'vitest';
import type { Db } from '@mcd/db';
import { buildServer } from '../../src/server.ts';

// A stub database whose query methods throw — simulating an unreachable DB.
// Injected via buildServer({ db }); the route's query throws and Fastify's error
// handler returns 500. No module mocking required.
//
// `db` is decorated onto the Fastify instance (plugins/app/db.ts). Fastify's
// decorate() probes a value's `getter`/`setter` to detect the accessor form, and
// Promise/thenable checks read `then`. We must return undefined for those reserved
// keys, otherwise the proxy would "throw" while being *decorated* (at boot) rather
// than when a real query method is *called* (at request time).
const RESERVED = new Set(['then', 'getter', 'setter']);
const throwingDb = new Proxy(
  {},
  {
    get(_target, prop) {
      if (RESERVED.has(prop as string)) return undefined;
      return () => {
        throw new Error('connection refused');
      };
    },
  },
) as unknown as Db;

describe('DB unreachable', () => {
  it('surfaces a 500 from /api/movies when the DB throws', async () => {
    const app = buildServer({ db: throwingDb });
    const res = await app.inject({ method: 'GET', url: '/api/movies' });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe('internal_server_error');
  });

  it('surfaces a 500 from /api/movies/:id when the DB throws', async () => {
    const app = buildServer({ db: throwingDb });
    const res = await app.inject({ method: 'GET', url: '/api/movies/1' });
    expect(res.statusCode).toBe(500);
  });

  it('surfaces a 500 from /api/search when the DB throws', async () => {
    const app = buildServer({ db: throwingDb });
    const res = await app.inject({ method: 'GET', url: '/api/search?q=test' });
    expect(res.statusCode).toBe(500);
  });

  it('surfaces a 500 from /api/analytics/top-genres when the DB throws', async () => {
    const app = buildServer({ db: throwingDb });
    const res = await app.inject({ method: 'GET', url: '/api/analytics/top-genres' });
    expect(res.statusCode).toBe(500);
  });

  it('reports degraded health when DB is unavailable', async () => {
    const app = buildServer({ db: throwingDb });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'degraded', db: 'unavailable' });
  });
});
