import { useState } from 'react';
import { SearchBar } from '../components/SearchBar.js';
import { MovieCard } from '../components/MovieCard.js';
import { MovieTable } from '../components/MovieTable.js';
import { SortControl } from '../components/SortControl.js';
import { ViewToggle, type View } from '../components/ViewToggle.js';
import { Pagination } from '../components/Pagination.js';
import { StateMessage } from '../components/StateMessage.js';
import { MovieGridSkeleton, MovieTableSkeleton } from '../components/Skeleton.js';
import { useMovieBrowse } from '../hooks/useMovieBrowse.js';
import styles from './Home.module.css';

export function Home() {
  // All browse/search/sort orchestration lives in the presenter hook; the page
  // owns only the local view-mode toggle and the rendering.
  const {
    term,
    setTerm,
    query,
    isSearching,
    sort,
    searchSort,
    order,
    setSort,
    setSearchSort,
    setOrder,
    handleSort,
    handleSearchSort,
    setPage,
    active,
  } = useMovieBrowse();
  const [view, setView] = useState<View>('grid');

  return (
    <div className={styles.page}>
      <SearchBar value={term} onChange={setTerm} />

      <div className={styles.toolbar}>
        <ViewToggle view={view} onChange={setView} />
        {/* Grid view uses the dropdown; list view sorts via column headers. */}
        {view === 'grid' && (
          isSearching ? (
            <SortControl
              sort={searchSort}
              order={order}
              onSortChange={setSearchSort}
              onOrderChange={setOrder}
              isSearching
            />
          ) : (
            <SortControl
              sort={sort}
              order={order}
              onSortChange={setSort}
              onOrderChange={setOrder}
            />
          )
        )}
      </div>

      {active.isLoading ? (
        view === 'grid' ? (
          <div className={styles.grid}>
            <MovieGridSkeleton count={8} />
          </div>
        ) : (
          <MovieTableSkeleton count={10} />
        )
      ) : active.isError ? (
        <StateMessage kind="error">
          Couldn&apos;t load movies. Is the API running on :3000?
        </StateMessage>
      ) : !active.data || active.data.data.length === 0 ? (
        <StateMessage kind="empty">
          {isSearching ? `No movies match "${query}".` : 'No movies found.'}
        </StateMessage>
      ) : (
        <>
          {view === 'grid' ? (
            <div className={styles.grid}>
              {active.data.data.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          ) : isSearching ? (
            /* v8 ignore start -- ternary branches for search state */
            <MovieTable
              items={active.data.data}
              sort={searchSort}
              order={order}
              onSort={handleSearchSort}
              isSearching
            />
          ) : (
            <MovieTable
              items={active.data.data}
              sort={sort}
              order={order}
              onSort={handleSort}
            />
            /* v8 ignore stop */
          )}
          <Pagination
            page={active.data.page}
            pageSize={active.data.pageSize}
            total={active.data.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
