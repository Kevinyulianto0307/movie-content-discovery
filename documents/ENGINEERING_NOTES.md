# Engineering Notes — Data Gotchas & Tricks

[← Back to the README](../README.md)

Running notes captured while building MovieContentDiscovery. These feed the README
"Notable Ingestion Decisions" and the ADR. Each entry: the trap, why it bites, and
what we did.

## 1. Python-style JSON columns (the apostrophe trap)

**Where:** `genres` (movies_metadata.csv), `cast`/`crew` (credits.csv),
`keywords` (keywords.csv).

The JSON-like columns are Python `repr` output, not real JSON:

```
[{'character': "Hooker's Mother", 'name': 'Tom Hanks', 'profile_path': None}]
```

Two things make the naive fix (`raw.replace(/'/g, '"')`) wrong:

- Python uses **single quotes normally but switches to double quotes** when a
  value contains an apostrophe. Blindly swapping all `'` -> `"` turns
  `"Hooker's Mother"` into `"Hooker"s Mother"` — broken JSON. The row's whole
  cast/crew list then fails to parse and is **silently dropped**.
- Apostrophes are common in this data (character names, nicknames, possessives).
  Measured: **337 apostrophe cast records in just the first 400 movies.** The
  naive approach loses all of them with no error.

**Fix:** a small hand-written tokenizer (`parsers/json-columns.ts`,
`pythonLiteralToJson`) that walks the string, consumes single- or double-quoted
runs (handling `\'` escapes — ~52 of those in credits.csv), and re-emits each as a
proper JSON string via `JSON.stringify`. No `eval`/`Function`. No new dependency.

**Second trap inside the fix:** `None`/`True`/`False`/`nan` must only be converted
when they appear **outside** a string. A keyword or character literally named
`"None"` must stay the string `"None"`, not become `null`. The tokenizer only
translates these as standalone barewords. Verified: input `[{'name': 'None'}]`
stays `{"name":"None"}`.

## 2. CSV escaping stacks on top of the Python quotes

The entire cast/crew array is one CSV-quoted field. So Python's inner `"..."`
gets CSV-escaped by **doubling**: in the raw file you see
`'character': ""Hooker's Mother""`. `csv-parse` decodes the doubled `""` back to
`"` before our tokenizer ever sees it, so we only handle the Python layer. Don't
try to special-case the `""` — let the CSV parser do its job first.

## 3. Corrupt / column-shifted rows in movies_metadata.csv

A handful of rows have shifted columns — e.g. a date lands in the `id` field
(`id = "1997-08-20"`) or the `title` is missing/non-text. Full-file scan result:
**45,460 valid, exactly 6 skipped.** The Zod schema drops them via
`id: z.coerce.number().int().positive()` and `title: z.string().min(1)`. No crash,
no manual filtering needed.

## 4. Missing / malformed release_date

Many rows have empty or garbled dates. We extract `release_year` only when the
date matches `YYYY-MM-DD`, else `null` (**84** such rows in the dataset). Never
assume `release_date` is present.

## 5. String numerics

`budget`, `revenue`, `popularity`, `vote_*` arrive as strings, sometimes empty.
A `nullableNumber` Zod preprocessor coerces them and maps empty/`NaN`/`Infinity`
to `null` (not `0`/`NaN`), so we never insert `NaN` into a numeric column.

## 6. ratings_small.csv uses MovieLens IDs, not TMDB IDs

`ratings_small.csv` `movieId` is a MovieLens id. Resolve it to the TMDB id via
`links.csv` (`movie_links` table) **before** insert. Rows whose MovieLens id has
no TMDB mapping are skipped and counted. This is why links is loaded first.

## 7. Idempotency: auto-generated-id tables can't use onConflictDoNothing

`cast_members` / `crew_members` have an auto-generated `integer ... GENERATED ALWAYS
AS IDENTITY` primary key (the modern replacement for `serial`, per the Drizzle
best-practices reference), so a re-run would get brand-new ids every time —
`.onConflictDoNothing()` never fires and you get **duplicates**. Fix:
`TRUNCATE cast_members, crew_members RESTART IDENTITY` at the start of the credits
stage, then re-insert from scratch. The full file is re-read each run, so this is the
correct idempotent strategy for these tables. All other tables have natural or
composite PKs, so `.onConflictDoNothing()` works there.

## 8. Foreign-key safety for dropped movies

The 6 dropped movie rows (and any movie not in our set) can still appear in
credits/keywords. Inserting their cast/keywords would violate the FK to `movies`
and blow up the whole batch. Each of those loaders first loads the set of existing
movie ids and skips rows for movies that aren't present.

## 9. Insert order within a batch (genres / keywords)

`movie_genres` references both `movies` and `genres`; `movie_keywords` references
`movies` and `keywords`. Within each flush we insert the parent rows (genres /
keywords, then movies) **before** the junction rows, so every FK target exists.

## 10. DATA_DIR resolves from the repo root, not cwd

`npm run ingest` runs as `npm run -w @mcd/pipeline start`, so cwd is the package
dir — `./data` would resolve to `packages/pipeline/data`. We find the monorepo
root (nearest `package.json` with `workspaces`) and resolve `DATA_DIR` against it.
Same helper loads the single root `.env`.

## 11. Migration runner: don't re-run drizzle's own SQL

A naive "apply every `NNNN_*.sql` in drizzle/" pass also matches drizzle-kit's
generated `0000_*.sql`, which has no `IF NOT EXISTS` on its `ALTER TABLE ... ADD
CONSTRAINT` — re-running it crashes a fresh migrate. The runner reads
`drizzle/meta/_journal.json` and skips anything drizzle already manages, so only
hand-written files (the GIN FTS index) run in the second pass.

## 13. .env must exist before anything reads DATABASE_URL

The db client throws on a missing `DATABASE_URL`. The intended flow was a manual
`cp .env.example .env`, which is easy to skip — symptom is
`Error: DATABASE_URL ... is not set` on `npm run ingest`/`api`, with dotenv
logging `injected env (0)`. Fix: `setup` runs `env:init`
(`scripts/ensure-env.mjs`) first, which copies `.env.example` -> `.env` if absent
(never overwrites). The file has no secrets (local Postgres creds), so seeding it
is safe and keeps setup a true one-command start.

## 14. Host port 5432 conflicts (local Postgres)

`docker compose up` fails with `Bind for 0.0.0.0:5432 failed: port is already
allocated` when a local Postgres already owns 5432 (common on macOS). The failed
`up` also leaves a half-created container, so always `docker compose down` first.
Fix: stop the local Postgres, or set `HOST_DB_PORT` in `.env` (compose reads it as
`${HOST_DB_PORT:-5432}:5432`) and match the port in DATABASE_URL/_TEST. Container
port stays 5432; only the host mapping moves.

## 15. Conditional joins in Drizzle need `.$dynamic()`

The `/api/movies` list adds a genre join only when `?genre=` is present. Reassigning
a query (`q = q.innerJoin(...)`) fails to typecheck on a normal builder because each
method returns a new narrowed type. Mark the base query `.$dynamic()` and the
conditional `.innerJoin(...)` / `.where(...)` chaining typechecks cleanly. Both the
data query and the `count(*)` query must get the same join so totals match the page.
Also: detail/list endpoints select explicit columns (never `select()` *) so the
`tsvector` `search_vector` never leaks into the API response.

## 16. pg.Pool needs an 'error' handler or the API crashes on DB blips

node-postgres emits `'error'` on an idle pooled client when the connection drops
(Postgres restart, container recreate). With no `pool.on('error', ...)` listener,
Node treats it as unhandled and crashes the whole API process. Added a handler in
`db/client.ts` that logs instead — the next query reconnects and `/health` reports
`degraded` meanwhile. Surfaced by testing the real `npm run api` listen path (not
just `inject()`): hitting the server over HTTP worked, but stopping Postgres under
the live pool crashed the process until the handler was added.

## 17. Test setup must load .env before importing the db client

`vitest.config` sets `NODE_ENV=test` but does NOT read `.env`. `DATABASE_URL_TEST`
lives only in `.env`, loaded by `env.ts`. `tests/setup.ts` imported the db client
(which reads the URL at module-load time) before anything loaded `.env`, so on a
real machine `npm test` failed with "DATABASE_URL_TEST is not set". Fix: make
`import '../src/env.js'` the first line of `setup.ts`. Caught by a clean-tree
unzip→install→test dry-run (an earlier sandbox run masked it by injecting the var
into the shell env).

## 12. esbuild audit override

Latest `drizzle-kit` (a devDependency) still pins a vulnerable esbuild. esbuild
`0.28.1` is the patched release; a root `overrides: { "esbuild": "^0.28.1" }`
forces it tree-wide and clears the last 4 advisories. Verified `drizzle-kit
generate` still works under it. Only used at migration-generation time — never in
the API runtime.

---

[← Back to the README](../README.md) · See also [`ADR.md`](../ADR.md) and [`INGESTION_REPORT.md`](./INGESTION_REPORT.md)
