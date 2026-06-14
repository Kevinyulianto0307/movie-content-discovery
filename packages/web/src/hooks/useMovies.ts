import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchMovies, type ListParams } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';

// Browse/list query. keepPreviousData avoids a loading flash when paging.
export function useMovies(params: ListParams) {
  return useQuery({
    queryKey: queryKeys.movies.list(params),
    queryFn: () => fetchMovies(params),
    placeholderData: keepPreviousData,
  });
}
