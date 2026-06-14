import { useQuery } from '@tanstack/react-query';
import { fetchMovie } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';

// Single movie detail. Disabled until we have a valid numeric id.
export function useMovie(id: number) {
  return useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => fetchMovie(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
