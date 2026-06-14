import { defineConfig } from 'vitest/config';

// Integration tests for the pipeline package that hit a real Postgres test database.
// These verify the full CSV -> DB ingestion flow end-to-end.
export default defineConfig({
  test: {
    setupFiles: ['./tests/integration/setup.ts'],
    env: { NODE_ENV: 'test' },
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 60_000, // Migrations + data loading can take time
    hookTimeout: 60_000,
    // Integration tests hit a real Postgres; run files serially to avoid
    // cross-test connection churn and ordering flakiness.
    fileParallelism: false,
  },
});
