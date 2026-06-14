import type { Paginated, SearchResultItem } from './types.js';
import type { SearchSortField, SortOrder } from './movies.client.js';
import { BASE, getJson, toQuery } from './http.js';
import { PAGE_SIZE } from '../constants/index.js';

export interface SearchParams {
  q: string;
  page?: number;
  pageSize?: number;
  sort?: SearchSortField;
  order?: SortOrder;
}

export function searchMovies({
  q,
  page = 1,
  pageSize = PAGE_SIZE,
  sort = 'relevance',
  order = 'desc',
}: SearchParams): Promise<Paginated<SearchResultItem>> {
  return getJson(`${BASE}/search?${toQuery({ q, page, pageSize, sort, order })}`);
}
