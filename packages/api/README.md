# @mcd/api

[← Back to the root README](../../README.md)

The REST API. Fastify 5 + TypeScript + Drizzle, serving the catalog over six
endpoints with native PostgreSQL full-text search and on-demand similarity.

> Setup and running the stack are covered in the [root README](../../README.md).
> This file documents the package internals.

## Responsibilities

- Expose `/api/movies`, `/api/movies/:id`, `/api/movies/:id/similar`, `/api/search`,
  `/api/analytics/top-genres`, and `/health`.
- Validate every request with Zod and shape responses as DTOs (no raw rows leak).
- Apply the database migrations (the migrate step lives here; the schema lives in
  `@mcd/db`).

## Architecture — controller → service → repository

```
src/
  index.ts             process entry — builds the server and listens
  server.ts            buildServer({ db }) — Fastify instance + runtime concerns
  app.ts               app plugin — autoloads external plugins, app plugins, routes
  routes/              controllers only; folders map to URLs
                       (routes/api/movies → /api/movies)
  plugins/
    external/          third-party plugins: cors, swagger (loaded first)
    app/<domain>/      per-domain service + repository, registered as plugins that
                       decorate the instance (app.moviesService, app.moviesRepository…)
  schemas/             Zod request/response schemas per domain
  lib/                 similarity, pagination, sql-result helpers
  db/migrate.ts        two-pass migration runner (uses @mcd/db/drizzle)
```

- A **route** only validates input and sets status codes.
- A **service** (`plugins/app/<domain>/<domain>-service.ts`) orchestrates multiple
  repository calls (e.g. composing the movie-detail queries). Single-query endpoints
  (search, analytics) skip the service and call the repository directly.
- A **repository** (`plugins/app/<domain>/<domain>-repository.ts`) holds all SQL /
  Drizzle data access.
- The DB handle is threaded through `buildServer({ db })` → `app.ts` → app plugins,
  so tests can inject a stub `Db` to exercise routes without — or against a failing —
  database.

## Environment variables

Reads the root `.env`: `API_PORT` (default `3000`), `LOG_LEVEL`, `DATABASE_URL`, and
`DATABASE_URL_TEST` (used when `NODE_ENV=test`). See the root README's setup table.

## Commands

```bash
npm run api                                   # from repo root — dev server (watch)
npm run -w @mcd/api dev                        # same thing, scoped
npm run -w @mcd/api db:migrate                 # apply migrations
npm run -w @mcd/api test                       # unit + integration (needs DB)
npm run -w @mcd/api test:unit                  # pure helpers/schemas, no DB
npm run -w @mcd/api test:integration           # endpoints against movies_test
npm run -w @mcd/api typecheck
```

OpenAPI docs (Swagger UI) are served at `/docs` when the dev server is running.

## API Usage / Example Requests

With `npm run api` running, each of these returns `200`:

```bash
curl http://localhost:3000/health
curl 'http://localhost:3000/api/movies?page=1&pageSize=5'
curl 'http://localhost:3000/api/movies?genre=Animation&sort=vote_average&order=desc'
curl http://localhost:3000/api/movies/862            # Toy Story
curl http://localhost:3000/api/movies/862/similar
curl 'http://localhost:3000/api/search?q=matrix'
curl 'http://localhost:3000/api/analytics/top-genres?bucket=decade'
```

| Method | Endpoint                    | Notes                                                                                                                            |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/movies`               | Pagination, sorting (`title`, `release_date`, `vote_average`, `revenue`), filters (`genre`, `yearFrom`/`yearTo`, `minVoteCount`) |
| GET    | `/api/movies/:id`           | Full detail: top-10 cast, key crew, genres, keywords, aggregate rating stats                                                     |
| GET    | `/api/movies/:id/similar`   | Weighted-Jaccard over shared genres + keywords                                                                                   |
| GET    | `/api/search`               | Full-text search across title / overview / tagline, ranked by `ts_rank`                                                          |
| GET    | `/api/analytics/top-genres` | Genre popularity by decade or year, with avg revenue + rating                                                                    |
| GET    | `/health`                   | `{ status, db }` smoke-test signal                                                                                               |

List responses are shaped `{ data, total, page, pageSize }`. Responses are shaped DTOs
(Zod serialization strips anything not in the schema, so the `tsvector` can never
leak). Invalid params return `400 { error, issues }`; unknown ids return `404`.

## Testing

Integration tests run through Fastify's in-process `inject()` against a real
`movies_test` database seeded with 8 fixtures in `beforeEach` (files run serially,
`fileParallelism: false`). Failure paths are covered: malformed params → 400, unknown
id → 404, and an injected stub `Db` that throws → 500 (no module mocking). The pure
`similarityScore()` helper is unit-tested and cross-checked against the SQL similarity
query so the two can't drift. Full rationale:
[root README test strategy](../../README.md#test-strategy).

## Design notes

- **Fastify 5 + autoload.** Directory structure drives URLs; load order
  (external → app → routes) guarantees dependencies exist before routes register.
  Framework choice rationale in [`ADR.md`](../../ADR.md) §2.
- **Zod for validation _and_ serialization** (`fastify-type-provider-zod`). Response
  serialization strips fields not in the declared schema, so `search_vector` can never
  leak into a response. Validation errors map to a stable `{ error, issues }` shape.
- **Similarity computed on demand** in a single SQL query (weighted Jaccard over shared
  genres + keywords) rather than from a pre-computed table — acceptable at 45K movies.
  Algorithm and migration path in [`ADR.md`](../../ADR.md) §4.
- **Full-text search** via PostgreSQL `tsvector` + GIN + `ts_rank`, with `setweight`
  field prioritization. No typo tolerance — a documented FTS limitation (ADR §3).
- **DI for testability.** `buildServer({ db })` is the seam that lets the failure test
  inject a throwing stub without touching module internals.
