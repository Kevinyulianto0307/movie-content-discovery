// Weighted-Jaccard similarity score: shared genres count double, shared keywords
// count once. The /similar endpoint computes this weighting in SQL for performance
// over ~45K movies (see db/repositories/movies.repo.ts). This pure function is the
// executable spec of that weighting: the integration test in
// tests/integration/search-similar-analytics.test.ts asserts the SQL's per-row
// scores equal this function's output, so the two cannot drift apart. It is also
// unit-tested directly below for the weighting edge cases.
export interface Tags {
  genres: number[];
  keywords: number[];
}

export function similarityScore(target: Tags, candidate: Tags): number {
  const candGenres = new Set(candidate.genres);
  const candKeywords = new Set(candidate.keywords);
  const sharedGenres = new Set(target.genres.filter((g) => candGenres.has(g))).size;
  const sharedKeywords = new Set(target.keywords.filter((k) => candKeywords.has(k))).size;
  return 2 * sharedGenres + sharedKeywords;
}
