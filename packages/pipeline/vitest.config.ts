import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'pipeline',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    setupFiles: ['./tests/integration/setup.ts'],
    env: { NODE_ENV: 'test' },
    testTimeout: 60_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/ingest.ts'],
    },
  },
});
