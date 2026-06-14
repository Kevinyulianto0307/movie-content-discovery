# MovieContentDiscovery

A Movie Content Discovery platform built on ~45,000 movies from
[The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset):
a data-ingestion pipeline, a Fastify REST API with native PostgreSQL full-text
search, and a lightweight React UI.

---

## Prerequisites

- **Node.js 20+** and **npm 9+** (Node.js 24 recommended)
- **Docker Desktop** (or Docker Engine + compose plugin) — only used to run PostgreSQL

> **Important:** Docker must be running before setup. On macOS/Windows, launch Docker
> Desktop and wait until it reports _running_. On Linux: `sudo systemctl start docker`.

---

## Quick Start

For experienced devs who just want to run it:

```bash
# Download CSVs from kaggle.com/datasets/rounakbanik/the-movies-dataset → ./data/
npm run setup        # Install deps, start Postgres, run migrations
npm run ingest       # Load CSVs into database (~3-5 min)
npm run api          # Terminal 1 → http://localhost:3000/documentation
npm run web          # Terminal 2 → http://localhost:5173
npm run test:all     # Run full test suite (unit + integration + e2e)
                     # Integration + Unit Test Reports: ./coverage/index.html
                     # E2E Reports: npm run e2e:report (e2e)
```

New here? Follow the [Getting Started](#getting-started) guide below.

---

## Getting Started

Complete steps 1–4 in order. This is the first-time setup flow.

### Step 1: Place the dataset

Download the five CSVs from
[The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset)
and place them in `./data/` at the project root:

```
data/
├── movies_metadata.csv
├── credits.csv          # credits_small.csv also accepted
├── keywords.csv         # keywords_small.csv also accepted
├── ratings_small.csv    # use the small ratings set, not the 26M file
└── links.csv
```

### Step 2: Run setup

```bash
npm run setup
```

This single command:

- Creates `.env` from the template (if missing)
- Installs all dependencies
- Starts PostgreSQL in Docker
- Runs database migrations

When it finishes, you have an empty, migrated database ready for data.

> **Port conflict?** If `5433` is already in use, see [Troubleshooting](#troubleshooting).

### Step 3: Load the data

```bash
npm run ingest
```

Streams the CSVs into PostgreSQL (~3–5 minutes on a laptop). Prints a summary of
rows inserted/skipped per file.

**Safe to re-run** — the pipeline is idempotent and never duplicates data.

### Step 4: Start the app

Open two terminal windows:

```bash
# Terminal 1: Start the API
npm run api              # http://localhost:3000
```

```bash
# Terminal 2: Start the frontend
npm run web              # http://localhost:5173
```

Open <http://localhost:5173> in your browser. You should see the movie catalog.

API docs (Swagger UI) are at <http://localhost:3000/documentation>.

---

## Running Tests

| Command                    | What it runs                                  | Requires             |
| -------------------------- | --------------------------------------------- | -------------------- |
| `npm test`                 | Unit + integration tests (api, pipeline, web) | Docker               |
| `npm run test:unit`        | Unit tests only                               | Nothing              |
| `npm run test:integration` | Integration tests only                        | Docker               |
| `npm run e2e`              | Full E2E browser suite (56 tests)             | App running          |
| `npm run test:all`         | Everything: unit + integration + E2E          | Docker + app running |

### Quick test commands

```bash
npm test              # Fast feedback — unit + integration (~30s)
npm run e2e           # Browser tests — start api + web first
```

### Viewing test reports

After running tests, you can view detailed HTML reports:

```bash
# Unit + integration coverage report
open ./coverage/index.html

# E2E test report (Playwright) — always use this from the project root
npm run e2e:report
# Note: Ignore the blue "npx playwright show-report" hint — it shows a relative path that only works from e2e/
```

### E2E test suites

E2E tests require the API and web servers to be running.

| Command                  | Tests | Purpose                              |
| ------------------------ | ----- | ------------------------------------ |
| `npm run e2e`            | 56    | Full suite                           |
| `npm run e2e:smoke`      | 5     | Quick health check (~3s)             |
| `npm run e2e:critical`   | 4     | Core user journeys (~3s)             |
| `npm run e2e:functional` | 16    | Edge cases & scenarios (~5s)         |
| `npm run e2e:regression` | 23    | Ensures existing features work (~5s) |
| `npm run e2e:ui`         | —     | Interactive Playwright UI mode       |

Tests run against a separate `movies_test` database — they never touch your ingested data.

---

## Project Overview

**Stack:** TypeScript (strict), PostgreSQL 16, Drizzle ORM, Zod, Fastify 5,
React 19 + Vite, TanStack Query, Vitest + Playwright.

PostgreSQL is the only infrastructure, and it runs in Docker — no cloud accounts,
no global installs, no Postgres on the host.

### Packages

| Package         | Role                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `@mcd/db`       | Single owner of the data model — Drizzle schema + Postgres client         |
| `@mcd/pipeline` | TypeScript CLI that streams CSVs into PostgreSQL                          |
| `@mcd/api`      | Fastify 5 REST API: list / detail / similar / search / analytics / health |
| `@mcd/web`      | React 19 + Vite + TanStack Query browse-and-detail UI                     |

### Architecture

```
packages/db       → Drizzle schema + Postgres client (@mcd/db)
      ↑                   ↑
packages/pipeline  packages/api
(CSV loaders)      (routes → services → repositories)
                          ↑
                   packages/web
                   (pages → presenter hooks → typed API client)
```

**Dependency rule:** `db` is depended on by both `pipeline` and `api`; neither
application imports the other.

Full architectural reasoning lives in **[`ADR.md`](./ADR.md)**.

---

## Repository Structure

```
movie-content-discovery/
├── packages/
│   ├── db/         @mcd/db        — Drizzle schema, Postgres client, env loader
│   ├── pipeline/   @mcd/pipeline  — CSV ingestion CLI
│   ├── api/        @mcd/api       — Fastify REST API + migrations + tests
│   └── web/        @mcd/web       — React frontend
├── e2e/            @mcd/e2e       — Playwright end-to-end suite
├── scripts/                       — Docker preflight, DB init SQL, readiness check
├── data/                          — Dataset CSVs (gitignored)
├── documents/
│   ├── PIPELINE_DECISIONS.md      — Detailed pipeline decision explanations
│   ├── INGESTION_REPORT.md        — Which rows get skipped on ingest, and why
│   └── ENGINEERING_NOTES.md       — Data gotchas discovered while building
├── docker-compose.yml             — PostgreSQL only
├── .env.example                   — Config template
├── ADR.md                         — Architecture decisions and trade-offs
└── README.md
```

Each package has its own README:
[`packages/db`](./packages/db/README.md) ·
[`packages/pipeline`](./packages/pipeline/README.md) ·
[`packages/api`](./packages/api/README.md) ·
[`packages/web`](./packages/web/README.md)

---

## Data Pipeline

The pipeline (`npm run ingest`) turns five messy CSVs into a clean relational catalog.

### How it works

Files are processed in foreign-key-safe order:

```
links.csv → movies_metadata.csv (+genres) → credits.csv → keywords.csv → ratings_small.csv → search_vector
```

### Key decisions

| Decision                        | Why                                           |
| ------------------------------- | --------------------------------------------- |
| **Streaming + 500-row batches** | Never buffer large files; peak heap 118MB     |
| **Hand-written JSON tokenizer** | The naive `'`→`"` fix corrupts apostrophes    |
| **Normalized schema**           | Junction tables enable indexed filtering      |
| **Skip malformed rows**         | Graceful degradation; 99.99% of movies loaded |
| **Idempotent re-runs**          | `ON CONFLICT DO NOTHING` — safe to re-run     |

A small number of rows are skipped by design (~6 movies, plus some links/ratings).
See **[`documents/INGESTION_REPORT.md`](./documents/INGESTION_REPORT.md)** for details
and **[`documents/PIPELINE_DECISIONS.md`](./documents/PIPELINE_DECISIONS.md)** for
the full reasoning.

---

## Test Strategy

### Testing Pyramid

```
         /\
        /  \        E2E (Playwright: browse → search → detail)
       /----\
      /      \      Integration (API + React with real DB/MSW)
     /--------\
    /          \    Unit (Parsers, validators, helpers, components)
   /------------\
```

| Layer       | ~%  | Rationale                              |
| ----------- | --- | -------------------------------------- |
| Unit        | 60% | Fast, isolated, catch logic bugs early |
| Integration | 35% | Verify components work together        |
| E2E         | 5%  | Smoke test critical user paths         |

### What we test

**Unit tests:** JSON parser edge cases, Zod validators, similarity scoring, pagination helpers

**Integration tests:** All API endpoints with real database, React pages with loading/error states

**E2E tests:** Happy paths through real browser — browse→detail→similar, search→detail

### What we deliberately don't test

| What                      | Why                                                                  |
| ------------------------- | -------------------------------------------------------------------- |
| Full-text ranking quality | Subjective; we test FTS returns correct rows                         |
| CSS / visual styling      | Test behavior, not appearance                                        |
| Third-party internals     | Drizzle / Fastify / Postgres assumed correct                         |
| Performance / load tests  | Expensive (infra, tooling, baselines); defer until traffic justifies |

---

## Architecture Decisions

Major decisions with options considered and trade-offs live in **[`ADR.md`](./ADR.md)**:

- Storage choice (PostgreSQL + Drizzle) and schema design
- Search strategy (PostgreSQL FTS vs. Typesense / Elasticsearch)
- Similarity algorithm (weighted Jaccard vs. collaborative filtering)
- Scaling to 10,000 concurrent users + 26M ratings
- What was cut and what we'd do with more time

---

## Assumptions and Trade-offs

- **`ratings_small.csv`, not the 26M file** — per the brief. Scaling path is in ADR.
- **Similar movies computed per request** — acceptable at 45K movies; pre-compute path in ADR.
- **No typo tolerance in search** — PostgreSQL FTS limitation. Typesense swap documented.
- **All endpoints are public** — auth is a documented cut.
- **Frontend pagination is prev/next**, not numbered.

---

## Troubleshooting

| Problem                                 | Solution                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Docker daemon is not running`          | Start Docker Desktop and wait for "running" status                                                     |
| `docker compose` not found              | Update Docker Desktop (old syntax: `docker-compose`)                                                   |
| `DATABASE_URL is not set`               | Run `npm run env:init` or `cp .env.example .env`                                                       |
| `port is already allocated` (5433)      | Run `docker compose down`, then either stop the conflicting process or change `HOST_DB_PORT` in `.env` |
| `database "movies_test" does not exist` | Run `docker compose down -v` then `npm run setup`                                                      |

---

## Reset Everything

```bash
docker compose down -v   # Wipes the Postgres volume
rm -rf node_modules packages/*/node_modules
npm run setup
```

---

## Environment Variables

| Variable            | Default                                                | Purpose                                             |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| `HOST_DB_PORT`      | `5433`                                                 | Host port for Postgres (mapped to container's 5432) |
| `DATABASE_URL`      | `postgresql://postgres:postgres@localhost:5433/movies` | Main database                                       |
| `DATABASE_URL_TEST` | `…/movies_test`                                        | Test database                                       |
| `DATA_DIR`          | `./data`                                               | Where pipeline reads CSVs                           |
| `API_PORT`          | `3000`                                                 | API server port                                     |
| `LOG_LEVEL`         | `info`                                                 | pino log level                                      |
