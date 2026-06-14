# Pipeline Tests

This directory contains both unit and integration tests for the CSV ingestion pipeline.

## Structure

```
tests/
├── unit/                    # Pure function tests (no database)
│   ├── json-columns.test.ts      # Python literal parser tests
│   ├── validators.test.ts        # Zod schema validation tests
│   └── shared-validators.test.ts # Shared validation logic tests
├── integration/             # Full pipeline tests (with database)
│   ├── setup.ts                  # Test database setup and migrations
│   ├── links.test.ts             # Links ingestion tests
│   ├── movies.test.ts            # Movies + genres ingestion tests
│   ├── credits.test.ts           # Cast/crew ingestion tests
│   ├── keywords.test.ts          # Keywords ingestion tests
│   ├── ratings.test.ts           # Ratings ingestion tests
│   ├── search-vector.test.ts     # Full-text search vector tests
│   └── full-ingestion.test.ts    # End-to-end pipeline tests
└── fixtures/                # Small test CSV files
    ├── links.csv
    ├── movies_metadata.csv
    ├── movies_with_errors.csv    # For error handling tests
    ├── credits.csv
    ├── keywords.csv
    └── ratings.csv
```

## Running Tests

```bash
# Run all tests
npm run -w @mcd/pipeline test:all

# Run only unit tests (fast, no database)
npm run -w @mcd/pipeline test:unit

# Run only integration tests (requires Docker/Postgres)
npm run -w @mcd/pipeline test:integration

# Run legacy command (unit tests only for backward compatibility)
npm run -w @mcd/pipeline test
```

## Unit Tests

Located in `tests/unit/`, these are pure function tests that require no database:

- **json-columns.test.ts**: Tests the Python literal → JSON parser that handles the dataset's non-standard JSON format
- **validators.test.ts**: Tests Zod schemas for CSV row validation
- **shared-validators.test.ts**: Tests shared validation utilities

These tests are fast and can run anywhere. They verify the parsing and validation logic in isolation.

## Integration Tests

Located in `tests/integration/`, these tests verify the full CSV → Postgres flow:

### Test Database Setup

- Uses `movies_test` database (via `DATABASE_URL_TEST` env var)
- Migrations run once before all tests (via `beforeAll` in `setup.ts`)
- Each test file truncates tables in `beforeEach` for isolation
- Tests run serially (`fileParallelism: false`) to avoid connection churn

### Test Coverage

1. **links.test.ts**: MovieLens → TMDB ID mapping
   - Basic ingestion
   - Idempotency (safe to re-run)
   - Malformed row handling

2. **movies.test.ts**: Movies + genres + junction table
   - Movie metadata ingestion
   - Genre extraction from Python-style JSON
   - Junction table population
   - Idempotency
   - Error handling (corrupt rows)

3. **credits.test.ts**: Cast and crew members
   - Cast/crew ingestion with FK checks
   - Python-style JSON parsing for arrays
   - Truncate-and-reinsert strategy (serial PKs)
   - Orphan prevention (skips credits for non-existent movies)

4. **keywords.test.ts**: Keywords + junction table
   - Keyword extraction from CSV
   - Junction table population
   - Idempotency
   - FK enforcement

5. **ratings.test.ts**: User ratings with ID mapping
   - MovieLens ID → TMDB ID resolution
   - Multiple ratings per movie
   - Unmapped movie ID handling
   - Idempotency

6. **search-vector.test.ts**: Full-text search vectors
   - `tsvector` population
   - Weighted fields (title > tagline > overview)
   - Query verification using `ts_query`
   - Handles NULL/missing text fields

7. **full-ingestion.test.ts**: End-to-end pipeline
   - Complete FK-safe ingestion order
   - All tables populated correctly
   - FK relationship verification
   - Full idempotency check
   - Summary statistics accuracy

8. **error-handling.test.ts**: Resilience and error recovery
   - Continues processing after malformed rows
   - Handles missing optional columns
   - Empty JSON arrays (genres/keywords)
   - Empty CSV files (header only)
   - Invalid data types
   - High error rate scenarios (>20 errors)
   - Extra/unexpected columns

### Fixtures

Small CSV files (3-5 rows each) in `tests/fixtures/`:

- Valid data files mirror the real dataset structure
- `movies_with_errors.csv` contains a malformed row for error handling tests
- Python-style JSON columns (`genres`, `cast`, `crew`, `keywords`) use authentic syntax

## Key Testing Principles

1. **Idempotency**: All loaders must be safe to re-run. Tests verify no duplicates on second run.

2. **FK Safety**: Integration tests verify the correct loading order (links → movies → credits/keywords/ratings) and orphan prevention.

3. **Error Resilience**: Malformed rows should be skipped with logging, not crash the run. Tests verify this.

4. **Streaming**: Loaders must not load entire CSVs into memory. (Not directly tested, but enforced by code review.)

5. **Batch Performance**: Loaders use batched inserts. (Verified indirectly by checking final counts.)

6. **Python JSON Parsing**: The dataset's genres/cast/crew/keywords use Python `repr()` format, not standard JSON. Tests verify the custom parser handles apostrophes, escapes, and Python literals (None, True, False).

## CI Considerations

- Unit tests can run anywhere (no dependencies)
- Integration tests require:
  - Postgres 16+ running
  - `DATABASE_URL_TEST` set to test database
  - Test database created (`movies_test`)
  
For CI, run `docker compose up -d` first, then:
```bash
npm run -w @mcd/pipeline test:all
```
