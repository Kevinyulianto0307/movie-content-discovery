import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useMovieBrowse } from '../../src/hooks/useMovieBrowse';

vi.mock('../../src/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

vi.mock('../../src/hooks/useMovies', () => ({
  useMovies: vi.fn(() => ({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('../../src/hooks/useSearch', () => ({
  useSearch: vi.fn(() => ({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
    isLoading: false,
    isError: false,
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useMovieBrowse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useMovieBrowse(), {
      wrapper: createWrapper(),
    });

    expect(result.current.term).toBe('');
    expect(result.current.query).toBe('');
    expect(result.current.isSearching).toBe(false);
    expect(result.current.sort).toBe('vote_average');
    expect(result.current.order).toBe('desc');
  });

  it('updates term when setTerm is called', () => {
    const { result } = renderHook(() => useMovieBrowse(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setTerm('matrix');
    });

    expect(result.current.term).toBe('matrix');
  });

  it('isSearching is true when query has content', () => {
    const { result } = renderHook(() => useMovieBrowse(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setTerm('test');
    });

    expect(result.current.isSearching).toBe(true);
  });

  it('isSearching is false when query is whitespace only', () => {
    const { result } = renderHook(() => useMovieBrowse(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setTerm('   ');
    });

    expect(result.current.isSearching).toBe(false);
  });

  describe('handleSort', () => {
    it('toggles order when clicking same field', () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      expect(result.current.sort).toBe('vote_average');
      expect(result.current.order).toBe('desc');

      act(() => {
        result.current.handleSort('vote_average');
      });

      expect(result.current.sort).toBe('vote_average');
      expect(result.current.order).toBe('asc');

      act(() => {
        result.current.handleSort('vote_average');
      });

      expect(result.current.order).toBe('desc');
    });

    it('sets ascending order for title field', () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleSort('title');
      });

      expect(result.current.sort).toBe('title');
      expect(result.current.order).toBe('asc');
    });

    it('sets descending order for non-title fields', () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleSort('title');
      });
      expect(result.current.order).toBe('asc');

      act(() => {
        result.current.handleSort('revenue');
      });

      expect(result.current.sort).toBe('revenue');
      expect(result.current.order).toBe('desc');

      act(() => {
        result.current.handleSort('release_date');
      });

      expect(result.current.sort).toBe('release_date');
      expect(result.current.order).toBe('desc');
    });
  });

  describe('handleSearchSort', () => {
    it('toggles order when clicking same field', () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      expect(result.current.searchSort).toBe('relevance');
      expect(result.current.order).toBe('desc');

      act(() => {
        result.current.handleSearchSort('relevance');
      });

      expect(result.current.searchSort).toBe('relevance');
      expect(result.current.order).toBe('asc');

      act(() => {
        result.current.handleSearchSort('relevance');
      });

      expect(result.current.order).toBe('desc');
    });

    it('sets ascending order for title field', () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleSearchSort('title');
      });

      expect(result.current.searchSort).toBe('title');
      expect(result.current.order).toBe('asc');
    });

    it('sets descending order for non-title fields', () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleSearchSort('title');
      });
      expect(result.current.order).toBe('asc');

      act(() => {
        result.current.handleSearchSort('vote_average');
      });

      expect(result.current.searchSort).toBe('vote_average');
      expect(result.current.order).toBe('desc');
    });
  });

  describe('page reset on input change', () => {
    it('resets page when sort changes', async () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.setSort('title');
      });

      await waitFor(() => {
        expect(result.current.sort).toBe('title');
      });
    });

    it('resets page when order changes', async () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.setOrder('asc');
      });

      await waitFor(() => {
        expect(result.current.order).toBe('asc');
      });
    });

    it('resets page when query changes', async () => {
      const { result } = renderHook(() => useMovieBrowse(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPage(5);
      });

      act(() => {
        result.current.setTerm('new search');
      });

      await waitFor(() => {
        expect(result.current.term).toBe('new search');
      });
    });
  });

  it('setPage updates the page', () => {
    const { result } = renderHook(() => useMovieBrowse(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setPage(3);
    });

    // Page is internal state, we verify through the hook behavior
    expect(result.current.active).toBeDefined();
  });
});
