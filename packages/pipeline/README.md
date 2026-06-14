# @mcd/pipeline

[← Back to the root README](../../README.md)

The data-ingestion CLI. Streams the five Movies-Dataset CSVs into PostgreSQL,
validating and normalizing as it goes, then builds the full-text search index.

> The end-to-end ingestion walkthrough and the _why_ behind each decision are in the
> [root README](../../README.md#data-pipeline-design-decisions). This file is the
> implementation map.

## Responsibilities

- Parse five CSVs in streaming mode and load them into the `@mcd/db` schema.
- Decode the Python-`repr` JSON columns (`genres`, `cast`, `crew`, `keywords`).
- Validate every row with Zod; skip and count malformed/unmappable rows.
- Remap `ratings_small.csv` MovieLens ids → TMDB ids via `links.csv`.
- Populate `search_vector` after the load. Stay idempotent — safe to re-run.

## Directory structure

```
src/
  ingest.ts            CLI entry point — orchestrates loaders in FK-safe order
  lib/
    csv.ts             streaming csv-parse helper + BATCH_SIZE (500)
    logger.ts          pino logger
  loaders/             one per table: links, movies, credits, keywords, ratings,
                       search-vector
  parsers/
    json-columns.ts    hand-written tokenizer for Python-repr JSON columns
  validators/
    rows/              Zod schema per CSV row type
    json-items/        Zod schema per embedded item (genre, cast, crew, keyword)
tests/
  unit/                parser + validator tests (no DB)
  integration/         loader tests against the movies_test DB
```

## Ingestion flow

```
links.csv → movies_metadata.csv (+genres) → credits.csv → keywords.csv → ratings_small.csv → search_vector
```

Loaded in foreign-key-safe order so references always exist. `ingest.ts` auto-detects
the full or `_small` variant of `credits`/`keywords`/`links`, and requires
`movies_metadata.csv` + `links.csv` at minimum. At the end it prints a per-file summary
(inserted / skipped) and elapsed time.

## Environment variables

Reads the root `.env`: `DATABASE_URL` (target DB) and `DATA_DIR` (CSV location,
default `./data`). See the root README's setup table.

## Commands

```bash
npm run ingest                              # from repo root — the normal entry point
npm run -w @mcd/pipeline start              # same thing, scoped
npm run -w @mcd/pipeline test              # unit + integration (integration needs DB)
npm run -w @mcd/pipeline test:unit         # pure parser/validator tests, no DB
npm run -w @mcd/pipeline test:integration  # loader tests against movies_test
npm run -w @mcd/pipeline typecheck
```

## Testing

Unit tests cover the highest-risk pure logic — the Python-literal JSON tokenizer and
the Zod row validators — directly and exhaustively. Integration tests exercise each
loader against the real `movies_test` database. Overall rationale is in the
[root README test-strategy section](../../README.md#test-strategy).

## Design notes

- **Streaming + 500-row batched transactions.** Large files are never fully buffered;
  `BATCH_SIZE` (`lib/csv.ts`) balances round-trip overhead against transaction size.
- **Hand-written tokenizer, not `'`→`"` replace.** The JSON columns are Python `repr`
  strings; a naive quote swap silently corrupts every apostrophe-containing value.
  `parsers/json-columns.ts` handles the mixed quoting safely and never uses `eval`.
  This is the standout decision — see [`documents/ENGINEERING_NOTES.md`](../../documents/ENGINEERING_NOTES.md).
- **Graceful validation.** Corrupt rows (non-numeric `id`, empty title) are rejected;
  malformed/unmappable rows are skipped and counted, never fatal. Full breakdown in
  [`documents/INGESTION_REPORT.md`](../../documents/INGESTION_REPORT.md).
- **Idempotency.** Natural/composite-PK tables use `ON CONFLICT DO NOTHING`;
  `cast_members`/`crew_members` (identity PK) are truncated and reloaded.
