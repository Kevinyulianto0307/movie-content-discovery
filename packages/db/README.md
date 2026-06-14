# @mcd/db

[← Back to the root README](../../README.md)

The shared data layer. **The single owner of the data model** — the Drizzle schema,
the Postgres client, the migrations, and the env loader all live here. Both
`@mcd/pipeline` and `@mcd/api` depend on this package; neither depends on the other.

> Setup, ingestion, and running the stack are covered in the
> [root README](../../README.md). This file documents the package itself.

## Responsibilities

- Define every table once, in TypeScript, with Drizzle. Split by domain under
  `src/schemas/`: `movies`, `genres`, `credits` (cast/crew), `keywords`, `links`,
  `ratings`.
- Export a configured Drizzle client and the underlying `pg` pool (`src/client.ts`).
- Own the custom `tsvector` Drizzle type (`src/types/`) and the table relations
  (`src/relations.ts`).
- Hold the migrations (`drizzle/`) — both drizzle-kit-generated and hand-written.
- Load the repo-root `.env` as a side effect before the client reads it
  (`src/env.ts`).

## Exports

```ts
import { db, pool, type Db } from '@mcd/db';        // client + type
import { movies, genres /* … */ } from '@mcd/db';   // schema tables
import { moviesRelations /* … */ } from '@mcd/db';  // relations for db.query API
import { type Movie, type NewMovie } from '@mcd/db';// inferred types
import '@mcd/db/env';                                // side effect: load root .env
import * as schema from '@mcd/db/schema';            // schema-only, no client
```

Import `@mcd/db/env` **first** in any entry point so the client reads a populated env.

## Directory structure

```
src/
  schemas/     one file per domain (movies, genres, credits, keywords, links, ratings)
  types/       custom Drizzle types (tsvector)
  client.ts    pg Pool + drizzle() instance
  relations.ts Drizzle relations for the relational-query API
  schema.ts    barrel re-exporting all schemas
  env.ts       side effect: loads root .env, exports repoRoot
  index.ts     main entry point
drizzle/
  0000_init.sql        generated schema
  0001_fts_index.sql   hand-written GIN index on search_vector
  meta/                drizzle-kit metadata / journal
```

## Environment variables

This package **reads** (it does not define) the root `.env`: `DATABASE_URL`, or
`DATABASE_URL_TEST` when `NODE_ENV=test`. See the root README's setup table.

## Commands

```bash
npm run -w @mcd/db db:generate   # regenerate migrations from schema changes
npm run -w @mcd/db typecheck     # tsc --noEmit
```

Migrations are **applied** by `@mcd/api` (`npm run db:migrate`), which runs the
two-pass strategy below. This package only generates them.

## Design notes

- **Why this package exists.** A shared schema package enforces the dependency rule
  (pipeline and API both build on one model, neither on the other) and guarantees the
  ingestion and serving sides can never drift apart.
- **Two-pass migrations.** Pass 1 applies drizzle-kit-generated schema migrations via
  the official migrator (tracked in `__drizzle_migrations`); pass 2 applies hand-written
  `*.sql` that Drizzle doesn't manage — currently just the GIN index on `search_vector`,
  which drizzle-kit cannot emit. See [`MIGRATIONS.md`](./MIGRATIONS.md).
- **Native `tsvector` via a custom Drizzle type.** `search_vector` is a real `tsvector`
  column, not `text` queried as `tsvector`.
- **Normalized schema.** Genres/keywords are junction tables; cast/crew are row tables —
  chosen for indexable filtering and joins over faster-but-unindexable JSON arrays.
  Trade-off in [`ADR.md`](../../ADR.md) §1. **Drizzle over Prisma:** SQL-first and
  transparent, which matters for the multi-join detail and similarity queries.
