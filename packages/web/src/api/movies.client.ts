import type { Paginated, MovieListItem, MovieDetail, SimilarMovie } from './types.js';
import { BASE, getJson, toQuery } from './http.js';
import { SIMILAR_MOVIES_LIMIT } from '../constants/index.js';

export type SortField = 'title' | 'release_date' | 'vote_average' | 'revenue';
export type SearchSortField = 'relevance' | SortField;
export type SortOrder = 'asc' | 'desc';

export interface ListParams {
  page: number;
  pageSize: number;
  sort?: SortField;
  order?: SortOrder;
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minVoteCount?: number;
}

export function fetchMovies(params: ListParams): Promise<Paginated<MovieListItem>> {
  return getJson(`${BASE}/movies?${toQuery({ ...params })}`);
}

export function fetchMovie(id: number): Promise<MovieDetail> {
  return getJson(`${BASE}/movies/${id}`);
}

export function fetchSimilar(
  id: number,
  limit: number = SIMILAR_MOVIES_LIMIT,
): Promise<{ data: SimilarMovie[] }> {
  return getJson(`${BASE}/movies/${id}/similar?${toQuery({ limit })}`);
}
