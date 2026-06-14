import { repoRoot } from "@mcd/db/env"; // MUST be first: loads .env before db client reads it
import { pool } from "@mcd/db";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { isAbsolute, join } from "node:path";
import { logger } from "./lib/logger.ts";
import { resetMetrics, getMetrics } from "./lib/metrics.ts";
import { ingestLinks } from "./loaders/links.ts";
import { ingestMovies } from "./loaders/movies.ts";
import { ingestCredits } from "./loaders/credits.ts";
import { ingestKeywords } from "./loaders/keywords.ts";
import { ingestRatings } from "./loaders/ratings.ts";
import { populateSearchVector } from "./loaders/search-vector.ts";
import type { LoadResult } from "./loaders/types.ts";

async function confirmDataFiles(): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log(
      "\n═══════════════════════════════════════════════════════════════",
    );
    console.log("  Before ingestion, ensure you have downloaded the CSV files");
    console.log("  from Kaggle and placed them in the data/ folder:");
    console.log(
      "    https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset",
    );
    console.log("");
    console.log("  Required files:");
    console.log("    - credits.csv");
    console.log("    - keywords.csv");
    console.log("    - links_small.csv");
    console.log("    - links.csv");
    console.log("    - movies_metadata.csv");
    console.log("    - ratings_small.csv");
    console.log("    - ratings.csv");
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );
    rl.question(
      "Have you placed all CSV files in the data/ folder? (Y/N): ",
      (answer) => {
        rl.close();
        resolve(
          answer.trim().toLowerCase() === "y" ||
            answer.trim().toLowerCase() === "yes",
        );
      },
    );
  });
}

// Picks the first existing candidate filename (supports the full + _small dataset
// variants the assignment allows).
function pick(dir: string, ...names: string[]): string | null {
  for (const name of names) {
    const p = join(dir, name);
    if (existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const confirmed = await confirmDataFiles();
  if (!confirmed) {
    console.log(
      "\n⚠️  Ingestion cancelled. Please download the CSV files and try again.\n",
    );
    process.exit(0);
  }

  const dataDirEnv = process.env.DATA_DIR ?? "./data";
  const dataDir = isAbsolute(dataDirEnv)
    ? dataDirEnv
    : join(repoRoot, dataDirEnv);
  logger.info({ dataDir }, "starting ingestion");

  const linksPath = pick(dataDir, "links.csv", "links_small.csv");
  const moviesPath = pick(dataDir, "movies_metadata.csv");
  const creditsPath = pick(dataDir, "credits.csv", "credits_small.csv");
  const keywordsPath = pick(dataDir, "keywords.csv", "keywords_small.csv");
  const ratingsPath = pick(dataDir, "ratings_small.csv"); // use the small ratings set, not the 26M full file

  if (!moviesPath || !linksPath) {
    throw new Error(
      `Required dataset files not found in ${dataDir}. Need movies_metadata.csv and links.csv. ` +
        `Download from https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset`,
    );
  }

  const t0 = Date.now();
  const summary: Record<string, LoadResult> = {};
  resetMetrics();

  // FK-safe order: links -> movies(+genres) -> credits -> keywords -> ratings.
  summary.links = await ingestLinks(linksPath);
  logger.info("links done");
  summary.movies = await ingestMovies(moviesPath);
  logger.info("movies done");

  if (creditsPath) {
    summary.credits = await ingestCredits(creditsPath);
    logger.info("credits done");
  } else {
    logger.warn("no credits.csv found — skipping cast/crew");
  }

  if (keywordsPath) {
    summary.keywords = await ingestKeywords(keywordsPath);
    logger.info("keywords done");
  } else {
    logger.warn("no keywords.csv found — skipping keywords");
  }

  if (ratingsPath) {
    summary.ratings = await ingestRatings(ratingsPath);
    logger.info("ratings done");
  } else {
    logger.warn("no ratings_small.csv found — skipping ratings");
  }

  logger.info("populating search_vector...");
  await populateSearchVector();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const totalRows = Object.values(summary).reduce(
    (sum, r) => sum + r.inserted,
    0,
  );
  const metrics = getMetrics(totalRows);

  // eslint-disable-next-line no-console -- intentional human-readable summary
  console.log("\n=== Ingestion summary ===");
  // eslint-disable-next-line no-console
  console.table(summary);
  // eslint-disable-next-line no-console
  console.log(`Elapsed: ${elapsed}s\n`);

  // eslint-disable-next-line no-console
  console.log("=== Batch performance metrics ===");
  // eslint-disable-next-line no-console
  console.log(`  Batches:       ${metrics.batchCount}`);
  // eslint-disable-next-line no-console
  console.log(`  Avg batch:     ${metrics.avgBatchMs}ms`);
  // eslint-disable-next-line no-console
  console.log(`  Min batch:     ${metrics.minBatchMs}ms`);
  // eslint-disable-next-line no-console
  console.log(`  Max batch:     ${metrics.maxBatchMs}ms`);
  // eslint-disable-next-line no-console
  console.log(`  Peak heap:     ${metrics.peakHeapMB}MB\n`);

  // eslint-disable-next-line no-console
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  // eslint-disable-next-line no-console
  console.log("  ✅ Ingestion completed successfully!");
  // eslint-disable-next-line no-console
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error(err, "ingestion failed");
    await pool.end().catch(() => {});
    process.exit(1);
  });
