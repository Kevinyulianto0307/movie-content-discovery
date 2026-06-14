// Centralized query keys for TanStack Query. Using a factory keeps cache
// reads/writes consistent (no key typos) and makes invalidation explicit:
//   queryClient.invalidateQueries({ queryKey: queryKeys.movies.all })
//   queryClient.invalidateQueries({ queryKey: queryKeys.movies.detail(id) })
//
// Conventions follow the TanStack Query "query key factory" pattern.
import type { ListParams } from './client.js';

export const queryKeys = {
  movies: {
    all: ['movies'] as const,
    list: (params: ListParams) => ['movies', 'list', params] as const,
    detail: (id: number) => ['movies', 'detail', id] as const,
    similar: (id: number) => ['movies', 'similar', id] as const,
  },
  search: {
    all: ['search'] as const,
    query: (q: string, page: number, sort?: string, order?: string) =>
      ['search', q, page, sort, order] as const,
  },
} as const;
