import '../src/env.ts'; // MUST be first: loads root .env so DATABASE_URL_TEST is set
                        // before the db client module reads it at import time.
import { beforeAll } from 'vitest';
import { runMigrations } from '../src/db/migrate.ts';

// Global setup: migrate the movies_test database once before any test file.
// Per-file seeding lives in each integration file's beforeEach so the DB-failure
// test (which mocks the client) isn't forced to touch a real DB.
beforeAll(async () => {
  await runMigrations(); // NODE_ENV=test -> DATABASE_URL_TEST
});

// Note: We don't close the pool in afterAll because with vmThreads pool,
// each test file may run in a separate VM context that shares the underlying
// Node.js process. Closing the pool in one context breaks it for others.
// The pool is cleaned up automatically when the Node.js process exits.
