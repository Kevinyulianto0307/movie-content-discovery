// MUST be first: loads root .env so DATABASE_URL_TEST is set
import '@mcd/db/env';
import { beforeAll } from 'vitest';
// Use the API's migrate instead of a local copy to avoid duplication
import { runMigrations } from '../../../api/src/db/migrate.ts';

// Global setup: migrate the movies_test database once before any integration test.
// Per-test cleanup lives in each integration file's beforeEach to ensure isolation.
beforeAll(async () => {
  await runMigrations(); // NODE_ENV=test -> DATABASE_URL_TEST
});

// Note: We don't close the pool in afterAll because with fileParallelism: false,
// all tests share the same process and closing the pool would break later tests.
// The pool is cleaned up automatically when the Node.js process exits.
