import { useState } from 'react';
import { useDebounce } from './useDebounce.js';
import { useMovies } from './useMovies.js';
import { useSearch } from './useSearch.js';
import type { SortField, SearchSortField, SortOrder } from '../api/client.js';
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../constants/index.js';

/**
 * Presenter hook for the Home screen.
 *
 * Orchestrates browse/search state and sort logic, exposing a single `active` query
 * that switches between browse (list) and search results based on the search term.
 *
 * @returns State and handlers for the browse page:
 * - `term` / `setTerm` - Raw search input value (immediate, not debounced)
 * - `query` - Debounced search query (triggers API calls)
 * - `isSearching` - Whether search mode is active
 * - `sort` / `setSort` - Current sort field (title, release_date, vote_average, revenue)
 * - `order` / `setOrder` - Sort direction (asc/desc)
 * - `handleSort` - Column header click handler for table view
 * - `setPage` - Pagination handler
 * - `active` - The active TanStack Query result (browse or search)
 *
 * @example
 * const { term, setTerm, active, isSearching } = useMovieBrowse();
 * if (active.isLoading) return <Skeleton />;
 * return active.data.data.map(m => <MovieCard movie={m} />);
 */
export function useMovieBrowse() {
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortField>('vote_average');
  const [searchSort, setSearchSort] = useState<SearchSortField>('relevance');
  const [order, setOrder] = useState<SortOrder>('desc');

  const query = useDebounce(term, SEARCH_DEBOUNCE_MS);
  const isSearching = query.trim().length > 0;

  // Reset to page 1 when the inputs that define the current result set change.
  // Using "adjust state during render" (the React-recommended pattern) instead
  // of an effect avoids a cascading re-render on every input change.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [trackedInputs, setTrackedInputs] = useState({ query, sort, searchSort, order });
  if (
    trackedInputs.query !== query ||
    trackedInputs.sort !== sort ||
    trackedInputs.searchSort !== searchSort ||
    trackedInputs.order !== order
  ) {
    setTrackedInputs({ query, sort, searchSort, order });
    setPage(1);
  }

  const browse = useMovies({ page, pageSize: PAGE_SIZE, sort, order });
  const search = useSearch(query, page, searchSort, order);
  const active = isSearching ? search : browse;

  // Column-header click in table view: toggle order on the same field, else switch
  // field (title defaults to ascending, everything else to descending).
  const handleSort = (field: SortField) => {
    if (field === sort) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSort(field);
      setOrder(field === 'title' ? 'asc' : 'desc');
    }
  };

  // Column-header click in table view during search: toggle order on same field
  const handleSearchSort = (field: SearchSortField) => {
    if (field === searchSort) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSearchSort(field);
      setOrder(field === 'title' ? 'asc' : 'desc');
    }
  };

  return {
    term,
    setTerm,
    query,
    isSearching,
    sort,
    setSort,
    searchSort,
    setSearchSort,
    order,
    setOrder,
    handleSort,
    handleSearchSort,
    setPage,
    active,
  };
}
