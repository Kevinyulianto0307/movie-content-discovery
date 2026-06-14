# Data Quality & Skipped Rows

[← Back to the README](../README.md)

The ingestion pipeline **validates every row and skips malformed or unmappable
records gracefully** — it never crashes on bad data, and it reports exactly how many
rows were skipped per file in the summary table at the end of `npm run ingest`.

Seeing a small number of skipped rows on the first ingest is **expected and correct**
— The Movies Dataset (Kaggle) contains a handful of genuinely broken rows, plus rows
that legitimately can't be linked. This document explains every skip.

## Summary (full dataset)

A complete run over the full dataset produces approximately:

| File | Inserted | Skipped | Why skipped |
|------|---------:|--------:|-------------|
| `links.csv` | 45,624 | ~219 | No TMDB id (can't map MovieLens → TMDB) |
| `movies_metadata.csv` | 45,460 | 6 | Corrupt / column-shifted rows |
| `credits.csv` | 45,473 | 3 | Cast/crew for a movie that was dropped (FK safety) |
| `keywords.csv` | 46,415 | 4 | Keywords for a movie that was dropped (FK safety) |
| `ratings_small.csv` | 99,898 | ~106 | Rating for a MovieLens id with no TMDB mapping |

That's 45,460 of 45,466 movies loaded — **99.99%**. The exact counts can vary slightly
with the dataset version you downloaded.

## Every skip falls into one of three buckets

### 1. Malformed data — `movies_metadata.csv` (6 rows)

A few rows in the source CSV are **column-shifted**: a stray unescaped comma pushes
every field one column to the right. The visible symptoms:

- A **date lands in the `id` field**, e.g. `id = "1997-08-20"`. The validator requires
  `id` to be a positive integer, so the row fails.
- The **`title` ends up empty** (the real title shifted into the next column). The
  validator requires a non-empty title.

These rows are genuinely unusable — the data is misaligned across every column — so
they're dropped. The Zod schema (`packages/pipeline/src/validators/rows.ts`) enforces
`id: positive int` and `title: min length 1`, which catches them.

### 2. Foreign-key safety — `credits.csv` (3 rows) and `keywords.csv` (4 rows)

`credits.csv` and `keywords.csv` are keyed by movie id. If a movie was dropped in step
1 (the 6 corrupt rows), its cast/crew/keywords rows now point at a movie that doesn't
exist. Inserting them would violate the foreign key to `movies`, so the loader skips
any row whose movie id isn't present in the database. (A row with its own corrupt id is
also skipped.)

This is deliberate: it keeps referential integrity intact instead of crashing the batch
on a foreign-key error.

### 3. No ID mapping — `links.csv` (~219 rows) and `ratings_small.csv` (~106 rows)

`ratings_small.csv` uses **MovieLens** ids, but the rest of the data uses **TMDB** ids.
The pipeline resolves MovieLens → TMDB via `links.csv` before inserting ratings.

- **`links.csv`**: some rows have an empty `tmdbId` — there's simply no TMDB movie to
  map to, so the link is skipped.
- **`ratings_small.csv`**: a rating whose MovieLens id has no TMDB mapping (no usable
  link row) can't be attached to any movie, so it's skipped.

These rows aren't corrupt — they just have no destination in our schema.

## Inspecting the skipped rows yourself

The pipeline logs the first 20 malformed movie rows (with the row data and the exact
Zod validation reason) at debug level:

```
LOG_LEVEL=debug npm run ingest
```

You'll see entries like `skipped malformed movie row` with the offending `id`/`title`
and the failing field.

## Why skip instead of fail?

This directly satisfies the pipeline requirement to *"validate the data and handle any
malformed or missing records gracefully."* The alternatives are worse:

- **Crashing on the first bad row** would make ingestion fragile and non-restartable.
- **Inserting bad rows anyway** would corrupt the dataset (NaN numerics, broken foreign
  keys, ratings pointing nowhere) and surface as confusing API errors later.

Skipping-and-counting keeps the load robust, the database consistent, and the data loss
transparent (you always see the counts).

---

[← Back to the README](../README.md) · See also [`ADR.md`](../ADR.md) and [`ENGINEERING_NOTES.md`](./ENGINEERING_NOTES.md)
