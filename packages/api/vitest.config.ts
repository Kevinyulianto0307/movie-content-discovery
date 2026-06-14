import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'api',
    setupFiles: ['./tests/setup.ts'],
    env: { NODE_ENV: 'test' },
    include: ['tests/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.ts',
        'src/env.ts',
        'src/server.ts',
        'src/db/migrate.ts',
        'src/plugins/external/cors.ts',
        'src/plugins/external/swagger.ts',
        'src/plugins/app/db.ts',
      ],
    },
  },
});
