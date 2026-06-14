// Search result row — includes the ts_rank relevance score from the API.
export interface SearchResultItem {
  id: number;
  title: string;
  releaseDate: string | null;
  releaseYear: number | null;
  voteAverage: number | null;
  voteCount: number | null;
  rank: number;
}
