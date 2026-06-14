# Pipeline Design Decisions — Detailed Explanations

[← Back to the README](../README.md#data-pipeline-design-decisions)

This document provides detailed explanations for each notable decision made in the
data ingestion pipeline. For a quick summary, see the
[Data Pipeline Design Decisions](../README.md#data-pipeline-design-decisions) section
in the README.

---

## FK-safe streaming with in-memory validation

> **This is the most critical pipeline decision.** It ensures data is not corrupted
> and batches don't crash mid-way.

### The Problem

The pipeline processes 5 interconnected CSV files with different ID systems and
foreign key relationships:

```
ratings_small.csv  →  uses MovieLens IDs (1, 2, 3...)
movies_metadata.csv →  uses TMDB IDs (862, 8844...)
credits.csv        →  references movie IDs (must exist)
keywords.csv       →  references movie IDs (must exist)
links.csv          →  maps MovieLens ↔ TMDB IDs
```

**Three things can go wrong:**

| Problem | What Happens |
|---------|--------------|
| Insert credits before movies exist | FK violation → **batch crashes** |
| Insert ratings with MovieLens IDs | Attaches to wrong movie → **data corruption** |
| Load full CSV into memory for validation | out-of-memory → **pipeline crashes** |

### The Solution: Three Interconnected Parts

**1. FK-safe load order**

Files must be processed in strict order so references exist before they're needed.

> **See:** [`packages/pipeline/src/ingest.ts:46-74`](../packages/pipeline/src/ingest.ts)

```typescript
// FK-safe order: links -> movies(+genres) -> credits -> keywords -> ratings.
summary.links = await ingestLinks(linksPath);
logger.info('links done');
summary.movies = await ingestMovies(moviesPath);
logger.info('movies done');

if (creditsPath) {
  summary.credits = await ingestCredits(creditsPath);
  // ...
}
if (keywordsPath) {
  summary.keywords = await ingestKeywords(keywordsPath);
  // ...
}
if (ratingsPath) {
  summary.ratings = await ingestRatings(ratingsPath);
  // ...
}
```

**2. In-memory lookup maps (small)**

Before inserting credits/keywords/ratings, we validate that the target movie exists.
Querying the DB per row would be too slow (100K+ queries). Instead, we build small
in-memory lookup structures.

> **See:** [`packages/pipeline/src/loaders/ratings.ts:10-11`](../packages/pipeline/src/loaders/ratings.ts)

```typescript
// MovieLens → TMDB lookup map (~2MB for 45K entries)
const linkRows = await db.select().from(movieLinks);
const movielensToTmdb = new Map(linkRows.map((r) => [r.movielensId, r.tmdbId]));
```

> **See:** [`packages/pipeline/src/loaders/credits.ts:19-21`](../packages/pipeline/src/loaders/credits.ts)

```typescript
// Movie ID validation set (~360KB for 45K IDs)
const movieIds = new Set(
  (await db.select({ id: movies.id }).from(movies)).map((r) => r.id),
);
```

These are tiny (~3MB total) because they only store IDs, not full row data.

**3. Validate before insert (prevent corruption & crashes)**

> **See:** [`packages/pipeline/src/loaders/ratings.ts:34-38`](../packages/pipeline/src/loaders/ratings.ts)

```typescript
// Remap MovieLens → TMDB, skip if no mapping exists
const tmdbId = movielensToTmdb.get(result.data.movieId);
if (!tmdbId) {
  skipped++;  // No mapping → skip, don't corrupt data
  continue;
}
```

> **See:** [`packages/pipeline/src/loaders/keywords.ts:35-38`](../packages/pipeline/src/loaders/keywords.ts)

```typescript
// Skip if movie doesn't exist (prevents FK violation crash)
if (!result.success || !movieIds.has(result.data.id)) {
  skipped++;  // Movie doesn't exist → skip, don't crash on FK
  continue;
}
```

**4. Stream row data (large)**

The actual CSV rows (with cast JSON blobs, etc.) are streamed in 500-row batches.

> **See:** [`packages/pipeline/src/lib/csv.ts:4`](../packages/pipeline/src/lib/csv.ts)

```typescript
export const BATCH_SIZE = 500;
```

```
credits.csv with full cast/crew JSON = 500MB+ if buffered
vs.
500 rows at a time = ~10MB peak, constant
```

### Why All Three Must Work Together

| If Missing... | Result |
|---------------|--------|
| Wrong load order | FK violations crash batch, or lookup maps don't exist yet |
| No lookup maps | Can't validate → data corruption, or 100K+ slow DB queries |
| No streaming | out-of-memory crash on large files |

### Example: What Happens to a Rating

```
1. ratings_small.csv row: { userId: 1, movieId: 31 (MovieLens), rating: 2.5 }

2. Lookup TMDB ID:
   linkMap.get(31) → 862 (TMDB ID for Toy Story)
   If no mapping exists → skip row, count it

3. Validate movie exists:
   movieIds.has(862) → true
   If false → skip row (movie was dropped as corrupt)

4. Insert with correct ID:
   INSERT INTO ratings (movie_id=862, user_id=1, rating=2.5)
```

**Without this:** rating "2.5 for movie 31" would either:
- Crash (no movie 31 in TMDB)
- Attach to wrong movie (if movie 31 happens to exist but is different)

### Memory Profile

| What | Size | Why Safe |
|------|------|----------|
| MovieLens→TMDB lookup map | ~2MB | Just 45K number pairs |
| Movie ID validation set | ~360KB | Just 45K numbers |
| CSV batch buffer | ~10MB peak | 500 rows, then freed |
| **Total** | **~13MB** | vs. 500MB+ if buffered |

**Measured:** Peak heap during full ingestion = **118MB** (including Node.js overhead)

---

## Hand-written JSON tokenizer

> **Problem:** The `genres`, `cast`, `crew`, and `keywords` columns are Python `repr`
> strings, not valid JSON.

```python
[{'character': "Hooker's Mother", 'name': 'Tom Hanks', 'profile_path': None}]
```

> **Why it matters:** The naive fix — `raw.replace(/'/g, '"')` — silently corrupts every
> value containing an apostrophe. Python switches to double quotes for strings like
> `"Marvel's"`, so the swap creates broken JSON. **337 cast records lost in just the
> first 400 movies** — and no error is thrown.

> **Solution:** A hand-written tokenizer (`src/parsers/json-columns.ts`) walks the
> string, handles mixed quoting and `\'` escapes, and converts `None`/`True`/`False`
> only _outside_ string content. No `eval`. Unit-tested exhaustively.

---

## Normalized schema

> **Problem:** The source data embeds genres, cast, crew, and keywords as JSON-like
> blobs inside each movie row.

**Example from source data:**

```
movie_id: 862
title: "Toy Story"
genres: "[{'id': 16, 'name': 'Animation'}, {'id': 35, 'name': 'Comedy'}, {'id': 10751, 'name': 'Family'}]"
```

All genres for a movie are crammed into one text field. To find "all Animation movies,"
the database would have to scan every row and search inside that text — slow and can't
use indexes.

> **Why it matters:** Storing blobs means the database can't index them — every filter
> query becomes a full table scan. With 45K movies, that's noticeable.

> **Solution:** Normalize into separate tables:

```
movies table:        id=862, title="Toy Story"
genres table:        id=16, name="Animation"
movie_genres table:  movie_id=862, genre_id=16  ← linkage
```

Now "find all Animation movies" is a fast indexed lookup on `movie_genres`.

| Approach | Insert cost | Query cost | Filtering |
|----------|-------------|------------|-----------|
| **Normalized (chosen)** | Higher | More joins | Indexed, fast |
| JSON arrays | Lower | Simpler | Can't index |

> **Trade-off:** More work on insert, but queries like "all Action movies" are fast.
> Full comparison in [`ADR.md`](../ADR.md) §1.

---

## Streaming + 500-row batches

> **Problem:** CSV files are large — 45K movies, 700K+ cast/crew records.

**Example scenario:**

```
credits.csv: 45,000 rows × ~50 cast members each = 2+ million cast records
Loading all at once: ~500MB+ in memory before any database write
```

> **Why it matters:** Loading everything into memory could crash or slow the machine.
> Inserting one row at a time would be too slow (too many database round-trips).

> **Solution:** Stream with `csv-parse` and flush in **500-row batched transactions**.

```
Read 500 rows → Insert batch → Free memory → Read next 500 → ...
```

**Measured performance** (full dataset ingestion):
- **2,145 batches** across all loaders
- **Avg batch: 16ms**, min 10ms, max 155ms
- **Peak heap: 118MB** — constant, not growing with file size

---

## Skip malformed rows

> **Problem:** Some rows in the source CSV are broken.

**Example of corrupt rows found in `movies_metadata.csv`:**

```
Row 19731:  id="1997-08-20", title=""           ← date in ID field, empty title
Row 29503:  id="2012-09-29", title=""           ← same issue
Row 35587:  id="2014-01-01", title=""           ← columns shifted
```

These rows have a date where the numeric ID should be, and the title is empty because
all columns shifted one position right (likely a stray comma in the source).

> **Why it matters:** Crashing on the first bad row means you get nothing. Inserting
> bad rows corrupts the database (imagine querying `WHERE id = '1997-08-20'`).

> **Solution:** Validate every row with Zod (`src/validators/`):

```
id:    must be a positive integer  → "1997-08-20" fails
title: must be non-empty string    → "" fails
```

**Skip and count** malformed rows — never crash, never corrupt. The summary table
shows exactly what was skipped:

```
movies_metadata.csv: 45,460 inserted, 6 skipped
```

**Result: 99.99% of movies loaded** (45,460 of 45,466).

See [`INGESTION_REPORT.md`](./INGESTION_REPORT.md) for the full breakdown.

---

## Idempotent re-runs

> **Problem:** Re-running the import could create duplicate records.

**Example without idempotency:**

```
First run:   INSERT cast_member (id=1, name="Tom Hanks", movie_id=862)
Second run:  INSERT cast_member (id=2, name="Tom Hanks", movie_id=862)  ← duplicate!
```

Tom Hanks now appears twice in Toy Story's cast.

> **Why it matters:** Users may re-run after fixing an issue or adding new data.
> Duplicates would corrupt counts and break queries.

> **Solution:** Two strategies based on table type:

**For tables with natural keys** (movies, genres, keywords):

```sql
INSERT INTO movies (id, title, ...) VALUES (862, 'Toy Story', ...)
ON CONFLICT (id) DO NOTHING;  -- already exists? skip it
```

**For tables with auto-generated IDs** (cast_members, crew_members):

```sql
TRUNCATE cast_members RESTART IDENTITY;  -- clear and reload from scratch
INSERT INTO cast_members ...
```

> **Result:** Running `npm run ingest` multiple times is **always safe** — you get the
> same data, not duplicates.

---

[← Back to the README](../README.md#data-pipeline-design-decisions)
