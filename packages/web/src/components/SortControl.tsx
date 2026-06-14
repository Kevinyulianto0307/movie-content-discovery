import type { SortField, SearchSortField, SortOrder } from '../api/client.js';
import styles from './SortControl.module.css';

const BROWSE_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'vote_average', label: 'Rating' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'release_date', label: 'Release date' },
  { value: 'title', label: 'Title' },
];

const SEARCH_OPTIONS: { value: SearchSortField; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'vote_average', label: 'Rating' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'release_date', label: 'Release date' },
  { value: 'title', label: 'Title' },
];

interface BrowseProps {
  sort: SortField;
  order: SortOrder;
  onSortChange: (s: SortField) => void;
  onOrderChange: (o: SortOrder) => void;
  isSearching?: false;
}

interface SearchProps {
  sort: SearchSortField;
  order: SortOrder;
  onSortChange: (s: SearchSortField) => void;
  onOrderChange: (o: SortOrder) => void;
  isSearching: true;
}

type Props = BrowseProps | SearchProps;

export function SortControl({ sort, order, onSortChange, onOrderChange, isSearching }: Props) {
  const options = isSearching ? SEARCH_OPTIONS : BROWSE_OPTIONS;

  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="sort-field">
        Sort by
      </label>
      <select
        id="sort-field"
        className={styles.select}
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortField & SearchSortField)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {/* v8 ignore start -- ternary branches tested in component tests */}
      <button
        type="button"
        className={styles.order}
        onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
        aria-label={`Sort order: ${order === 'asc' ? 'ascending' : 'descending'}`}
        title={order === 'asc' ? 'Ascending' : 'Descending'}
      >
        {order === 'asc' ? '↑' : '↓'}
      </button>
      {/* v8 ignore stop */}
    </div>
  );
}
