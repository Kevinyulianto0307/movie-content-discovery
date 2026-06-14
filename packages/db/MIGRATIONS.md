# Migration Workflow

This document explains how database migrations work in the Movie Content Discovery project.

## Overview

Migrations use a **two-pass strategy**:

1. **Generated migrations** - Created by `drizzle-kit` from schema changes
2. **Hand-written migrations** - For features `drizzle-kit` doesn't support (e.g., GIN indexes)

Both types live in `packages/api/drizzle/` and are applied by the migration runner.

## Generating Migrations

When you change any schema file in `packages/db/src/schemas/`:

```bash
# Generate SQL from schema changes
npm run db:generate

# Review the generated SQL in packages/api/drizzle/
# Then commit both the schema changes and the migration
```

The generated file will be named `NNNN_<name>.sql` where `NNNN` is a sequence number.

## Hand-Written Migrations

Some PostgreSQL features are not supported by `drizzle-kit`:

| Feature | Example | Why Hand-Written |
|---------|---------|------------------|
| GIN indexes | Full-text search on `tsvector` | `drizzle-kit` only emits btree indexes |
| GIST indexes | Spatial queries | Not supported |
| Partial indexes | `WHERE` clause in index | Not supported |
| Expression indexes | `LOWER(email)` | Not supported |

### Adding a Hand-Written Migration

1. Create a new file: `packages/api/drizzle/NNNN_descriptive_name.sql`
2. Use `IF NOT EXISTS` to make re-runs safe:

```sql
-- 0001_fts_index.sql
CREATE INDEX IF NOT EXISTS idx_movies_search_vector
ON movies USING gin(search_vector);
```

3. The migration runner will apply it after generated migrations.

## Running Migrations

```bash
# Apply all pending migrations
npm run db:migrate
```

The runner:
1. Reads `packages/api/drizzle/meta/_journal.json` to find generated migrations
2. Applies generated migrations via Drizzle's migrator
3. Scans for additional `.sql` files not in the journal
4. Applies hand-written migrations that haven't been run

Migrations are tracked in the `__drizzle_migrations` table.

## File Structure

```
packages/api/drizzle/
├── 0000_init.sql           # Generated: initial schema
├── 0001_fts_index.sql      # Hand-written: GIN index for FTS
├── meta/
│   ├── 0000_snapshot.json  # Schema snapshot for 0000
│   └── _journal.json       # Drizzle's migration journal
```

## Local Development Tips

### Fresh Start

```bash
docker compose down -v    # Wipe Postgres volume
npm run setup             # Recreate DB and run migrations
npm run ingest            # Reload data
```

### Check Migration Status

```bash
docker compose exec postgres psql -U postgres -d movies -c \
  "SELECT * FROM __drizzle_migrations ORDER BY created_at;"
```

### Debugging

If a migration fails:
1. Check the SQL syntax in the migration file
2. Ensure `IF NOT EXISTS` / `IF EXISTS` guards are in place
3. Review the Postgres logs: `docker compose logs postgres`

## Schema Location

The schema source of truth is `packages/db/src/schemas/`. The `drizzle.config.ts` in `packages/api` points to it:

```ts
// packages/api/drizzle.config.ts
export default defineConfig({
  schema: '../db/src/schema.ts',
  out: './drizzle',
  // ...
});
```

This separation allows `packages/db` to be a pure schema/client package without migration tooling dependencies.
