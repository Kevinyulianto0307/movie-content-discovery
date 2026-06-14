import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit reads this to emit migration SQL from src/schema.ts into ./drizzle.
// `generate` only needs the schema + dialect; it does not connect to the DB.
// The DATABASE_URL is supplied for completeness (e.g. `drizzle-kit push`/`studio`).
export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/movies',
  },
});
