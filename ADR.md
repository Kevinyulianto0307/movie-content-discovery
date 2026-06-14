# Architecture Decision Record

Key technical decisions for the MovieContentDiscovery platform.

---

## 1. Storage Choice and Schema Design

**Chosen:** PostgreSQL 16 with Drizzle ORM, running in Docker.

**Why:** Native full-text search (`tsvector` + GIN index + `ts_rank`), relational joins across movies/cast/ratings, and type-safe schema. Drizzle is SQL-first — queries stay transparent, which matters for the JOIN-heavy similarity and analytics endpoints.

**Trade-off:** Requires Docker (mitigated by `npm run setup` with preflight checks).

**Nested data modeling:** The source CSV embeds genres, cast, crew, and keywords as JSON-like blobs. Two options:

| Approach                   | Pros                                                                    | Cons                                        |
| -------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| **Normalized (chosen)**    | Indexed filtering, enables similarity queries, future "movies by actor" | More JOINs, slower inserts                  |
| Denormalized (JSON arrays) | Simpler inserts                                                         | Can't index; genre filter = full table scan |

Schema: `genres`, `keywords` → lookup tables; `movie_genres`, `movie_keywords` → junction tables; `cast_members`, `crew_members` → rows with `movie_id` FK. This enables queries like "all Action movies" or "movies sharing 3+ genres" to use index scans.

---

## 2. Similarity Algorithm

**Formula:** `score = 2 × |shared genres| + 1 × |shared keywords|`

| Approach                      | Pros                             | Cons                                           | Verdict         |
| ----------------------------- | -------------------------------- | ---------------------------------------------- | --------------- |
| **Weighted Jaccard (chosen)** | Fast, explainable, one SQL query | Ignores user behavior and narrative            | ✅              |
| Collaborative filtering       | "Users who liked X also liked Y" | Needs matrix factorization; cold-start problem | ❌ Too complex  |
| Embedding-based (cosine)      | Best semantic quality            | External model/API required                    | ❌ Out of scope |

**Why weighted:** Genres are stronger signals than keywords — sharing "Action" + "Sci-Fi" matters more than sharing a minor keyword.

**Trade-off: Per-request vs. pre-computed similarity**

Two ways to answer "what's similar to Movie X?":

| Approach                            | How it works                                                                                       | Pros                                                | Cons                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Pre-computed** (similarity table) | Offline job computes similarity scores for all movie pairs, stores in `movie_similarity` table     | O(1) lookup at query time                           | Storage: 45K movies × 45K = ~2 billion pairs. Must recompute when movies/metadata change. |
| **Per-request** (chosen)            | When a user requests `/similar/:id`, run a SQL query that counts shared genres/keywords on the fly | No storage overhead, always fresh, simpler pipeline | Slower than a table lookup (but still fast with indexes)                                  |

**Why per-request works here:** We're not scanning all 2 billion pairs. The query only examines movies that share at least one genre or keyword with the source movie—a small subset. Junction tables (`movie_genres`, `movie_keywords`) are indexed, so these lookups are fast.

**Future options if performance degrades:**

1. **Batch-compute top-N:** Nightly job pre-computes the top 20 similar movies for each film → `movie_similarity` table. Query becomes a simple lookup.
2. **Vector embeddings (pgvector):** Represent each movie as a vector (from plot/metadata), store in Postgres with `pgvector`. Similarity = fast cosine distance, and you get semantic matches ("heist movie" similar to "Ocean's Eleven" even without shared keywords).

---

## 3. Scaling Considerations

If serving 10,000 concurrent users with the full 26M-rating dataset:

| Concern                | Current (assessment)      | At scale                                                                                       |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| **Database**           | Single Postgres in Docker | Amazon Aurora with read replicas for all read endpoints (movies, search, similar, analytics)   |
| **Connection pooling** | `pg.Pool` defaults        | RDS Proxy for managed connection pooling + failover handling                                   |
| **Caching**            | None                      | Redis (ElastiCache) for `/analytics/top-genres`, hot `/movies/:id`, search results (short TTL) |
| **Search**             | PG FTS                    | AWS OpenSearch for typo tolerance + faster ranking                                             |
| **Similarity**         | Computed per-request      | Pre-computed `movie_similarity` table, refreshed async                                         |
| **Static assets**      | Vite dev server           | CloudFront CDN in front of S3-hosted bundle                                                    |
| **Ratings ingestion**  | One-shot CSV load         | Kinesis/Kafka → worker → batched upserts                                                       |
| **Observability**      | pino → stdout             | OpenTelemetry traces; metrics to CloudWatch/Datadog                                            |
| **Deployment**         | Local only                | API on ECS Fargate behind ALB; autoscale on CPU + request count                                |

---

## 4. What I Would Do Differently With More Time

| Cut                         | Why                        | Impact                                             | What I'd add                                          |
| --------------------------- | -------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| **Pre-computed similarity** | Time                       | `/similar` computes per-request (indexed tables)   | Batch-compute at ingest into `movie_similarity` table |
| **Auth**                    | Out of scope per brief     | All endpoints public                               | `@fastify/jwt` + `users` table                        |
| **Typo-tolerant search**    | Extra service setup        | "Avengrs" ≠ "Avengers"                             | OpenSearch in a second Docker container               |
| **Numbered pagination UI**  | Time                       | API supports full pagination; UI is prev/next only | Numbered pages component                              |
| **Dockerfile for app**      | Local-only assessment      | Not deployable as-is                               | Multi-stage build + ECS task definition               |
| **Performance tests**       | Expensive; traffic unknown | No load testing                                    | k6/Artillery tests once traffic patterns emerge       |
| **Caching layer**           | Complexity                 | No caching for hot queries                         | Redis for top movies, popular searches, analytics     |
| **Rate limiting**           | Out of scope               | API unprotected from abuse                         | `@fastify/rate-limit` to protect endpoints            |
| **CI/CD pipeline**          | Local-only assessment      | Manual deploy only                                 | GitHub Actions: lint → test → build → deploy          |
| **Error tracking**          | Infra cost                 | No production error visibility                     | Sentry integration for error monitoring               |
| **Accessibility audit**     | Time                       | Basic a11y only                                    | WCAG compliance, keyboard nav, screen reader testing  |
| **Design system**           | Time                       | Custom CSS, not scalable for team                  | MUI or Tailwind for consistent styling                |
