import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchMovies } from '../api/client.js';
import type { SearchSortField, SortOrder } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';

// Full-text search. Disabled when the query is empty so we don't hit the API
// with a blank term (the API would 400 on it anyway).
export function useSearch(
  q: string,
  page: number,
  sort: SearchSortField = 'relevance',
  order: SortOrder = 'desc',
) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: queryKeys.search.query(trimmed, page, sort, order),
    queryFn: () => searchMovies({ q: trimmed, page, sort, order }),
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData,
  });
}
