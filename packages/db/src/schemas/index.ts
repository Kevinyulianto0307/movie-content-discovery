// Schema split by domain. Each file owns one area; this barrel re-exports them so
// consumers can `import { movies, genres, ... } from '@mcd/db'` as before.
export * from './movies.schema.ts';
export * from './genres.schema.ts';
export * from './credits.schema.ts';
export * from './keywords.schema.ts';
export * from './links.schema.ts';
export * from './ratings.schema.ts';
