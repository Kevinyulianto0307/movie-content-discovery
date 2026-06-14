import { useQuery } from '@tanstack/react-query';
import { fetchSimilar } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';

export function useSimilarMovies(id: number) {
  return useQuery({
    queryKey: queryKeys.movies.similar(id),
    queryFn: () => fetchSimilar(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
