// Similar-movie row — includes the weighted-Jaccard similarity score.
export interface SimilarMovie {
  id: number;
  title: string;
  releaseYear: number | null;
  voteAverage: number | null;
  score: number;
}
